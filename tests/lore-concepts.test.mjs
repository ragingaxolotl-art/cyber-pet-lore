import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,validateState,mergeStates,STORAGE_KEY} from '../site/records.mjs';
import {LoreConceptStore} from '../site/translator/lore-concepts.mjs';
import {createProposal,emptyQueue,INTAKE_KEY,reviewProposal} from '../site/translator/concept_intake.mjs';
const data={atoms:[{canonical_id:'TEST:001'}],compounds:[]};
const proposal=(id='EZC:anonymous1')=>createProposal({submitted_form:'teacher',intended_meaning:'A person who teaches',example_context:'A teacher taught me how to read.',proposed_part_of_speech:'noun'},{id,now:'2026-10-28T12:00:00Z'});
const queue=(...proposals)=>({...emptyQueue(),proposals});
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};};
test('Lore backup round trip retains proposals and chooses newest review without removing notes',()=>{
 const a=emptyState();a.readings.story={note:'Keep me',updatedAt:1,highlights:[]};a.conceptQueue=queue(proposal());
 const b=emptyState();b.conceptQueue=reviewProposal(a.conceptQueue,'EZC:anonymous1',{status:'triaged',reviewer_name:'Example',reviewer_decision:'Needs review'},data,{now:'2026-10-28T13:00:00Z'});
 const merged=mergeStates(a,b);assert.equal(merged.readings.story.note,'Keep me');assert.equal(merged.conceptQueue.proposals[0].status,'triaged');
 assert.deepEqual(validateState(JSON.parse(JSON.stringify(merged))),merged);
 assert.equal(mergeStates(merged,a).conceptQueue.proposals[0].status,'triaged');
 assert.equal(mergeStates(merged,emptyState()).conceptQueue.proposals.length,1);
});
test('legacy translator proposals migrate without deleting original or Lore readings',()=>{
 const storage=memory(),state=emptyState();state.readings.story={note:'Keep me',updatedAt:1,highlights:[]};
 storage.setItem(STORAGE_KEY,JSON.stringify(state));storage.setItem(INTAKE_KEY,JSON.stringify(queue(proposal())));
 const store=new LoreConceptStore(data,{storage:()=>storage});store.load();
 assert.equal(store.queue.proposals.length,1);assert.ok(storage.getItem(INTAKE_KEY));assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).readings.story.note,'Keep me');
 store.load();assert.equal(store.queue.proposals.length,1);
});
test('quota failure keeps proposal exportable and private backup saves despite full storage',async()=>{
 const storage={getItem:()=>null,setItem(){throw new DOMException('full','QuotaExceededError');}},statuses=[];let saved;
 const remote=emptyState();remote.readings.remote={note:'Online note',updatedAt:1,highlights:[]};
 const store=new LoreConceptStore(data,{storage:()=>storage,onStatus:s=>statuses.push(s),connection:()=>({load:async()=>remote,save:async value=>{saved=value;}})});
 store.load();store.commit(queue(proposal()));assert.equal(store.queue.proposals[0].submitted_form,'teacher');assert.equal(store.unsaved,true);
 assert.match(statuses.at(-1),/Browser save unavailable/);
 await store.connect();assert.equal(saved.conceptQueue.proposals.length,1);assert.equal(saved.readings.remote.note,'Online note');assert.equal(store.unsaved,false);assert.match(statuses.at(-1),/Private backup saved/);
});
test('failed network retains unsaved proposal and does not claim successful private save',async()=>{
 const store=new LoreConceptStore(data,{storage:()=>({getItem:()=>null,setItem(){throw Error('quota')}}),connection:()=>({load:async()=>{throw Error('offline')}})});
 store.load();store.commit(queue(proposal()));await store.connect();assert.equal(store.unsaved,true);assert.equal(store.queue.proposals.length,1);
});
test('blocked storage access still supports private saves',async()=>{
 let saved;const store=new LoreConceptStore(data,{storage:()=>{throw Error('blocked')},connection:()=>({load:async()=>null,save:async s=>{saved=s}})});
 store.load();store.commit(queue(proposal()));await store.connect();assert.equal(saved.conceptQueue.proposals.length,1);
});
test('corrupt existing Lore data is never overwritten',async()=>{
 let writes=0,uploads=0;const store=new LoreConceptStore(data,{storage:()=>({getItem:k=>k===STORAGE_KEY?'{bad':null,setItem(){writes++}}),connection:()=>({load:async()=>null,save:async()=>uploads++})});
 assert.throws(()=>store.load(),/recovery/);store.commit(queue(proposal()));await store.connect();assert.equal(writes,0);assert.equal(uploads,0);assert.equal(store.queue.proposals.length,1);
});
test('concurrent local Lore edits survive a proposal save',()=>{
 const storage=memory(),store=new LoreConceptStore(data,{storage:()=>storage});store.load();const state=emptyState();state.readings.new={note:'Another tab',updatedAt:2,highlights:[]};storage.setItem(STORAGE_KEY,JSON.stringify(state));store.commit(queue(proposal()));assert.equal(store.state.readings.new.note,'Another tab');
});
test('proposal added while upload runs remains pending until its own upload completes',async()=>{
 let release;const first=new Promise(r=>release=r);let count=0;const saved=[];
 const store=new LoreConceptStore(data,{storage:()=>({getItem:()=>null,setItem(){throw Error('quota')}}),connection:()=>({load:async()=>null,save:async s=>{saved.push(s);if(++count===1)await first}})});
 store.load();store.commit(queue(proposal()));const pending=store.connect();await new Promise(r=>setImmediate(r));store.commit(queue(proposal(),proposal('EZC:anonymous2')));release();await pending;await new Promise(r=>setImmediate(r));assert.equal(saved.at(-1).conceptQueue.proposals.length,2);assert.equal(store.unsaved,false);
});
test('malformed proposals and unreviewed approvals are rejected by backup validation',()=>{
 const state=emptyState();state.conceptQueue=queue({...proposal(),status:'approved',approved_surface_mapping:true});assert.throws(()=>validateState(state));
 state.conceptQueue=queue({...proposal(),updated_at:'invalid'});assert.throws(()=>validateState(state));
});
