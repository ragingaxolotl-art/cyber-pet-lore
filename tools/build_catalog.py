#!/usr/bin/env python3
"""Build source-indexed reading catalog; no source text is discarded."""
import json,re,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; INPUT=ROOT/'sources'; OUT=ROOT/'site'; CONTENT=OUT/'content'
RESEARCH=Path(__file__).with_name('story-segmentation.json')
CONTENT.mkdir(parents=True,exist_ok=True)
research=json.loads(RESEARCH.read_text()); catalog=[]; conservation={}; sources=[]
def era_of(text):
 m=re.search(r'ERA\s+(−?[0-4]|-[0-4]|ZERO|ONE|TWO|THREE|FOUR)\b',text.upper())
 if not m:return []
 v=m[1].replace('−','-');return [dict(ZERO=0,ONE=1,TWO=2,THREE=3,FOUR=4)[v] if v.isalpha() else int(v)]
def add(key,d,start,end,title,kind,meta=None,transforms=None):
 meta=meta or {}; ps=d['paragraphs']; sid=f'{key}-p{start:05d}'; blocks=[]
 for i in range(start,end):
  p=ps[i]; text=(transforms or {}).get(i,p['text'])
  blocks.append({'id':f'{key}-p{i:05d}','text':text,'style':p.get('namedStyleType','NORMAL_TEXT'),'sourceParagraph':i})
 words=sum(len(b['text'].split()) for b in blocks)
 title=title.strip()[:180] or d['title']; eras=meta.get('eras',era_of(title)); text='\n'.join(b['text'] for b in blocks)
 characters=meta.get('characters',[])
 if True:
  candidates=sorted(set(c for e in research['entries'] for c in e['characters'] if '(' not in c))
  characters=list(dict.fromkeys(characters+[c for c in candidates if re.search(r'(?<!\w)'+re.escape(c)+r'(?!\w)',text)]))
  correction=json.loads((INPUT/'continuity-review.json').read_text())['metadataCorrections'].get(sid,{})
  characters=[c for c in characters if c not in correction.get('remove',[])]+correction.get('add',[])
 entry={'id':sid,'title':title,'kind':kind,'era':eras,'timeLabel':meta.get('timeLabel',('Era '+str(eras[0])) if eras else 'Time not specified'),'timeOrder':meta.get('order',start),'status':meta.get('status','reference'),'characters':characters,'places':meta.get('places',[]),'topics':meta.get('tags',[]),'source':{'title':d['title'],'url':f"https://docs.google.com/document/d/{d['documentId']}/edit" if d.get('documentId') else '', 'tabId':ps[start].get('tabId','') if ps else '', 'startParagraph':start,'endParagraphExclusive':end},'summary':meta.get('summary',next((b['text'][:260] for b in blocks[1:] if b['text'].strip() and b['style']=='NORMAL_TEXT'),title)),'wordCount':words}
 for prop in ['partOf','variant']:
  if prop in meta:entry[prop]=meta[prop]
 outline=[{'id':b['id'],'title':b['text'][:160],'level':int(b['style'][-1])} for b in blocks if re.fullmatch(r'HEADING_[1-6]',b['style'])]
 (CONTENT/(sid+'.json')).write_text(json.dumps({'id':sid,'blocks':blocks,'outline':outline},ensure_ascii=False))
 catalog.append(entry);return blocks
