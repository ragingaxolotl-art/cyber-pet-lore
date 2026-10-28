import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
test('approved continuation is complete, separately anchored, and conserved paragraph for paragraph',()=>{
 const source=read('sources/corrected-child-part-two.json');
 const content=read('site/content/corrected-child-part-two-p00000.json');
 assert.deepEqual(content.blocks.map(b=>b.text),source.paragraphs.map(p=>p.text));
 assert.match(content.blocks[2].text,/By the morning of the review/);
 assert.match(content.blocks.at(-1).text,/the others were waiting to hear it/);
 const catalog=read('site/catalog.json');
 for(const id of ['stories-p11382','corrected-child-part-two-p00000']){
  const e=catalog.entries.find(e=>e.id===id);assert.equal(e.status,'complete');assert.equal(e.partOf,'The Corrected Child');
 }
 assert.equal(catalog.storyCounts.distinctPrimaryStories,14);
 assert.equal(catalog.storyCounts.completePrimaryStories,14);
 assert.equal(catalog.storyCounts.unfinishedPrimaryStories,0);
 const app=fs.readFileSync('site/app.js','utf8');assert.ok(app.includes("'#read=corrected-child-part-two-p00000':'#read=stories-p11382'"));
});
