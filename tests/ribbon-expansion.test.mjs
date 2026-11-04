import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createLayer,encodeRecipe,decodeRecipe,validateRecipe,matchPalette,matchMaterial,recolor,orbitPose,sceneLayers,PALETTES} from '../site/ribbons/studio/model.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../site/ribbons/studio/catalog.json',import.meta.url)));
const base=JSON.parse(fs.readFileSync(new URL('../sources/ribbon-expansion/base-catalog.json',import.meta.url)));
const selections=JSON.parse(fs.readFileSync(new URL('../site/ribbons/studio/material-selections.json',import.meta.url)));
const make=layers=>({version:1,library:catalog.library,name:'Materials and horizontal orbit',layers});
test('original parts retain exact artwork, identity, bounds and placement',()=>{
 for(const p of base.parts){const current=catalog.parts.find(x=>x.id===p.id);for(const key of ['file','bounds','width','height','x','y','original_size','sha256','source'])assert.deepEqual(current[key],p[key],`${p.id} ${key}`);}
});
test('matched palettes persist and are inherited by newly added parts',()=>{
 const parts=catalog.parts.filter(p=>p.materials?.includes('gem')).slice(0,3);
 const r=make(parts.map(createLayer));r.layers[0].rotation=45;
 const next=matchPalette(r,PALETTES['Silver moon'],catalog);assert.notDeepEqual(next,r);assert.equal(r.palette,undefined);
 for(const l of next.layers)for(const [key,color] of Object.entries(l.materialColors))assert.equal(color,PALETTES['Silver moon'][key]);
 assert.equal(next.layers[0].rotation,45);
 const added=createLayer(parts[0],next.palette);assert.equal(added.materialColors.gem,PALETTES['Silver moon'].gem);
 const decoded=decodeRecipe(encodeRecipe(next,catalog),catalog);assert.equal(decoded.version,3);assert.deepEqual(decoded.layers,next.layers);assert.deepEqual(decoded.palette,next.palette);
 const gemOnly=matchMaterial(next,'gem','#f123ab',catalog);assert.equal(gemOnly.layers[0].materialColors.metal,next.layers[0].materialColors.metal);assert.equal(gemOnly.layers[0].materialColors.gem,'#f123ab');
});
test('adding new metal/fabric masks does not alter existing saved legacy tints',()=>{
 const src=new Uint8ClampedArray([180,130,50,255,40,35,150,255,20,180,220,255]);
 const layer={mode:'all',color:'#d74466',source:'#0000ff',tolerance:32,materialColors:{gem:null}};
 const legacy=recolor(src.slice(),layer,{gem:new Uint8Array([0,0,1])});
 const expanded=recolor(src.slice(),layer,{metal:new Uint8Array([1,0,0]),fabric:new Uint8Array([0,1,0]),gem:new Uint8Array([0,0,1])});
 assert.deepEqual(expanded,legacy);
});
test('horizontal orbits travel left/right with shallow perspective and occlude behind the ribbon',()=>{
 const p=catalog.parts[0],centre={...createLayer(p),x:256,y:160,orbit:{radius:140,depth:24,period:8,phase:0}};
 const right=orbitPose(centre,p,0),front=orbitPose(centre,p,2),left=orbitPose(centre,p,4),back=orbitPose(centre,p,6);
 assert.equal(right.layer.x,396);assert.equal(left.layer.x,116);assert.ok(front.depth>0&&back.depth<0);assert.ok(front.layer.scale>back.layer.scale);
 assert.ok(Math.abs(front.layer.x-256)<1e-9);assert.ok(Math.abs(back.layer.x-256)<1e-9);
 const r=make([{...centre,orbit:{...centre.orbit,phase:270}},{...createLayer(p)},{...centre,orbit:{...centre.orbit,phase:90}}]);
 assert.deepEqual(sceneLayers(r,catalog,0).map(x=>x.index),[0,1,2]);
 assert.deepEqual(sceneLayers(r,catalog,4).map(x=>x.index),[2,1,0]);
 assert.deepEqual(decodeRecipe(encodeRecipe(r,catalog),catalog).layers,r.layers);
});
test('malformed palettes and orbits cannot enter saved recipes',()=>{
 const l=createLayer(catalog.parts[0]);for(const orbit of [{radius:Infinity,depth:20,period:8,phase:0},{radius:100,depth:20,period:0,phase:0},{radius:100,depth:101,period:8,phase:0}])assert.throws(()=>validateRecipe(make([{...l,orbit}]),catalog));
 assert.throws(()=>validateRecipe({...make([l]),palette:{gem:'url(secret)'}},catalog));
 assert.throws(()=>validateRecipe({...make([l]),palette:{unknown:'#123456'}},catalog));
});
test('every category has at least sixty finished choices and particle groups retain independent bits',()=>{
 for(const kind of ['ribbon','medal','rosette','accent','clasp'])assert.ok(catalog.parts.filter(p=>p.kind===kind).length>=60,kind);
 assert.ok(catalog.parts.filter(p=>p.kind==='accent'&&!p.tags?.includes('particle')).length>=60,'at least sixty trims even without particle groups');
 const particles=catalog.parts.filter(p=>p.tags?.includes('particle'));assert.ok(particles.length>=32);
 for(const p of particles){assert.ok(p.width<=88&&p.height<=28);assert.ok(p.fragments.length>1&&p.fragments.length<=16);const pixels=new Set();
  for(const f of p.fragments){assert.ok(f.width<=16&&f.height<=16);for(const [y,a,b] of f.runs)for(let x=a;x<b;x++){const k=x+','+y;assert.ok(!pixels.has(k),'particle pixel belongs to more than one bit');pixels.add(k);}}
  const sourcePixels=new Set();for(const [y,a,b] of selections.parts[p.id].gem.runs)for(let x=a;x<b;x++)sourcePixels.add(x+','+y);assert.deepEqual(pixels,sourcePixels,'separated bits preserve every source pixel');
  const l=createLayer(p);assert.ok(l.orbit);l.orbit.phase=0;l.orbit.spread=180;
  const medal=catalog.parts.find(p=>p.kind==='medal');const r=make([createLayer(medal),l]),items=sceneLayers(r,catalog,0),middle=items.findIndex(x=>x.index===0);
  assert.ok(middle>0&&middle<items.length-1,'some bits behind pendant while others are in front');
  assert.equal(items.filter(x=>x.index===1).length,p.fragments.length);
  assert.deepEqual(decodeRecipe(encodeRecipe(r,catalog),catalog).layers,r.layers);
  assert.notDeepEqual(sceneLayers(r,catalog,2).map(x=>x.layer.x),items.map(x=>x.layer.x));
 }
});
test('all generation candidates and finishing versions remain saved with verified hashes',()=>{
 const inventory=JSON.parse(fs.readFileSync(new URL('../sources/ribbon-expansion/archive-inventory.json',import.meta.url)));
 const jobs=JSON.parse(fs.readFileSync(new URL('../sources/ribbon-expansion-jobs.json',import.meta.url))).jobs;
 const expected=jobs.reduce((n,j)=>n+Number(j.result.content.find(x=>x.type==='text').text.match(/candidates: (\d+)/)[1]),0);
 assert.equal(inventory.generated_batches,jobs.length);assert.equal(inventory.original_candidates,expected);
 assert.equal(inventory.finishing_outputs,JSON.parse(fs.readFileSync(new URL('../sources/ribbon-expansion/repairs.json',import.meta.url))).length);
 assert.equal(inventory.prior_generation_images,37);
 for(const f of inventory.files)assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../site/ribbons/studio/'+f.file,import.meta.url))).digest('hex'),f.sha256,f.file);
 assert.ok(fs.statSync(new URL('../site/ribbons/studio/downloads/pixellab-generation-archive.zip',import.meta.url)).size>1000000);
});
