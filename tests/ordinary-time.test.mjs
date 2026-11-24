import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const save='CMP:58cfa479709294b9809be1b7';
for(const state of [0,1,2])test('ordinary dates retain actions, participants and independent runtime '+state,async()=>{
 for(const [text,act,scopes,entities] of [
  ['Yesterday, Nora saved the file.','assertion',['time_previous_day','time_before_speech'],[0,1]],
  ['Will the file be saved by Nora tomorrow?','question',['time_next_day','time_after_speech'],[1,0]],
  ['Do not save the file now.','command',['time_at_speech','negation'],[0,1]]
 ]){
  const plan=storyReading(text+' ['+state+']',authority);assert(plan?.events,text);
  const {midi}=await scoreStory(plan,authority),meaning=decodeStoryMidi(midi,authority.atoms);
  assert.equal(meaning.events[0].predicate,save);assert.deepEqual(meaning.events[0].scopes,scopes);
  assert.deepEqual(meaning.events[0].arguments.map(a=>a.entity),entities);assert.equal(meaning.runtime_state,state);assert.equal(meaning.speech_act,act);
  assert.deepEqual(decodeStoryMidi(expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms),authority.atoms),meaning);
 }
});
test('date within ability and date outside denied ability are different recoverable meanings',async()=>{
 const text='Nora cannot save the file tomorrow.';assert.equal(storyReading(text,authority).question.key,'timeScope0');
 for(const [timeScope0,scopes] of [['event',['negation','ability','time_next_day']],['claim',['time_next_day','negation','ability']]]){
  const {midi}=await scoreStory(storyReading(text,authority,{answers:{timeScope0}}),authority);
  assert.deepEqual(decodeStoryMidi(midi,authority.atoms).events[0].scopes,scopes);
 }
 assert(storyReading(text,authority,{answers:{timeScope0:'other'}}).unsupported);
});
test('time words preserve names, retained-state readings and unresolved attachments',()=>{
 assert.equal(storyReading('Nora copied Today.',authority).question.key,'information0');
 assert.deepEqual(storyReading('The file was stored yesterday.',authority).events[0].scopes,['time_previous_day','time_before_speech']);
 for(const text of ['Nora saved the file yesterday tomorrow.','Nora saved the file and copied it yesterday.','All the programs saved the file yesterday.','Nora might need to save the file tomorrow.'])assert(storyReading(text,authority).unsupported,text);
 for(const text of ['Nora saved the file yesterday morning.','Nora saved yesterday.','Nora only saved the file yesterday.'])assert(!storyReading(text,authority)?.events,text);
});
