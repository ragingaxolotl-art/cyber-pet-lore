import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLayer,encodeRecipe,decodeRecipe,validateRecipe,bounds,hits,localPoint,drawLayer} from '../site/ribbons/studio/model.mjs';
const catalog=JSON.parse(readFileSync(new URL('../site/ribbons/studio/catalog.json',import.meta.url))),part=catalog.parts[0];
const recipe={version:1,library:catalog.library,name:'Rotated ribbon',layers:[{...createLayer(part),materialColors:undefined}]};
test('legacy codes retain exact content; angles and material tints survive portable round trips',()=>{
 delete recipe.layers[0].materialColors;const old=encodeRecipe(recipe,catalog);assert.deepEqual(decodeRecipe(old,catalog),recipe);assert.equal(encodeRecipe(decodeRecipe(old,catalog),catalog),old);
 for(const rotation of [-180,-90,-12.5,0,15,90,180]){const layer={...recipe.layers[0],rotation},r={...recipe,layers:[layer]},decoded=decodeRecipe(encodeRecipe(r,catalog),catalog);assert.equal(decoded.version,rotation?2:1);assert.deepEqual(decoded.layers,[layer]);}
 const decorated=catalog.parts.find(p=>p.materials?.includes('gem')),layer={...createLayer(decorated),rotation:45,materialColors:{gem:'#abcdef'}};assert.deepEqual(decodeRecipe(encodeRecipe({...recipe,layers:[layer]},catalog),catalog).layers,[layer]);
});
test('unsafe angles and unsupported recipe versions are rejected',()=>{
 for(const rotation of [Infinity,NaN,'90',null,181,-181])assert.throws(()=>validateRecipe({...recipe,layers:[{...recipe.layers[0],rotation}]},catalog));assert.throws(()=>validateRecipe({...recipe,version:99},catalog));
});
test('selection and color sampling invert rotation around the same center as drawing',()=>{
 const p={width:20,height:100},layer={x:100,y:50,scale:1,visible:true,rotation:90},b=bounds(layer,p),cx=b.x+b.w/2,cy=b.y+b.h/2;
 assert.ok(hits(layer,p,cx+40,cy));assert.ok(!hits(layer,p,cx,cy+40));const mapped=localPoint(layer,p,cx+40,cy);assert.ok(Math.abs(mapped.x-cx)<1e-9);assert.ok(Math.abs(mapped.y-(cy-40))<1e-9);assert.ok(!hits({...layer,visible:false},p,cx,cy));
 const calls=[],ctx=Object.fromEntries(['save','translate','rotate','drawImage','restore'].map(name=>[name,(...args)=>calls.push([name,...args])]));drawLayer(ctx,layer,p,'image');assert.deepEqual(calls,[['save'],['translate',cx,cy],['rotate',Math.PI/2],['drawImage','image',-10,-50,20,100],['restore']]);
});
test('a diagonal layer hit uses the rotated rectangle rather than its enclosing box',()=>{
 const p={width:20,height:100},layer={x:100,y:50,scale:1,visible:true,rotation:45};assert.ok(hits(layer,p,100,100));assert.ok(!hits(layer,p,140,140));
});
