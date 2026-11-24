import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const cause='CMP:3019a12938289fa9f3a23237',change='CMP:9a954f78879ed70ce262bdc5',closed='CMP:82a697e83c845e4a7b38b53e';
for(const runtime of [0,1,2])test('closing state, transition and cause stay distinct at runtime '+runtime,async()=>{
 for(const [text,id,roles,scopes,act] of [
  ['The gate was closed.',closed,['bearer'],['time_before_speech'],'assertion'],
  ['The gate closed.',change,['bearer'],['time_before_speech'],'assertion'],
  ['Nora closed the gate.',cause,['cause','bearer'],['time_before_speech'],'assertion'],
  ['Nora might not shut the gate.',cause,['cause','bearer'],['modality_possible','negation'],'assertion'],
  ['Do not shut the gate.',cause,['cause','bearer'],['negation'],'command'],
  ['Can the gate close?',change,['bearer'],['ability'],'question']
 ]){
  const plan=storyReading(text+' ['+runtime+']',authority);assert(plan?.events,text);
  const {midi}=await scoreStory(plan,authority),heard=decodeStoryMidi(midi,authority.atoms);
  assert.equal(heard.events[0].predicate,id);assert.deepEqual(heard.events[0].scopes,scopes);
  assert.deepEqual(heard.events[0].arguments.map(a=>a.role),roles);assert.deepEqual(heard.events[0].arguments.map(a=>a.entity),roles.map((_,i)=>i));
  assert.equal(heard.runtime_state,runtime);assert.equal(heard.speech_act,act);
  assert.deepEqual(decodeStoryMidi(expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms),authority.atoms),heard);
 }
});
test('ambiguous shut tense and physical/software closing require their own choice',()=>{
 const text='We shut the gate.';assert.equal(storyReading(text,authority).question.key,'tense0');
 assert.deepEqual(storyReading(text,authority,{answers:{tense0:'present'}}).events[0].scopes,[]);
 assert.deepEqual(storyReading(text,authority,{answers:{tense0:'past'}}).events[0].scopes,['time_before_speech']);
 for(const text of ['Nora closed the file.','Nora shut the window.','The meeting closed.']){
  assert.equal(storyReading(text,authority).question.key,'closing0');assert.equal(storyReading(text,authority,{answers:{closing0:'other'}}),null);
 }
});
test('closure phase guidance and explicit before-clause preserve the intended referent',async()=>{
 for(const text of ['The closed gate closed.','Nora closed the open gate.']){
  const plan=storyReading(text,authority);assert.equal(plan.unsupported,true);assert.match(plan.reason,/before and after/);
 }
 const before=storyReading('The gate was open before Nora closed it.',authority);
 const heard=decodeStoryMidi((await scoreStory(before,authority)).midi,authority.atoms);
 assert.equal(heard.events[1].predicate,cause);assert.equal(heard.events[0].arguments[0].entity,heard.events[1].arguments[1].entity);
 assert.deepEqual(heard.relations,[{kind:'before',events:[0,1]}]);
 for(const text of ['Nora closed the gate with a lever.','The gate has been closed by Nora.','Nora has closed the gate.'])assert.equal(storyReading(text,authority),null);
});
