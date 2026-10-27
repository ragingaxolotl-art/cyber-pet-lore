"""Import existing mapped location composites; never infer a place from a similar name."""
from pathlib import Path
import json,re,hashlib,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(sys.argv[1])
config_path=SOURCE/'config/location_filesystem.json'
config=json.loads(config_path.read_text())
manifest=json.loads((SOURCE/'assets/manifest.json').read_text())['assets']
wiki=json.loads((ROOT/'site/wiki.json').read_text())
normalize=lambda s:re.sub(r'[^a-z0-9]','',re.sub(r'^the\s+','',s.lower()))
output=ROOT/'site/images/locations';output.mkdir(parents=True,exist_ok=True)
records=[]
for loc in config['locations']:
 matches=[t for t in wiki['topics'] if 'Place' in t['kinds'] and any(normalize(a)==normalize(loc['name']) for a in t['aliases'])]
 candidates={}
 for rendering in loc['renderings']:
  if rendering['kind']!='composite' or len(rendering['assets'])!=1:continue
  relative=rendering['assets'][0].replace('res://','');file=SOURCE/relative
  if not file.is_file():continue
  view=rendering['view']
  if view not in candidates or ('pixel16' in candidates[view][0]['id'] and 'pixel16' not in rendering['id']):candidates[view]=(rendering,relative,file)
 if not candidates:continue
 assert len(matches)==1,(loc['name'],matches)
 topic=matches[0];images=[]
 for view,(rendering,relative,file) in candidates.items():
  suffix=re.sub(r'[^a-z0-9]+','-',view.lower()).strip('-') or 'main'
  name=f"{loc['id']}-{suffix}.webp"
  with Image.open(file) as im:
   im=im.convert('RGB');width,height=im.size
   im.save(output/name,'WEBP',quality=90,method=5)
  attrs=[a for a in manifest if a.get('path')==relative or a.get('path','').endswith('/') and relative.startswith(a['path'])]
  attr=max(attrs,key=lambda a:len(a['path'])) if attrs else {}
  images.append({'src':'images/locations/'+name,'width':width,'height':height,'view':view,'caption':loc['name']+(' — '+view.replace('_',' ') if view!='main' else ''),'alt':loc['name']+' location artwork'+(' — '+view.replace('_',' ') if view!='main' else ''),'sourceAsset':relative,'sourceSha256':hashlib.sha256(file.read_bytes()).hexdigest(),'originalPath':attr.get('original_path',''),'attribution':attr.get('attribution','Existing Cyber Pet project location artwork. Original creator or license not recorded in the available asset manifest; no new reuse license is granted.')})
 records.append({'atlasId':loc['atlas_id'],'locationId':loc['id'],'name':loc['name'],'topicId':topic['id'],'readingIds':list(dict.fromkeys(t['readingId'] for t in topic['targets'] if t['kind']=='Locations')),'images':images})
 print(loc['name']+': '+str(len(images))+' view(s)',flush=True)
result={'version':1,'sourceSnapshot':str(SOURCE),'mappingFile':'config/location_filesystem.json','mappingSha256':hashlib.sha256(config_path.read_bytes()).hexdigest(),'note':'Existing project composites matched through atlas location identities and exact wiki aliases. Display copies are WebP at original dimensions. Sources remain unchanged. These images are illustrations, not new assertions of canon.','locations':records}
(ROOT/'sources/location-art.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Imported',len(records),'locations;',sum(len(l['images']) for l in records),'images')
