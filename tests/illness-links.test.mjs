import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>JSON.parse(fs.readFileSync(new URL('../site/'+name,import.meta.url),'utf8'));
const directory=read('illnesses/directory.json'),wiki=read('wiki.json'),links=read('illness-location-links.json'),catalog=read('catalog.json').entries;
const page=fs.readFileSync(new URL('../site/illnesses/index.html',import.meta.url),'utf8');
const normalize=name=>name.replace(/^\d+\.\s*/,'').toLowerCase().replace(/^the\s+/,'');
test('all 31 trademark illnesses link to their exact locations and every matching atlas reading',()=>{
 const trademarks=directory.filter(d=>d.trademark);assert.equal(trademarks.length,31);assert.equal(links.length,31);
 for(const illness of trademarks){
  const link=links.find(l=>l.illnessId===illness.id);assert.ok(link,illness.id);
  const topic=wiki.topics.find(t=>t.id===link.locationTopicId);assert.equal(normalize(topic.title),normalize(illness.location_name));
  const entry=topic.illnesses.find(d=>d.id===illness.id);assert.equal(entry.description,illness.description);assert.equal(entry.treatment,illness.treatment);assert.equal(entry.href,link.illnessHref);assert.match(entry.status,/future hook is hypothetical/);
  const expected=catalog.filter(e=>e.id.startsWith('atlas-')&&normalize(e.title)===normalize(illness.location_name)).map(e=>e.id);assert.deepEqual(link.readingIds,expected);
  for(const id of expected)assert.deepEqual(wiki.readingIllnesses[id].find(d=>d.id===illness.id),entry);
  const start=page.indexOf('<article id="'+illness.id+'"'),end=page.indexOf('</article>',start);assert.ok(start>=0);assert.ok(page.slice(start,end).includes('href="../'+link.locationHref+'"'),illness.id+' backlink');
 }
});
test('ordinary illnesses are not assigned a false trademark location',()=>{for(const d of directory.filter(d=>!d.trademark)){assert.ok(!links.some(l=>l.illnessId===d.id));assert.ok(!wiki.topics.some(t=>t.illnesses?.some(i=>i.id===d.id)));}});
