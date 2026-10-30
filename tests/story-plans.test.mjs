import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const archive=JSON.parse(fs.readFileSync('sources/story-plans.json','utf8'));
const sources=new Map(archive.sources.map(s=>[s.id,s]));
const variants=archive.groups.flatMap(g=>g.variants);
test('all 200 numbered compact proposals and all source-table rows survive recovery',()=>{
 const rows=variants.filter(v=>['chat-60','chat-61','chat-62'].includes(v.source));
 assert.equal(rows.length,200);
 assert.deepEqual(rows.map(v=>Number(v.number)).sort((a,b)=>a-b),Array.from({length:200},(_,i)=>i+1));
 const tables=archive.sources.filter(s=>/^chat-(36|55|57|58|60|61|62|64|82|83|90)$/.test(s.id));
 let count=0;
 for(const s of tables){
  const original=s.text.split('\n').filter(l=>l.includes('\t')&&!/^(#|Era)\t/.test(l));
  const recovered=variants.filter(v=>v.source===s.id);assert.equal(recovered.length,original.length,s.id);
  for(const v of recovered)for(const [key,value] of Object.entries(v.fields)){
   if(key==='Title')assert.ok(original.some(l=>l.includes(value)),value);
   else if(value)assert.ok(original.some(l=>l.includes(value)),`${s.id}: ${key}`);
  }
  count+=original.length;
 }
 assert.equal(count,archive.counts.tableRows);
});
test('every proposal has provenance and a working generated local source page',()=>{
 assert.equal(new Set(archive.groups.map(g=>g.id)).size,archive.groups.length);
 assert.equal(new Set(variants.map(v=>v.id)).size,variants.length);
 for(const v of variants){assert.ok(sources.has(v.source),v.id);assert.ok(fs.existsSync(`site/plans/${v.source}.html`));assert.ok(v.status);}
 assert.equal(JSON.stringify(archive).includes('\ufffd'),false);
 assert.equal(archive.counts.groups,archive.groups.length);assert.equal(archive.counts.variants,variants.length);
});
test('sequel publication status and incomplete source fragments remain distinct',()=>{
 const outline=variants.find(v=>v.id==='outline-91');assert.equal(outline.status,'Both parts written');
 assert.match(outline.fields['Original planning text'],/Part Two — \*\*The Right to Be Incorrect/);
 assert.match(outline.note,/The Right to Be Incorrect/);
 assert.equal(variants.filter(v=>v.partial).length,2);
 for(const v of variants.filter(v=>v.partial))assert.equal(v.status,'Incomplete source fragment');
 for(const g of archive.groups.filter(g=>g.title.startsWith('The Quiet One’s Human')))assert.ok(g.reading);
 const catalog=JSON.parse(fs.readFileSync('site/catalog.json','utf8'));
 assert.equal(catalog.counts.Story,15);assert.equal(catalog.entries.filter(e=>e.kind==='Draft'&&!['custodian-who-refused','custodian-who-refused-revised'].includes(e.id)).length,20);
 assert.equal(catalog.entries.find(e=>e.id==='custodian-who-refused')?.status,'draft');
 assert.equal(catalog.entries.find(e=>e.id==='custodian-who-refused-revised')?.status,'draft');
 assert.ok(!catalog.entries.some(e=>e.id.startsWith('outline-')));
});
test('generated internal reading links and illness anchors resolve',()=>{
 const catalog=JSON.parse(fs.readFileSync('site/catalog.json','utf8'));
 const ids=new Set(catalog.entries.map(e=>e.id));
 const illness=fs.readFileSync('site/illnesses/index.html','utf8');
 for(const s of archive.sources){
  if(s.url.startsWith('index.html#read=')){const id=s.url.split('read=')[1].split('&')[0];assert.ok(ids.has(id),s.url);}
  if(s.url.startsWith('illnesses/#'))assert.ok(illness.includes(`id="${s.url.split('#')[1]}"`),s.url);
 }
 const page=fs.readFileSync('site/plans.html','utf8');
 for(const id of ['the-corrected-child-complete-two-part-outline','the-oldest-newborn-arus-later-life'])assert.ok(page.includes(`id="${id}"`));
});
