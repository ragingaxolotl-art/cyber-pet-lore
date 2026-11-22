import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const placement='CMP:64574c1a25d72a89aafc46ef';
for(const state of [0,1,2])test('physical placement keeps three roles and scopes at runtime '+state,async()=>{
 for(const [text,scopes,act] of [
  ['The awake robot placed the full box at the closed gate.',['time_before_speech'],'assertion'],
  ['Nora will not put the box at the gate.',['time_after_speech','negation'],'assertion'],
  ['Can Nora put the box at the gate?',['ability'],'question'],
  ['Do not put the box at the gate.',['negation'],'command']
 ]){
  const plan=storyReading(text+' ['+state+']',authority);assert(plan?.events,text);
  const {midi}=await scoreStory(plan,authority),heard=decodeStoryMidi(midi,authority.atoms);
  assert.equal(heard.events[0].predicate,placement);assert.deepEqual(heard.events[0].scopes,scopes);
  assert.deepEqual(heard.events[0].arguments.map(a=>a.role),['actor','target','destination']);
  assert.deepEqual(heard.events[0].arguments.map(a=>a.entity),[0,1,2]);
  assert.equal(heard.runtime_state,state);assert.equal(heard.speech_act,act);
  assert.deepEqual(decodeStoryMidi(expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms),authority.atoms),heard);
 }
});
test('unmarked we put asks about time while rejecting unsupported relations and figurative meanings',()=>{
 const text='We put the box at the gate.';assert.equal(storyReading(text,authority).question.key,'tense0');
 assert.deepEqual(storyReading(text,authority,{answers:{tense0:'past'}}).events[0].scopes,['time_before_speech']);
 assert.deepEqual(storyReading(text,authority,{answers:{tense0:'present'}}).events[0].scopes,[]);
 for(const t of ['Nora put the box on the table.','Nora put only the box at the gate.','The box was put at the gate.'])assert.equal(storyReading(t,authority),null);
 for(const [t,key] of [['Nora placed the file at the gate.','physical0'],['Nora placed the box at the folder.','place0']]){
  assert.equal(storyReading(t,authority).question.key,key);
  assert.equal(storyReading(t,authority,{answers:{[key]:'other'}}),null);
 }
});
