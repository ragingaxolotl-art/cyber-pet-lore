"""Publish the revised edition without modifying the original reading anchors."""
import hashlib
import json
from build_custodian_story import add_custodian_story, markdown, shell

SID = 'custodian-who-refused-revised'


def add_custodian_revision(root, catalog, sources):
    output = root/'site/custodian'
    original = {name:(output/name).read_bytes() for name in ['manuscript.md','development.md','review.md']}
    add_custodian_story(root, catalog, sources, sid=SID)
    source = root/'sources'/SID
    for name,data in original.items():
        target = 'first-draft.md' if name=='manuscript.md' else 'first-draft-'+name
        (output/target).write_bytes(data)
    # Only the new edition receives new status text; the original reading is untouched.
    reading_path=root/'site/content'/f'{SID}.json'
    reading=json.loads(reading_path.read_text())
    reading['blocks'][0]['text']=reading['blocks'][0]['text'].replace('Complete first draft','Revised draft after three completed editorial passes')
    reading['blocks'][0]['referenceUrl']='custodian/revisions.html'
    reading_path.write_text(json.dumps(reading,ensure_ascii=False,indent=2)+'\n')
    for p in output.glob('*.html'):
        text=p.read_text().replace('Complete first draft','Three-pass revised draft')
        text=text.replace('<a href="review.html">Continuity review</a>', '<a href="review.html">Continuity review</a><a href="revisions.html">Three revision passes</a>')
        if p.name=='index.html':
            text=text.replace('Consciousness is unresolved.','')
            text=text.replace('An evaluation engineer investigates a monitoring system whose increasingly consistent judgments expose a conflict between institutional policy and the evidence it is supposed to certify.', 'A monitoring engineer earns a promotion by making uncertain findings easy to act on. When one report costs a contractor her work and another implicates his own decisions, the system he helped build asks questions his company cannot afford to leave open.')
            text=text.replace('<h2>Chapters</h2>', '<p class="metadata">Rewritten for character, world detail and consequence, then revised for pacing and continuity. <a href="revisions.html">Read the three-pass record</a> · <a href="../index.html#read=custodian-who-refused">Original draft and annotations</a> · <a href="first-draft.md" download>Download first draft</a></p><h2>Chapters</h2>')
        p.write_text(text)
    manuscript=(output/'manuscript.md').read_text().replace('Complete first draft','Three-pass revised draft')
    (output/'manuscript.md').write_text(manuscript)
    pub=json.loads((output/'publication.json').read_text())
    pub.update({'edition':'Three-pass revised draft','readingId':SID,'previousReadingId':'custodian-who-refused','manuscriptSha256':hashlib.sha256(manuscript.encode()).hexdigest()})
    passes=[]
    links=[]
    for i in range(1,4):
        folder=source/f'pass-{i:02d}'
        chapters=[(folder/f'chapter-{n:02d}.md').read_text().strip() for n in range(1,13)]
        snapshot='# The Custodian Who Refused\n\nEditorial pass '+str(i)+' · proposed fiction\n\n'+'\n\n'.join(chapters)+'\n'
        filename=f'revision-pass-{i:02d}.md'
        (output/filename).write_text(snapshot)
        review=(folder/'review.md').read_text()
        review_name=f'revision-pass-{i:02d}-review.html'
        (output/review_name).write_text(shell(f'Pass {i} review',markdown(review)))
        words=sum(len(ch.split()) for ch in chapters)
        passes.append({'pass':i,'wordCount':words,'sha256':hashlib.sha256(snapshot.encode()).hexdigest(),'manuscript':filename,'review':review_name})
        links.append(f'<li>Pass {i}: {words:,} words — <a href="{filename}" download>manuscript snapshot</a> · <a href="{review_name}">editorial review</a></li>')
    pub['passes']=passes
    (output/'publication.json').write_text(json.dumps(pub,ensure_ascii=False,indent=2)+'\n')
    log=(source/'revision-log.md').read_text()
    (output/'revision-log.md').write_text(log)
    resources='<h2>Retained editions</h2><ul>'+''.join(links)+'</ul><p><a href="first-draft.md" download>Original published manuscript</a> · <a href="first-draft-development.md" download>Original plans</a> · <a href="revision-log.md" download>Revision record</a></p>'
    (output/'revisions.html').write_text(shell('Three-pass revision record',markdown(log)+resources))
    for entry in catalog:
        if entry['id']==SID:
            entry['title']='The Custodian Who Refused — revised edition'
            entry['variant']='New proposed fiction — three-pass revised draft'
            entry['summary']='Twelve revised chapters of investigative science fiction: a monitoring engineer confronts the human consequences of uncertain evidence and a service he cannot specify how to preserve. Includes detailed plans, lore checks and three retained revision passes.'
            entry['characters'] += ['Tess Ren','Ada Keene','Miro Tan']
    sources[-1]['note']='Three author-requested editorial passes, retained separately. Original manuscript and annotation anchors preserved; revised work remains proposed fiction.'
