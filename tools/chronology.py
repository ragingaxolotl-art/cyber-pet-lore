"""Named chronology addresses; keep source text, certainty and calendar dates separate."""
import html
import json
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]


def registry():
    return json.loads((ROOT / 'sources/chronology.json').read_text())


def validate_point(point, data):
    era = next(e for e in data['eras'] if e['number'] == point['era'])
    if 'stage' in point and 'period' not in point:
        raise ValueError('A stage requires a period')
    if 'period' in point:
        period = next(p for p in era['periods'] if p['number'] == point['period'])
        if 'stage' in point:
            next(s for s in period['stages'] if s['number'] == point['stage'])


def address(point):
    code = 'E' + str(point['era']).replace('-', '−')
    if 'period' in point:
        code += f" · P{point['period']:02}"
    if 'stage' in point:
        code += f" · S{point['stage']:02}"
    return code


def notation(place):
    start, end = place['start'], place.get('end')
    if not end:
        return address(start)
    if start['era'] == end['era'] and start.get('period') == end.get('period') and 'stage' in start and 'stage' in end:
        return address(start) + f"–{end['stage']:02}"
    return address(start) + ' → ' + address(end)


def names(point, data):
    era = next(e for e in data['eras'] if e['number'] == point['era'])
    parts = ['Era ' + str(point['era']).replace('-', '−'), era['name']]
    if 'period' in point:
        p = next(p for p in era['periods'] if p['number'] == point['period'])
        parts.append(p['name'])
        if 'stage' in point:
            parts.append(next(s['name'] for s in p['stages'] if s['number'] == point['stage']))
    return ' · '.join(parts)


def describe(place, data):
    validate_point(place['start'], data)
    if place.get('end'):
        validate_point(place['end'], data)
        key = lambda p: (p['era'], p.get('period', 0), p.get('stage', 0))
        if key(place['end']) < key(place['start']):
            raise ValueError('Chronology ranges must run forward')
        if place['relation'] not in ('span', 'window'):
            raise ValueError('Ranges must distinguish span from window')
    point = place['start']
    anchor = 'era-' + str(point['era'])
    if 'period' in point:
        anchor += f"-p{point['period']:02}"
    label = names(point, data)
    if place.get('end'):
        label += ' → ' + names(place['end'], data)
    return {**place, 'code': notation(place), 'label': label, 'href': 'chronology.html#' + anchor,
            'precision': {'point': ('Era only; period and stage unspecified' if 'period' not in point else 'Period known; stage unspecified' if 'stage' not in point else 'Named stage'), 'span': 'Spans this interval', 'window': 'Placement window; exact stage uncertain'}[place['relation']]}


def paragraph_map(data):
    out = {}
    for era in data['eras']:
        for p in era['periods']:
            point = {'era': era['number'], 'period': p['number']}
            out[p['sourceParagraph']] = describe({'start': point, 'relation': 'point', 'basis': p['basis']}, data)
            for s in p['stages']:
                out[s['sourceParagraph']] = describe({'start': {**point, 'stage': s['number']}, 'relation': 'point',
                    'basis': p['basis'] + '; stage indexing is editorial, not a measured date.'}, data)
    return out


def add_catalog_chronology(root, catalog):
    data = registry()
    mapping = paragraph_map(data)
    for e in catalog:
        if e['id'] in data['placements']:
            e['chronology'] = [describe(data['placements'][e['id']], data)]
        else:
            e['chronology'] = [describe({'start': {'era': n}, 'relation': 'point', 'basis': 'Era from the existing catalog; period and stage unspecified.'}, data) for n in e.get('era', [])]
        if e['id'] in [era['readingId'] for era in data['eras']]:
            path = root / 'site/content' / (e['id'] + '.json')
            reading = json.loads(path.read_text())
            for b in reading['blocks']:
                if b.get('sourceParagraph') in mapping:
                    b['chronology'] = mapping[b['sourceParagraph']]
            path.write_text(json.dumps(reading, ensure_ascii=False))


def annotate_timeline():
    data = registry()
    mapping = paragraph_map(data)
    path = ROOT / 'site/timeline.json'
    timeline = json.loads(path.read_text())
    for era in timeline['eras']:
        era['chronologyGuide'] = 'chronology.html#era-' + str(era['number'])
        for event in era['events']:
            place = mapping.get(event.get('paragraph'))
            if event['id'] == 'event-early-machine-language':
                place = describe(data['placements']['early-machine-language'], data)
            event['chronology'] = place or describe({'start': {'era': era['number']}, 'relation': 'point', 'basis': 'Period and stage not established for this thematic entry.'}, data)
    path.write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n')


