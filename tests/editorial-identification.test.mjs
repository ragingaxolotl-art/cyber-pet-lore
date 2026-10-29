import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {editorialSegments} from '../site/editorial-highlights.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
test('identification links resolve without changing original story paragraphs',()=>{
 const register=read('site/content/corrected-child-register.json');
 const entries=read('sources/corrected-child-register.json').entries;
 assert.equal(entries.length,14);
 for(const id of ['stories-p11382','corrected-child-part-two-p00000']){
  const path='site/content/'+id+'.json';const current=read(path);
  const before=JSON.parse(execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'}));
  assert.deepEqual(current.blocks.map(({id,text})=>({id,text})),before.blocks.map(({id,text})=>({id,text})));
  for(const block of current.blocks){
   const parts=editorialSegments(block.text,block.editorialMarks);
   assert.equal(parts.map(p=>p.text).join(''),block.text);
   for(const part of parts.filter(p=>p.href))assert.ok(register.blocks.some(b=>part.href.endsWith('&block='+b.id)));
  }
 }
 for(const e of entries){const source=read('site/content/'+e.readingId+'.json');assert.ok(source.blocks.find(b=>b.id===e.blockId).text.includes(e.quote));}
});
test('overlapping editorial quotes preserve text exactly',()=>{
 const text='The House advocate spoke.';
 const parts=editorialSegments(text,[{quote:'House',href:'#house'},{quote:'House advocate',href:'#advocate'}]);
 assert.equal(parts.map(p=>p.text).join(''),text);assert.equal(parts.find(p=>p.href).href,'#advocate');
});
