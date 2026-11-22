import test from 'node:test';import assert from 'node:assert/strict';
import {validateTarget,targetHref,safeWorkspaceHref} from '../site/workspace-targets.mjs';
import {resolveArticleHighlights} from '../site/article-anchors.mjs';
import {NotebookStore} from '../site/notebook-store.mjs';
import {captureArtifacts,restoreArtifact} from '../site/workspace-artifacts.mjs';
import {notebookRows,filterNotebook} from '../site/notebook-view.mjs';
import {matchDocument,matchText,queryTerms} from '../site/search-engine.mjs';
const memory=()=>{const m=new Map();return {get length(){return m.size;},key:i=>[...m.keys()][i],getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
test('portable context keeps exact map stage and audio time; unsafe destinations reject',()=>{
 assert.equal(targetHref({kind:'map',id:'A01',title:'Haven',href:'shelter-atlas.html',stage:-3}),'shelter-atlas.html?stage=-3#A01');assert.match(targetHref({kind:'audio',id:'song',title:'Song',href:'songs/index.html',start:12.4}),/time=12.4/);
 for(const href of ['https://evil.test','javascript:alert(1)','//evil.test','index.html\\evil','../index.html','wiki.html%2f..'])assert.equal(safeWorkspaceHref(href),false);
 assert.throws(()=>validateTarget({kind:'map',id:'x',title:'x',href:'shelter-atlas.html',stage:20}));
});
test('old highlights recover only on an exact unique quote and retain outdated originals',()=>{
 const h={id:'a',segments:[{block:'oldhash',start:0,end:5,quote:'hello'}]};
 const resolved=resolveArticleHighlights([{id:'stable',text:'New hello.'}],[h]);assert.deepEqual(resolved.highlights[0].segments[0],{block:'stable',start:4,end:9,quote:'hello'});assert.equal(resolved.stale.size,0);
 const ambiguous=resolveArticleHighlights([{id:'a',text:'hello hello'}],[h]);assert.ok(ambiguous.stale.has('a'));assert.equal(h.segments[0].block,'oldhash');
 assert.ok(resolveArticleHighlights([{id:'oldhash',text:'other text'}],[h]).stale.has('a'));
});
test('creations capture versions once, exclude unrelated saves, and preserve draft before restore',()=>{
 const storage=memory(),store=new NotebookStore({storage});storage.setItem('student-profile','private');storage.setItem('cyberpath.ribbon-studio.v1','{"name":"one"}');assert.equal(captureArtifacts(storage,store),1);assert.equal(captureArtifacts(storage,store),0);
 const first=Object.values(store.state.workspace.artifacts)[0].versions[0].value;storage.setItem('cyberpath.ribbon-studio.v1','{"name":"two"}');restoreArtifact(storage,store,first);assert.equal(storage.getItem('cyberpath.ribbon-studio.v1'),'{"name":"one"}');assert.equal(Object.keys(store.state.workspace.artifacts).length,2);assert.ok(!store.export().includes('student-profile'));assert.throws(()=>restoreArtifact(storage,store,{...first,data:{storageKey:'student-profile',raw:'bad'}}));store.destroy();
});
test('notebook questions, pins, quotes, tags and stage return links can be filtered together',()=>{
 const store=new NotebookStore({storage:memory()});store.updateWorkspace('notes','n',{target:{kind:'map',id:'A01',title:'Haven',href:'shelter-atlas.html',stage:2,era:[-3]},text:'Why did this fail?',tags:['continuity'],status:'question',pinned:true,createdAt:1});const rows=notebookRows(store.state);assert.equal(filterNotebook(rows,{query:'continuity',kind:'map',era:'-3',status:'question',pinned:true}).length,1);assert.match(rows[0].href,/stage=2/);assert.equal(filterNotebook(rows,{status:'resolved'}).length,0);store.destroy();
});
test('global search supports full passages, titles and era/status constraints',()=>{
 assert.ok(matchText('A strange promise inside the shelter.',queryTerms('promise shelter')));const d={title:'Haven',text:'Continuity',kind:'Draft',era:[-3],status:'proposed'};assert.ok(matchDocument(d,{query:'haven',era:'-3'}));assert.equal(matchDocument(d,{query:'haven',kind:'Story'}),false);
});
test('whole song workspace restores the selected version including removed lines and arrangement',()=>{
 const storage=memory(),store=new NotebookStore({storage});storage.setItem('era-zero-song-v2:line:a','{"text":"a"}');storage.setItem('era-zero-song-arrangement-v1','chords');captureArtifacts(storage,store);const first=Object.values(store.state.workspace.artifacts).map(c=>c.versions[0].value).find(v=>v.data.songEntries);storage.removeItem('era-zero-song-v2:line:a');storage.setItem('era-zero-song-v2:line:b','{"text":"b"}');restoreArtifact(storage,store,first);assert.ok(storage.getItem('era-zero-song-v2:line:a'));assert.equal(storage.getItem('era-zero-song-v2:line:b'),null);assert.equal(storage.getItem('era-zero-song-arrangement-v1'),'chords');assert.match(storage.getItem('cyber-pet-lore.song-before-restore'),/line:b/);store.destroy();
});
