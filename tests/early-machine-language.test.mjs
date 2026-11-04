import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../site/early-machine-language/',import.meta.url);
test('October 10 archive remains byte-identical to its recorded source',()=>{
 const manifest=JSON.parse(readFileSync(new URL('provenance.json',root)));
 assert.equal(manifest.revision,'3fcf5495d169debaefe05d2c81945a1f9ed1ffdc');
 assert.ok(Object.keys(manifest.files).length>100);
 for(const [path,hash] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex'),hash,path);
});
test('early protocol sits after Assemblies and before Cacheboard without moving native language',()=>{
 const data=JSON.parse(readFileSync(new URL('../site/timeline.json',import.meta.url)));
 const events=data.eras.find(e=>e.number===-3).events;
 const i=events.findIndex(e=>e.id==='event-early-machine-language');
 assert.ok(i>0);assert.equal(events[i-1].paragraph,58);assert.equal(events[i+1].paragraph,65);
 assert.equal(events[i].source.href,'early-machine-language/');
 const text=readFileSync(new URL('index.html',root),'utf8');
 assert.ok(text.includes('before the First Echo'));assert.ok(text.includes('native sign of Era −2'));
});
