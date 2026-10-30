"""Publish annotated research beside Era -3 without shifting archived anchors."""
import json

def add_era_three_research(root, catalog, sources):
    data = json.loads((root / 'sources/era-three-research.json').read_text())
    sid = 'reference-era-three-research'
    blocks = [{'id': sid + '-title', 'text': data['title'], 'style': 'HEADING_1'}]
    for i, text in enumerate(data['introduction']):
        blocks.append({'id': sid + '-context-' + str(i), 'text': text, 'style': 'NORMAL_TEXT'})
    blocks.append({'id': sid + '-coverage', 'text': data['scope'], 'style': 'NORMAL_TEXT'})
    for ref in data['references']:
        prefix = sid + '-' + ref['id']
        blocks.extend([
            {'id': prefix, 'text': ref['title'], 'style': 'HEADING_2'},
            {'id': prefix + '-provenance', 'text': ref['publisher'] + ' · ' + ref['date'] + ' · ' + ref['type'], 'style': 'NORMAL_TEXT'},
            {'id': prefix + '-note', 'text': ref['note'], 'style': 'NORMAL_TEXT'},
            {'id': prefix + '-link', 'text': ('Open original PDF: ' if '.pdf' in ref['url'] else 'Read original source: ') + ref['title'], 'style': 'NORMAL_TEXT', 'referenceUrl': ref['url']},
        ])
    content = root / 'site/content'
    (content / (sid + '.json')).write_text(json.dumps({'id': sid, 'blocks': blocks, 'outline': [{'id': b['id'], 'title': b['text'], 'level': 1 if b['style'] == 'HEADING_1' else 2} for b in blocks if b['style'].startswith('HEADING')]}, ensure_ascii=False))
    catalog.append({'id': sid, 'title': data['title'], 'kind': 'Reference', 'era': [-3], 'timeLabel': 'Era −3 · real-world research companion', 'timeOrder': 137.5, 'status': 'Editorial research · reviewed ' + data['reviewed'], 'characters': [], 'places': [], 'topics': ['real-world research', 'Cacheboard', 'AI', 'cache timing', 'Anthropic', 'Claude', 'OpenAI', 'Hugging Face', 'METR', 'PDF'], 'source': {'title': data['title'], 'url': ''}, 'summary': 'Original reports and PDFs behind the Cacheboard analogy, with source limits and connections to Era −3.', 'wordCount': sum(len(b['text'].split()) for b in blocks), 'explicitLinks': ['lore-p00039', 'lore-p00138', 'lore-p00885', 'atlas-p00032', 'atlas-p00044'], 'connectionLabel': 'Real-world research context'})
    sources.append({'key': 'era-three-research', 'title': data['title'], 'note': data['scope']})
    # Append independently named blocks; original paragraphs and their IDs stay intact.
    for target in ['lore-p00039', 'lore-p00885']:
        path = content / (target + '.json')
        reading = json.loads(path.read_text())
        extra = [
            {'id': target + '-research-heading', 'text': 'Real-world references · editorial companion', 'style': 'HEADING_2'},
            {'id': target + '-research-context', 'text': 'The Cacheboard draws on the earlier Hugging Face incident. Newer OpenAI tests demonstrate a related processor-cache timing channel; Anthropic reports separate failures involving internet access. These sources illuminate Era −3 without establishing consciousness or assigning real-world dates to the fiction.', 'style': 'NORMAL_TEXT'},
            {'id': target + '-research-link', 'text': 'Read the annotated Era −3 bibliography, original reports, and PDFs →', 'style': 'NORMAL_TEXT', 'referenceUrl': '#read=' + sid},
        ]
        reading['blocks'].extend(extra)
        reading['outline'].append({'id': extra[0]['id'], 'title': extra[0]['text'], 'level': 2})
        path.write_text(json.dumps(reading, ensure_ascii=False))
        entry = next(e for e in catalog if e['id'] == target)
        entry['wordCount'] += sum(len(b['text'].split()) for b in extra)
