import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const text=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(text(p));
const manifest=read('sources/haven-stories/manifest.json'),catalog=read('site/catalog.json'),atlas=read('site/shelter-atlas.json');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
test('five complete distinct stories preserve actual planning and three substantive manuscripts',()=>{
 assert.equal(manifest.stories.length,5);assert.equal(new Set(manifest.stories.map(s=>s.haven)).size,5);assert.equal(new Set(manifest.stories.map(s=>s.style)).size,5);
 let total=0;
 for(const story of manifest.stories){const base='sources/haven-stories/'+story.id+'/';const final=text(base+'manuscript.md');assert.equal(digest(final),story.finalSha256);assert.equal(final.trim().split(/\s+/).length,story.wordCount);total+=story.wordCount;assert.ok(story.wordCount>2800);assert.equal(story.chapters.length,4);
  const hashes=[];for(const p of story.passes){const manuscript=text(base+p.path);assert.equal(digest(manuscript),p.sha256);hashes.push(p.sha256);assert.ok(text(base+p.path.replace('manuscript.md','review.md')).length>400);}assert.equal(new Set(hashes).size,3);assert.ok(story.passes[1].wordCount>story.passes[0].wordCount*1.2);assert.ok(story.passes[2].wordCount>story.passes[1].wordCount);
  for(const file of ['overall-plan-v1.md','overall-critique.md','overall-plan-v2.md','outline-v1.md','outline-novelty-critique.md','outline-v2.md'])assert.ok(text(base+file).length>150);
  for(const ch of story.chapters){assert.ok(ch.wordCount>500);const plan=text(base+`chapter-${String(ch.number).padStart(2,'0')}-plan.md`);assert.match(plan,/Initial plan/);assert.match(plan,/Second critique/);assert.match(plan,/Final writing constraints/);}
 }
 assert.equal(total,manifest.totalWordCount);assert.ok(total>15000);
});
test('stories are separate proposed drafts and atlas/dossier links resolve',()=>{
 for(const story of manifest.stories){const id='haven-fiction-'+story.id,entry=catalog.entries.find(e=>e.id===id);assert.equal(entry.kind,'Draft');assert.match(entry.status,/proposed/);const h=atlas.nodes.find(n=>n.id===story.haven);assert.ok(h.stories.some(s=>s.href==='haven-stories/'+story.id+'/index.html'));
  assert.equal(h.history[story.stage].status,story.id==='interval'?'fragmented':'functioning');
  const dossier=read('site/content/catalistym-place-'+story.haven+'.json');assert.ok(dossier.blocks.some(b=>b.referenceUrl==='#read='+id));
  const content=read('site/content/'+id+'.json');assert.equal(content.outline.filter(h=>h.level===2).length,4);assert.equal(new Set(content.blocks.map(b=>b.id)).size,content.blocks.length);
  for(const file of ['index.html','plans.html','review.html','chapter-01.html','chapter-04.html','pass-01.html','pass-02.html','pass-03.html'])assert.ok(text('site/haven-stories/'+story.id+'/'+file).length>500);
 }
 assert.doesNotMatch(text('sources/haven-stories/sideways/manuscript.md'),/Custodian/i);
});
test('reading copies are separated from planning and preserve final prose',()=>{
 for(const story of manifest.stories){const html=text('site/haven-stories/'+story.id+'/chapter-01.html');const article=html.match(/<article class="chapter">([\s\S]*?)<\/article>/)?.[1];assert.ok(article);assert.doesNotMatch(article,/Initial plan|Second critique|Final writing constraints/);assert.equal(text('site/haven-stories/'+story.id+'/manuscript.md'),text('sources/haven-stories/'+story.id+'/manuscript.md'));}
});
