"""Stable logbook readings for illustrated reference directories."""
import json

def add_reference_readings(root,catalog,sources):
 from build_potion_readings import add_potion_readings
 add_potion_readings(root,catalog,sources)
 out=root/'site';content=out/'content'
 def write(id,title,kind,blocks,summary,url,status='reference',links=None):
  outline=[{'id':b['id'],'title':b['text'],'level':2} for b in blocks if b['style']=='HEADING_2']
  (content/(id+'.json')).write_text(json.dumps({'id':id,'blocks':blocks,'outline':outline},ensure_ascii=False))
  catalog.append({'id':id,'title':title,'kind':kind,'era':[],'timeLabel':'Gameplay reference · saved collection','timeOrder':30000+len(catalog),'status':status,'characters':[],'places':[],'topics':['reference','logbook',kind.lower()],'source':{'title':title,'url':url},'referencePage':url,'summary':summary,'wordCount':sum(len(b['text'].split()) for b in blocks),'explicitLinks':links or [],'connectionLabel':'Reference collection'})
 def block(id,field,text,style='NORMAL_TEXT',art=None):
  b={'id':id+'-'+field,'text':text,'style':style}
  if art:b['referenceArt']=art
  return b
 for directory,kind,title,collection in [('ribbons','Ribbons','Ribbons & honours — complete collection','reference-ribbons'),('illnesses','Illnesses','Illness field guide — complete collection','reference-illnesses')]:
  data=json.loads((out/directory/'directory.json').read_text());rows=data['entries'] if directory=='ribbons' else data
  allblocks=[block(collection,'title',title,'HEADING_1'),block(collection,'intro','This is the complete illustrated collection in your logbook. Highlight any definition, add notes and tags, mark it read, and use Save or Backups as you do for other readings. Each individual card also has its own reading for focused notes. Collection notes and individual-card notes are stored separately.')]
  for e in rows:
   sid=('ribbon-' if directory=='ribbons' else 'illness-')+e['id']
   if directory=='ribbons':
    art={'src':'ribbons/'+e['art'],'render':e.get('render',{})};render=art['render'].copy()
    if render.get('frames'):render['frames']=['ribbons/'+p for p in render['frames']]
    if render.get('base'):render['base']='ribbons/'+render['base']
    art['render']=render
    fields=[('status',e['status']+' · '+e['kind']+' · '+e['category']),('definition',e['definition']),('placement','Placement: '+e['where']),('reward','Reward: '+e['reward']),('animation','Animation: '+e['animation']),('notes',e['notes']),('source','Source: '+'; '.join(k.replace('_',' ')+': '+str(v) for k,v in e['source'].items()))]
    status=e['status']
   else:
    preview=e.get('preview',{'animation':'previews/'+e['id']+'.gif','still':'previews/'+e['id']+'-still.png'})
    art={'src':'illnesses/'+preview['animation'],'still':'illnesses/'+preview['still']}
    fields=[('status',e['family']+' · '+('Location trademark' if e['trademark'] else 'Random variant')),('definition',e['description']),('location','Location: '+e['location_name']),('appearance','Appearance: '+e['visual']),('care','Care: '+e['treatment']),('story','Story connection: '+e['story_hook']),('status-note',e['status'])];status='gameplay reference'
   blocks=[block(sid,'title',e['name'],'HEADING_2',art)]
   for key,value in fields:
    if not value: continue
    # Keep the old appearance anchor with its original words in the history below.
    field='appearance-reviewed-'+e['visual_revision'] if directory=='illnesses' and key=='appearance' and e.get('visual_history') else key
    blocks.append(block(sid,field,value))
   if directory=='illnesses' and e.get('visual_history'):
    blocks.append(block(sid,'visual-kind','Visual type: '+e['visual_kind']))
    blocks.append(block(sid,'severity-reviewed-'+e['severity_revision'] if e.get('severity_revision') else 'severity',e['severity_note']))
    for label,path in zip(['Mild','Moderate','Severe'],e['preview']['stages']):
     blocks.append(block(sid,'stage-'+label.lower(),label+' — current example','HEADING_3',{'src':'illnesses/'+path,'still':'illnesses/'+path}))
    blocks.append(block(sid,'earlier-versions','Earlier versions','HEADING_2'))
    for version in e['visual_history']:
     prefix='history-'+version['id'];preview=version['preview']
     blocks.append(block(sid,prefix+'-title',version['label'],'HEADING_3',{'src':'illnesses/'+preview['animation'],'still':'illnesses/'+preview['still']}))
     appearance=block(sid,prefix+'-appearance','Appearance: '+version['visual'])
     if version.get('appearance_anchor'): appearance['id']=version['appearance_anchor']
     blocks.append(appearance)
     blocks.extend(version.get('preserved_blocks',[]))
     if preview.get('sheet'):
      link=block(sid,prefix+'-sheet','Download the earlier frame sheet')
      link['referenceUrl']='illnesses/'+preview['sheet'];blocks.append(link)
   write(sid,e['name'],kind,blocks,fields[1][1],directory+'/#'+e['id'],status,[collection]);allblocks.extend(blocks)
  write(collection,title,kind,allblocks,'Every '+('ribbon, medal, trophy and archived design' if directory=='ribbons' else 'illness')+' on one illustrated, annotatable logbook page.',directory+'/')
  sources.append({'key':collection,'title':title,'note':'Illustrated reference cards with stable reading and paragraph IDs; notes use the existing logbook records and backups.'})
