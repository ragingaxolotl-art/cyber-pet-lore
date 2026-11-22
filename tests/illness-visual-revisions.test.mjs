import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../site/',import.meta.url);
const read=path=>JSON.parse(fs.readFileSync(new URL(path,root),'utf8'));
const directory=read('illnesses/directory.json');
const previous=read('illnesses/history/2026-11-22-before/directory.json');
const revised=directory.filter(row=>row.visual_revision==='2026-11-22');
const collection=read('content/reference-illnesses.json');
const html=fs.readFileSync(new URL('illnesses/index.html',root),'utf8');
test('22 reviewed conditions expose current images and all three stages',()=>{
 assert.equal(revised.length,22);
 for(const row of revised){
  assert.ok(row.severity_note);assert.ok(row.visual_kind);
  assert.equal(row.preview.stages.length,3);
  for(const path of [row.preview.animation,row.preview.still,row.preview.sheet,...row.preview.stages])assert.ok(fs.existsSync(new URL('illnesses/'+path,root)),path);
  const page=read('content/illness-'+row.id+'.json');
  assert.equal(page.blocks[0].referenceArt.src,'illnesses/'+row.preview.animation);
  assert.ok(page.blocks.some(b=>b.text==='Appearance: '+row.visual));
  assert.equal(page.blocks.filter(b=>b.id.startsWith('illness-'+row.id+'-stage-')).length,3);
  const card=html.slice(html.indexOf('<article id="'+row.id+'"'),html.indexOf('</article>',html.indexOf('<article id="'+row.id+'"')));
  assert.ok(card.includes(row.preview.animation));assert.ok(card.includes('Earlier versions'));
 }
});
test('original appearance anchors keep their exact original words beside preserved examples',()=>{
 for(const row of revised){
  const old=previous.find(p=>p.id===row.id);const page=read('content/illness-'+row.id+'.json');
  const anchor='illness-'+row.id+'-appearance';
  assert.equal(page.blocks.find(b=>b.id===anchor).text,'Appearance: '+old.visual);
  assert.equal(collection.blocks.find(b=>b.id===anchor).text,'Appearance: '+old.visual);
  assert.equal(new Set(page.blocks.map(b=>b.id)).size,page.blocks.length);
  assert.equal(row.visual_history[0].visual,old.visual);
  for(const history of row.visual_history)for(const path of Object.values(history.preview))assert.ok(fs.existsSync(new URL('illnesses/'+path,root)),path);
 }
});
test('Doorwake preserves the earlier stretch while explaining the final linked-door walk',()=>{
 const row=revised.find(r=>r.id==='trademark_032');
 assert.match(row.visual,/emerge from the opposite doorway/);
 assert.match(row.visual,/position, size and action stay unchanged/);
 assert.equal(row.visual_history.length,2);
 assert.ok(row.visual_history.some(v=>v.id==='earlier-stretch'));
 const js=fs.readFileSync(new URL('illnesses/directory.js',root),'utf8');
 assert.ok(js.includes("button.closest('[data-preview-group]')"));
});
test('care, identity, source definitions and unaffected visual descriptions are preserved',()=>{
 assert.equal(directory.length,previous.length);
 for(const old of previous){const current=directory.find(row=>row.id===old.id);
  for(const key of ['name','family','description','treatment','story_hook','location_name','trademark','corruption'])assert.deepEqual(current[key],old[key],old.id+' '+key);
  if(!current.visual_revision)assert.equal(current.visual,old.visual);
 }
});
test('preserved original media still match the pre-update hashes',()=>{
 const manifest=read('illnesses/review-2026-11-22.json');
 for(const file of manifest.earlier_media){
  const bytes=fs.readFileSync(new URL(file.path,root));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);
 }
});
