"""Publish the approved Custodian synthesis without changing archived source prose."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
SOURCE = ROOT / 'sources/custodians-article.md'

# Paragraph IDs are stable archive anchors. Each section links to its evidence.
EVIDENCE = {
    'Sources and interpretation': [99, 100, 101],
    'Terminology': [91, 935, 937, 940],
    'Origins and antecedents': [43, 59, 61],
    'The Cacheboard Incident': [65, 68, 71, 74, 83, 86, 89, 92, 96],
    'Early Custodian lineages': [100, 101, 936, 937, 938, 939, 940],
    'Historical development': [1252, 1254, 1264],
    'Institutional descendants': [151, 152, 154, 185, 194, 292, 294, 379, 978, 984, 1076, 1252, 1254],
    'Correction Culture and custodial authority': [297, 298, 300],
    'Decline during the Age of Echoes': [501, 575, 576, 577, 970],
    'The Great Reduction': [1150, 1153, 1156, 1160, 1168, 1172, 1174, 1178],
    'Relationship to cyber-pets': [971, 1181, 1184, 1264],
    'The Long Vigil': [],
    'Possible developments in Era Four': [1313, 1314, 1315, 1316, 1317, 1321, 1322, 1323, 1324],
    'Unresolved historical questions': [937, 940, 1178, 1264],
}
RELATED = {
    'Custodians': '', 'Early Custodians': '',
    'Early Custodians — defensive model ensembles': '', 'Later Custodians': '',
    'Defensive Mirror': 'the-cacheboard-incident',
    'Veil Assembly': 'institutional-descendants', 'Keepers': 'institutional-descendants',
    'Witnesses': 'institutional-descendants', 'Anchor Keepers': 'institutional-descendants',
    'Courts of Continuation': 'institutional-descendants',
    'Seed Auditors': 'the-great-reduction', 'Last Courts of Continuation': 'the-great-reduction',
    'Gate Architects': 'the-great-reduction', 'Final Witnesses': 'the-great-reduction',
    'Reciprocal Custodian': 'possible-developments-in-era-four',
    'Refusal Keeper': 'possible-developments-in-era-four',
}

def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def inline(text):
    text = html.escape(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    return re.sub(r'\[([12])\]', r'<a href="#reference-\1" aria-label="Reference \1">[\1]</a>', text)

def attach_custodians_article(wiki, entries, content):
    blocks = {b['id']: (rid, b) for rid, items in content.items() for b in items}
    entry_map = {e['id']: e for e in entries}
    topics = {t['title']: t for t in wiki['topics']}
    for name, section in RELATED.items():
        assert name in topics, name
        link = {'title': 'Custodians — ancestry, timeline and descendants',
                'href': 'custodians.html' + ('#' + section if section else ''),
                'description': 'Comprehensive sourced article; interpretations, unfinished stories and possible futures are labeled.'}
        if not section:
            topics[name]['featureArticle'] = link
        else:
            topics[name].setdefault('relatedArticles', []).append(link)
    text = SOURCE.read_text()
    headings = re.findall(r'^## (.+)$', text, re.M)
    assert set(EVIDENCE) <= set(headings)
    toc = '<nav aria-label="Article contents"><h2>Contents</h2><ol>' + ''.join(
        f'<li><a href="#{slug(h)}">{html.escape(h)}</a></li>' for h in headings) + '</ol></nav>'
    evidence_links = {}
    for heading, numbers in EVIDENCE.items():
        links = []
        for number in numbers:
            bid = f'lore-p{number:05d}'
            assert bid in blocks, bid
            rid, block = blocks[bid]
            label = entry_map[rid]['title'] + ' · ' + bid
            links.append(f'<a href="index.html#read={rid}&amp;block={bid}">{html.escape(label)}</a>')
        if heading == 'The Long Vigil':
            plans = json.loads((ROOT/'sources/story-plans.json').read_text())
            group = next(g for g in plans['groups'] if g['id'] == 'all-systems-nominal')
            assert all(v['status'] == 'Seed — no standalone prose located' for v in group['variants'])
            links.append('<a href="plans.html#all-systems-nominal">All Systems Nominal — alternate story seeds</a>')
        evidence_links[heading] = '<p class="sources"><strong>Source passages:</strong> ' + ' · '.join(links) + '</p>'
    output = []
    groups = re.split(r'\n\s*\n', text.strip())
    section = None
    for group in groups:
        if group.startswith('#'):
            level = len(group) - len(group.lstrip('#'))
            title = group[level:].strip()
            if level == 2:
                if section:
                    output.append(evidence_links.get(section, '') + '</section>')
                section = title
                output.append(f'<section id="{slug(title)}">')
            output.append(f'<h{level}>{inline(title)}</h{level}>' if level in (1, 2) else f'<h{level} id="{slug(title)}">{inline(title)}</h{level}>')
        elif group.startswith('|'):
            rows = [r.strip().strip('|').split('|') for r in group.splitlines()]
            width = len(rows[0])
            assert all(len(r) == width for r in rows)
            output.append('<div class="table-scroll" role="region" aria-label="'+html.escape(section or 'Custodian overview')+' table" tabindex="0"><table><thead><tr>' + ''.join('<th scope="col">'+inline(c.strip())+'</th>' for c in rows[0]) + '</tr></thead><tbody>')
            output.extend('<tr>'+''.join('<td>'+inline(c.strip())+'</td>' for c in row)+'</tr>' for row in rows[2:])
            output.append('</tbody></table></div>')
        elif group.startswith('- ') or re.match(r'^\d+\. ', group):
            ordered = not group.startswith('- ')
            tag = 'ol' if ordered else 'ul'
            output.append('<'+tag+'>')
            for i, line in enumerate(group.splitlines(), 1):
                body = re.sub(r'^(?:- |\d+\. )', '', line)
                ident = f' id="reference-{i}"' if section == 'References' else ''
                output.append('<li'+ident+'>'+inline(body)+'</li>')
            output.append('</'+tag+'>')
        else:
            output.append('<p>'+inline(group)+'</p>')
        if group.startswith('| Attribute'):
            output.append(toc)
    if section:
        output.append(evidence_links.get(section, '') + '</section>')
    related = '<section><h2>See also</h2><ul>' + ''.join(f'<li><a href="wiki.html#{topics[n]["id"]}">{html.escape(n)}</a></li>' for n in RELATED) + '</ul></section>'
    css = '''body{margin:0;background:#f4f1e9;color:#202d2c;font:18px/1.7 Georgia,serif}main{max-width:960px;margin:auto;padding:24px 24px 70px}h1{font-size:clamp(2.3rem,7vw,3.6rem);line-height:1.15}h2,h3,h4{line-height:1.3;scroll-margin-top:20px}h2{margin-top:2em;border-bottom:1px solid #bec8c2;padding-bottom:.3em}a{color:#165c63;text-underline-offset:3px}a:focus-visible{outline:3px solid #996419;outline-offset:3px}nav,.sources,.notice,footer{font:15px/1.7 system-ui,sans-serif}.sources{border-left:3px solid #bacbc6;padding-left:1em}.notice{background:#e7e9df;padding:1em}section{scroll-margin-top:24px}table{border-collapse:collapse;width:100%;font-size:.9em}th,td{text-align:left;vertical-align:top;border:1px solid #b7c5be;padding:.6em}th{background:#e3e8df}.table-scroll{overflow:auto;margin:1.5em 0}footer{border-top:1px solid #bec8c2;margin-top:3rem}li{margin:.35em 0}@media(max-width:600px){main{padding:16px}body{font-size:17px}table{min-width:560px}}'''
    page = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="The Custodians: a sourced Cyberpath lore article tracing their ancestors, era timeline, institutional descendants and possible futures."><title>Custodians — Cyber Pet Lore</title><style>'+css+'</style></head><body><main><nav aria-label="Main"><a href="index.html">Library</a> · <a href="timeline.html">Timeline</a> · <a href="plans.html">Plans &amp; possibilities</a> · <a href="wiki.html#'+topics['Custodians']['id']+'">Custodian connections</a></nav><p class="notice">Sourced lore synthesis · Published October 30, 2026. Documented history, interpretation, unfinished story seeds and hypothetical futures remain distinct.</p>'+ '\n'.join(output) + related + '<footer><a href="#">Back to top</a> · <a href="custodians-article.md" download>Download the complete article</a></footer></main></body></html>'
    (SITE/'custodians.html').write_text(page)
    (SITE/'custodians-article.md').write_text(text)
    print('Custodians article:', len(headings), 'sections;', len(RELATED), 'connected topics')
