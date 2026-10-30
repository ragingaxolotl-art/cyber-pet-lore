import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../sources/era-three-history.json',import.meta.url),'utf8'));
const reading=JSON.parse(readFileSync(new URL('../site/content/reference-era-three-history.json',import.meta.url),'utf8'));
const original=JSON.parse(readFileSync(new URL('../site/content/lore-p00039.json',import.meta.url),'utf8'));
test('real chronology has sources, limits, actual lore anchors and no invented future dates',()=>{
 assert.ok(data.entries.length>=40);
 const ids=new Set(),anchors=new Set(original.blocks.map(b=>b.id));let lastYear=0;
 for(const e of data.entries){
  assert.ok(!ids.has(e.id));ids.add(e.id);
  assert.match(e.date,/^\d{4}(-\d{2})?(-\d{2})?$/);
  assert.ok(e.date<=data.reviewed);assert.ok(Number(e.date.slice(0,4))>=lastYear);lastYear=Number(e.date.slice(0,4));
  assert.ok(e.fact&&e.connection&&e.limit&&e.sources.length);
  for(const s of e.sources)assert.equal(new URL(s.url).protocol,'https:');
  assert.ok(anchors.has('lore-p'+String(e.paragraph).padStart(5,'0')));
 }
 assert.ok(data.fiction.length>=10);
 for(const e of data.fiction){assert.equal(e.date,undefined);assert.ok(e.placement&&e.text);}
});
test('published reading preserves every fact, interpretation, limit and source',()=>{
 const ids=reading.blocks.map(b=>b.id);assert.equal(new Set(ids).size,ids.length);
 for(const e of data.entries){
  for(const field of ['fact','connection','limit'])assert.ok(reading.blocks.some(b=>b.text.endsWith(e[field])));
  for(const s of e.sources)assert.ok(reading.blocks.some(b=>b.referenceUrl===s.url));
 }
 assert.ok(reading.blocks.some(b=>b.text==='Fictional chronology — calendar dates unassigned'));
 assert.ok(data.entries.find(e=>e.id==='cache-timing').limit.includes('controlled red-team'));
 assert.ok(data.entries.find(e=>e.id==='misalignment').limit.includes('controlled simulations'));
 assert.ok(data.entries.find(e=>e.id==='anthropic-july').limit.includes('real internet access'));
});
