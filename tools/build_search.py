"""Small discovery catalog and independently cacheable passage shards."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
def build():
 catalog=json.loads((SITE/'catalog.json').read_text());wiki=json.loads((SITE/'wiki.json').read_text());out=SITE/'search-data';out.mkdir(exist_ok=True)
 documents=[];passages=[]
 for entry in catalog['entries']:
  documents.append(dict(id=entry['id'],title=entry['title'],kind=entry['kind'],era=entry['era'],status=entry['status'],text=' '.join([entry.get('summary',''),*entry.get('characters',[]),*entry.get('places',[]),*entry.get('topics',[])]),href='index.html#read='+entry['id']))
  content=json.loads((SITE/'content'/f"{entry['id']}.json").read_text())
  for block in content['blocks']:
   if not block['text'].strip():continue
   passages.append(dict(id=block['id'],readingId=entry['id'],text=block['text'],annotation=bool(block.get('annotation'))))
 for topic in wiki['topics']:
  documents.append(dict(id=topic['id'],title=topic['title'],kind='Topic',era=topic.get('profile',{}).get('recordedEras',[]),status='Reference · check source status',text=' '.join(topic.get('aliases',[])+topic.get('kinds',[])),href='wiki.html#'+topic['id']))
 tools=[('map','Haven and shelter atlas','shelter-atlas.html','galaxy map microsystems history damage stages'),('sound','Sound library','sounds/index.html','music ambience footsteps audio clips'),('translator','DBA translator','translator/index.html','language words dictionary compounds songs'),('studio','Ribbon Studio','ribbons/studio/index.html','design colours ribbons honours'),('plans','Plans and possibilities','plans.html','draft outlines ideas'),('genres','Story genres','genres.html','styles writing'),('recent','Recently added','recent.html','creation order new updates'),('history','Timeline','timeline.html','eras history chronology'),('chronology','Era, period and stage','chronology.html','historical time notation'),('notebook','My notebook','notebook.html','notes highlights questions saved creations')]
 for id,title,href,keywords in tools:documents.append(dict(id='tool-'+id,title=title,href=href,text=keywords,kind='Tool',era=[],status='Workspace'))
 sounds=json.loads((SITE/'sounds/catalog.json').read_text())
 entries=sounds if isinstance(sounds,list) else sounds.get('entries',sounds.get('sounds',[]))
 for sound in entries:documents.append(dict(id='audio-'+sound['id'],title=sound['title'],href='sounds/index.html#'+sound['id'],text=' '.join(str(sound.get(k,'')) for k in ['category','kind','search','status']),kind='Audio',era=[],status=sound.get('status','Audio resource')))
 shards=[]
 for i in range(0,len(passages),1200):
  data=json.dumps(passages[i:i+1200],ensure_ascii=False,separators=(',',':'));digest=hashlib.sha256(data.encode()).hexdigest()[:12];name=f'passages-{i//1200:03}-{digest}.json';(out/name).write_text(data+'\n');shards.append('search-data/'+name)
 manifest=dict(version=1,documents=documents,shards=shards,passageCount=len(passages));(SITE/'search-index.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
 # Only names and aliases are required to link a reading; full articles stay lazy.
 small={k:wiki.get(k,{}) for k in ['aliases','readings','readingExclusions','readingNotes','readingImages','readingIllnesses']};small['topics']=[{k:t[k] for k in ['id','title','register'] if k in t} for t in wiki['topics']]
 for t in small['topics']:
  if 'register' in t:t['register']={'definitionStatus':t['register'].get('definitionStatus','')}
 (SITE/'wiki-reader-index.json').write_text(json.dumps(small,ensure_ascii=False,separators=(',',':'))+'\n')
 print('Discovery:',len(documents),'resources;',len(passages),'passages;',len(shards),'shards')
if __name__=='__main__':build()
