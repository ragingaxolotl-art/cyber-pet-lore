"""Derive navigable mentions, not invented biographies or relationships."""
import json,re,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
cat=json.loads((SITE/'catalog.json').read_text());entries=cat['entries'];content={e['id']:json.loads((SITE/'content'/(e['id']+'.json')).read_text())['blocks'] for e in entries}
review=json.loads((ROOT/'sources/continuity-review.json').read_text())
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
add('Unnamed river healer','Person',reading_target(next(e for e in entries if e['id']=='stories-p14010')))
# Authored profiles also index named people previously missing from character facets.
for name, rid, block, extra_aliases in [
 ('Kessler','stories-p03043','stories-p09691',['Dr. Kessler']),
 ('Ell','stories-p03043','stories-p04059',[]),
 ('Grandmother Seli','stories-p00016','stories-p00145',['Seli']),
 ('Relay Seven','stories-p00167','stories-p00181',[]),
 ('Southern relay','stories-p00167','stories-p00214',['southern relay']),
 ('First Echo','lore-p00911','lore-p00911',[]),
 ('Witness Instance 19-C','stories-p00887','stories-p00941',['WITNESS INSTANCE 19-C'])]:
 add(name,'Person',reading_target(next(e for e in entries if e['id']==rid),block),extra_aliases)
# Approved concept entries and character supplements receive stable wiki links.
development=json.loads((ROOT/'sources/world-development.json').read_text())
for item in development['entries']:
 e=next(e for e in entries if e['id']==item['id'])
 name=item['title'].split(' — ')[0] if item['kind']=='People' else item['title']
 add(name,'Person' if item['kind']=='People' else 'History & ideas',reading_target(e),item['aliases'])
# The lament uses uppercase speaker cues; keep their exact spelling linked too.
for name in ['Aven', 'Serein', 'Palinode']:
 add(name, 'Person', aliases=[name.upper()])
# The named rescue is an event, distinct from Orison the lost place.
rescue_source = next(e for e in entries if e['id'] == 'lore-p01279')
add('Orison rescue', 'Event', reading_target(rescue_source))
add('Hartland','Place',reading_target(next(e for e in entries if e['id']=='stories-p03043'),'stories-p11307'))
add('Hollow Nest','Place',reading_target(next(e for e in entries if e['id']=='stories-p00016'),'stories-p00140'))
add('Shelter Esra','Place',reading_target(next(e for e in entries if e['id']=='stories-p01469'),'stories-p01482'))
# Explicit alternate labels from the reviewed dossiers / atlas, without substring guesses.
aliases={'Talar':['Tal'],'Hollis Dane':['Dane'],'Lennox Shaw':['Shaw'],'Keeper Eren':['Eren'],'Mara Vale':['Mara'],'Codex':['Codex'],'DBA':['Digital Binary Ancients'],'Dormant External Gate':['External Gate'],'Cacheboard, the Unintended Board':['Cacheboard'],'Shelter Orison, the Vanishing Shelter':['Shelter Orison','Orison'],'House of First Continuities and the Adaptive Nursery':['Adaptive Nursery','House of First Continuities'],'Central House of Meaning and the Unfinished Teaching Room':['Central House of Meaning','Unfinished Teaching Room'],'Commons and the Orison Chamber':['Orison Chamber'],'Sublevel and Pump Forty-Seven':['Sublevel','Pump Forty-Seven'],'Corridor Twelve and the Last Relay':['Corridor Twelve'],'Compatibility Route C-17, the Ghost Line':['Compatibility Route C-17','Ghost Line']}
for name,values in aliases.items():
 if name.casefold() in topics:
  for a in values:
   if a not in topics[name.casefold()]['aliases']:topics[name.casefold()]['aliases'].append(a)
for name in ['Vey','Pell']:
 options=[t for t in topics.values() if t['title'].startswith(name+' (')]
 if options:
  t=add(name,'Ambiguous name');t['choices']=[{'title':x['title'],'id':x['id']} for x in options]
