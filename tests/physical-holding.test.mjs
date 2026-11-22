import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
for(const runtime of [0,1,2])test('holding reuses the exact foundation at runtime '+runtime,async()=>{
  for(const [text,scopes] of [['Nora will not hold the rope.',['time_after_speech','negation']],['Mira held the box.',['time_before_speech']]]){
    const plan=storyReading(text+' ['+runtime+']',authority);assert(plan?.events);
    const {midi}=await scoreStory(plan,authority);
    for(const bytes of [midi,expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms)]){
      const heard=decodeStoryMidi(bytes,authority.atoms);assert.equal(heard.runtime_state,runtime);
      assert.equal(heard.events[0].predicate,'CMP:834a56d90e31b430990720ff');assert.deepEqual(heard.events[0].scopes,scopes);
      assert.deepEqual(heard.events[0].arguments.map(a=>[a.role,a.entity]),[['actor',0],['target',1]]);
    }
  }
});
test('holding another kind of thing is not silently physical',()=>{
  for(const text of ['Nora holds Mira.','Nora holds an opinion.','Nora holds the box or the file.']){
    const plan=storyReading(text,authority);assert(plan?.question,text);
    assert.equal(storyReading(text,authority,{answers:{[plan.question.key]:'other'}}),null);
  }
});
