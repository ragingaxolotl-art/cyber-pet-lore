import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const source=read('sources/early-development.json');
const catalog=read('site/catalog.json');
const wiki=read('site/wiki.json');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
test('all reviewed paragraphs and tables survive in encyclopedia pages and annotatable readings',()=>{
 for(const a of source.articles){
  const rid='reference-'+a.id;
  const blocks=read('site/content/'+rid+'.json').blocks;
  const page=fs.readFileSync(new URL('site/development-'+a.id+'.html',root),'utf8');
  for(const s of a.sections){
   for(const p of s.paragraphs){assert.ok(blocks.some(b=>b.text===p),a.id);assert.ok(page.includes(escape(p)),a.id);}
   for(const row of s.table||[])assert.ok(blocks.some(b=>b.text===row.join(' — ')));
  }
 }
});
test('proposed story seeds stay out of completed stories and preserve qualified era placement',()=>{
 const seeds=source.articles.filter(a=>a.kind==='seed');assert.equal(seeds.length,9);
 for(const a of seeds){
  const e=catalog.entries.find(e=>e.id==='reference-'+a.id);
  assert.equal(e.kind,'Reference');assert.match(e.status,/Proposed.*unwritten/);assert.deepEqual(e.era,a.eras);
  const topic=wiki.topics.find(t=>t.title===a.title);assert.match(topic.article.note,/not a dated historical event/);
  assert.ok(a.sections.find(s=>s.id==='continuity').refs.length);
 }
});
test('source evidence remains exact and all incoming wiki connections open the review',()=>{
 for(const [key,r] of Object.entries(source.references)){
  if(r.kind!=='Lore evidence'){assert.ok(r.url.startsWith('https://'));continue;}
  const b=read('site/content/'+r.readingId+'.json').blocks.find(b=>b.id===r.blockId);assert.ok(b,key);
  assert.equal(crypto.createHash('sha256').update(b.text).digest('hex'),r.sha256,key);
 }
 for(const name of source.relatedTopics)assert.ok(wiki.topics.find(t=>t.title===name).relatedArticles.some(a=>a.href==='development-early-development.html'),name);
});
