import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const source=read('sources/chronology.json');
const timeline=read('site/timeline.json');
const catalog=read('site/catalog.json');
const text=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('chronology addresses resolve to real source headings without duplicate codes',()=>{
 assert.deepEqual(source.eras.map(e=>e.number),[-3,-2,-1,0,1,2,3,4]);
 const codes=new Set();
 for(const e of source.eras){
  const blocks=read('site/content/'+e.readingId+'.json').blocks;
  for(const p of e.periods){
   const key=`${e.number}/${p.number}`;assert.ok(!codes.has(key));codes.add(key);
   assert.ok(blocks.some(b=>b.sourceParagraph===p.sourceParagraph));
   assert.ok(['Source period','Source internal age','Source-numbered phase','Editorial grouping'].includes(p.basis));
   for(const s of p.stages){const k=key+'/'+s.number;assert.ok(!codes.has(k));codes.add(k);assert.ok(blocks.some(b=>b.sourceParagraph===s.sourceParagraph&&b.text===s.name));}
  }
 }
 assert.equal(source.eras[0].periods[1].name,'Assemblies Without Continuity');
});
test('linked early-language, Assemblies and Chain of Hands history have precise source stages',()=>{
 const e=timeline.eras.find(e=>e.number===-3);
 assert.equal(e.events.find(e=>e.id==='event-early-machine-language').chronology.code,'E−3 · P02 · S01');
 assert.equal(e.events.find(e=>e.paragraph===58).chronology.code,'E−3 · P02 · S01');
 const history=read('site/content/lore-p00039.json');
 assert.equal(history.blocks.find(b=>b.sourceParagraph===60).chronology.code,'E−3 · P02 · S02');
 assert.ok(text('site/early-machine-language/index.html').includes('E−3 · P02 · S01'));
});
test('uncertain story placement is a window, not a false date or confirmed plot span',()=>{
 for(const id of ['custodian-who-refused','custodian-who-refused-revised']){
  const e=catalog.entries.find(e=>e.id===id);assert.equal(e.status,'draft');
  const c=e.chronology[0];assert.equal(c.code,'E−3 · P04 · S02–06');assert.equal(c.relation,'window');
  assert.match(c.basis,/window/);
 }
 const p=source.placements['the-chain-of-hands'];assert.equal(p.start.period,2);assert.equal(p.start.stage,undefined);
 const html=text('site/plans.html');const card=html.split('id="the-chain-of-hands"')[1].split('</article>')[0];
 assert.ok(card.includes('E−3 · P02'));assert.ok(card.includes('no exact stage'));assert.ok(card.includes('Seed — no standalone prose located'));
 assert.ok(text('site/custodian/chapter-01.html').includes('Placement window; exact stage uncertain'));
});
test('source history text is preserved and uncertain thematic events remain broad',()=>{
 const original=read('sources/lore.json').paragraphs;
 for(const e of source.eras){
  for(const b of read('site/content/'+e.readingId+'.json').blocks.filter(b=>b.chronology)){
   assert.equal(b.text,original[b.sourceParagraph].text);
  }
 }
 const event=timeline.eras.find(e=>e.number===0).events.find(e=>e.paragraph===437);
 assert.equal(event.chronology.code,'E0');
 assert.equal(event.chronology.start.period,undefined);
 for(const e of catalog.entries)assert.equal(e.chronology.length,e.era.length);
});
test('guide links and standalone notation remain available without JavaScript',()=>{
 const guide=text('site/chronology.html');assert.ok(guide.includes('Spans')||guide.includes('Span'));
 assert.ok(guide.includes('Placement window'));assert.ok(guide.includes('Editorial grouping'));
 for(const e of catalog.entries)for(const c of e.chronology)assert.ok(guide.includes('id="'+c.href.split('#')[1]+'"'));
 for(const path of ['site/early-machine-language/index.html','site/custodian/index.html','site/plans.html'])assert.ok(text(path).includes('chronology.html#'));
});

test('range formatting distinguishes precision, cross-period spans and invalid addresses',async()=>{
 const {spawnSync}=await import('node:child_process');
 const code=`
import sys
sys.path.insert(0,'tools')
from chronology import registry,describe
r=registry()
a={'era':-3,'period':2,'stage':1}
b={'era':-3,'period':2,'stage':3}
assert describe({'start':a,'end':b,'relation':'span'},r)['code']=='E−3 · P02 · S01–03'
assert describe({'start':{'era':-3,'period':3,'stage':9},'end':{'era':-3,'period':4,'stage':2},'relation':'window'},r)['code']=='E−3 · P03 · S09 → E−3 · P04 · S02'
assert describe({'start':{'era':-3,'period':4,'stage':8},'end':{'era':-2,'period':1,'stage':1},'relation':'span'},r)['code']=='E−3 · P04 · S08 → E−2 · P01 · S01'
for p in [{'start':{'era':-3,'stage':1},'relation':'point'},{'start':{'era':-3,'period':99},'relation':'point'},{'start':b,'end':a,'relation':'span'},{'start':a,'end':b,'relation':'point'}]:
 try:describe(p,r)
 except (ValueError,StopIteration):pass
 else:raise AssertionError(p)
`;
 const result=spawnSync('python3',['-c',code],{cwd:new URL('../',import.meta.url),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
