import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const keep='CMP:cac584a394535e4912c75b5a',stay='CMP:ec3a1fad0ed828279e948372';
function physical(text,initial={}){
 const answers={...initial};
 for(let i=0;i<10;i++){
  const plan=storyReading(text,authority,{answers});if(!plan?.question)return plan;
  assert(plan.question.options.some(o=>o.value==='physical'));answers[plan.question.key]='physical';
 }
 throw Error('Repeated question');
}
for(const runtime of [0,1,2])test('physical state complements retain predicate, condition and bearer at runtime '+runtime,async()=>{
 for(const [text,id,norm,scopes,roles] of [
  ['Nora kept the box cold.',keep,'cold',['time_before_speech'],['cause','bearer']],
  ['The box stayed heavy.',stay,'heavy',['time_before_speech'],['bearer']],
  ['The box remains wide.',stay,'wide',[],['bearer']],
  ['Nora might not keep the box bright.',keep,'bright',['modality_possible','negation'],['cause','bearer']]
 ]){
  const plan=physical(text+' ['+runtime+']');assert(plan?.events);
  const {midi}=await scoreStory(plan,authority),heard=decodeStoryMidi(midi,authority.atoms),event=heard.events[0];
  assert.equal(event.predicate,id);assert.deepEqual(event.condition,{contextual_norm:norm});assert.deepEqual(event.scopes,scopes);
  assert.deepEqual(event.arguments.map(a=>a.role),roles);assert.deepEqual(event.arguments.map(a=>a.entity),roles.map((_,i)=>i));
  assert.equal(heard.runtime_state,runtime);
  assert.deepEqual(decodeStoryMidi(expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms),authority.atoms),heard);
 }
});
test('state complements retain their physical sense choice and unresolved alternatives',()=>{
 for(const text of ['Nora keeps the box light.','The idea stays cold.']){
  const q=storyReading(text,authority).question;assert.equal(q.key,'condition0');
  assert.equal(storyReading(text,authority,{answers:{[q.key]:'other'}}),null);
 }
 for(const text of ['Nora keeps the box very cold.','The box has stayed cold.','The box stays cold for two hours.','The box stays colder.'])assert.equal(storyReading(text,authority),null);
});
test('a noun description stays separate from the maintained state and later pronoun choice',async()=>{
 const text='The heavy robot kept the light box cold. It stayed bright.';
 assert.equal(storyReading(text,authority,{answers:{property0Subjectheavy:'physical',property0Objectlight:'physical',condition0:'physical'}}).question.key,'subject1');
 const plan=physical(text,{subject1:'1'}),heard=decodeStoryMidi((await scoreStory(plan,authority)).midi,authority.atoms);
 assert.deepEqual(heard.events[0].arguments.map(a=>a.properties),[[{contextual_norm:'heavy'}],[{contextual_norm:'light'}]]);
 assert.deepEqual(heard.events[0].condition,{contextual_norm:'cold'});
 assert.equal(heard.events[1].arguments[0].entity,1);assert.deepEqual(heard.events[1].condition,{contextual_norm:'bright'});
});
