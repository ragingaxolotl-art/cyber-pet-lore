import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../site/',import.meta.url);
const read=path=>JSON.parse(fs.readFileSync(new URL(path,root),'utf8'));
const rows=read('illnesses/directory.json');
const before=read('illnesses/history/2026-11-22-followup-before/directory.json');
const manifest=read('illnesses/review-2026-11-22-followup.json');
const collection=read('content/reference-illnesses.json');
test('six follow-up effects expose current animation, all severity stages and retained older examples',()=>{
 const revised=rows.filter(r=>r.visual_revision==='2026-11-22-followup');
 assert.equal(revised.length,6);
 assert.equal(rows.filter(r=>r.visual_revision).length,28);
 for(const r of revised){
  assert.equal(r.visual_kind,'Effect');assert.equal(r.preview.stages.length,3);
  assert.ok(r.severity_note);assert.equal(r.visual_history.length,1);
  const page=read('content/illness-'+r.id+'.json');
  assert.equal(page.blocks[0].referenceArt.src,'illnesses/'+r.preview.animation);
  assert.ok(page.blocks.some(b=>b.text==='Appearance: '+r.visual));
  assert.equal(new Set(page.blocks.map(b=>b.id)).size,page.blocks.length);
  for(const path of [r.preview.animation,r.preview.still,r.preview.sheet,...r.preview.stages,...Object.values(r.visual_history[0].preview)])assert.ok(fs.existsSync(new URL('illnesses/'+path,root)),path);
 }
});
test('follow-up retains original definitions, care, story, original appearance text and note anchors',()=>{
 assert.equal(rows.length,before.length);
 for(const old of before){
  const current=rows.find(r=>r.id===old.id);
  for(const key of ['name','family','description','treatment','story_hook','location_name','trademark','corruption'])assert.deepEqual(current[key],old[key],old.id+' '+key);
  if(!manifest.ids.includes(old.id)){assert.deepEqual(current,old);continue;}
  const page=read('content/illness-'+old.id+'.json');
  const anchor='illness-'+old.id+'-appearance';
  assert.equal(page.blocks.find(b=>b.id===anchor).text,'Appearance: '+old.visual);
  assert.equal(collection.blocks.find(b=>b.id===anchor).text,'Appearance: '+old.visual);
  assert.equal(current.visual_history[0].visual,old.visual);
 }
});
test('all six current previews and all eighteen previous media files match their recorded hashes',()=>{
 assert.equal(manifest.current_media.length,36);assert.equal(manifest.earlier_media.length,18);
 for(const file of [...manifest.current_media,...manifest.earlier_media]){
  const bytes=fs.readFileSync(new URL(file.path,root));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);
 }
});
