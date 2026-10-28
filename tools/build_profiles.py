"""Build evidence-bound profiles. Appearance eras are never birth dates or lifespans."""
import re,hashlib

def attach_profiles(wiki,entries,content,review):
 by_entry={e['id']:e for e in entries}
 dossier_eras={'lore-p01267':-2,'lore-p01271':-1,'lore-p01275':-2,'lore-p01279':-2,'lore-p01283':-2,'lore-p01287':1,'lore-p01291':-2}
 all_blocks={b['id']:(rid,b) for rid,blocks in content.items() for b in blocks}
 for n in review['notes']:
  n['sources']=[]
  for bid in n['evidence']:
   assert bid in all_blocks,bid
   rid,b=all_blocks[bid];n['sources'].append({'href':'index.html#read='+rid+'&block='+bid,'title':by_entry[rid]['title'],'blockId':bid})
 for t in wiki['topics']:
  target_ids={x['readingId'] for x in t['targets']}
  primary=[e for e in entries if e['kind'] in ['Story','People'] and e['status'] not in ['alternate','superseded'] and (e['id'] in target_ids or t['title'] in e.get('characters',[]))]
  t['continuityNotes']=[n for n in review['notes'] if target_ids.intersection(n['readingIds']) or any(e['id'] in n['readingIds'] for e in primary)] if any(k in t['kinds'] for k in ['Person','People & groups']) else [n for n in review['notes'] if target_ids.intersection(n['readingIds'])]
  if not any(k in t['kinds'] for k in ['Person','People & groups']) or t.get('choices'):continue
  eras={};undated=[]
  for e in primary:
   era=dossier_eras.get(e['id'],e['era'][0] if len(e['era'])==1 else None)
   blocks=[b for b in content[e['id']] if not b['style'].startswith('HEADING') and len(b['text'])>35]
   if e['kind']=='People' and e['id'] in target_ids:
    chosen=blocks
   elif t['title']=='Unnamed river healer' and e['id']=='stories-p14010':chosen=blocks
   else:
    names=[t['title'].split(' (')[0],*t['aliases']]
    chosen=[b for b in blocks if any(re.search(r'(?<!\w)'+re.escape(a)+r'(?!\w)',b['text']) for a in names)]
   if not chosen:continue
   if era is None:
    undated.append({'title':e['title'],'href':'index.html#read='+e['id'],'note':'This source spans multiple eras or does not date this individual passage.'});continue
   stages=[]
   if e['kind']=='People':
    for label,prefix in [('Beginning / recorded origin',('Origin','Possible origin','New supporting')),('Middle / recorded role',('Importance','Possible importance','Function')),('Latest recorded status',('Final status','Current function','Final identity','Decline','Risk'))]:
     b=next((b for start in prefix for b in chosen if b['text'].startswith(start)),None)
     if b:stages.append((label,b))
   if not stages:
    indices=list(dict.fromkeys([0,len(chosen)//2,len(chosen)-1]))
    labels={0:'First recorded passage',len(chosen)//2:'Middle recorded passage',len(chosen)-1:'Last recorded passage'}
    stages=[(labels[i],chosen[i]) for i in indices]
   eras.setdefault(era,[]).append({'title':e['title'],'status':e['status'],'readingId':e['id'],'stages':[{'label':label,'text':b['text'],'blockId':b['id'],'href':'index.html#read='+e['id']+'&block='+b['id']} for label,b in stages]})
  t['profile']={'type':'Character' if 'Person' in t['kinds'] else 'Group or historical role','recordedEras':sorted(eras),'origin':'Exact formation date not supplied here. See the sourced origin account below; recorded activity is not a birth date.','timeline':[{'era':era,'records':records} for era,records in sorted(eras.items())],'undated':undated,'note':'Beginning, middle and last refer to the source’s recorded account, not a complete lifespan. Multiple accounts in one era are not assigned an invented order. Later mentions do not prove personal survival.','archiveSizeKiB':64+int(hashlib.sha256(t['id'].encode()).hexdigest()[:6],16)%4033,'sizeLabel':'Fictional archive allocation · decorative, not canon or actual memory size'}