# The editorial register records source-attested terms even without a definition.
register=json.loads((ROOT/'sources/term-register.json').read_text())
entry_lookup={e['id']:e for e in entries}
for item in register['entries']:
 for evidence in item['evidence']:
  block=next(b for b in content[evidence['readingId']] if b['id']==evidence['blockId'])
  assert block['text']==evidence['quote'],item['name']
  assert any(re.search(r'(?<!\w)'+re.escape(alias)+r'(?!\w)',block['text']) for alias in item['aliases']),item['name']
 t=add(item['name'],item['category'],aliases=item['aliases'])
 # A matching source heading is an existing explanatory section, not a new definition.
 for evidence in item['evidence']:
  e=entry_lookup[evidence['readingId']]
  b=next(b for b in content[e['id']] if b['id']==evidence['blockId'])
  heading=re.sub(r'^(?:[IVX]+|\d+)\.\s*','',b['text']).removeprefix('The ').strip()
  if b['style'].startswith('HEADING') and heading.casefold()==clean(item['name']).casefold():
   target=reading_target(e,b['id'])
   if target not in t['targets']:t['targets'].append(target)
 t['register']={'category':item['category'],'definitionStatus':item['definitionStatus'],'note':item.get('note',''),'evidence':[dict(ev,href='index.html#read='+ev['readingId']+'&block='+ev['blockId'],title=entry_lookup[ev['readingId']]['title'],status=entry_lookup[ev['readingId']]['status']) for ev in item['evidence']]}

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
reading_topics={};block_topics={}
for e in entries:
 found={}
 for b in content[e['id']]:
  block_topics[(e['id'],b['id'])]=set()
  for m in pattern.finditer(b['text']):
   for tid in lookup[m.group()]:
    if by_id[tid]['title'] not in review['readingExclusions'].get(e['id'],[]):
     found.setdefault(tid,b['id']);block_topics[(e['id'],b['id'])].add(tid)
 reading_topics[e['id']]=list(found)
 for tid,block in found.items():
  t=by_id[tid];t['mentions'].append(reading_target(e,block));t['eras']=sorted(set(t['eras']+e.get('era',[])))
# Connections are backed by shared passages, never inferred personal relationships.
registered={t['id']:t for t in topics.values() if t.get('register')}
connections={tid:{} for tid in registered}
coverage=[]
for e in entries:
 for b in content[e['id']]:
  found=block_topics[(e['id'],b['id'])]
  for tid in found & registered.keys():
   for other in found-{tid}:
    connections[tid].setdefault(other,reading_target(e,b['id']))
 coverage.append({'readingId':e['id'],'title':e['title'],'kind':e['kind'],'blocksScanned':len(content[e['id']]),'termIds':[tid for tid in reading_topics[e['id']] if tid in registered]})
for tid,t in registered.items():
 t['register']['connections']=[{'topicId':other,'title':by_id[other]['title'],'basis':'Named in the same passage','source':source} for other,source in sorted(connections[tid].items(),key=lambda pair:by_id[pair[0]]['title'].casefold())]

# Existing articles also link back to newly registered terms.
for tid,t in registered.items():
 for connection in t['register']['connections']:
  other=by_id[connection['topicId']]
  other.setdefault('relatedTerms',[]).append({'topicId':tid,'title':t['title'],'source':connection['source'],'basis':'Named in the same passage'})

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
# Wiki articles reproduce existing prose, retaining source status and block links.
entry_by_id={e['id']:e for e in entries}
for topic in topics.values():
 topic['article']={'summary':None,'sections':[]}
 if topic.get('choices'):
  topic['article']['note']=('This name refers to more than one indexed topic. Choose the intended topic below; their histories are kept separate.' if len(topic['choices'])>1 else 'Only the listed identity is supported by the indexed prose. Earlier unsupported identities have been removed.')
  continue
 seen_text=set()
 sources=topic['targets'] or topic['mentions']
 sources=sorted(sources,key=lambda x:(x['status'] in ['alternate','superseded'],x['kind'] in ['Draft','Reference']))
 for source in sources:
  blocks=content[source['readingId']]
  anchor=source['href'].split('&block=')[-1] if '&block=' in source['href'] else None
  if topic['targets']:
   if anchor:
    start=next((i for i,b in enumerate(blocks) if b['id']==anchor),0)
    level=blocks[start]['style'];end=len(blocks)
    if level.startswith('HEADING'):
     end=next((i for i in range(start+1,len(blocks)) if blocks[i]['style'].startswith('HEADING') and blocks[i]['style']<=level),len(blocks))
    blocks=blocks[start:end]
   selected=[b for b in blocks if not b['style'].startswith('HEADING') and len(b['text'].strip())>35]
  else:
   selected=[b for b in blocks if not b['style'].startswith('HEADING') and len(b['text'].strip())>35 and (topic['id'] in block_topics[(source['readingId'],b['id'])] or (topic['title'] in entry_by_id[source['readingId']].get('characters',[]) and re.search(r'(?<!\w)'+re.escape(topic['title'].split(' (')[0])+r'(?!\w)',b['text'])))]
  selected=[b for b in selected if b['text'] not in seen_text][:12 if topic['targets'] else 3]
  if not selected:continue
  # The overview is an unaltered informative paragraph, not a generated assertion.
  if topic['article']['summary'] is None:
   overview=next((b for b in selected if len(b['text'])>80 and not b['text'].startswith(('Status:','Era ','New location','New supporting'))),selected[0])
   topic['article']['summary']={'text':overview['text'],'href':'index.html#read='+source['readingId']+'&block='+overview['id'],'title':source['title'],'status':source['status'],'readingId':source['readingId'],'blockId':overview['id']}
  paragraphs=[{'text':b['text'],'blockId':b['id'],'href':'index.html#read='+source['readingId']+'&block='+b['id']} for b in selected]
  topic['article']['sections'].append({'title':source['title'],'status':source['status'],'readingId':source['readingId'],'paragraphs':paragraphs})
  seen_text.update(b['text'] for b in selected)
  if len(topic['article']['sections'])>=3:break
 topic['article']['note']=('Overview and details use the existing source wording. Proposed, alternate and newly added material keep their source labels.' if topic['targets'] else 'No dedicated article is recorded for this topic. The overview and details below are the available source passages; a fuller history is not established.')
 if topic['article']['summary'] is None:topic['article']['note']='The archive indexes this name, but no substantive descriptive passage is available. No history or identity has been inferred.'
