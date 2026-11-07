import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createLayer,encodeRecipe,decodeRecipe,validateRecipe,drawLayer} from '../site/ribbons/studio/model.mjs';
import {drawDecorated} from '../site/ribbons/studio/effects.mjs';
const root=new URL('../site/ribbons/studio/',import.meta.url),catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',root)));
const parts=catalog.parts.filter(p=>p.id.startsWith('flavor-'));
const recipe=layers=>({version:4,library:'ornate-v1',name:'Opacity check',layers});
test('all thirteen collections contain reusable verified parts and three distinct assembled examples',()=>{
 assert.equal(parts.length,65);const collections=new Set(parts.map(p=>p.collection));assert.equal(collections.size,13);
 for(const p of parts)assert.equal(createHash('sha256').update(fs.readFileSync(new URL(p.file,root))).digest('hex'),p.sha256);
 for(const name of collections){const presets=catalog.presets.filter(p=>p.collection===name);assert.equal(presets.length,3);const signatures=presets.map(p=>p.layers.map(l=>l.part).join(','));assert.equal(new Set(signatures).size,3);
  for(const p of presets){const r=decodeRecipe(encodeRecipe({...recipe(p.layers),name:p.name},catalog),catalog);assert.deepEqual(r.layers,p.layers);}
  for(const mix of presets.filter(p=>p.inspiration))assert.ok(new Set(mix.layers.map(l=>catalog.parts.find(p=>p.id===l.part).collection)).size>=2);
 }
 assert.ok(!parts.some(p=>p.source.job_id==='d86752b7-c941-4e75-a180-8d1082a6fb38'));
});
test('opacity defaults only on sheer components and round-trips with legacy defaults intact',()=>{
 const sheer=parts.filter(p=>p.tags.includes('sheer'));assert.equal(sheer.length,4);
 for(const p of sheer){const l=createLayer(p);assert.equal(l.opacity,.55);assert.equal(decodeRecipe(encodeRecipe(recipe([l]),catalog),catalog).layers[0].opacity,.55);}
 const p=catalog.parts[0],old=createLayer(p);assert.equal(old.opacity,undefined);assert.equal(decodeRecipe(encodeRecipe(recipe([old]),catalog),catalog).layers[0].opacity,undefined);
 for(const opacity of [-.1,1.1,NaN,Infinity,'0.5',null])assert.throws(()=>validateRecipe(recipe([{...old,opacity}]),catalog));
 for(const opacity of [0,.55,1])assert.equal(decodeRecipe(encodeRecipe(recipe([{...old,opacity}]),catalog),catalog).layers[0].opacity,opacity);
});
function context(){const stack=[],alphas=[];return {globalAlpha:.8,alphas,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},translate(){},rotate(){},scale(){},drawImage(){alphas.push(this.globalAlpha);}};}
test('editor and exported decorated rendering multiply opacity and restore context, including reveals',()=>{
 const p=parts[0],l={...createLayer(p),opacity:.5};const a=context();drawLayer(a,l,p,{});assert.equal(a.alphas[0],.4);assert.equal(a.globalAlpha,.8);
 const b=context();drawDecorated(b,l,p,{},0,{still:true});assert.equal(b.alphas[0],.4);assert.equal(b.globalAlpha,.8);
 const c=context();drawDecorated(c,l,p,{},0,{reveal:'assemble',revealAge:.325,index:0});assert.equal(c.alphas[0],.2);assert.equal(c.globalAlpha,.8);
 const d=context();drawDecorated(d,{...l,opacity:0},p,{},0,{still:true});assert.equal(d.alphas[0],0);
});
