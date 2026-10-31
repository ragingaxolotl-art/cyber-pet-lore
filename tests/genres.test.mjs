import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createIndex,filterEntries,referenceCSV,visibleTreeIds} from '../site/genre-model.mjs';
const read = path => JSON.parse(readFileSync(new URL('../site/'+path,import.meta.url),'utf8'));
const data=read('genres.json'), catalog=read('catalog.json'), index=createIndex(data,catalog);
test('reference has unique IDs, connected acyclic branches and complete explanations',()=>{
  assert.equal(index.byId.size,data.entries.length);
  assert.equal(index.ordered.length,data.entries.length);
  for(const entry of data.entries){
    assert.ok(entry.parent===null||index.byId.has(entry.parent),entry.id);
    assert.equal(index.path(entry).at(-1),entry);
    for(const field of ['name','definition','prompt','kind','scopeNote'])assert.ok(entry[field]?.length,entry.id+': '+field);
  }
  assert.ok(index.path(index.byId.get('criminal-prosecution-and-defense')).length>=4);
  assert.equal(index.byId.get('developing-physical-rules').kind,'Planning label');
  assert.equal(index.byId.get('friends-to-lovers').kind,'Trope');
  assert.equal(index.byId.get('autonomy-and-consent').kind,'Theme');
});
test('every story match points to existing prose and a real supporting paragraph',()=>{
  const covered=new Set();
  for(const entry of data.entries)for(const match of entry.matches){
    assert.ok(index.stories.has(match.story),match.story);
    assert.ok(read('content/'+match.story+'.json').blocks.some(b=>b.id===match.paragraph),match.paragraph);
    assert.ok(match.reason.length>30);covered.add(match.story);
  }
  assert.deepEqual([...covered].sort(),[...index.stories.keys()].sort());
  assert.ok(index.stories.get('stories-p11382').summary.length);
  assert.ok(covered.has('corrected-child-part-two-p00000'));
});
test('parent matches deduplicate stories and preserve the reason and originating branch',()=>{
  const legal=index.matches(index.byId.get('legal-drama'));
  assert.equal(new Set(legal.map(m=>m.story)).size,legal.length);
  assert.equal(legal.find(m=>m.story==='aru-first-newborn-revised').via,'legal-drama');
  assert.equal(legal.find(m=>m.story==='stories-p00887').via,'rights-and-personhood');
  assert.equal(index.matches(index.byId.get('criminal-prosecution-and-defense')).length,0);
});
test('filters combine hierarchy, type, story, query and coverage without inventing matches',()=>{
  const legal=filterEntries(index,{query:'legal',category:'drama',kind:'Planning label'});
  assert.ok(legal.some(e=>e.id==='criminal-prosecution-and-defense'));
  assert.ok(legal.every(e=>e.kind==='Planning label'&&index.path(e)[0].id==='drama'));
  const lio=filterEntries(index,{story:'stories-p11382',match:'matched',query:'physical'});
  assert.ok(lio.some(e=>e.id==='developing-physical-rules'));
  assert.equal(filterEntries(index,{story:'stories-p11382',match:'unmatched'}).length,0);
  assert.equal(filterEntries(index,{query:'qzxj-no-such-label'}).length,0);
  assert.equal(filterEntries(index).length,data.entries.length);
});
test('CSV contains full explanations, hierarchy and match reasons with escaped quotes',()=>{
  const csv=referenceCSV(index);
  assert.ok(csv.startsWith('\uFEFF"Category"'));
  assert.ok(csv.includes('Drama > Legal drama > Courtroom drama > Wrongful-conviction appeal'));
  assert.ok(csv.includes('The First Newborn'));
  assert.equal(csv.split('\r\n').length,data.entries.length+1);
  const fixture={entries:[{id:'quoted',parent:null,name:'A "quoted" label',kind:'Planning label',definition:'A, B',prompt:'Why?',scopeNote:'Local',matches:[]}]};
  assert.ok(referenceCSV(createIndex(fixture,{entries:[]})).includes('A ""quoted"" label'));
});

test('filtered nested view retains ancestors and alias searches find laments',()=>{
  const results=filterEntries(index,{query:'lamentation',kind:'Poetic kind'});
  assert.ok(results.some(e=>e.id==='lament'));
  const visible=visibleTreeIds(index,results);
  assert.ok(visible.has('poetry'));
  assert.ok(visible.has('poems-of-mourning'));
  assert.ok(!visible.has('romance'));
  assert.equal(visibleTreeIds(index,[]).size,0);
  assert.ok((index.children.get('slice-of-life')||[]).length>=10);
  for(const e of data.entries){
    for(const id of e.related||[])assert.ok(index.byId.has(id),e.id+': '+id);
    for(const ref of e.references||[])assert.ok(ref.url.startsWith('https://'));
  }
});
