"""Add dated human history and clearly undated fiction without moving source anchors."""
import json


def add_era_three_history(root, catalog, sources):
    data = json.loads((root / 'sources/era-three-history.json').read_text())
    sid = 'reference-era-three-history'
    blocks = []

    def block(key, text, style='NORMAL_TEXT', href=None):
        item = {'id': sid + '-' + key, 'text': text, 'style': style}
        if href:
            item['referenceUrl'] = href
        blocks.append(item)

    block('title', data['title'], 'HEADING_1')
    block('coverage', data['scope'] + ' Reviewed ' + data['reviewed'] + '.')
    for i, text in enumerate(data['introduction']):
        block('introduction-' + str(i), text)
    block('bibliography', 'Open the earlier annotated bibliography and incident PDFs →', href='#read=reference-era-three-research')
    block('real-world', 'Dated real-world chronology', 'HEADING_2')
    for event in data['entries']:
        key = event['id']
        block(key, event['date'] + ' — ' + event['title'], 'HEADING_3')
        block(key + '-fact', 'REAL WORLD · ' + event['category'] + '. ' + event['fact'])
        block(key + '-connection', 'STORY CONNECTION · Editorial interpretation. ' + event['connection'])
        block(key + '-limit', 'EVIDENCE LIMIT · ' + event['limit'])
        for i, source in enumerate(event['sources']):
            block(key + '-source-' + str(i), 'Source: ' + source['label'], href=source['url'])
        block(key + '-lore', 'Read the connected Era −3 passage →', href='#read=lore-p00039&block=lore-p' + str(event['paragraph']).zfill(5))
    block('fiction', 'Fictional chronology — calendar dates unassigned', 'HEADING_2')
    for event in data['fiction']:
        key = 'fiction-' + event['id']
        block(key, event['placement'] + ' — ' + event['title'], 'HEADING_3')
        block(key + '-text', 'FICTION · Existing lore, summarized. ' + event['text'])
        block(key + '-source', 'Read the original fictional history →', href='#read=lore-p00039&block=lore-p' + str(event['paragraph']).zfill(5))
    block('connection-summary', 'Where reality and Cyberpath connect', 'HEADING_2')
    block('synthesis', data['synthesis'])
    content = root / 'site/content'
    reading = {'id': sid, 'blocks': blocks, 'outline': [
        {'id': b['id'], 'title': b['text'], 'level': int(b['style'][-1])}
        for b in blocks if b['style'].startswith('HEADING_')
    ]}
    (content / (sid + '.json')).write_text(json.dumps(reading, ensure_ascii=False))
    (root / 'site/era-three-history.json').write_text(json.dumps(data, ensure_ascii=False))
    targets = ['lore-p00039', 'lore-p00885', 'reference-era-three-research']
    catalog.append({
        'id': sid, 'title': data['title'], 'kind': 'Reference', 'era': [-3],
        'timeLabel': '1950–2026 · real events and undated fictional sequence',
        'timeOrder': 137.6, 'status': 'Editorial chronology · reviewed ' + data['reviewed'],
        'characters': [], 'places': [],
        'topics': ['AI history', 'timeline', 'real-world research', 'Cacheboard', 'bias', 'copyright', 'labor', 'privacy', 'companions', 'energy', 'Claude', 'Anthropic', 'OpenAI', 'PDF'],
        'source': {'title': data['title'], 'url': ''},
        'summary': str(len(data['entries'])) + ' dated real-world milestones and ' + str(len(data['fiction'])) + ' fictional stages, with original sources, PDFs, story connections, and evidence limits.',
        'wordCount': sum(len(b['text'].split()) for b in blocks),
        'explicitLinks': targets + ['lore-p00138', 'atlas-p00032', 'atlas-p00044'],
        'connectionLabel': 'Human-world chronology and fictional connections',
    })
    sources.append({'key': 'era-three-history', 'title': data['title'], 'note': data['scope']})
    for target in targets:
        path = content / (target + '.json')
        original = json.loads(path.read_text())
        extra = {'id': target + '-detailed-history', 'text': 'Explore the detailed Era −3 timeline: real AI history, controversies, sources, and the fictional sequence →', 'style': 'NORMAL_TEXT', 'referenceUrl': '#read=' + sid}
        original['blocks'].append(extra)
        path.write_text(json.dumps(original, ensure_ascii=False))
        entry = next(e for e in catalog if e['id'] == target)
        entry['wordCount'] += len(extra['text'].split())
        entry.setdefault('explicitLinks', []).append(sid)
