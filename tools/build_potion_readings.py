"""Build only the new potion readings; preserve other logbook records and IDs."""
import json,shutil,collections
from pathlib import Path

def add_potion_readings(root,catalog,sources):
 source=root/'sources/era-four-remedies.json'
 if not source.exists():return
 data=json.loads(source.read_text());content=root/'site/content';content.mkdir(exist_ok=True)
 collection='reference-era-four-remedies'
 def block(id,key,text,style='NORMAL_TEXT',art=None):
  value={'id':id+'-'+key,'text':text,'style':style}
  if art:value['referenceArt']=art
  return value
 def write(id,title,blocks,summary,links):
  (content/(id+'.json')).write_text(json.dumps({'id':id,'blocks':blocks,'outline':[{'id':b['id'],'title':b['text'],'level':2} for b in blocks if b['style']=='HEADING_2']},ensure_ascii=False))
  catalog.append({'id':id,'title':title,'kind':'Remedies','era':[4],'timeLabel':'Era Four · everyday care','timeOrder':34000+len(catalog),'status':'new gameplay lore','characters':[],'places':[],'topics':['reference','logbook','remedies','Era Four'],'source':{'title':'Era Four remedies','url':'#read='+collection},'summary':summary,'wordCount':sum(len(b['text'].split()) for b in blocks),'explicitLinks':links,'connectionLabel':'Remedy collection'})
 allblocks=[block(collection,'title','Era Four remedies','HEADING_1'),block(collection,'principle',data['principle']),block(collection,'scope',data['scope'])]
 for e in data['items']:
  sid='remedy-'+e['id'];art={'src':'remedies/'+e['id']+'.gif','still':'remedies/'+e['id']+'.png'}
  blocks=[block(sid,'title',e['name'],'HEADING_2',art),block(sid,'history',e['history']),block(sid,'appearance',e['appearance']),block(sid,'activation',e['activation']),block(sid,'effects',e['effects']),block(sid,'provenance',e['provenance'])]
  write(sid,e['name'],blocks,e['history'],[collection]);allblocks+=blocks
 write(collection,'Era Four remedies — illustrated collection',allblocks,data['principle'],['remedy-'+e['id'] for e in data['items']])
 sources.append({'key':collection,'title':'Era Four remedies','note':'Original game items; short compound names in the game, fuller context in the lore book. New gameplay lore, October 28, 2026.'})
