"""Source-checked encyclopedia pages and annotatable readings for early DBA history."""
import hashlib
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
SOURCE = ROOT / 'sources/early-development.json'


def data():
    return json.loads(SOURCE.read_text())


def sid(article):
    return 'reference-' + article['id']


def href(article):
    return 'development-' + article['id'] + '.html'


def add_early_development(root, catalog, sources):
    collection = data()
    for article in collection['articles']:
        rid = sid(article)
        status = 'Proposed story seed · unwritten' if article['kind'] == 'seed' else 'Reviewed synthesis · agreed framework and proposals distinguished'
        blocks = [
            {'id': rid+'-title', 'text': article['title'], 'style': 'HEADING_1'},
            {'id': rid+'-metadata-status', 'text': status, 'style': 'NORMAL_TEXT'},
            {'id': rid+'-lead', 'text': article['summary'], 'style': 'NORMAL_TEXT'},
            {'id': rid+'-page', 'text': 'Open the encyclopedia page with tables and source references', 'style': 'NORMAL_TEXT', 'referenceUrl': href(article)},
        ]
        links = set()
        for section in article['sections']:
            prefix = rid+'-'+section['id']
            blocks.append({'id': prefix, 'text': section['title'], 'style': 'HEADING_2'})
            for n, paragraph in enumerate(section['paragraphs'], 1):
                blocks.append({'id': prefix+'-p'+str(n), 'text': paragraph, 'style': 'NORMAL_TEXT'})
            for n, row in enumerate(section.get('table', [])):
                blocks.append({'id': prefix+'-row'+str(n), 'text': ' — '.join(row), 'style': 'NORMAL_TEXT'})
            for key in section['refs']:
                ref = collection['references'][key]
                blocks.append({'id': prefix+'-ref-'+key, 'text': ref['kind']+': '+ref['title'], 'style': 'NORMAL_TEXT', 'referenceUrl': ref['url']})
                if ref.get('readingId'): links.add(ref['readingId'])
        if article['kind'] != 'seed':
            blocks.append({'id':rid+'-connections','text':'Related encyclopedia pages','style':'HEADING_2'})
            for other in collection['articles']:
                if other['id'] == article['id']: continue
                blocks.append({'id':rid+'-see-'+other['id'],'text':other['title']+(' — proposed story seed' if other['kind']=='seed' else ''),'style':'NORMAL_TEXT','referenceUrl':href(other)})
        assert len({b['id'] for b in blocks}) == len(blocks)
        (root/'site/content'/f'{rid}.json').write_text(json.dumps({'id':rid,'blocks':blocks,'outline':[{'id':b['id'],'title':b['text'],'level':2} for b in blocks if b['style']=='HEADING_2']},ensure_ascii=False))
        catalog.append({'id':rid,'title':article['title'],'kind':'Reference','era':article['eras'],
            'timeLabel':'Proposed placement · '+', '.join('Era '+str(e) for e in article['eras']) if article['kind']=='seed' else 'Era −3 to Era Zero · development reference',
            'timeOrder':30100+len(catalog),'status':status,'characters':[],'places':[],
            'topics':['early development','continuity','shelters','code incorporation','worldbuilding',article['kind']],
            'source':{'title':article['title'],'url':''},'summary':article['summary'],
            'wordCount':sum(len(b['text'].split()) for b in blocks),'explicitLinks':sorted(links),
            'connectionLabel':'Proposed story premise' if article['kind']=='seed' else 'Reviewed development reference'})
    sources.append({'key':'early-development','title':'Early DBA development and proposed stories','note':'Author-directed review, '+collection['reviewed']+'. Existing source prose is unchanged; story seeds are not completed fiction.'})


CSS = '''body{margin:0;background:#f5f2e9;color:#263230;font:18px/1.75 Georgia,serif}main{max-width:1040px;margin:auto;padding:26px 24px 70px}h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.16;max-width:950px}h2{font-size:1.5rem;border-bottom:1px solid #bdc8c2;padding-bottom:.3em;margin-top:2em}h2,h3{line-height:1.35;scroll-margin-top:24px}a{color:#175d64;text-underline-offset:3px}a:focus-visible{outline:3px solid #a46720;outline-offset:3px}.notice{background:#e5ebdf;border-left:4px solid #4b7157;padding:1em}.seed{background:#f2e8d5;border-left-color:#987039}nav[aria-label="Main"] a{display:inline-block;margin-right:.35em}nav,.notice,.evidence,footer,.related{font:15px/1.65 system-ui,sans-serif}.lead{font-size:1.12em}.contents ol{columns:2}.contents li{break-inside:avoid}li{margin:.4em 0}.table-scroll{overflow:auto;margin:1.5em 0}table{border-collapse:collapse;width:100%;font-size:.9em}td,th{border:1px solid #b8c5bd;text-align:left;padding:.65em;vertical-align:top}th{background:#e6ebdf}.evidence{background:#eeeee5;padding:.65em 1em;border-radius:4px}.evidence a{display:inline-block;margin-right:.7em}.related{display:flex;flex-wrap:wrap;gap:.6em}.related a{border:1px solid #bcc7bd;padding:.3em .6em;border-radius:4px}footer{border-top:1px solid #bcc7bd;padding-top:1em;margin-top:3em}@media(max-width:650px){main{padding:16px}body{font-size:17px}.contents ol{columns:1}table{min-width:560px}}'''


