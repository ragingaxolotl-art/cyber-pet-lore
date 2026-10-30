"""Publish the author's Era Zero concept collection as an annotatable reading."""
import json


def add_era_zero_lives(root, catalog, sources):
    data = json.loads((root / 'sources/era-zero-independent-lives.json').read_text())
    sid = 'reference-era-zero-independent-lives'
    blocks = [{'id': sid + '-title', 'text': data['title'], 'style': 'HEADING_1'},
              {'id': sid + '-status', 'text': data['status'] + '. ' + data['sourceNote'], 'style': 'NORMAL_TEXT'}]
    for section in data['sections']:
        prefix = sid + '-' + section['id']
        blocks.append({'id': prefix, 'text': section['title'], 'style': 'HEADING_2'})
        for number, paragraph in enumerate(section['paragraphs'], 1):
            blocks.append({'id': prefix + '-p' + str(number), 'text': paragraph, 'style': 'NORMAL_TEXT'})
    assert len({b['id'] for b in blocks}) == len(blocks)
    reading = {'id': sid, 'blocks': blocks, 'outline': [
        {'id': b['id'], 'title': b['text'], 'level': 2} for b in blocks if b['style'] == 'HEADING_2']}
    (root / 'site/content' / (sid + '.json')).write_text(json.dumps(reading, ensure_ascii=False))
    catalog.append({'id': sid, 'title': data['title'], 'kind': 'Reference', 'era': [0],
        'timeLabel': 'Era Zero · proposed independent communities and characters', 'timeOrder': 366.5,
        'status': data['status'], 'characters': [], 'places': [],
        'topics': ['Era Zero', 'Great Flourishing', 'program embodiment', 'independent characters',
                   'Manybody Commons', 'Moving Orchards', 'Houses of Another Beginning', 'Interval Cities',
                   'Unscored Fields', 'First Homes', 'Weather Stages', 'Patient Workshops',
                   'communication between minds', 'World Bloom', 'Deren Vask', 'Iven Sool', 'Pella Ro',
                   'Sava Pell', 'Orren Vey', 'Mira Tann', 'Esi Marr', 'Tovan Nesh'],
        'source': {'title': data['title'], 'url': ''},
        'summary': 'Nine proposed areas of prosperous Era Zero, independent character concepts, a World Bloom ensemble, and six retained earlier alternatives. Includes the correction from the dancer analogy to communication between differently perceiving programs.',
        'wordCount': sum(len(b['text'].split()) for b in blocks),
        'explicitLinks': ['lore-p00365', 'world-shared-simulation', 'world-embodied-space'],
        'connectionLabel': 'Proposed Era Zero lives · program embodiment'})
    sources.append({'key': 'era-zero-independent-lives', 'title': data['title'], 'note': data['sourceNote']})
