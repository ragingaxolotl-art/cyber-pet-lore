import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../site/',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const row=read('illnesses/directory.json').find(r=>r.id==='trademark_064');
const page=read('content/illness-trademark_064.json');
test('Deferred Reflection reverses substance while preserving both prior examples',()=>{
 assert.match(row.visual,/upright pet.*translucent/);
 assert.match(row.visual,/image below becomes solid/);
 assert.equal(row.visual_history.length,2);
 assert.equal(row.visual_revision,'2026-11-22-reflection-swap');
 assert.equal(page.blocks[0].referenceArt.src,'illnesses/'+row.preview.animation);
 assert.equal(new Set(page.blocks.map(b=>b.id)).size,page.blocks.length);
 const prior=row.visual_history.find(v=>v.id==='before-reflection-swap');
 assert.equal(page.blocks.find(b=>b.id===prior.appearance_anchor).text,'Appearance: '+prior.visual);
 const severity=prior.preserved_blocks[0];
 assert.deepEqual(page.blocks.find(b=>b.id===severity.id),severity);
 assert.ok(page.blocks.some(b=>b.id==='illness-trademark_064-severity-reviewed-2026-11-22-reflection-swap'&&b.text===row.severity_note));
});
test('reflection swap retains original media and exposes verified new media',()=>{
 const manifest=read('illnesses/2026-11-22-reflection-swap.json');
 assert.equal(manifest.current_media.length,6);assert.equal(manifest.earlier_media.length,6);
 for(const f of [...manifest.current_media,...manifest.earlier_media])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(f.path,root))).digest('hex'),f.sha256,f.path);
});
