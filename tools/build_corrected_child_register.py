"""Evidence-backed editorial highlights; preserve story text and block IDs."""
import json

def add_corrected_child_register(root, catalog, sources):
 data=json.loads((root/'sources/corrected-child-register.json').read_text())
 rid=data['id']; content=root/'site/content'; blocks=[]; outline=[]; stories={}
 def block(key,text,style='NORMAL_TEXT',marks=None):
  item={'id':rid+'-'+key,'text':text,'style':style}
  if marks:item['editorialMarks']=marks
  blocks.append(item)
 block('title',data['title'],'HEADING_1')
 block('intro','Editorial identification register for Parts One and Two. Gold underlined passages in the stories link here. These notes distinguish established details from gaps; they do not add new story canon or replace your personal highlights.')
 for entry in data['entries']:
  sid=entry['readingId']
  if sid not in stories: stories[sid]=json.loads((content/(sid+'.json')).read_text())
  original=next(b for b in stories[sid]['blocks'] if b['id']==entry['blockId'])
  assert entry['quote'] in original['text'], entry
  target=rid+'-'+entry['key']
  original.setdefault('editorialMarks',[]).append({'quote':entry['quote'],'href':'#read='+rid+'&block='+target,'title':'Identification notes: '+entry['name']})
  block(entry['key'],entry['name'],'HEADING_2');outline.append({'id':target,'title':entry['name'],'level':2})
  block(entry['key']+'-known','Established: '+entry['known'])
  block(entry['key']+'-unknown','Still unidentified: '+entry['unknown'])
  label='Source: '+('Part One' if sid=='stories-p11382' else 'Part Two')+' — '+entry['quote']
  block(entry['key']+'-source',label,marks=[{'quote':label,'href':'#read='+sid+'&block='+entry['blockId'],'title':'Read the original passage'}])
 block('other','Other people and settings','HEADING_2')
 block('other-notes','Lio, Sen, Iri, and Aru already have identified roles in the lore. Background students remain unnamed; separate appearances should not be assumed to describe the same person. References to developmental designers or advisers do not establish that they are the review specialists. Classroom test environments are exercises, not independently identified atlas locations.')
 block('real-world','Real-world identification','HEADING_2')
 block('real-world-notes','Neither part identifies a real-world human character, Earth location, server site, or physical facility. A remote presence frame is mentioned, but it does not establish a physical-world location. These absences remain open questions, not invitations to invent a mapping.')
 for sid,story in stories.items(): (content/(sid+'.json')).write_text(json.dumps(story,ensure_ascii=False))
 (content/(rid+'.json')).write_text(json.dumps({'id':rid,'blocks':blocks,'outline':outline},ensure_ascii=False))
 catalog.append({'id':rid,'title':data['title'],'kind':'Reference','era':[-1],'timeLabel':'Era −1 · editorial reference','timeOrder':11384,'status':'reference','characters':[],'places':[],'topics':['identification','characters','places'],'source':{'title':data['title'],'url':'#read='+rid},'summary':'Evidence-linked identification gaps in both parts: seven characters, seven settings, and the limits of real-world identification.','wordCount':sum(len(b['text'].split()) for b in blocks),'explicitLinks':list(stories),'connectionLabel':'Character and place identification'})
 for entry in catalog:
  if entry['id']=='stories-p11382': entry['characters']=list(dict.fromkeys(entry['characters']+['Valei','Pei','Arven','Vey (student)']))
 sources.append({'key':rid,'title':data['title'],'note':'Editorial reference derived from the two published stories; source prose is unchanged.'})
