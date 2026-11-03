import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createLayer,encodeRecipe,decodeRecipe,recolor,materialMasks,hsl} from '../site/ribbons/studio/model.mjs';
const root=new URL('../site/ribbons/studio/',import.meta.url);
const catalog=JSON.parse(readFileSync(new URL('catalog.json',root)));
const selections=JSON.parse(readFileSync(new URL('material-selections.json',root)));
test('material selections match catalog, source bounds and immutable art hashes',()=>{
 for(const p of catalog.parts){
  assert.equal(createHash('sha256').update(readFileSync(new URL(p.file,root))).digest('hex'),p.sha256,p.id);
  assert.deepEqual(Object.keys(selections.parts[p.id]||{}),p.materials||[]);
  const occupied=new Set();
  for(const s of Object.values(selections.parts[p.id]||{})){
   assert.ok(s.runs.length);
   for(const [y,start,end] of s.runs){assert.ok(y>=0&&y<p.original_size[1]&&start>=0&&end<=p.original_size[0]&&start<end);
    for(let x=start;x<end;x++){const key=`${x},${y}`;assert.ok(!occupied.has(key),`Overlapping materials: ${p.id} ${key}`);occupied.add(key);}
   }
  }
 }
});
test('gem and leaf colours survive recipe round trips; old recipes remain unchanged',()=>{
 const p=catalog.parts.find(p=>p.id==='oak-shield'),layer=createLayer(p);
 layer.materialColors={gem:'#ec38c7',leaf:'#4caa58'};
 const recipe={version:1,library:catalog.library,name:'Separate materials',layers:[layer]};
 assert.deepEqual(decodeRecipe(encodeRecipe(recipe,catalog),catalog),recipe);
 delete layer.materialColors;
 assert.deepEqual(decodeRecipe(encodeRecipe(recipe,catalog),catalog),recipe);
 layer.materialColors={gem:'url(evil)'};assert.throws(()=>encodeRecipe(recipe,catalog));
 layer.materialColors={other:'#ffffff'};assert.throws(()=>encodeRecipe(recipe,catalog));
});
test('gem-only tint preserves metal, leaf, transparency and facet contrast',()=>{
 const original=new Uint8ClampedArray([20,35,65,255,70,100,160,255,220,232,250,255,255,255,255,255,200,140,30,255,30,110,45,255,9,8,7,0]);
 const data=original.slice(),layer={mode:'original',color:'#ffffff',source:'#000000',tolerance:32,materialColors:{gem:'#eb2878',leaf:null}};
 recolor(data,layer,{gem:new Uint8Array([1,1,1,1,0,0,0]),leaf:new Uint8Array([0,0,0,0,0,1,0])});
 assert.deepEqual(data.slice(16),original.slice(16));assert.deepEqual(data.slice(12,16),original.slice(12,16));
 const lights=[0,4,8,12].map(i=>hsl(...data.slice(i,i+3))[2]);
 assert.ok(lights.every((v,i)=>!i||v>lights[i-1]));assert.ok(lights[3]-lights[0]>.6);
 assert.notDeepEqual(data.slice(0,3),original.slice(0,3));
 for(let i=3;i<data.length;i+=4)assert.equal(data[i],original[i]);
});
test('metal colour does not tint protected gems or leaves; materials tint independently',()=>{
 const original=new Uint8ClampedArray([45,70,160,255,40,100,40,255,180,130,35,255]);
 const layer={mode:'all',color:'#aabbcc',source:'#000000',tolerance:32,materialColors:{gem:null,leaf:null}};
 const masks={gem:new Uint8Array([1,0,0]),leaf:new Uint8Array([0,1,0])};
 const data=original.slice();recolor(data,layer,masks);assert.deepEqual(data.slice(0,8),original.slice(0,8));assert.notDeepEqual(data.slice(8),original.slice(8));
 layer.mode='original';layer.materialColors.leaf='#a835d4';const leaf=original.slice();recolor(leaf,layer,masks);assert.deepEqual(leaf.slice(0,4),original.slice(0,4));assert.deepEqual(leaf.slice(8),original.slice(8));assert.notDeepEqual(leaf.slice(4,8),original.slice(4,8));
});
test('source-coordinate masks align after transparent margins are cropped',()=>{
 const masks=materialMasks({bounds:[10,20,14,23]},{gem:{runs:[[20,11,13],[22,10,14]]}});
 assert.deepEqual([...masks.gem],[0,1,1,0,0,0,0,0,1,1,1,1]);
});