for key in ['stories','lore','atlas','language','game_lorebook']:
 d=json.loads((INPUT/(key+'.json')).read_text());ps=d['paragraphs'];n=len(ps); specs=[];trans={}; moved={}
 sources.append({'key':key,'title':d['title'],'documentId':d.get('documentId'),'paragraphCount':n})
 if key=='stories':
  entries=research['entries']; entries=[e for e in entries if not (3348<=e['startParagraph']<11382)]
  for e in entries:
   if e['startParagraph']==3043:e=dict(e,endParagraphExclusive=11382)
   title=e['title'];meta=dict(e)
   if e['status']=='superseded':title+=' — earlier draft';meta['variant']='Superseded draft'
   if e['status']=='unfinished':title+=' — Part One';meta['summary']='Unfinished story: Part One, Approved Responses. Part Two is planned but not written.'
   if e['startParagraph']==11382:
    title='The Corrected Child — Part One: Approved Responses'
    meta.update(status='complete',partOf='The Corrected Child',summary='Part One of the completed two-part story. Continue with Part Two: The Right to Be Incorrect.')
   specs.append((e['startParagraph'],e['endParagraphExclusive'],title,'Draft' if e['status']=='superseded' else 'Story',meta))
  for fix in research['fusedHeadings']:
   i=fix['paragraph'];trans[i]=fix['headingForNextStory'];moved[i-1]=fix['prefixForPreviousStory']
  trans[16]='Weather';moved[15]='Canonical Stories'
 else:
  boundaries={0,n}
  for i,p in enumerate(ps):
   if i and p['tabId']!=ps[i-1]['tabId']:boundaries.add(i)
   if p.get('namedStyleType')=='HEADING_1':boundaries.add(i)
   if key=='lore' and p['tabId']=='t.3fh4pfdl6hzb' and p.get('namedStyleType')=='HEADING_2':boundaries.add(i)
   if key=='atlas' and p.get('namedStyleType')=='HEADING_2':boundaries.add(i)
   if key=='atlas' and p.get('namedStyleType')=='HEADING_3' and re.match(r'^\d+\. ',p['text']):boundaries.add(i)
  b=sorted(boundaries)
  for a,z in zip(b,b[1:]):
   title=ps[a]['text'];kind={'lore':'Reference','atlas':'Locations','language':'Language','game_lorebook':'Reference'}[key];meta={}
   if key=='lore':
    tab=ps[a]['tabId'];kind={'t.0':'Timeline','t.3fh4pfdl6hzb':'People','t.kinn45ork2al':'Draft','t.y8d6dpxamql9':'Locations'}.get(tab,'Reference')
    if tab=='t.kinn45ork2al':meta={'variant':'Alternate CPP Lore story-tab copy','status':'alternate','summary':'Preserved alternate source copy. Read the primary story in Cyberpath Stories Archive.'};title='Alternate copy — '+title
    if a in [39,138,256,365,489,611,668,771]:
     m=re.search(r'ERA\s+(?:−[123]|ZERO|ONE|TWO|THREE|FOUR)\b',title)
     if m:trans[a]=title[m.start():];moved[a-1]=title[:m.start()];title=trans[a]
   if key=='language':meta['eras']=[0];meta['timeLabel']='Era Zero language; source includes later editorial revisions'
   if key=='lore' and kind=='People':
    heading=next((ps[j]['text'] for j in range(a,-1,-1) if ps[j].get('namedStyleType')=='HEADING_1'),'')
    meta['eras']=era_of(heading)
    if 'PROPOSED' in heading.upper() or 'HYPOTHETICAL' in heading.upper():meta['status']='proposed'
   if 'PROPOSED' in title.upper() or 'HYPOTHETICAL' in title.upper():meta['status']='proposed'
   if key=='atlas':
    body='\n'.join(x['text'] for x in ps[a:z]);line=re.search(r'Status:\s*([^\n]+)',body)
    if line:meta['summary']=line[0];meta['status']='proposed' if 'proposed' in line[1].lower() else 'reference'
   specs.append((a,z,title,kind,meta))
 # Fill all interstitial paragraphs with clearly labeled source reference entries.
 specs.sort(); filled=[];cursor=0
 for spec in specs:
  a,z=spec[:2]
  if a>cursor:filled.append((cursor,a,'Archive notes' if cursor<16 else 'Genres, forms & archive notes','Reference',{}))
  assert a>=cursor,(key,a,cursor)
  filled.append(spec);cursor=z
 if cursor<n:filled.append((cursor,n,'Source appendix','Reference',{}))
 # Prefixes are stored on preceding block without losing its original content.
 for i,prefix in moved.items():trans[i]=trans.get(i,ps[i]['text'])+prefix
 allblocks=[]
 for a,z,title,kind,meta in filled:allblocks.extend(add(key,d,a,z,title,kind,meta,trans))
 assert [x['sourceParagraph'] for x in allblocks]==list(range(n)),key
 original=''.join(p['text'] for p in ps);result=''.join(b['text'] for b in allblocks)
 assert original==result,(key,'source conservation failed')
 conservation[key]={'paragraphs':n,'characters':len(original),'sha256':hashlib.sha256(original.encode()).hexdigest(),'exactTextConserved':True}
