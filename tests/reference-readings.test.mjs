import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyState,validateState,mergeStates} from '../site/records.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL('../site/'+name,import.meta.url)));
const catalog=read('catalog.json').entries, ribbons=read('ribbons/directory.json').entries,illnesses=read('illnesses/directory.json');
test('every illustrated card and both complete collections are real stable logbook readings',()=>{
 const references=catalog.filter(e=>['Ribbons','Illnesses'].includes(e.kind));assert.equal(references.length,208);
 for(const [prefix,rows,collection] of [['ribbon-',ribbons,'reference-ribbons'],['illness-',illnesses,'reference-illnesses']]){
  const complete=read('content/'+collection+'.json');
  for(const row of rows){const id=prefix+row.id;assert.ok(catalog.some(e=>e.id===id));const page=read('content/'+id+'.json');assert.equal(page.blocks[0].id,id+'-title');assert.ok(page.blocks[0].referenceArt);assert.ok(page.blocks.some(b=>b.id===id+'-definition'));for(const b of page.blocks)assert.deepEqual(complete.blocks.find(x=>x.id===b.id),b);}
 }
});
test('reference article notes, tags, read marks and exact highlight anchors survive backup and merge',()=>{
 const state=emptyState();for(const e of catalog.filter(e=>['Ribbons','Illnesses'].includes(e.kind))){const doc=read('content/'+e.id+'.json'),b=doc.blocks.find(b=>b.id.endsWith('-definition'))||doc.blocks[1],quote=b.text.slice(0,12);state.readings[e.id]={read:true,readAt:100,note:'Synthetic reference note',tags:['review'],position:{block:b.id},updatedAt:100,highlights:[{id:'test-'+e.id,note:'Synthetic highlighted thought',color:'gold',segments:[{block:b.id,start:0,end:quote.length,quote}],createdAt:100}]};}
 const restored=validateState(JSON.parse(JSON.stringify(state)));assert.deepEqual(restored,state);const old=emptyState();old.readings['stories-p00016']={read:false,readAt:null,note:'Keep existing story note',tags:[],highlights:[],updatedAt:20,position:null};const merged=mergeStates(old,restored);assert.equal(Object.keys(merged.readings).length,209);assert.equal(merged.readings['stories-p00016'].note,'Keep existing story note');
});
test('card entry links open saveable readings and the complete collections remain accessible',()=>{
 for(const [directory,prefix,rows] of [['ribbons','ribbon-',ribbons],['illnesses','illness-',illnesses]]){const html=fs.readFileSync(new URL('../site/'+directory+'/index.html',import.meta.url),'utf8');assert.ok(html.includes('#read=reference-'+directory));for(const row of rows)assert.ok(html.includes('#read='+prefix+row.id));}
});
