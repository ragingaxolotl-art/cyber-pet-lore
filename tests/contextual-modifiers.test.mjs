import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
function interpret(text){
 const answers={};
 for(let i=0;i<10;i++){
  const p=storyReading(text,authority,{answers});if(!p?.question)return p;
  assert(p.question.options.some(o=>o.value==='physical'));answers[p.question.key]='physical';
 }
 throw Error('Unresolved meaning');
}
for(const runtime of [0,1,2])test('physical noun modifiers retain intended scope and runtime '+runtime,async()=>{
 for(const norm of ['hot','cold','heavy','light','bright','dim','rough','smooth','wide','narrow']){
  const plan=interpret('Nora will not lift the '+norm+' board. ['+runtime+']');assert(plan?.events);
  const {midi}=await scoreStory(plan,authority);
  const heard=decodeStoryMidi(midi,authority.atoms);
  assert.equal(heard.events[0].predicate,'CMP:e1d0059daad4093d8a5ce05c');
  assert.deepEqual(heard.events[0].scopes,['time_after_speech','negation']);
  assert.deepEqual(heard.events[0].arguments.map(a=>[a.role,a.entity,a.properties]),[['actor',0,[]],['target',1,[{contextual_norm:norm}]]]);
  assert.equal(heard.runtime_state,runtime);assert.equal(heard.speech_act,'assertion');
  assert.deepEqual(decodeStoryMidi(expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms),authority.atoms),heard);
 }
});
test('modifiers bind separate placement roles and a later pronoun preserves identity',async()=>{
 const plan=interpret('The heavy robot placed the narrow box at the wide gate.');
 const heard=decodeStoryMidi((await scoreStory(plan,authority)).midi,authority.atoms);
 assert.equal(heard.events[0].predicate,'CMP:64574c1a25d72a89aafc46ef');
 assert.deepEqual(heard.events[0].arguments.map(a=>[a.role,a.entity,a.properties[0].contextual_norm]),[['actor',0,'heavy'],['target',1,'narrow'],['destination',2,'wide']]);
 const follow=interpret('Nora lifted the rough and wide board. Mira lowered it.');
 const followHeard=decodeStoryMidi((await scoreStory(follow,authority)).midi,authority.atoms);
 assert.deepEqual(followHeard.events[0].arguments[1].properties,[{contextual_norm:'rough'},{contextual_norm:'wide'}]);
 assert.equal(followHeard.events[1].arguments[1].entity,1);assert.deepEqual(followHeard.events[1].arguments[1].properties,[]);
});
test('physical dimensions are explicit and unsupported degree/complements stay unresolved',()=>{
 for(const text of ['The wide idea fell.','Nora lifted the light board.']){
  const question=storyReading(text,authority).question;assert(question);
  assert.equal(storyReading(text,authority,{answers:{[question.key]:'other'}}),null);
 }
 for(const text of ['Nora lifted the very wide board.','Nora lifted the wider board.','The board stayed wide.'])assert.equal(storyReading(text,authority),null);
});