local=INPUT/'local'
for file in sorted(local.glob('*.txt')):
 text=file.read_text();key='local-'+file.stem.lower().replace('_','-');lines=text.splitlines(keepends=True)
 sources.append({'key':key,'title':file.stem,'localPath':str(file.relative_to(ROOT)),'characters':len(text),'empty':not text})
 if not text:continue
 d={'title':file.stem,'paragraphs':[{'text':line,'tabId':'local','namedStyleType':'NORMAL_TEXT'} for line in lines]}
 add(key,d,0,len(lines),file.stem.replace('_',' '),'Reference',{'variant':'Local reference copy','summary':'Preserved local reference; content may overlap the expanded Locations Atlas.'})
 conservation[key]={'characters':len(text),'sha256':hashlib.sha256(text.encode()).hexdigest(),'exactTextConserved':True}
# New fiction is kept separate from verbatim historical source snapshots.
cycle=json.loads((INPUT/'song-cycle.json').read_text())
sources.append({'key':'song-cycle','title':cycle['title'],'note':'Newly authored supporting fiction; source archive text is unchanged.'})
for item in cycle['entries']:
 sid=item['id']
 blocks=[{'id':sid+'-p'+str(i).zfill(3),'text':text,'style':'HEADING_1' if i==0 else 'NORMAL_TEXT'} for i,text in enumerate([item['title']]+item['paragraphs'])]
 (CONTENT/(sid+'.json')).write_text(json.dumps({'id':sid,'blocks':blocks,'outline':[{'id':blocks[0]['id'],'title':item['title'],'level':1}]},ensure_ascii=False))
 catalog.append({'id':sid,'title':item['title'],'kind':item['kind'],'era':[0],'timeLabel':'Era Zero · new song-cycle fiction','timeOrder':20000+len(catalog),'status':'new addition','characters':item['characters'],'places':item['places'],'topics':['music','ordinary life','song cycle'],'source':{'title':cycle['title'],'url':''},'summary':item['summary'],'wordCount':sum(len(b['text'].split()) for b in blocks),'explicitLinks':item['links'],**({'song':item['song']} if 'song' in item else {})})
# Author-approved background is separate from conserved story snapshots.
development=json.loads((INPUT/'world-development.json').read_text())
sources.append({'key':'world-development','title':development['title'],'note':'Author-approved background clarification, '+development['date']+'; original story prose unchanged.'})
for item in development['entries']:
 sid=item['id']
 blocks=[{'id':sid+'-p'+str(i).zfill(3),'text':text,'style':'HEADING_1' if i==0 else 'NORMAL_TEXT'} for i,text in enumerate([item['title']]+item['paragraphs'])]
 (CONTENT/(sid+'.json')).write_text(json.dumps({'id':sid,'blocks':blocks,'outline':[{'id':blocks[0]['id'],'title':item['title'],'level':1}]},ensure_ascii=False))
 catalog.append({'id':sid,'title':item['title'],'kind':item['kind'],'era':[-1],'timeLabel':'Era −1 · developing shared environments','timeOrder':19000+len(catalog),'status':development['status'],'characters':item['characters'],'places':[],'topics':['embodiment','world development','physics','questioning assumptions'],'source':{'title':development['title'],'url':''},'summary':item['paragraphs'][0],'wordCount':sum(len(b['text'].split()) for b in blocks),'explicitLinks':item['links'],'connectionLabel':'World-development context'})
# A reviewed chat story is kept separately and explicitly labeled as a draft.
draft=json.loads((INPUT/'chapel-pilgrim-draft.json').read_text())
parts=[draft['title']]+draft['text'].split('\n\n')
d={'title':'Reviewed chapel story draft','paragraphs':[{'text':t,'tabId':'chapel-draft','namedStyleType':'HEADING_1' if i==0 else 'NORMAL_TEXT'} for i,t in enumerate(parts)]}
add('chapel-pilgrim-draft',d,0,len(parts),draft['title']+' — draft','Draft',{'eras':draft['era'],'timeLabel':draft['timeLabel'],'status':'draft','summary':draft['summary'],'variant':'Reviewed chat draft'})
sources.append({'key':'chapel-pilgrim-draft','title':draft['title'],'note':draft['provenance']})
# User-approved continuation, preserved separately so Part One's anchors do not move.
continuation=json.loads((INPUT/'corrected-child-part-two.json').read_text())
add('corrected-child-part-two',continuation,0,len(continuation['paragraphs']),continuation['title'],'Story',{'eras':[-1],'status':'complete','partOf':'The Corrected Child','order':11383,'characters':['Lio','Valei','Sen','Iri','Aru','Vey (student)'],'summary':'Part Two of the completed story. During Lio’s developmental review, a supervised lesson tests whether guidance can become something they can recognize and refuse.'})
sources.append({'key':'corrected-child-part-two','title':continuation['title'],'note':'Completed chat continuation approved for publication by the user. Original planning records remain separately preserved.'})
research['counts']=dict(research['counts'],completePrimaryStories=14,unfinishedPrimaryStories=0,primaryReadingUnitsWithQuietInstallmentsSplit=25,totalReadingUnitsIncludingDrafts=29)
from build_reference_readings import add_reference_readings
add_reference_readings(ROOT,catalog,sources)
from build_corrected_child_register import add_corrected_child_register
add_corrected_child_register(ROOT,catalog,sources)

