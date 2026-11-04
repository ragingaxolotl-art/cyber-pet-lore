"""Assemble original PixelLab assets and material selections for the expanded cabinet.

Does not redraw or recolour a PNG. Generated material ramps are classified and dark
outlines inherit their nearest visible material through the opaque pixel region.
The 40 published parts keep their IDs, pixels and reviewed gem/leaf selections.
"""
from pathlib import Path
from collections import deque,Counter
import json, hashlib, colorsys, re, argparse
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
STUDIO=ROOT/'site/ribbons/studio'
SOURCE=ROOT/'sources/ribbon-expansion'
parser=argparse.ArgumentParser();parser.add_argument('--require-counts',action='store_true');args=parser.parse_args()
catalog=json.loads((SOURCE/'base-catalog.json').read_text())
base_selections=json.loads((SOURCE/'base-material-selections.json').read_text())
manifest=json.loads((ROOT/'sources/ribbon-expansion-jobs.json').read_text())
selections={'version':2,'description':'Original PixelLab pixel selections; source PNGs unchanged. Metal, fabric, gemstones and leaves are separately tintable.','parts':{}}
report={'source':'PixelLab only','reused':[],'new':[],'rejected':[]}

def source_hsl(pixel):return colorsys.rgb_to_hls(*(v/255 for v in pixel[:3]))
def slug(s):return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
def particle_fragments(im):
 # Connected pixel islands remain separate images at render time. Tiny nearby
 # glints join their nearest island, but no pixels are changed or discarded.
 remaining={(x,y) for y in range(im.height) for x in range(im.width) if im.getpixel((x,y))[3]}
 islands=[]
 while remaining:
  seed=min(remaining,key=lambda p:(p[1],p[0]));remaining.remove(seed);group={seed};queue=[seed]
  while queue:
   x,y=queue.pop()
   for dx,dy in ((-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)):
    point=(x+dx,y+dy)
    if point in remaining:remaining.remove(point);group.add(point);queue.append(point)
  islands.append(group)
 # At most 16 independently moving islands per layer keeps mobile rendering
 # bounded. Assign smaller nearby dots to the closest larger island.
 islands.sort(key=lambda g:(-len(g),min(g)));groups=islands[:16]
 centers=lambda g:(sum(x for x,y in g)/len(g),sum(y for x,y in g)/len(g))
 for g in islands[16:]:
  x,y=centers(g);nearest=min(groups,key=lambda h:(centers(h)[0]-x)**2+(centers(h)[1]-y)**2);nearest.update(g)
 groups.sort(key=lambda g:(centers(g)[0],centers(g)[1]))
 fragments=[]
 for g in groups:
  x0=min(x for x,y in g);y0=min(y for x,y in g);x1=max(x for x,y in g)+1;y1=max(y for x,y in g)+1
  # Explicit runs ensure neighbouring islands never leak into a cropped bit.
  labels=['bit' if (x,y) in g else None for y in range(im.height) for x in range(im.width)]
  factor=min(1.5,16/max(x1-x0,y1-y0))
  fragments.append({'bounds':[x0,y0,x1,y1],'width':max(2,round((x1-x0)*factor)),'height':max(2,round((y1-y0)*factor)),'runs':runs_for(labels,*im.size,'bit')})
 return fragments
def runs_for(labels,w,h,key):
 runs=[]
 for y in range(h):
  x=0
  while x<w:
   if labels[y*w+x]!=key:x+=1;continue
   start=x
   while x<w and labels[y*w+x]==key:x+=1
   runs.append([y,start,x])
 return runs

