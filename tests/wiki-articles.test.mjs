import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../site/'+p,import.meta.url)));
const wiki=read('wiki.json');
test('every topic has an article or an explicit evidence limitation',()=>{
 for(const t of wiki.topics){assert.ok(t.article?.note);if(t.choices){assert.equal(t.article.sections.length,0);continue;}
 if(!t.article.summary){assert.match(t.article.note,/no substantive/);continue;}
 for(const section of t.article.sections){const blocks=read('content/'+section.readingId+'.json').blocks;assert.ok(section.status);for(const p of section.paragraphs){assert.equal(blocks.find(b=>b.id===p.blockId)?.text,p.text);}}
 const summary=t.article.summary;assert.equal(read('content/'+summary.readingId+'.json').blocks.find(b=>b.id===summary.blockId)?.text,summary.text);
 }
});
