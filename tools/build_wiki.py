"""Derive navigable mentions, not invented biographies or relationships."""
import json,re,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
cat=json.loads((SITE/'catalog.json').read_text());entries=cat['entries'];content={e['id']:json.loads((SITE/'content'/(e['id']+'.json')).read_text())['blocks'] for e in entries}
topics={}
def clean(name):return re.sub(r'^The\s+','',re.sub(r'^\d+\.\s*','',name)).strip()
def add(name,kind,target=None,aliases=()):
 name=clean(name)
 if len(name)<3:return
 key=name.casefold();t=topics.setdefault(key,{'id':'topic-'+hashlib.sha256(key.encode()).hexdigest()[:12],'title':name,'kinds':[],'aliases':[],'targets':[],'mentions':[],'eras':[]})
 if kind not in t['kinds']:t['kinds'].append(kind)
 for a in [name,*aliases]:
  if len(a)>2 and a not in t['aliases']:t['aliases'].append(a)
 if target and target not in t['targets']:t['targets'].append(target)
 return t

def reading_target(e,block=None):return {'title':e['title'],'kind':e['kind'],'status':e['status'],'href':'index.html#read='+e['id']+('&block='+block if block else ''),'readingId':e['id']}
# Named people sometimes share one dossier; link each name to the actual group dossier.
groups={'lore-p01267':['Keeper Eren'],'lore-p01271':['Aru','Iri','Vey (councilor)'],'lore-p01275':['Silt','Bell','Mire','The Nine Below'],'lore-p01279':['Palinode','Sile','Tovan','Serein'],'lore-p01283':['Leth','Mael','Soren','Vey (restoration)'],'lore-p01287':['Talar','Edrin','Nemi'],'lore-p01291':['Mara Vale','Sev','Tern','Hollis Dane','Lennox Shaw']}
for e in entries:
 if e['kind']=='People':
  if e['status']=='new addition':add(e['title'].split(' — ')[0],'Person',reading_target(e))
  elif e['id'] in groups:
   for person in groups[e['id']]:add(person,'Person',reading_target(e))
  elif e['title'].startswith('The ') or e['title'] in ['Keepers','Witnesses','Bridges','Players','Cyber-pets','Human Security Responders and Incident Coalitions','Question-Core Designers and Proto-Pet Caretakers','Open Path Movements','Restoration Factions','New Harvest Institutions']:
   add(e['title'].split(' — ')[0],'People & groups',reading_target(e))
 if e['kind']=='Locations' and re.match(r'^\d+\. ',e['title']):
  title=clean(e['title']);add(title,'Place',reading_target(e),[title.split(',')[0]])
 if e['kind']=='Locations' and e['status']=='new addition':add(e['title'],'Place',reading_target(e))
 if e['kind']=='Song':add(e['title'].split(' — ')[0],'Song',reading_target(e))
 if e['kind']=='Story':add(e['title'],'Story',reading_target(e))
 if e['kind']=='Timeline':
  for b in content[e['id']]:
   if b['style'].startswith('HEADING') and len(b['text'])<90 and not re.match(r'ERA |Period |I[VX]?\.|[IVX]+\.|Key Players|.*Paradoxes|.*Terminal Status',b['text']):
    title=b['text']
    if title.startswith('The ') or title in ['Num','The Codex','The DBA','Full Speech','Question Cores and Proto-Pets','Continuity Marks','Winter Seeds','Bridges','Quiet Ones','Open Hands','Paths and Evolution','Old Sound Traditions']:
     add(title,'History & ideas',reading_target(e,b['id']))