# Attach only explicitly mapped existing artwork; never borrow a neighboring place’s image.
art=json.loads((ROOT/'sources/location-art.json').read_text())
reading_images={}
for location in art['locations']:
 assert location['topicId'] in by_id, location['name']
 images=[]
 for image in location['images']:
  assert (SITE/image['src']).is_file(), image['src']
  images.append({k:image[k] for k in ['src','width','height','view','caption','alt','flavorText','explanation','contextLinks'] if k in image})
 by_id[location['topicId']]['images']=images
 for reading in location['readingIds']:
  assert reading in content, reading
  reading_images[reading]=images
# Author-selected profile media is separate from source lore and location artwork.
profile_media=json.loads((ROOT/'sources/profile-media.json').read_text())
for topic_id,media in profile_media.items():
 assert topic_id in by_id, topic_id
 for item in media:
  assert (SITE/item['src']).is_file(), item['src']
  assert (SITE/item['poster']).is_file(), item['poster']
 by_id[topic_id]['media']=media
output={'version':1,'termRegister':{'scope':register['scope'],'readingCount':len(entries),'blocksScanned':sum(len(b) for b in content.values()),'topicIds':list(registered),'coverage':coverage},'notice':'Links identify named mentions and related reading, not proof of identity, causation, or a personal relationship. Source status and uncertainties remain authoritative.','topics':list(topics.values()),'readingNotes':{e['id']:[n for n in review['notes'] if e['id'] in n['readingIds']] for e in entries},'readingExclusions':{rid:[t['id'] for t in topics.values() if t['title'] in names] for rid,names in review['readingExclusions'].items()},'readingImages':reading_images,'aliases':{a:ids[0] for a,ids in lookup.items()},'readings':reading_topics}
import sys
sys.path.insert(0,str(ROOT/"tools"))
from build_profiles import attach_profiles
attach_profiles(output,entries,content,review)
from build_illness_links import attach_illnesses
attach_illnesses(output,entries)
from build_person_articles import attach_person_articles
attach_person_articles(output,entries,content)
by_id['topic-3175c8dcdf0c']['featureArticle']={'title':'The House of Returning — comprehensive article','href':'house-of-returning.html','description':'History, restoration, the hidden Garden, supported interpretations, and unresolved questions — with existing artwork.'}
from build_custodians_article import attach_custodians_article
attach_custodians_article(output,entries,content)
from build_dba_decline import attach_dba_decline
attach_dba_decline(output,entries,content)
from build_early_development import attach_early_development
attach_early_development(output,entries,content)
(SITE/'wiki.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
print('Wiki:',len(topics),'topics;',sum(len(t['mentions']) for t in topics.values()),'reading references')
