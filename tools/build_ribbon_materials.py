from pathlib import Path
import runpy
# The expanded builder preserves the reviewed original selections and adds the
# four-material cabinet. Keep the old entry point safe for existing workflows.
if (Path(__file__).resolve().parents[1]/'sources/ribbon-expansion/base-material-selections.json').exists():
 runpy.run_path(str(Path(__file__).with_name('build_ribbon_expansion.py')),run_name='__main__')
 raise SystemExit
from PIL import Image,ImageDraw
import json,colorsys
R=Path(__file__).resolve().parents[1]/'site/ribbons/studio'
# Pixel-coordinate regions select original artwork, without modifying source images.
def ellipse(x,y,rx,ry):return {'ellipse':[x,y,rx,ry]}
def poly(*points):return {'polygon':points}
G={
'moon-medallion':[ellipse(103,122,28,32)],
'oak-shield':[ellipse(96,107,24,25)],
'rose-heart':[poly((75,99),(81,88),(94,85),(107,94),(118,85),(132,86),(142,99),(140,116),(130,131),(108,151),(84,131),(74,115))],
'compass-star':[ellipse(108,124,27,27)],
'crystal-drop':[poly((96,48),(109,62),(124,84),(134,109),(138,128),(134,143),(125,157),(111,168),(94,174),(78,170),(66,160),(57,146),(54,130),(58,111),(66,91),(80,67))],
'winged-sun':[ellipse(105,122,33,35)],
'pleated-rosette':[ellipse(95,94,16,17)],
'petal-rosette':[ellipse(96,94,17,18)],
'sunburst-rosette':[ellipse(95,92,18,21)],
'copper-leaf':[poly((96,24),(103,32),(96,40),(88,32))],
'rose-crystal':[poly((95,24),(101,32),(95,39),(89,32))],
'chain-tassels':[ellipse(91,265,4,9),ellipse(164,265,4,9)],
'archive-01-aster-ribbon':[ellipse(73,82,9,15),ellipse(73,340,3,5)],
'archive-01-aster-pendant':[ellipse(96,114,17,18)],
'archive-02-verdant-pendant':[poly((85,85),(93,98),(94,131),(86,150),(77,133),(77,102)),ellipse(85,209,4,5)],
'archive-03-tideglass-ribbon':[ellipse(67,52,8,8)],
'archive-03-tideglass-pendant':[poly((73,74),(82,85),(87,100),(83,112),(76,119),(68,117),(61,109),(60,100),(65,86)),ellipse(74,149,7,8)],
'archive-04-ember-pendant':[poly((75,94),(83,92),(90,98),(98,93),(105,96),(104,105),(91,119),(79,108)),ellipse(57,161,4,6),ellipse(90,173,4,6),ellipse(121,161,4,6)],
}
for metal,centers,y in [('gold',[85],38),('silver',[80],34)]:
 for n in (1,2,3):
  cs=([85] if n==1 else [74,96] if n==2 else [64,85,106]) if metal=='gold' else ([80] if n==1 else [69,90] if n==2 else [62,79,96])
  G[f'archive-clasp-{metal}-{n}']=[poly((x,y-6),(x+6,y),(x,y+6),(x-6,y)) for x in cs]
L={
'laurel-rosette':[{'polygon':[(5,10),(184,10),(184,184),(5,184)],'hues':[65,165],'saturation':.24}],
'laurel-wings':[poly((30,38),(93,3),(110,11),(69,71),(56,127),(80,171),(112,196),(108,211),(56,189),(26,157),(16,106)),poly((226,38),(163,3),(146,11),(187,71),(200,127),(176,171),(144,196),(148,211),(200,189),(230,157),(240,106))],
'ivory-laurel':[poly((24,24),(62,30),(85,46),(80,57),(46,48)),poly((166,24),(130,30),(105,46),(110,57),(146,48))],
'oak-shield':[poly((22,54),(59,36),(86,27),(85,55),(64,76),(54,100),(64,141),(89,169),(96,204),(69,192),(45,164),(32,127)),poly((169,54),(132,36),(105,27),(106,55),(127,76),(137,100),(127,141),(102,169),(95,204),(122,192),(146,164),(159,127))],
}
# Refined selections use colour-connected gemstone interiors and include enclosed
# neutral highlights. Spatial limits prevent matching fabric or nearby metal.
G.update({
 'moon-medallion':[{'box':[70,86,138,160],'hues':[175,245]}],
 'oak-shield':[{'box':[65,80,127,142],'hues':[75,160]}],
 'rose-heart':[{'box':[68,84,148,160],'hues':[315,355]}],
 'compass-star':[{'box':[78,95,142,161],'hues':[150,190]}],
 'crystal-drop':[{'box':[50,48,141,174],'hues':[245,285]}],
 'winged-sun':[ellipse(108,124,31,33)],
 'pleated-rosette':[{'box':[74,74,118,118],'hues':[205,245]}],
 'petal-rosette':[ellipse(96,96,18,19)],
 'sunburst-rosette':[ellipse(96,96,18,19)],
 'chain-tassels':[{'box':[85,256,99,278],'hues':[180,240]},{'box':[158,256,172,278],'hues':[180,240]}],
 'archive-01-aster-ribbon':[ellipse(73,61,10,15),ellipse(73,339,3,5)],
 'archive-01-aster-pendant':[{'box':[74,98,118,142],'hues':[180,240]}],
 'archive-02-verdant-pendant':[{'box':[71,83,99,164],'hues':[125,175]},ellipse(85,216,4,5)],
 'archive-03-tideglass-pendant':[{'box':[55,74,93,128],'hues':[160,210]},ellipse(74,150,8,9)],
})
for metal in ('gold','silver'):
 for n in (1,2,3):
  G[f'archive-clasp-{metal}-{n}']=[{'box':[45,25,120,55],'hues':[180,245],'components':n}]