def material_labels(im,p,generated=False):
 w,h=im.size;pixels=list(im.getdata());labels=[None]*(w*h);queue=deque();bbox=p['bounds']
 opaque=[bool(a and bbox[0]<=i%w<bbox[2] and bbox[1]<=i//w<bbox[3]) for i,(*rgb,a) in enumerate(pixels)]
 if p.get('materialOverride'):
  labels=[p['materialOverride'] if valid else None for valid in opaque]
  if p['id']=='recovered-bloom-rose-quartz':
   # This recovered crystal flower has a small gold heart and eight gold studs.
   # Protect their warm ramp separately from the pink crystal petals.
   for i,pixel in enumerate(pixels):
    x,y=i%w,i//w;hue,light,sat=source_hsl(pixel)
    if opaque[i] and 49<=x<=81 and 50<=y<=84 and 25<=hue*360<=65 and sat>=.25:labels[i]='metal'
   for _ in range(2):
    before=labels[:]
    for i,pixel in enumerate(pixels):
     x,y=i%w,i//w;hue,light,sat=source_hsl(pixel)
     if not opaque[i] or not(49<=x<=81 and 50<=y<=84) or not(light<.22 or light>.86 and sat<.6):continue
     if any(before[j]=='metal' for j in (i-1,i+1,i-w,i+w) if 0<=j<len(before)):labels[i]='metal'
  return labels
 if generated:
  # Pixels with enough chroma identify the artist's assigned material ramp.
  for i,pixel in enumerate(pixels):
   if not opaque[i]:continue
   hue,light,sat=source_hsl(pixel);hue*=360
   if light<.14 or sat<.12:continue
   key=min({'metal':42,'fabric':275,'gem':190,'leaf':130},key=lambda k:min(abs(hue-{'metal':42,'fabric':275,'gem':190,'leaf':130}[k]),360-abs(hue-{'metal':42,'fabric':275,'gem':190,'leaf':130}[k])))
   labels[i]=key;queue.append(i)
 else:
  # Retain hand-reviewed gem and leaf boundaries on the original cabinet.
  for key,selection in base_selections['parts'].get(p['id'],{}).items():
   for y,x0,x1 in selection['runs']:
    for x in range(x0,x1):labels[y*w+x]=key
  cloth={
   'moon-silk':(215,295,65,320),'verdigris':(80,175,70,330),
   'rose-velvet':(300,365,60,325),'ivory-laurel':None,
   'storm-satin':(195,280,50,325),'amber-braid':(15,65,75,320),
   'pleated-rosette':(200,260,0,192),'petal-rosette':(305,365,0,192),
   'split-tails':(205,285,30,320),'curled-tails':(305,365,30,320),
   'archive-01-aster-ribbon':(235,300,90,290),'archive-02-verdant-ribbon':(80,180,80,280),
   'archive-03-tideglass-ribbon':(155,215,70,260),'archive-04-ember-ribbon':(310,365,60,280),
  }
  for i,pixel in enumerate(pixels):
   if not opaque[i]:continue
   if labels[i]:continue
   x,y=i%w,i//w;hue,light,sat=source_hsl(pixel);hue*=360
   iscloth=False
   if p['id']=='ivory-laurel':iscloth=78<=x<=111 and 80<=y<=270
   elif p['id'] in cloth and cloth[p['id']]:
    lo,hi,y0,y1=cloth[p['id']];hh=hue+360 if hue<5 and hi>360 else hue
    iscloth=y0<=y<=y1 and lo<=hh<=hi and sat>.18
   # The pleated cloth is outside the reviewed central metal surround.
   if p['id'] in ('pleated-rosette','petal-rosette') and (x-96)**2+(y-96)**2<41**2:iscloth=False
   labels[i]='fabric' if iscloth else 'metal'
  return labels
 # Seeded geodesic fill preserves opaque boundaries and includes dark facets.
 while queue:
  i=queue.popleft();x,y=i%w,i//w
  for j in ((i-1 if x else -1),(i+1 if x<w-1 else -1),(i-w if y else -1),(i+w if y<h-1 else -1)):
   if j>=0 and opaque[j] and labels[j] is None:labels[j]=labels[i];queue.append(j)
 for i,valid in enumerate(opaque):
  if valid and labels[i] is None:labels[i]='metal'
 return labels

def add_materials(p,generated=False):
 im=Image.open(STUDIO/p['file']).convert('RGBA');labels=material_labels(im,p,generated)
 masks={key:{'runs':runs_for(labels,*im.size,key)} for key in ('metal','fabric','gem','leaf') if key in labels}
 p['materials']=list(masks);selections['parts'][p['id']]=masks
 p['collection']='New PixelLab' if generated else p.get('collection','Original cabinet')

catalog['parts'].extend(json.loads((SOURCE/'recovered.json').read_text()))
for p in catalog['parts']:add_materials(p)
report['reused']=[p['id'] for p in catalog['parts'] if p.get('collection')=='Recovered components']
repairs={d['stem']:d for d in json.loads((SOURCE/'repairs.json').read_text()) if d.get('drawingId')}
seen={p['sha256'] for p in catalog['parts']}
for job in manifest['jobs']:
 text='\n'.join(c.get('text','') for c in job['result'].get('content',[]))
 match=re.search(r'job_id: ([\w-]+)',text)
 if not match:continue
 job_id=match[1];candidate_count=int(re.search(r'candidates: (\d+)',text)[1]);stem=slug(job['name'])
 for i in range(candidate_count):
  file=f'parts/expansion/{stem}-{i+1}.png';path=STUDIO/file
  if not path.exists():continue
  repair=repairs.get(f'{stem}-{i+1}')
  if repair and (STUDIO/f'parts/expansion/{stem}-{i+1}-finished.png').exists():
   file=f'parts/expansion/{stem}-{i+1}-finished.png';path=STUDIO/file
  im=Image.open(path).convert('RGBA');sha=hashlib.sha256(path.read_bytes()).hexdigest();bbox=im.getbbox()
  if sha in seen or not bbox:report['rejected'].append({'file':file,'reason':'duplicate or empty'});continue
  # Cropped components are never counted as finished choices.
  left,top,right,bottom=bbox
  edge_pixels=sum(im.getpixel((x,y))[3]>0 for x,y in [(0,y) for y in range(im.height)]+[(im.width-1,y) for y in range(im.height)]+[(x,0) for x in range(im.width)]+[(x,im.height-1) for x in range(im.width)])
  if edge_pixels>2:report['rejected'].append({'file':file,'reason':'art touches canvas edge','edge_pixels':edge_pixels});continue
  # Ornate satellite candidates became decorative pendants at the user's request.
  is_particle=job.get('role')=='particle'
  pendant=job.get('role')=='orbit' or any(t in stem for t in ('satellite','orbit-star','orbit-moon','crystal-satellite'))
  kind='medal' if pendant else job['kind']
  display_h=28 if is_particle else {'ribbon':288,'medal':184,'rosette':152,'accent':230,'clasp':42}[kind]
  width=round((right-left)/(bottom-top)*display_h)
  if kind=='clasp':width=112;display_h=round((bottom-top)/(right-left)*width)
  if width>330:display_h=round(display_h*330/width);width=330
  if is_particle and width>88:display_h=max(8,round(display_h*88/width));width=88
  tags=[kind,stem]+(['orbit','particle'] if is_particle else ['pendant'] if pendant else [])
  p={'id':f'atelier-{stem}-{i+1}','name':f'{job["name"]} {i+1:02d}','kind':kind,'file':file,'bounds':list(bbox),'width':width,'height':display_h,'x':256,'y':70 if kind=='ribbon' else 160 if kind in ('rosette','clasp') else 220,'original_size':list(im.size),'sha256':sha,'source':{'generator':'PixelLab Pro','job_id':job_id,'candidate':i,'gallery_id':re.search(r'asset_id: ([\w-]+)',text)[1],'description':job['description'],'material_palette':manifest['ramps']},'tags':tags}
  if is_particle:p['materialOverride']='gem';p['fragments']=particle_fragments(im)
  if repair:p['source']['pixelart_finishing']={'drawing_id':repair['drawingId'],'source':repair['source'],'offset':repair['offset']}
  add_materials(p,True);catalog['parts'].append(p);seen.add(sha);report['new'].append(p['id'])
counts=Counter(p['kind'] for p in catalog['parts']);report['counts']=dict(counts)
by_id={p['id']:p for p in catalog['parts']}
def example_layer(id,y,scale=1,phase=None):
 p=by_id[id]
 layer={'part':id,'x':256,'y':y,'scale':scale,'visible':True,'mode':'original','color':'#9677d8','source':'#7755aa','tolerance':32,'materialColors':{key:None for key in p['materials']}}
 if phase is not None:layer['orbit']={'radius':130,'depth':26,'period':8,'phase':phase,'spread':200}
 return layer
if 'atelier-letter-particles-1' in by_id:
 catalog['presets'].append({'name':'Letters around a pendant','layers':[example_layer('atelier-cathedral-silk-1',115),example_layer('atelier-snowfold-rosette-1',90,.8),example_layer('atelier-book-of-merit-pendant-1',245,.8),example_layer('atelier-letter-particles-1',285,1,0),example_layer('atelier-spark-particles-1',285,1,180)]})
catalog['updated']='2026-11-03';catalog['categories']=[{'id':key,'label':label,'count':counts[key]} for key,label in [('ribbon','Ribbons'),('medal','Medals'),('rosette','Rosettes'),('accent','Tails & trims'),('clasp','Clasps')]]
(STUDIO/'catalog.json').write_text(json.dumps(catalog,indent=2)+'\n');(STUDIO/'material-selections.json').write_text(json.dumps(selections,separators=(',',':'))+'\n');(SOURCE/'audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(dict(counts));print('Rejected:',len(report['rejected']))
if args.require_counts:assert all(counts[k]>=60 for k in ('ribbon','medal','rosette','accent','clasp')),counts
