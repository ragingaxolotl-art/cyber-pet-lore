import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyState,validateState,mergeStates,highlightIntervals} from '../site/records.mjs';
const reading=(time,note='')=>({read:true,readAt:time,note,tags:['revisit'],highlights:[],updatedAt:time});
test('backup round trip retains read marks, notes, positions and highlights',()=>{
 const s=emptyState();s.readings.story={...reading(10,'<script>literal note</script>'),position:{block:'p1'},highlights:[{id:'h1',note:'Why?',color:'gold',segments:[{block:'p1',start:0,end:5,quote:'Hello'}],createdAt:10}]};
 assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))),s);
});
test('imports merge newer records and retain readings absent from backup',()=>{
 const a=emptyState(),b=emptyState();a.readings.one=reading(20,'new');a.readings.two=reading(10,'keep');b.readings.one=reading(10,'old');b.readings.three=reading(30,'import');
 const merged=mergeStates(a,b);assert.equal(merged.readings.one.note,'new');assert.equal(merged.readings.two.note,'keep');assert.equal(merged.readings.three.note,'import');
});
test('malformed backups fail without mutating current state',()=>{
 const a=emptyState(),b=emptyState();a.readings.one=reading(1);b.readings.bad={...reading(2),highlights:[{id:'h',color:'gold',segments:[{block:'p',start:0,end:8,quote:'bad'}]}]};
 assert.throws(()=>mergeStates(a,b));assert.deepEqual(Object.keys(a.readings),['one']);assert.throws(()=>validateState({readings:{}}));
});
test('overlapping highlights preserve exact text and ignore stale anchors',()=>{
 const h=(id,start,end,quote)=>({id,color:'gold',segments:[{block:'p',start,end,quote}]});
 const parts=highlightIntervals('hello world','p',[h('a',0,5,'hello'),h('b',3,8,'lo wo'),h('old',0,5,'wrong')]);
 assert.equal(parts.map(x=>x.text).join(''),'hello world');assert.equal(parts.find(x=>x.text==='lo').id,'b');assert.ok(parts.every(x=>x.id!=='old'));
});
test('all catalog readings have content, unique stable IDs and valid source anchors',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('../site/catalog.json',import.meta.url)));assert.equal(c.entries.filter(e=>e.kind==='Story').length,14);assert.equal(new Set(c.entries.map(e=>e.id)).size,c.entries.length);assert.ok(c.entries.some(e=>e.places.length));
 for(const e of c.entries){const doc=JSON.parse(fs.readFileSync(new URL('../site/content/'+e.id+'.json',import.meta.url)));assert.equal(doc.id,e.id);assert.ok(doc.blocks.length);assert.equal(new Set(doc.blocks.map(b=>b.id)).size,doc.blocks.length);for(const o of doc.outline)assert.ok(doc.blocks.some(b=>b.id===o.id));}
 assert.ok(Object.values(c.integrity).every(x=>x.exactTextConserved));
});