def badge(place, prefix=''):
    d = describe(place, registry())
    return ('<aside class="chronology-note" aria-label="Historical placement"><p><a href="' + prefix + d['href'] + '"><strong>' + html.escape(d['code']) + '</strong></a> — ' + html.escape(d['precision']) + '</p><p>' + html.escape(d['label']) + '</p><small>' + html.escape(d['basis']) + '</small></aside>')


def publish_guide():
    data = registry()
    sections = []
    esc = html.escape
    for era in data['eras']:
        periods = []
        for p in era['periods']:
            point = {'era': era['number'], 'period': p['number']}
            rows = []
            for s in p['stages']:
                code = address({**point, 'stage': s['number']})
                href = f"index.html#read={era['readingId']}&block=lore-p{s['sourceParagraph']:05}"
                rows.append(f'<li><a href="{esc(href)}"><code>{code}</code> — {esc(s["name"])}</a></li>')
            source = f'index.html#read={era["readingId"]}&block=lore-p{p["sourceParagraph"]:05}'
            periods.append(f'<section id="era-{era["number"]}-p{p["number"]:02}"><h3>{address(point)} — {esc(p["name"])}</h3><p>{esc(p["basis"])} · <a href="{esc(source)}">Source passage →</a></p>' + ('<ol>'+''.join(rows)+'</ol>' if rows else '<p>Stages not yet assigned. Use the period code alone.</p>')+'</section>')
        sections.append(f'<section id="era-{era["number"]}"><h2>{address({"era":era["number"]})} — {esc(era["name"])}</h2>'+''.join(periods)+'</section>')
    examples = []
    for key,title,href in [('early-machine-language','Early machine language','early-machine-language/'),('the-chain-of-hands','The Chain of Hands — story seed','plans.html#the-chain-of-hands'),('custodian-who-refused-revised','The Custodian Who Refused — revised draft','custodian/')]:
        examples.append('<li><a href="'+href+'">'+title+'</a>'+badge(data['placements'][key])+'</li>')
    nav = ' · '.join(f'<a href="#era-{e["number"]}">{address({"era":e["number"]})}</a>' for e in data['eras'])
    text = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Era, period and stage · Cyber Pet Lore</title><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="chronology.css"></head><body><main class="chronology-guide"><nav aria-label="Archive"><a href="index.html">Library</a> · <a href="timeline.html">Timeline</a> · <a href="plans.html">Plans</a></nav><p>READING THE HISTORY</p><h1>Era · Period · Stage</h1><p><strong>E−3 · P02 · S01</strong> means Era −3, Period 2, Stage 1. Here that is <strong>Assemblies Without Continuity → The First Assemblies</strong>.</p><p>These are named positions in the history, not dates or equal units of time. Periods and stages may overlap. Numbers follow the indexed source sequence; they do not settle disputed chronology.</p><h2>Use only the precision we have</h2><ul><li><code>E−3</code>: era known; period and stage unspecified.</li><li><code>E−3 · P02</code>: period known; stage unspecified.</li><li><code>E−3 · P02 · S01</code>: a named stage.</li><li><code>E−3 · P04 · S02–06</code>: a range within a period.</li><li><code>E−3 · P03 · S09 → E−3 · P04 · S02</code>: a range crossing periods.</li></ul><p><strong>Span</strong> means the work covers the stated interval. <strong>Placement window</strong> means it could fall within that interval; it does not claim that all those stages occur during the story. An unknown placement is left broad, not assigned a made-up stage.</p><p>Existing source periods retain their names and order. Newly grouped periods are labeled <strong>Editorial grouping</strong>; stage numbers are editorial references. Draft, proposed and established-lore status remain separate from time placement. Codes are stable references; future additions must not silently renumber them.</p><h2>The works discussed</h2><ul>'''+''.join(examples)+'</ul><h2>Browse the full index</h2><nav aria-label="Eras">'+nav+'</nav>'+''.join(sections)+'</main></body></html>'
    (ROOT/'site/chronology.html').write_text(text)
    (ROOT/'site/chronology.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
    # Standalone editions get the same setting window; source prose remains unchanged.
    targets = [(ROOT/'site/early-machine-language/index.html', 'early-machine-language')]
    targets += [(p,'custodian-who-refused-revised') for p in (ROOT/'site/custodian').glob('*.html')]
    for path,key in targets:
        s=path.read_text()
        s=re.sub(r'<aside class="chronology-note".*?</aside>', '', s, flags=re.S)
        s=re.sub(r'(<h1\b[^>]*>.*?</h1>)',lambda m:m[0]+badge(data['placements'][key],'../'),s,count=1,flags=re.S)
        if 'chronology.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="../chronology.css"></head>')
        path.write_text(s)
    print('Chronology: 8 eras,',sum(len(e['periods']) for e in data['eras']),'named periods')


if __name__ == '__main__':
    annotate_timeline()
    publish_guide()
