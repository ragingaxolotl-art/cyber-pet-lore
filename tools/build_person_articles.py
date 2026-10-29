"""Attach authored biographies with validated, passage-level provenance."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def attach_person_articles(wiki, entries, content):
    authored=json.loads((ROOT/'sources/person-articles.json').read_text())
    by_name={t['title']:t for t in wiki['topics']}
    by_entry={e['id']:e for e in entries}
    blocks={b['id']:(rid,b) for rid,items in content.items() for b in items}
    names=set()
    for article in authored['articles']:
        name=article['name']
        assert name not in names, f'Duplicate biography: {name}'
        names.add(name)
        topic=by_name[name]
        biography={**article,'sections':[],'places':[]}
        for section in article['sections']:
            sources=[]
            for bid in section['evidence']:
                assert bid in blocks, f'{name}: missing passage {bid}'
                rid,block=blocks[bid]
                entry=by_entry[rid]
                sources.append({'readingId':rid,'blockId':bid,'title':entry['title'],'status':entry['status'],
                    'href':f'index.html#read={rid}&block={bid}','quote':block['text']})
            assert sources and section['text'].strip(),name
            biography['sections'].append({**section,'sources':sources})
        for place in article['places']:
            target=by_name[place['name']]
            assert 'Place' in target['kinds'],place['name']
            biography['places'].append({**place,'topicId':target['id'],'href':'wiki.html#'+target['id'],
                'image':next(iter(target.get('images',[])),None)})
        if article.get('portrait'):
            portrait=article['portrait']
            assert (ROOT/'site'/portrait['src']).is_file(),portrait
            assert portrait['evidence'] and all(b in blocks for b in portrait['evidence'])
        # Include every indexed source for further reading, with alternate statuses intact.
        bibliography={ref['readingId']:ref for ref in topic['targets']+topic['mentions']}
        for section in biography['sections']:
            for source in section['sources']:
                bibliography.setdefault(source['readingId'],{k:source[k] for k in ['readingId','title','status','href']})
        biography['bibliography']=list(bibliography.values())
        topic['biography']=biography
    missing=[t['title'] for t in wiki['topics'] if 'Person' in t['kinds'] and not t.get('choices') and t['title'] not in names]
    assert not missing, f'Individuals without authored articles: {missing}'
    wiki['biographyCoverage']={'articleCount':len(names),'individualCount':sum('Person' in t['kinds'] for t in wiki['topics']),
       'sourceReadings':len(entries),'sourceBlocks':sum(map(len,content.values())),
       'note':'Authored synthesis of the indexed archive; interpretations are labeled separately. Original passages remain unchanged.'}
