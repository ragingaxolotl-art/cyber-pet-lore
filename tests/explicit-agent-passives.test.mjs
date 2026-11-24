import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const save='CMP:58cfa479709294b9809be1b7',copy='CMP:9ea919967152aa85bc1c7169';
for(const runtime of [0,1,2])test('passives preserve actor, patient and ordered scope at runtime '+runtime,async()=>{
 const plan=storyReading('The file will not be copied by Nora. ['+runtime+']',authority);assert(plan?.events);
 const {midi}=await scoreStory(plan,authority);
 for(const bytes of [midi,expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms)]){
  const meaning=decodeStoryMidi(bytes,authority.atoms),event=meaning.events[0];
  assert.equal(event.predicate,copy);assert.deepEqual(event.arguments.map(a=>[a.role,a.entity]),[['actor',1],['target',0]]);
  assert.deepEqual(meaning.entities[0].identity.phonemes,['F','IH','L']);assert.deepEqual(meaning.entities[1].identity.phonemes,['N','AO','R','AE']);
  assert.deepEqual(event.scopes,['time_after_speech','negation']);assert.equal(meaning.runtime_state,runtime);
 }
});
test('neutral pronouns follow the preserved passive participants',async()=>{
 const plan=storyReading('The file was saved by Nora. They copied it.',authority);
 const meaning=decodeStoryMidi((await scoreStory(plan,authority)).midi,authority.atoms);
 assert.deepEqual(meaning.events.map(e=>e.predicate),[save,copy]);assert(meaning.events.every(e=>e.arguments[0].entity===1&&e.arguments[1].entity===0));
});
test('passive storage actions remain distinct from stored states and changing descriptions',()=>{
 assert.equal(storyReading('The file was stored.',authority).events[0].predicate,'DAT:000');
 assert.equal(storyReading('The file was stored by Nora.',authority).events[0].predicate,save);
 assert(storyReading('The stored file was deleted by Nora.',authority).unsupported);
 assert.equal(storyReading('The file has been saved by Nora.',authority),null);
 assert.equal(storyReading('All the files were saved by Nora.',authority),null);
});
test('ambiguous by-phrases and personally selected verbs remain explicit',()=>{
 const text='The file was saved by the river.',plan=storyReading(text,authority);assert.equal(plan.question.key,'passiveBy0');
 assert.equal(storyReading(text,authority,{answers:{passiveBy0:'other'}}),null);
 assert(storyReading(text,authority,{answers:{passiveBy0:'actor'}})?.events);
 const personal={word:'saved',forms:['saved'],root:'MIN:011',target:'MIN:011',quality:false,roles:'experiencer/target'};
 assert(storyReading('The file was saved by Nora.',authority,{preferences:[personal]}).unsupported);
});