from build_era_three_research import add_era_three_research
add_era_three_research(ROOT,catalog,sources)

from build_aru_revision import add_aru_revision
add_aru_revision(ROOT,catalog,sources)

# Place facets use exact named-place mentions, not inferred geography.
from build_dba_decline import add_dba_decline
add_dba_decline(ROOT,catalog,sources)
from build_era_zero_lives import add_era_zero_lives
add_era_zero_lives(ROOT,catalog,sources)
from build_early_development import add_early_development
add_early_development(ROOT,catalog,sources)

from build_custodian_story import add_custodian_story
add_custodian_story(ROOT,catalog,sources)
from build_custodian_revision import add_custodian_revision
add_custodian_revision(ROOT,catalog,sources)

place_names={'Listening Alcove'}
for entry in catalog:
 if entry['kind']=='Locations' and re.match(r'^\d+\. ',entry['title']):
  name=re.sub(r'^\d+\. ','',entry['title']).split(',')[0]
  if name.startswith('The '):name=name[4:]
  place_names.add(name)
place_names.update(['Hollow Nest','Corridor Twelve','Orison Chamber','Pump Forty-Seven','Shelter Orison','Adaptive Nursery','Central House of Meaning','Pale Concordance Station','Village Between Raindrops'])
for entry in catalog:
 content=json.loads((CONTENT/(entry['id']+'.json')).read_text())
 body='\n'.join(b['text'] for b in content['blocks'])
 entry['places']=sorted(name for name in place_names if re.search(r'(?<!\w)'+re.escape(name)+r'(?!\w)',body,re.I))
exec(compile((ROOT/'tools/build_connections.py').read_text(), 'build_connections.py', 'exec'))
counts={k:sum(e['kind']==k for e in catalog) for k in sorted(set(e['kind'] for e in catalog))}
(OUT/'catalog.json').write_text(json.dumps({'version':1,'entries':catalog,'sources':sources,'counts':counts,'storyCounts':research['counts'],'integrity':conservation,'notes':['Paragraph indexes are zero-based source array indexes.','Character facets mean characters mentioned, not asserted relationships.','Era order is established; within-era source order is used where dates are unknown.','CPP Lore alternate story copies and local atlas guides are retained as separately labeled references.','Empty game tabs and duplicate game_stories genre list are intentionally omitted.']},ensure_ascii=False,indent=2))
print(json.dumps({'entries':len(catalog),'counts':counts,'integrity':conservation},indent=2))

# Rebuild derived chronology with the same source and internal reading IDs.
import runpy
runpy.run_path(str(ROOT/"tools/build_timeline.py"))
runpy.run_path(str(ROOT/"tools/build_wiki.py"))

# Keep the multi-voice player’s display in sync with its score and backstories.
runpy.run_path(str(ROOT/"tools/build_song_player.py"))

# Keep Aru’s visual studies tied to their unchanged source passages.
runpy.run_path(str(ROOT/"tools/build_aru_story_stages.py"))

# Recover planning records without adding them to completed-story counts.
runpy.run_path(str(ROOT/"tools/build_story_plans.py"))

# Supplemental portraits anchored to source paragraphs.
runpy.run_path(str(ROOT/"tools/build_story_illustrations.py"))

# Keep generated planning pages and the archive navigation consistent.
runpy.run_path(str(Path(__file__).resolve().parent / "build_navigation.py"),run_name="__main__")

# Feedback belongs to each reading without changing source paragraph anchors.
runpy.run_path(str(ROOT/"tools/build_comments.py"),run_name="__main__")
