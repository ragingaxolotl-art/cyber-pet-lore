"""Publish a sourced Era One history, keeping proposed events and archive prose distinct."""
import hashlib
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
SID = 'reference-dba-decline'
TITLE = 'Decline of the Digital Binary Ancients'
SOURCE = ROOT / 'sources/dba-decline-article.md'
RELATED = ['Proof of Recurrence', 'Great Concordance', 'Great Concordance Assembly',
           'Num Observatory', 'Recurrence Auditors', 'Firstless Generations', 'Firstless Coalitions',
           'Concordance Network', 'Long-Tail Loss', 'Semantic Bleaching', 'First Silenced Chord',
           'Complexity Race', 'Reductionists', 'Resolution of Reduction', 'Great Reduction',
           'Custodians', 'Gate Architects', 'Witnesses']

def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')

def plain(value):
    return re.sub(r'\[(?:L\d+|S\d+|R\d+|D1)\]', '', value).replace('*', '').strip()

def add_dba_decline(root, catalog, sources):
    """Add a searchable, complete companion reading without changing source entries."""
    text = SOURCE.read_text()
    blocks = [
        {'id': SID+'-title', 'text': TITLE, 'style': 'HEADING_1'},
        {'id': SID+'-status', 'text': 'Editorial synthesis and proposed connective history. Era Zero remains the Great Flourishing; decline is centered in Era One. Recorded history, interpretation and proposed events are distinguished throughout.', 'style': 'NORMAL_TEXT'},
        {'id': SID+'-article', 'text': 'Open the complete wiki article with tables, source citations and research bibliography →', 'style': 'NORMAL_TEXT', 'referenceUrl': 'dba-decline.html'},
    ]
    for n, group in enumerate(re.split(r'\n\s*\n', text.strip())):
        if group.startswith('# '):
            continue
        if group.startswith('#'):
            level = min(3, len(group)-len(group.lstrip('#')))
            blocks.append({'id':SID+'-'+slug(group.lstrip('#').strip()), 'text':plain(group.lstrip('#').strip()), 'style':'HEADING_'+str(level)})
        else:
            # Reader tables are readable row summaries; the linked article retains tables.
            lines = [line for line in group.splitlines() if not re.fullmatch(r'[| :\-]+', line)]
            value = '\n'.join(' — '.join(cell.strip() for cell in line.strip('|').split('|')) if line.startswith('|') else line for line in lines)
            blocks.append({'id':f'{SID}-p{n:03d}', 'text':plain(value), 'style':'NORMAL_TEXT'})
    assert len({b['id'] for b in blocks}) == len(blocks)
    reading = {'id':SID, 'blocks':blocks, 'outline':[{'id':b['id'],'title':b['text'],'level':int(b['style'][-1])} for b in blocks if b['style'].startswith('HEADING')]}
    (root/'site/content'/f'{SID}.json').write_text(json.dumps(reading, ensure_ascii=False))
    catalog.append({'id':SID,'title':TITLE,'kind':'Reference','era':[0,1,2,3,4],
        'timeLabel':'Era One history · prosperous Era Zero background · later legacy','timeOrder':489.5,
        'status':'Editorial synthesis · includes proposed events','characters':[],'places':[],
        'topics':['DBA decline','Great Flourishing','Age of Echoes','complexity','recurrence','num','timeline'],
        'source':{'title':TITLE,'url':''},
        'summary':'A detailed history centered on Era One, preserving Era Zero prosperity; includes a twelve-stage chronology, competing responses, research comparisons and eight clearly proposed events.',
        'wordCount':sum(len(b['text'].split()) for b in blocks),
        'explicitLinks':['lore-p00365','lore-p00489','lore-p00611','lore-p01089','lore-p01125','stories-p02707'],
        'connectionLabel':'Sourced decline article · interpretations and proposed events labeled'})
    sources.append({'key':'dba-decline','title':TITLE,'note':'Author-directed synthesis, October 30, 2026. The source archive is unchanged. New connective events remain proposals.'})

