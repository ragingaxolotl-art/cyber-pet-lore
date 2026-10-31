"""Publish the approved Aru revision while preserving original passage anchors."""
import copy, hashlib, html, json, re
SID='aru-first-newborn-revised'
OLD='stories-p01889'
def add_aru_revision(root,catalog,sources):
 source=root/'sources'/SID
 manuscript=(source/'manuscript.md').read_text()
 checks=json.loads((source/'source-checks.json').read_text())
 assert hashlib.sha256(manuscript.encode()).hexdigest()==checks['manuscriptSha256']
 original=next(e for e in catalog if e['id']==OLD)
 entry=copy.deepcopy(original)
 original.update(kind='Draft',status='superseded',title='The First Newborn — previous edition',variant='Preserved edition before the three approved revisions',summary='Previous edition, retained with its original passage anchors and annotations. The completed three-pass revision is available in Stories.')
 blocks=[]
 for i,part in enumerate(re.split(r'\n\s*\n',manuscript.strip())):
  heading=re.match(r'^(#{1,6}) (.+)$',part)
  blocks.append({'id':f'{SID}-p{i:04d}','text':heading[2] if heading else part,'style':'HEADING_'+str(len(heading[1])) if heading else 'NORMAL_TEXT'})
 entry.update(id=SID,title='The First Newborn',status='complete',variant='Author-approved third revision',summary='Aru’s first story, revised through three approved editorial passes. Learning Keeper Iri must learn what caring for a new mind demands—and what it gives no one the right to decide. The ending leaves room for Part Two.',wordCount=checks['wordCount'],source={'title':'Author-approved third revision','url':''},explicitLinks=[OLD],connectionLabel='Current and previous editions')
 content={'id':SID,'blocks':blocks,'outline':[{'id':b['id'],'title':b['text'],'level':1} for b in blocks if b['style']=='HEADING_1']}
 (root/'site/content'/f'{SID}.json').write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n')
 catalog.append(entry)
 sources.append({'key':SID,'title':'The First Newborn — third revision','note':'Three author-approved revision cycles. Original text and anchors preserved separately. Publication requested October 31, 2026.'})
 output=root/'site/aru';output.mkdir(exist_ok=True)
 (output/'manuscript.md').write_bytes((source/'manuscript.md').read_bytes())
 (output/'publication.json').write_text(json.dumps({'readingId':SID,'previousReadingId':OLD,'wordCount':checks['wordCount'],'manuscriptSha256':checks['manuscriptSha256'],'edition':'Third approved revision','partTwo':'Continuation remains open'},indent=2)+'\n')
 print('Aru: approved 8,456-word revision; previous anchors retained.')
