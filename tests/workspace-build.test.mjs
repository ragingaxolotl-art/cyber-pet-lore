import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),json=p=>JSON.parse(read(p));
test('global discovery contains all Haven stories, the marginalia and exact source passage anchors',()=>{
 const index=json('site/search-index.json'),catalog=json('site/catalog.json').entries;for(const entry of catalog.filter(e=>e.id.startsWith('haven-fiction-')))assert.ok(index.documents.some(d=>d.id===entry.id&&d.title===entry.title));
 const matches=[];for(const shard of index.shards)for(const block of json('site/'+shard))if(block.text.includes('The question grew another edge')||block.text.includes('Vell'))matches.push(block);
 assert.ok(matches.some(b=>b.text.includes('The question grew another edge')));assert.ok(matches.some(b=>b.text.includes('Vell')&&b.annotation));for(const b of matches)assert.ok(json('site/content/'+b.readingId+'.json').blocks.some(source=>source.id===b.id&&source.text===b.text));
 assert.ok(index.documents.some(d=>d.title==='Sound library'&&d.href==='sounds/index.html'));
});
test('small reader index retains artwork and context without full topic bodies',()=>{
 const full=json('site/wiki.json'),small=json('site/wiki-reader-index.json');for(const key of ['readingImages','readingIllnesses','readingNotes','readings'])assert.deepEqual(small[key],full[key]);assert.ok(read('site/wiki-reader-index.json').length<read('site/wiki.json').length/5);
});
test('publication coverage and documented census are generated from the archive',()=>{
 const stats=json('site/archive-stats.json'),catalog=json('site/catalog.json');assert.equal(stats.readings,catalog.entries.length);assert.match(read('README.md'),new RegExp(stats.readings+' indexed readings'));assert.deepEqual(json('site/publication-report.json').unrecordedReadingIds,[]);assert.deepEqual(json('sources/publication-manifest.json'),json('site/creation-log.json'));
});
test('chapter URLs open canonical notes and archived editions stay distinct',()=>{
 const manifest=json('sources/haven-stories/manifest.json');for(const story of manifest.stories){const blocks=json('site/content/haven-fiction-'+story.id+'.json').blocks;for(const chapter of story.chapters){const page=read('site/haven-stories/'+story.id+'/chapter-'+String(chapter.number).padStart(2,'0')+'.html');const match=page.match(/data-lore-reading href="[^"#]+#read=([^&]+)&amp;block=([^"]+)"/);assert.ok(match);assert.equal(match[1],'haven-fiction-'+story.id);assert.ok(blocks.some(b=>b.id===match[2]&&b.text.includes(chapter.title)));}assert.match(read('site/haven-stories/'+story.id+'/pass-01.html'),/Preserved prose pass 1/);}
});
