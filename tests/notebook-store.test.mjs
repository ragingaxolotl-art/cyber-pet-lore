import test from 'node:test';import assert from 'node:assert/strict';
import {NotebookStore,MIGRATION_KEY} from '../site/notebook-store.mjs';import {emptyState,STORAGE_KEY,validateState} from '../site/records.mjs';
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
const response=(status,data)=>({ok:status<400,status,json:async()=>data});
test('migrates v1 without changing existing highlights and keeps an original recovery copy',()=>{
 const storage=memory(),old={...emptyState(),version:1};old.readings.story={read:false,note:'old',tags:[],highlights:[],updatedAt:1};storage.setItem(STORAGE_KEY,JSON.stringify(old));const store=new NotebookStore({storage});store.updateReading('story',{note:'new'});assert.equal(JSON.parse(storage.getItem(MIGRATION_KEY)).readings.story.note,'old');assert.equal(validateState(JSON.parse(storage.getItem(STORAGE_KEY))).readings.story.note,'new');store.destroy();
});
test('two device-local edits to different fields and note targets round trip',()=>{
 const storage=memory(),a=new NotebookStore({storage}),b=new NotebookStore({storage});a.updateReading('story',{note:'keep'});b.updateReading('story',{position:{block:'p'}});a.refresh();assert.equal(a.state.readings.story.note,'keep');assert.equal(a.state.readings.story.position.block,'p');
 a.updateWorkspace('notes','map-note',{target:{kind:'map',id:'lattice-s29',title:'Different Fit',href:'shelter-atlas.html',stage:3},text:'Question',tags:['review'],pinned:true,status:'question',createdAt:1});assert.ok(validateState(JSON.parse(a.export())).workspace.notes['map-note']);a.destroy();b.destroy();
});
test('every store client can write merged online backups without opening the reader',async()=>{
 const storage=memory(),session=memory();let remote=null,revision=0;
 const request=async(url,opts)=>{if(url.endsWith('/connect'))return response(200,{token:'session'});if(opts.method==='PUT'){const body=JSON.parse(opts.body);assert.equal(body.revision,revision);remote=body.state;return response(200,{revision:++revision});}return response(200,{state:remote,revision});};
 const store=new NotebookStore({storage,session,request,delay:100000});await store.connect('test');store.updateReading('article-example',{note:'from Connections'});await store.flush();assert.equal(remote.readings['article-example'].note,'from Connections');assert.match(store.status,/Backed up online/);store.destroy();
});
test('unreadable storage is preserved and never replaced during an edit',()=>{const storage=memory();storage.setItem(STORAGE_KEY,'broken');const store=new NotebookStore({storage});store.updateReading('story',{note:'unsaved'});assert.equal(storage.getItem(STORAGE_KEY),'broken');assert.ok(store.unsaved);assert.match(store.export(),/unsaved/);store.destroy();});
test('failed network save retains local notes and a later retry restores them',async()=>{
 const storage=memory(),session=memory();let fail=false,remote=null,revision=0;
 const request=async(url,options)=>{if(url.endsWith('/connect'))return response(200,{token:'test'});if(fail)throw Error('offline');if(options.method==='PUT'){const body=JSON.parse(options.body);remote=body.state;return response(200,{revision:++revision});}return response(200,{state:remote,revision});};
 const store=new NotebookStore({storage,session,request,delay:100000});await store.connect('code');fail=true;store.updateReading('story',{note:'offline thought'});assert.equal(await store.flush(),false);assert.doesNotMatch(store.status,/Backed up online/);assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).readings.story.note,'offline thought');fail=false;await store.flush();assert.equal(remote.readings.story.note,'offline thought');store.destroy();
});
test('locking while a load is pending prevents a subsequent cloud write',async()=>{
 let release,puts=0;const pending=new Promise(resolve=>release=resolve);const store=new NotebookStore({storage:memory(),session:memory(),delay:100000,request:async(url,options)=>{if(url.endsWith('/connect'))return response(200,{token:'test'});if(url.endsWith('/disconnect'))return response(200,{});if(options.method==='PUT'){puts++;return response(200,{revision:1});}await pending;return response(200,{state:null,revision:0});}});
 const connect=store.connect('code');await new Promise(resolve=>setTimeout(resolve,0));store.lock();release();await connect;assert.equal(puts,0);assert.match(store.status,/locked/);store.destroy();
});
test('separate store clients retain simultaneous wording until explicit resolution',()=>{
 const storage=memory(),a=new NotebookStore({storage}),b=new NotebookStore({storage});a.updateReading('story',{note:'Version A'});b.updateReading('story',{note:'Version B'});a.refresh();assert.equal(a.state.readings.story._sync.note.versions.length,2);a.resolveReadingField('story','note','Version A');b.refresh();assert.equal(b.state.readings.story.note,'Version A');assert.equal(b.state.readings.story._sync.note.versions.length,1);a.destroy();b.destroy();
});
