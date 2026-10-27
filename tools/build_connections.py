"""Build reciprocal, labeled reading links without changing any source paragraphs."""
def plain_title(title):
 return re.sub(r'^The ', '', re.sub(r'^\d+\.\s*', '', title),flags=re.I).split(' — ')[0]
by_id={e['id']:e for e in catalog}
links={e['id']:{} for e in catalog}
def connect(a,b,label,reverse):
 if a==b:return
 assert b in by_id, (a,b)
 links[a].setdefault(b,label);links[b].setdefault(a,reverse)
# Authored links explicitly establish context, including thematic/earlier-story links.
for e in catalog:
 for target in e.get('explicitLinks',[]):connect(e['id'],target,'Song-cycle connection','Song-cycle connection')
# Exact named mentions link to existing location/people profiles, not inferred geography.
profiles=[]
character_names=set(c for e in catalog for c in e['characters'])
for e in catalog:
 if e['kind'] not in ('Locations','People'):continue
 if e['id'].startswith('lore-p') and 1250<=int(e['id'][6:])<=1264:continue
 name=plain_title(e['title'])
 if name.isupper() or len(name)<4:continue
 aliases={name}
 if e['kind']=='Locations':
  aliases.update(n for n in place_names if n.casefold() in name.casefold())
 else:
  aliases.update(n for n in character_names if re.search(r'(?<!\w)'+re.escape(re.sub(r'^The ', '', n))+r'(?!\w)',name,re.I))
 profiles.append((e['id'],aliases))
for e in catalog:
 body='\n'.join(b['text'] for b in json.loads((CONTENT/(e['id']+'.json')).read_text())['blocks'])
 for target,aliases in profiles:
  if any(re.search(r'(?<!\w)'+re.escape(name)+r'(?!\w)',body,re.I) for name in aliases):
   connect(e['id'],target,'Named in this reading','Reading mentioning this entry')
for e in catalog:
 e['connections']=[{'id':id,'label':label} for id,label in sorted(links[e['id']].items(),key=lambda pair:(by_id[pair[0]]['kind'],by_id[pair[0]]['title']))]