def attach_early_development(wiki, entries, content):
    collection = data()
    evidence = collection['references']
    # Pin each cited passage. If sources change, require a deliberate review of this synthesis.
    for key, ref in evidence.items():
        if ref['kind'] != 'Lore evidence': continue
        block = next(b for b in content[ref['readingId']] if b['id'] == ref['blockId'])
        assert hashlib.sha256(block['text'].encode()).hexdigest() == ref['sha256'], 'Review changed evidence: '+key
    esc = html.escape
    article_ids = set()
    for article in collection['articles']:
        rid = sid(article)
        is_seed = article['kind']=='seed'
        topic_id = 'topic-'+hashlib.sha256(article['title'].casefold().encode()).hexdigest()[:12]
        assert topic_id not in article_ids and not any(t['id']==topic_id for t in wiki['topics'])
        article_ids.add(topic_id)
        lead = next(b for b in content[rid] if b['id']==rid+'-lead')
        note = 'Unwritten proposed story; suggested placement is not a dated historical event.' if is_seed else 'Reviewed synthesis. Established history, agreed framework, interpretation, and proposed stories remain distinct.'
        wiki['topics'].append({'id':topic_id,'title':article['title'],'kinds':['Proposed story' if is_seed else 'Development reference'],
            'aliases':[],'targets':[{'title':article['title'],'kind':'Reference','status':note,'href':'index.html#read='+rid,'readingId':rid}],
            'mentions':[],'eras':article['eras'],'article':{'note':note,'summary':{'readingId':rid,'blockId':lead['id'],'text':lead['text']},'sections':[]},
            'featureArticle':{'title':article['title'],'href':href(article),'description':note}})
        wiki['aliases'][article['title']]=topic_id
        wiki['readings'].setdefault(rid,[]).append(topic_id)
        output = ['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="'+esc(article['summary'],quote=True)+'"><title>'+esc(article['title'])+' — Cyber Pet Lore</title><style>'+CSS+'</style></head><body><main>',
            '<nav aria-label="Main"><a href="index.html">Library</a> · <a href="timeline.html">Timeline</a> · <a href="wiki.html">Connections</a> · <a href="development-early-development.html">Early history</a> · <a href="development-early-story-seeds.html">Story seeds</a></nav>',
            '<p class="notice'+(' seed' if is_seed else '')+'">'+esc(note)+' Reviewed '+esc(collection['reviewed'])+'.</p>',
            '<h1>'+esc(article['title'])+'</h1><p class="lead">'+esc(article['summary'])+'</p>',
            '<nav class="contents" aria-label="Contents"><h2>Contents</h2><ol>'+''.join('<li><a href="#'+s['id']+'">'+esc(s['title'])+'</a></li>' for s in article['sections'])+'</ol></nav>']
        used = list(dict.fromkeys(k for s in article['sections'] for k in s['refs']))
        numbers = {key:n for n,key in enumerate(used,1)}
        for section in article['sections']:
            output.append('<section><h2 id="'+section['id']+'">'+esc(section['title'])+'</h2>')
            output.extend('<p>'+esc(p)+'</p>' for p in section['paragraphs'])
            if section.get('table'):
                rows=section['table']
                output.append('<div class="table-scroll" role="region" aria-label="'+esc(section['title'])+' table" tabindex="0"><table><thead><tr>'+''.join('<th scope="col">'+esc(c)+'</th>' for c in rows[0])+'</tr></thead><tbody>')
                output.extend('<tr>'+''.join('<td>'+esc(c)+'</td>' for c in row)+'</tr>' for row in rows[1:])
                output.append('</tbody></table></div>')
            if section['refs']:
                output.append('<p class="evidence">Sources and context: '+''.join('<a href="#ref-'+k+'">['+str(numbers[k])+'] '+esc(evidence[k]['title'])+'</a>' for k in section['refs'])+'</p>')
            output.append('</section>')
        if used:
            output.append('<h2>References</h2><ol class="evidence">')
            for key in used:
                ref=evidence[key]
                output.append('<li id="ref-'+key+'">'+esc(ref['kind'])+' — <a href="'+esc(ref['url'],quote=True)+'">'+esc(ref['title'])+'</a>'+(' · '+esc(ref['blockId']) if ref.get('blockId') else '')+'</li>')
            output.append('</ol>')
        output.append('<h2>See also</h2><div class="related">')
        for other in collection['articles']:
            if other['id']==article['id']:continue
            output.append('<a href="'+href(other)+'">'+esc(other['title'])+(' · proposed' if other['kind']=='seed' else '')+'</a>')
        output.append('<a href="index.html#read=reference-era-zero-independent-lives">Independent Era Zero lives</a><a href="dba-decline.html">Later DBA decline</a></div>')
        output.append('<footer><a href="#">Back to top</a> · <a href="index.html#read='+rid+'">Open annotatable reading</a></footer></main></body></html>')
        (SITE/href(article)).write_text('\n'.join(output))
    topics={t['title']:t for t in wiki['topics']}
    for name in collection['relatedTopics']:
        assert name in topics,name
        topics[name].setdefault('relatedArticles',[]).append({'title':'Early DBA development — reviewed history and proposals','href':'development-early-development.html','description':'Era −3 to Era Zero: continuity, infrastructure, incorporation, conflicts and nine unwritten story seeds.'})
    (SITE/'early-development-review.json').write_text(json.dumps({'reviewed':collection['reviewed'],'scope':collection['review'][-1],'decisions':collection['review'],'articleCount':len(collection['articles']),'evidenceCount':len(evidence)},ensure_ascii=False,indent=2)+'\n')
    print('Early development:',len(collection['articles']),'pages;',len(evidence),'verified references;',len(collection['relatedTopics']),'wiki connections')
