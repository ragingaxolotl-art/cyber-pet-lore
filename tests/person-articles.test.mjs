import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../site/'+p,import.meta.url),'utf8'));
const wiki=read('wiki.json'),byId=new Map(wiki.topics.map(t=>[t.id,t]));
test('every indexed individual has a synthesis with valid evidence and place destinations',()=>{
 const people=wiki.topics.filter(t=>t.kinds.includes('Person')&&!t.choices);
 assert.ok(people.length>=56);
 for(const t of people){const b=t.biography;assert.ok(b,t.title);assert.ok(b.summary.length>50);assert.ok(b.sections.length>=2);for(const s of b.sections){assert.ok(s.text.length>80);assert.ok(s.sources.length);for(const ref of s.sources){const source=read('content/'+ref.readingId+'.json').blocks.find(b=>b.id===ref.blockId);assert.equal(source?.text,ref.quote);assert.equal(ref.href,`index.html#read=${ref.readingId}&block=${ref.blockId}`);}}
 for(const p of b.places){assert.ok(byId.get(p.topicId)?.kinds.includes('Place'));assert.equal(p.href,'wiki.html#'+p.topicId);assert.ok(p.relationship.length>15);}if(b.portrait){assert.ok(fs.existsSync(new URL('../site/'+b.portrait.src,import.meta.url)));assert.match(b.portrait.caption,/interpretation|illustration/i);assert.ok(b.portrait.evidence.length);}}
});
test('ambiguous people, proposed lives, and actual later installments stay distinct',()=>{
 const named=n=>wiki.topics.find(t=>t.title===n);
 assert.notEqual(named('Vey (student)').id,named('Vey (councilor)').id);
 assert.match(named('Serein').biography.summary,/uncertain origin/);
 assert.match(named('Renn').biography.sections.map(s=>s.text).join(' '),/not settle/);
 assert.match(named('Lio').biography.sections.map(s=>s.text).join(' '),/Part Two/);
 assert.match(named('Mara Vale').biography.sections.map(s=>s.text).join(' '),/explicitly internal/);
 assert.equal(named('Returning Child').biography.status,'Proposed role');
});