L['laurel-wings']=[poly((0,0),(128,0),(128,250),(0,250)),poly((128,0),(256,0),(256,250),(128,250))]
# Separate the warm raised leaf surfaces from the dark shield ground.
for r in L['oak-shield']:r.update({'hues':[20,55],'saturation':.35,'lightness':.23})
# The ivory ribbon's leafwork is its complete top wreath.
L['ivory-laurel']=[poly((20,24),(73,30),(89,42),(83,62),(46,49)),poly((172,24),(119,30),(103,42),(109,62),(146,49))]
# Export explicit pixel runs; transparency is never selected.
catalog=json.loads((R/'catalog.json').read_text());result={'version':1,'description':'Hand-reviewed gemstone and leaf selections in original PNG coordinates. Source artwork is unchanged.','parts':{}}
for p in catalog['parts']:
 im=Image.open(R/p['file']).convert('RGBA'); materials={}
 for key,regions in [('gem',G.get(p['id'],[])),('leaf',L.get(p['id'],[]))]:
  if not regions:continue
  mask=Image.new('1',im.size)
  for region in regions:
   region_mask=Image.new('1',im.size);d=ImageDraw.Draw(region_mask)
   if 'ellipse' in region:
    x,y,rx,ry=region['ellipse'];d.ellipse((x-rx,y-ry,x+rx,y+ry),fill=1)
   elif 'box' in region:d.rectangle(region['box'],fill=1)
   else:d.polygon(region['polygon'],fill=1)
   chosen=set()
   for y in range(im.height):
    for x in range(im.width):
     if not region_mask.getpixel((x,y)):continue
     r,g,b,a=im.getpixel((x,y));h,l,s=colorsys.rgb_to_hls(r/255,g/255,b/255)
     if a and ('hues' not in region or region['hues'][0]<=h*360<=region['hues'][1] and s>=region.get('saturation',.25) and l>=region.get('lightness',.12)):chosen.add((x,y))
   if 'box' in region and key=='gem':
    groups=[]
    while chosen:
     seed=chosen.pop();group={seed};queue=[seed]
     while queue:
      x,y=queue.pop()
      for point in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
       if point in chosen:chosen.remove(point);group.add(point);queue.append(point)
     groups.append(group)
    chosen=set().union(*sorted(groups,key=len,reverse=True)[:region.get('components',1)])
   for point in chosen:mask.putpixel(point,1)
  # Fill only enclosed highlights, never the surrounding open metalwork.
  if key=='gem':
   exterior=Image.new('L',(im.width+2,im.height+2),0)
   exterior.paste(mask.convert('L').point(lambda v:255 if v else 0),(1,1))
   ImageDraw.floodfill(exterior,(0,0),128)
   for yy in range(im.height):
    for xx in range(im.width):
     if exterior.getpixel((xx+1,yy+1))==0 and im.getpixel((xx,yy))[3]:mask.putpixel((xx,yy),1)
  runs=[]
  for y in range(im.height):
   x=0
   while x<im.width:
    if not mask.getpixel((x,y)):x+=1;continue
    start=x
    while x<im.width and mask.getpixel((x,y)):x+=1
    runs.append([y,start,x])
  materials[key]={'runs':runs}
 if materials:p['materials']=list(materials);result['parts'][p['id']]=materials
(R/'material-selections.json').write_text(json.dumps(result,separators=(',',':'))+'\n');(R/'catalog.json').write_text(json.dumps(catalog,indent=2)+'\n')
print('Selected materials:',len(result['parts']), 'parts')