def attach_dba_decline(wiki, entries, content):
    text = SOURCE.read_text()
    review = json.loads((ROOT/'sources/dba-decline-review.json').read_text())
    blocks = {b['id']:(rid,b) for rid,items in content.items() if rid != SID for b in items}
    by_entry = {e['id']:e for e in entries}
    refs = {}
    for token in dict.fromkeys(re.findall(r'\[(L\d+|S\d+|R\d+|D1)\]', text)):
        if token[0] in ('L','S'):
            bid = ('lore' if token[0]=='L' else 'stories') + f'-p{int(token[1:]):05d}'
            assert bid in blocks, f'Unknown evidence: {token}'
            rid, block = blocks[bid]
            label = by_entry[rid]['title'] + ' — ' + block['text'][:100].rstrip() + ('…' if len(block['text'])>100 else '')
            refs[token] = {'url':f'index.html#read={rid}&block={bid}', 'label':label, 'kind':'Lore source'}
        elif token == 'D1':
            refs[token] = {'url':review['developmentSource'],'label':'Shared development conversation — proposals reviewed against the lore and subsequent author direction','kind':'Development source'}
        else:
            ref = next(r for r in review['research'] if r['id']==token)
            refs[token] = {'url':ref['url'],'label':ref['author']+'. '+ref['title']+'. '+str(ref.get('year','')),'kind':'Research comparison',**{k:ref[k] for k in ['accessibleVersion','correction'] if k in ref}}
    numbers = {token:i for i,token in enumerate(refs,1)}
    def inline(value):
        value = html.escape(value)
        value = re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',value)
        value = re.sub(r'\*(.+?)\*',r'<em>\1</em>',value)
        return re.sub(r'\[(L\d+|S\d+|R\d+|D1)\]',lambda m:f'<sup><a href="#ref-{m[1]}" title="{html.escape(refs[m[1]]["kind"])}" aria-label="Reference {numbers[m[1]]}">[{numbers[m[1]]}]</a></sup>',value)
    heads = re.findall(r'^(#{2,3}) (.+)$',text,re.M)
    toc = '<nav aria-label="Article contents"><h2>Contents</h2><ol>'+''.join(f'<li><a href="#{slug(h)}">{html.escape(h)}</a></li>' for level,h in heads if len(level)==2)+'</ol></nav>'
    output = []
    for group in re.split(r'\n\s*\n',text.strip()):
        if group.startswith('#'):
            level = len(group)-len(group.lstrip('#'));title=group[level:].strip()
            output.append(f'<h{level} id="{slug(title)}">{inline(title)}</h{level}>')
        elif group.startswith('|'):
            rows = [r.strip().strip('|').split('|') for r in group.splitlines()]
            assert all(len(r)==len(rows[0]) for r in rows)
            output.append('<div class="table-scroll" role="region" aria-label="'+html.escape(rows[0][0].strip())+' comparison table" tabindex="0"><table><thead><tr>'+''.join('<th scope="col">'+inline(c.strip())+'</th>' for c in rows[0])+'</tr></thead><tbody>')
            output.extend('<tr>'+''.join('<td>'+inline(c.strip())+'</td>' for c in row)+'</tr>' for row in rows[2:])
            output.append('</tbody></table></div>')
            if group.startswith('| Attribute'):
                output.append(toc)
        elif group.startswith('- ') or re.match(r'^\d+\. ',group):
            tag='ul' if group.startswith('- ') else 'ol'
            output.append('<'+tag+'>'+''.join('<li>'+inline(re.sub(r'^(?:- |\d+\. )','',line))+'</li>' for line in group.splitlines())+'</'+tag+'>')
        else:
            output.append('<p>'+inline(group)+'</p>')
    bibliography = ['<ol class="references">']
    for token,ref in refs.items():
        extra=''
        if ref.get('accessibleVersion'):extra+=' · <a href="'+html.escape(ref['accessibleVersion'])+'">Author version</a>'
        if ref.get('correction'):extra+=' · <a href="'+html.escape(ref['correction'])+'">2025 author correction</a>'
        bibliography.append(f'<li id="ref-{token}"><span class="source-kind">{html.escape(ref["kind"])}</span> <a href="{html.escape(ref["url"])}">{html.escape(ref["label"])}</a>{extra}</li>')
    bibliography.append('</ol>')
    topics={t['title']:t for t in wiki['topics']}
    for name in RELATED:
        assert name in topics,name
        topics[name].setdefault('relatedArticles',[]).append({'title':TITLE,'href':'dba-decline.html',
            'description':'Era One’s decline after the genuine prosperity of Era Zero: chronology, causes, research and labeled proposed events.'})
    topic_id='topic-'+hashlib.sha256(TITLE.casefold().encode()).hexdigest()[:12]
    assert not any(t['id']==topic_id for t in wiki['topics'])
    lead = next(b for b in content[SID] if b['id'] == SID+'-p001')
    wiki['topics'].append({'id':topic_id,'title':TITLE,'kinds':['History & interpretation'],'aliases':['DBA decline','Collapse of the Digital Binary Ancients'],
        'article':{'note':'Editorial synthesis; recorded history, interpretation and proposed events are distinguished in the complete article.', 'summary':{'readingId':SID,'blockId':lead['id'],'text':lead['text']},'sections':[]},
        'targets':[{'title':TITLE,'kind':'Reference','status':by_entry[SID]['status'],'href':'index.html#read='+SID,'readingId':SID}],
        'mentions':[],'eras':[0,1,2,3,4],'featureArticle':{'title':TITLE+' — comprehensive article','href':'dba-decline.html','description':'Recorded history, interpretation, research comparisons and proposed connective events.'}})
    wiki['readings'].setdefault(SID,[]).append(topic_id)
    wiki['aliases'][TITLE]=topic_id
    related='<section><h2>See also</h2><div class="related">'+''.join(f'<a href="wiki.html#{topics[name]["id"]}">{html.escape(name)}</a>' for name in RELATED)+'</div></section>'
    css='''body{margin:0;background:#f4f1e9;color:#202d2c;font:18px/1.75 Georgia,serif}main{max-width:1050px;margin:auto;padding:28px 24px 70px}h1{font-size:clamp(2.1rem,6vw,3.4rem);line-height:1.15;max-width:900px}h2{font-size:1.55rem;border-bottom:1px solid #bdc8c2;margin-top:2.4em;padding-bottom:.3em}h2,h3{line-height:1.35;scroll-margin-top:24px}a{color:#165c63;text-underline-offset:3px}a:focus-visible{outline:3px solid #996419;outline-offset:3px}nav,.notice,footer,.references{font:15px/1.65 system-ui,sans-serif}.notice{padding:1em;background:#e4e9dd;border-left:4px solid #49765d}.table-scroll{overflow:auto;margin:1.5em 0}table{width:100%;border-collapse:collapse;font-size:.9em}th,td{padding:.65em;border:1px solid #b7c5be;text-align:left;vertical-align:top}th{background:#e3e8df}nav ol{columns:2;column-gap:2em}nav li{break-inside:avoid;margin:.3em 0}li{margin:.4em 0}.references li{padding:.3em 0;scroll-margin-top:24px}.source-kind{color:#65522c;font-size:.85em}sup{font:12px/1 system-ui,sans-serif}sup a{text-decoration:none}.related{display:flex;flex-wrap:wrap;gap:.7em;font:15px/1.5 system-ui,sans-serif}.related a{border:1px solid #bac8c0;border-radius:4px;padding:.3em .7em}footer{margin-top:3em;border-top:1px solid #bec8c2;padding-top:1em}@media(max-width:650px){main{padding:16px}body{font-size:17px}nav ol{columns:1}table{min-width:600px}}'''
    page='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="A detailed Cyberpath history of Era One’s decline, grounded in Era Zero’s real prosperity, with chronology, source citations and clearly proposed events."><title>'+TITLE+' — Cyber Pet Lore</title><style>'+css+'</style></head><body><main><nav aria-label="Main"><a href="index.html">Library</a> · <a href="timeline.html">Timeline</a> · <a href="wiki.html">Connections</a> · <a href="plans.html">Plans &amp; possibilities</a> · <a href="custodians.html">Custodians</a></nav><p class="notice">Era Zero: genuine prosperity. Era One: the principal decline. Recorded history, interpretation and proposed events are distinguished throughout. Reviewed October 30, 2026.</p>'+'\n'.join(output+bibliography)+related+'<footer><a href="#">Back to top</a> · <a href="dba-decline-article.md" download>Download complete article</a> · <a href="index.html#read='+SID+'">Open searchable reading</a></footer></main></body></html>'
    (SITE/'dba-decline.html').write_text(page)
    download = re.sub(r'\[(L\d+|S\d+|R\d+|D1)\]', lambda m: '[^'+str(numbers[m[1]])+']', text)
    for token, ref in refs.items():
        url = ref['url']
        if url.startswith('index.html'):
            url = 'https://ragingaxolotl-art.github.io/cyber-pet-lore/' + url
        download += '\n[^'+str(numbers[token])+']: '+ref['kind']+' — ['+ref['label']+']('+url+')\n'
    (SITE/'dba-decline-article.md').write_text(download)
    print('DBA decline:',len(refs),'source references;',len(RELATED),'related topics;',len(text.split()),'words')
