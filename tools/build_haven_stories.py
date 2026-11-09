"""Publish five proposed stories and the preserved planning and revision trail."""
import hashlib
import html
import json
import re
from pathlib import Path
from build_custodian_story import markdown, CSS


def shell(title,body,nested=False):
    prefix='../../' if nested else '../'
    assets='../' if nested else ''
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Five novelistic stories from the early havens, with chapter plans and three preserved prose passes."><title>'+html.escape(title)+' — Cyber Pet Lore</title><link rel="stylesheet" href="'+assets+'story.css"></head><body><a class="skip" href="#content">Skip to reading</a><main id="content"><nav aria-label="Story navigation"><a href="'+prefix+'index.html">Lore library</a><a href="'+prefix+'shelter-atlas.html">Haven atlas</a><a href="'+assets+'index.html">Five haven stories</a></nav>'+body+'<footer><p>Proposed fiction. These local scenes do not settle the historical questions of identity or consciousness.</p></footer></main></body></html>'


def add_haven_stories(root,catalog,sources):
    src=root/'sources/haven-stories';out=root/'site/haven-stories';out.mkdir(exist_ok=True)
    manifest=json.loads((src/'manifest.json').read_text())
    (out/'story.css').write_text(CSS+'\n.story-grid{display:grid;gap:1.2rem}.story-card{border:1px solid #b8c8bf;border-radius:9px;padding:1.2rem}.story-card h2{margin-top:0}.story-card p{margin:.6rem 0}.revision-nav{display:flex;flex-wrap:wrap;gap:1rem}code{word-break:break-word}\n')
    cards=[]
    for story in manifest['stories']:
        sid='haven-fiction-'+story['id'];folder=src/story['id'];dest=out/story['id'];dest.mkdir(exist_ok=True)
        manuscript=(folder/'manuscript.md').read_text();assert hashlib.sha256(manuscript.encode()).hexdigest()==story['finalSha256']
        assert len(manuscript.split())==story['wordCount']
        blocks=[dict(id=sid+'-status',text='Complete third-pass proposed draft. New scenes remain proposed fiction. Plans, critiques and earlier manuscripts are preserved separately.',style='NORMAL_TEXT',referenceUrl='haven-stories/'+story['id']+'/review.html')]
        for i,part in enumerate(re.split(r'\n\s*\n',manuscript.strip())):
            heading=re.match(r'^(#{1,6}) (.+)$',part)
            blocks.append(dict(id=sid+'-p'+str(i).zfill(4),text=heading[2] if heading else part,style='HEADING_'+str(len(heading[1])) if heading else 'NORMAL_TEXT'))
        outline=[dict(id=b['id'],title=b['text'],level=int(b['style'][-1])) for b in blocks if b['style'].startswith('HEADING_')]
        (root/'site/content'/f'{sid}.json').write_text(json.dumps(dict(id=sid,blocks=blocks,outline=outline),ensure_ascii=False,indent=2)+'\n')
        dossier='catalistym-place-'+story['haven']
        catalog.append(dict(id=sid,title=story['title'],kind='Draft',era=[-3,-2],timeLabel='Early haven height'+(' into the first separation campaign' if story['stage']==1 else '')+' · proposed local story',timeOrder=19400+story['stage'],status='complete proposed third-pass draft',characters=[],places=[story['place']],topics=['early havens','proposed fiction',story['style'],'continuity'],source=dict(title='At the Height of the Havens — three-pass proposed story collection',url=''),summary=story['engine'],wordCount=story['wordCount'],explicitLinks=[dossier,'catalistym-history'],connectionLabel='Proposed local fiction; not established historical evidence'))
        p=root/'site/content'/f'{dossier}.json';reading=json.loads(p.read_text());reading['blocks'].append(dict(id=dossier+'-haven-fiction',text='Read the proposed story: '+story['title'],style='NORMAL_TEXT',referenceUrl='#read='+sid));p.write_text(json.dumps(reading,ensure_ascii=False,indent=2)+'\n')
        entry=next(e for e in catalog if e['id']==dossier);entry['explicitLinks']=list(dict.fromkeys(entry.get('explicitLinks',[])+[sid]));entry['wordCount']=sum(len(b['text'].split()) for b in reading['blocks'])
        notice='<p class="metadata">'+html.escape(story['place'])+' · early haven fiction · third prose pass</p><p class="notice">A complete proposed draft. Network sensations and readable exchanges are literary translations; these scenes do not assign humanlike minds to every process.</p>'
        contents='<ol class="contents">'+''.join('<li><a href="chapter-'+str(c['number']).zfill(2)+'.html">'+html.escape(c['title'])+'</a><small>'+str(c['wordCount'])+' words</small></li>' for c in story['chapters'])+'</ol>'
        resources='<nav class="revision-nav"><a href="plans.html">Plans and chapter outlines</a><a href="review.html">Critiques and revisions</a><a href="manuscript.md" download>Download manuscript</a><a href="../../shelter-atlas.html?stage='+str(story['stage'])+'#'+story['haven']+'">Locate the haven</a></nav>'
        intro='<h1>'+html.escape(story['title'])+'</h1>'+notice+'<p>'+html.escape(story['style'])+'</p><p>'+html.escape(story['engine'])+'</p><p class="metadata">'+format(story['wordCount'],',')+' words · four chapters</p>'+contents+resources+'<details><summary>Read the entire story on this page</summary><article class="chapter">'+markdown(manuscript)+'</article></details>'
        (dest/'index.html').write_text(shell(story['title'],intro,True));(dest/'manuscript.md').write_text(manuscript)
        for chapter in story['chapters']:
            n=chapter['number'];text=(folder/f'chapter-{n:02d}.md').read_text()
            prev='chapter-'+str(n-1).zfill(2)+'.html' if n>1 else 'index.html';nxt='chapter-'+str(n+1).zfill(2)+'.html' if n<4 else 'index.html'
            body='<p class="metadata">'+html.escape(story['title'])+' · '+html.escape(story['place'])+' · proposed fiction</p><article class="chapter">'+markdown(text)+'</article><nav class="pager"><a href="'+prev+'">← '+('Previous chapter' if n>1 else 'Story contents')+'</a><a href="'+nxt+'">'+('Next chapter' if n<4 else 'Story contents')+' →</a></nav><details><summary>Chapter plan and critiques</summary>'+markdown((folder/f'chapter-{n:02d}-plan.md').read_text())+'</details>'
            (dest/f'chapter-{n:02d}.html').write_text(shell(chapter['title'],body,True))
        planfiles=['overall-plan-v1.md','overall-critique.md','overall-plan-v2.md','outline-v1.md','outline-novelty-critique.md','outline-v2.md']+[f'chapter-{n:02d}-plan.md' for n in range(1,5)]
        planbody='<h1>Planning '+html.escape(story['title'])+'</h1><p>Preserved initial plans, critiques, and revisions. The reading copy is separate.</p>'
        for filename in planfiles:
            label=filename.removesuffix('.md').replace('-',' ');planbody+='<details><summary>'+html.escape(label)+'</summary>'+re.sub(r'id="([^"]+)"', lambda m: 'id="'+filename.removesuffix('.md')+'-'+m[1]+'"', markdown((folder/filename).read_text()))+'</details>'
        (dest/'plans.html').write_text(shell(story['title']+' planning',planbody+resources,True))
        reviews='<h1>Revising '+html.escape(story['title'])+'</h1><p>Three full prose versions and their editorial self-reviews. These are not independent reader tests.</p>'
        for i,version in enumerate(story['passes'],1):
            text=(folder/version['path']).read_text();assert hashlib.sha256(text.encode()).hexdigest()==version['sha256']
            (dest/f'pass-{i:02d}.html').write_text(shell(story['title']+' prose pass '+str(i),'<p class="notice">Preserved prose pass '+str(i)+'. <a href="index.html">Read the current draft</a>.</p><article class="chapter">'+markdown(text)+'</article>',True))
            reviews+='<h2>Prose pass '+str(i)+'</h2><p><a href="pass-'+str(i).zfill(2)+'.html">Read this full version</a> · '+str(version['wordCount'])+' words</p>'+markdown((folder/f'pass-{i:02d}'/'review.md').read_text())
        (dest/'review.html').write_text(shell(story['title']+' revision review',reviews+resources,True))
        cards.append('<article class="story-card"><h2><a href="'+story['id']+'/index.html">'+html.escape(story['title'])+'</a></h2><p class="metadata">'+html.escape(story['place'])+' · '+format(story['wordCount'],',')+' words</p><p>'+html.escape(story['style'])+'</p><p>'+html.escape(story['engine'])+'</p><a href="'+story['id']+'/chapter-01.html">Begin reading →</a></article>')
    hub='<h1>At the Height of the Havens</h1><p>Five complete chaptered stories from inside the early networks: ordinary ingenuity, the first separation, a restoration mystery, the cost of waiting, and unequal cooperation.</p><p class="notice">Proposed fiction · '+format(manifest['totalWordCount'],',')+' words · twenty chapters. Five novelistic stories, not five full-length novels. Each has revised plans, chapter critiques, and three preserved prose passes.</p><div class="story-grid">'+''.join(cards)+'</div><details><summary>Collection planning and final review</summary>'+markdown((src/'collection-plan.md').read_text())+markdown((src/'collection-review.md').read_text())+'</details>'
    (out/'index.html').write_text(shell('At the Height of the Havens',hub));(out/'publication.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    sources.append(dict(key='haven-stories',title=manifest['title'],note='Five newly authored proposed drafts. Full planning and three prose passes preserved; existing story source texts unchanged.'))
    print('Haven stories:',len(manifest['stories']),'stories;',manifest['totalWordCount'],'words; 20 chapters; 15 preserved prose manuscripts')
