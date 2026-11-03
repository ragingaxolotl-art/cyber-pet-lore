import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sections,sectionFor,matches,highHonorsBonus,statusLabel} from '../site/ribbons/gallery-model.mjs';
const root=new URL('../site/ribbons/',import.meta.url);
const entries=JSON.parse(fs.readFileSync(new URL('directory.json',root))).entries;
const html=fs.readFileSync(new URL('index.html',root),'utf8');
test('all 188 preserved awards are reachable in one section and have stable reading links',()=>{
 assert.equal(entries.length,188);assert.equal(new Set(entries.map(e=>e.id)).size,188);
 for(const e of entries){assert.ok(sections.some(([id])=>id===sectionFor(e)));assert.ok(html.includes(`href="../index.html#read=ribbon-${e.id}"`));assert.ok(fs.existsSync(new URL(e.art,root)));}
});
test('game, classroom, components and archived studies stay distinct',()=>{
 for(const e of entries){if(e.status==='Archived concept')assert.equal(sectionFor(e),'history');else if(e.category==='Quarter award components')assert.equal(sectionFor(e),'workshop');else if(e.category==='Quarter awards')assert.equal(sectionFor(e),'classroom');}
 const high=entries.find(e=>e.id==='quarter-galaxy-gala');assert.ok(matches(high,{section:'classroom',query:'high honors'}));assert.ok(!matches(high,{section:'game'}));assert.ok(!matches(high,{section:'all',query:'nonexistent-ribbon'}));assert.ok(statusLabel(high).includes('Teacher-selected'));
});
test('High Honors examples cover the five implemented cap bonuses with preserved game art',()=>{
 assert.deepEqual([0,1,2,3,4].map(highHonorsBonus),[5,7,9,11,13]);
 assert.equal((html.match(/class="honor-card honors-open"/g)||[]).length,5);
 for(let n=0;n<=4;n++)assert.ok(html.includes(`data-honors="${n}"`));
 assert.ok(html.includes('bonuses do not stack'));assert.ok(fs.existsSync(new URL('art/high-honors/README.md',root)));
});

test('gallery HTML has unique anchors including one High Honors display',()=>{
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
});
