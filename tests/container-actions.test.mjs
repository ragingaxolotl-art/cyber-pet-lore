import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {scoreSongText} from '../site/translator/song_lines.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const fill='CMP:8732bb43e880fb058158e27d',empty='CMP:f6a1885a79cc91ee94fb86aa';
for(const state of [0,1,2])test('container actions preserve actor, container and scope at runtime '+state,async()=>{
 for(const [text,id,scopes,act] of [
  ['The awake robot filled the cracked bottle.',fill,['time_before_speech'],'assertion'],
  ['Mira will not empty the box.',empty,['time_after_speech','negation'],'assertion'],
  ['Can Nora fill the bottle?',fill,['ability'],'question'],
  ['Do not empty the box.',empty,['negation'],'command']
 ]){
  const plan=storyReading(text+' ['+state+']',authority);assert(plan?.events,text);
  const {midi}=await scoreStory(plan,authority),heard=decodeStoryMidi(midi,authority.atoms);
  assert.equal(heard.events[0].predicate,id);assert.deepEqual(heard.events[0].scopes,scopes);
  assert.deepEqual(heard.events[0].arguments.map(a=>a.role),['actor','target']);
  assert.deepEqual(heard.events[0].arguments.map(a=>a.entity),[0,1]);
  assert.equal(heard.runtime_state,state);assert.equal(heard.speech_act,act);
  assert.deepEqual(decodeStoryMidi(expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms),authority.atoms),heard);
 }
});
test('container phases stay explicit and share the same referent',async()=>{
 for(const text of ['Nora filled the empty box.','Nora emptied the full box.']){
  const plan=storyReading(text,authority);assert.equal(plan?.unsupported,true);assert.match(plan.reason,/before and after/);
  assert.equal(await scoreSongText(text,authority,()=>{throw Error('No unrelated reinterpretation');}),null);
 }
 const plan=storyReading('The box was empty before Nora filled it.',authority);
 const heard=decodeStoryMidi((await scoreStory(plan,authority)).midi,authority.atoms);
 assert.equal(heard.events[0].predicate,'CMP:7e3cdc51fe00e1c61e5e9f12');assert.equal(heard.events[1].predicate,fill);
 assert.equal(heard.events[0].arguments[0].entity,heard.events[1].arguments[1].entity);
 assert.deepEqual(heard.relations,[{kind:'before',events:[0,1]}]);
});
test('container ambiguity and unsupported complements never become a different meaning',()=>{
 for(const text of ['Nora filled the form.','Nora emptied the file.']){
  assert.equal(storyReading(text,authority).question.key,'containerAction0');
  assert.equal(storyReading(text,authority,{answers:{containerAction0:'other'}}),null);
 }
 for(const text of ['Nora filled the box with water.','Nora emptied the box into the bin.','The box was filled.','Nora has emptied the box.'])assert.equal(storyReading(text,authority),null,text);
});
