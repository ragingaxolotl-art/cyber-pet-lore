import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync(new URL('../site/catalog.json',import.meta.url)));
const entries=new Map(catalog.entries.map(e=>[e.id,e]));
test('all lore connections resolve and have a reciprocal link',()=>{
 for(const e of entries.values())for(const c of e.connections){assert.notEqual(c.id,e.id);assert.ok(entries.has(c.id),c.id);assert.ok(entries.get(c.id).connections.some(back=>back.id===e.id),`${e.id} → ${c.id}`);}
});
test('each song has a performer, setting, existing source connection and playable assets',()=>{
 const songs=[...entries.values()].filter(e=>e.kind==='Song');assert.equal(songs.length,4);
 for(const song of songs){const targets=song.connections.map(c=>entries.get(c.id));assert.ok(targets.some(t=>t.kind==='People'&&t.status==='new addition'));assert.ok(targets.some(t=>t.kind==='Locations'));assert.ok(targets.some(t=>t.id.startsWith('atlas-')));for(const file of ['song.m4a','language-only.wav','arrangement.mid','meanings.txt'])assert.ok(fs.statSync(new URL(`../site/songs/${song.song}/${file}`,import.meta.url)).size>0);}
});
test('new fiction is distinct and original source conservation is retained',()=>{
 assert.equal([...entries.values()].filter(e=>e.status==='new addition').length,9);
 assert.ok(Object.values(catalog.integrity).every(v=>v.exactTextConserved));
 assert.equal(entries.get('atlas-p00297').status,'proposed');
 assert.ok(entries.get('atlas-p00207').connections.some(c=>c.id==='song-care-in-the-quiet'));
 assert.ok(entries.get('stories-p01469').connections.some(c=>c.id==='song-room-to-restore'));
 assert.ok(!entries.get('song-care-in-the-quiet').connections.some(c=>c.id==='lore-p01257'));
});
