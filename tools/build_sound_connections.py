"""Connect game audio to exact Atlas records and editorial game-reference topics.
Never modifies source paragraph text or existing paragraph IDs.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
def prepare_readings():
 audio=json.loads((SITE/'sounds/catalog.json').read_text());catalog=json.loads((SITE/'catalog.json').read_text());readings={e['id']:e for e in catalog['entries']}
 for group in audio['groups']:
  rid=group['reading_id']
  blocks=[{'id':rid+'-title','text':group['title'],'style':'HEADING_1'},{'id':rid+'-overview','text':group['description'],'style':'NORMAL_TEXT'},{'id':rid+'-status','text':'Audio reference for the Cyber Pet game and listening archive. These playback assignments describe production choices, not additional historical events in the fiction. Press Play in the connected sounds panel below to listen.','style':'NORMAL_TEXT'}]
  (SITE/'content'/(rid+'.json')).write_text(json.dumps({'id':rid,'blocks':blocks,'outline':[{'id':blocks[0]['id'],'title':group['title'],'level':1}]},ensure_ascii=False))
  reading={'id':rid,'title':group['title']+' — sounds & music','kind':'Reference','era':[],'timeLabel':'Game audio reference','timeOrder':99999,'status':'audio reference','characters':[],'places':[],'topics':['Audio',group['title']],'source':{'title':'Cyber Pet game audio catalog','url':''},'summary':group['description'],'wordCount':sum(len(b['text'].split()) for b in blocks),'connections':[],'chronology':[]}
  readings[rid]=reading
 catalog['entries']=list(readings.values());catalog['counts']={k:sum(e['kind']==k for e in catalog['entries']) for k in sorted({e['kind'] for e in catalog['entries']})}
 (SITE/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2))

def build():
 prepare_readings()
 audio=json.loads((SITE/'sounds/catalog.json').read_text());wiki=json.loads((SITE/'wiki.json').read_text());catalog=json.loads((SITE/'catalog.json').read_text());entries={e['id']:e for e in audio['entries']};topics={t['id']:t for t in wiki['topics']};readings={e['id']:e for e in catalog['entries']}
 connection={'version':1,'topics':{},'readings':{},'related_places':{},'groups':audio['groups'],'entries':{}}
 def attach(mapping,key,ids):
  mapping[key]=list(dict.fromkeys(mapping.get(key,[])+ids))
 for group in audio['groups']:
  tid,rid=group['topic_id'],group['reading_id'];ids=[e['id'] for e in entries.values() if group['id'] in e['groups']]
  attach(connection['topics'],tid,ids);attach(connection['readings'],rid,ids)
  reading=readings[rid]
  topic={'id':tid,'title':group['title'],'kinds':['Game audio'],'aliases':[group['title']],'targets':[{'title':reading['title'],'kind':'Reference','status':'audio reference','href':'index.html#read='+rid,'readingId':rid}],'mentions':[],'eras':[],'relatedTerms':[],'article':{'summary':{'text':group['description'],'href':'index.html#read='+rid,'title':'Cyber Pet game audio catalog','status':'audio reference','readingId':rid,'blockId':rid+'-overview'},'sections':[],'note':'A production audio reference, separate from fictional chronology.'}}
  topics[tid]=topic;wiki['aliases'][group['title']]=tid;wiki['readings'][rid]=[tid]
 for loc in audio['locations']:
  ids=[loc['music'],'amb_'+loc['ambience_tag'],'step_'+loc['floor_tag']]
  assert loc['topic_id'] in topics
  attach(connection['topics'],loc['topic_id'],ids)
  for rid in loc['reading_ids']:
   assert rid in readings;attach(connection['readings'],rid,ids)
 # Songs already carry reviewed backstory and setting IDs from the song player.
 for e in entries.values():
  for rid in e.get('reading_ids',[]):
   assert rid in readings;attach(connection['readings'],rid,[e['id']])
  for tid in e.get('topic_ids',[]):
   assert tid in topics;attach(connection['topics'],tid,[e['id']])
  if e['kind']=='song':
   for t in topics.values():
    if 'Song' in t['kinds'] and t['title']==e['title']:attach(connection['topics'],t['id'],[e['id']])
 # Explicit game-reference associations; never infer a soundtrack from prose keywords.
 for rid,ids in {'lore-p00845':['soft_circuit','cyber_pet_hurdles','dojo_power_up_01','party_grooves','memory_match','care_complete','battle_spell','award'], 'reference-era-four-remedies':['medicine','treatment_patch','wash','sleep'], 'reference-illnesses':['medicine','treatment_patch'], 'reference-ribbons':['award','level_up','record_broken']}.items():
  if rid in readings:attach(connection['readings'],rid,ids)
 for rid in readings:
  if rid.startswith('ribbon-'):attach(connection['readings'],rid,['award'])
 # Named place connections on other readings stay labeled as related settings.
 loc_by_topic={l['topic_id']:l for l in audio['locations']}
 for rid,tids in wiki['readings'].items():
  if rid in connection['readings']:continue
  places=[{'title':loc_by_topic[t]['name'],'topic_id':t} for t in tids if t in loc_by_topic]
  if places:connection['related_places'][rid]=places
 for e in entries.values():
  related=[]
  for group in audio['groups']:
   if group['id'] in e['groups']:related.append({'title':group['title'],'href':'wiki.html#'+group['topic_id']})
  for loc in audio['locations']:
   if e['id'] in connection['topics'].get(loc['topic_id'],[]):related.append({'title':loc['name'],'href':'wiki.html#'+loc['topic_id']})
  for rid in e.get('reading_ids',[]):related.append({'title':readings[rid]['title'],'href':'index.html#read='+rid})
  e['related']=related
  connection['entries'][e['id']]={k:e[k] for k in ['id','kind','title','description','category','status','clips','related']}
  if e.get('player_href'):connection['entries'][e['id']]['player_href']=e['player_href']
 wiki['topics']=sorted(topics.values(),key=lambda t:t['title'].casefold());catalog['entries']=list(readings.values());catalog['counts']={k:sum(e['kind']==k for e in catalog['entries']) for k in sorted({e['kind'] for e in catalog['entries']})}
 (SITE/'wiki.json').write_text(json.dumps(wiki,ensure_ascii=False,separators=(',',':')))
 (SITE/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2))
 (SITE/'sounds/catalog.json').write_text(json.dumps(audio,ensure_ascii=False,indent=2)+'\n')
 (SITE/'sounds/connections.json').write_text(json.dumps(connection,ensure_ascii=False,separators=(',',':')))
 print(f'Audio connections: {len(connection["topics"])} topics, {len(connection["readings"])} direct readings, {len(connection["related_places"])} readings with setting links')
if __name__=='__main__':build()