# Facet people without a dedicated dossier still get a transparent mention index.
for person in sorted({p for e in entries if e['kind']=='Story' for p in e.get('characters',[])}):add(person,'Person')
# Explicit alternate labels from the reviewed dossiers / atlas, without substring guesses.
aliases={'Hollis Dane':['Dane'],'Lennox Shaw':['Shaw'],'Keeper Eren':['Eren'],'Mara Vale':['Mara'],'Codex':['Codex'],'DBA':['Digital Binary Ancients'],'Dormant External Gate':['External Gate'],'Cacheboard, the Unintended Board':['Cacheboard'],'Shelter Orison, the Vanishing Shelter':['Shelter Orison'],'House of First Continuities and the Adaptive Nursery':['Adaptive Nursery','House of First Continuities'],'Central House of Meaning and the Unfinished Teaching Room':['Central House of Meaning','Unfinished Teaching Room'],'Commons and the Orison Chamber':['Orison Chamber'],'Sublevel and Pump Forty-Seven':['Sublevel','Pump Forty-Seven'],'Corridor Twelve and the Last Relay':['Corridor Twelve'],'Compatibility Route C-17, the Ghost Line':['Compatibility Route C-17','Ghost Line']}
for name,values in aliases.items():
 if name.casefold() in topics:
  for a in values:
   if a not in topics[name.casefold()]['aliases']:topics[name.casefold()]['aliases'].append(a)
for name in ['Vey','Pell']:
 options=[t for t in topics.values() if t['title'].startswith(name+' (')]
 if options:
  t=add(name,'Ambiguous name');t['choices']=[{'title':x['title'],'id':x['id']} for x in options]
# Case-sensitive boundaries preserve names such as Bell without linking bellflower.
lookup={}
for t in topics.values():
 for alias in t['aliases']:lookup.setdefault(alias,[]).append(t['id'])
# If independently indexed topics share an alias, retain a visible chooser.
for alias,ids in list(lookup.items()):
 if len(ids)>1:
  key=alias.casefold();chooser=topics.get(key)
  if chooser and chooser['id'] in ids:
   chooser['alternatives']=[i for i in ids if i!=chooser['id']];lookup[alias]=[chooser['id']]
  else:
   chooser=add(alias+' — choose a topic','Ambiguous term');chooser['choices']=[{'id':i,'title':next(t['title'] for t in topics.values() if t['id']==i)} for i in ids];lookup[alias]=[chooser['id']]
by_id={t['id']:t for t in topics.values()};pattern=re.compile(r'(?<![\w])(?:'+ '|'.join(re.escape(x) for x in sorted(lookup,key=lambda x:(-len(x),x)))+r')(?![\w])')
reading_topics={}
for e in entries:
 found={}
 for b in content[e['id']]:
  for m in pattern.finditer(b['text']):
   for tid in lookup[m.group()]:found.setdefault(tid,b['id'])
 reading_topics[e['id']]=list(found)
 for tid,block in found.items():
  t=by_id[tid];t['mentions'].append(reading_target(e,block));t['eras']=sorted(set(t['eras']+e.get('era',[])))
# Explicit character facets distinguish the two Veys/Pells where the source does.
for e in entries:
 for person in e.get('characters',[]):
  t=topics.get(person.casefold())
  if t and '(' in person and e['kind']=='Story':
   t['mentions'].append(reading_target(e));reading_topics[e['id']]=list(dict.fromkeys(reading_topics[e['id']]+[t['id']]))
# Timeline cards get direct, two-way event references.
time=json.loads((SITE/'timeline.json').read_text())
for era in time['eras']:
 for ev in era['events']:
  found={tid for m in pattern.finditer(ev['title']+' '+' '.join(ev['text'])) for tid in lookup[m.group()]}
  for tid in found:by_id[tid].setdefault('events',[]).append({'title':ev['title'],'era':era['number'],'href':'timeline.html#'+era['id']+'&event='+ev['id'],'status':ev['status']})
output={'version':1,'notice':'Links identify named mentions and related reading, not proof of identity, causation, or a personal relationship. Source status and uncertainties remain authoritative.','topics':list(topics.values()),'aliases':{a:ids[0] for a,ids in lookup.items()},'readings':reading_topics}
(SITE/'wiki.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
print('Wiki:',len(topics),'topics;',sum(len(t['mentions']) for t in topics.values()),'reading references')
