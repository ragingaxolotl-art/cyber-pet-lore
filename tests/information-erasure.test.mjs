import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
for(const runtime of [0,1,2])test('vendored erasure preserves reference and scope at runtime '+runtime,async()=>{
  const plan=storyReading('If Nora finds the file, Mira will not delete it. ['+runtime+']',authority);
  assert(plan?.events);
  const {midi}=await scoreStory(plan,authority);
  for(const bytes of [midi,expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms)]){
    const heard=decodeStoryMidi(bytes,authority.atoms),event=heard.events[1];
    assert.equal(heard.runtime_state,runtime);assert.equal(event.predicate,'erase_stored_object');
    assert.deepEqual(event.scopes,['time_after_speech','negation']);
    assert.deepEqual(event.arguments.map(a=>[a.role,a.entity]),[['actor',2],['target',1]]);
    assert.deepEqual(heard.relations,[{kind:'condition',events:[0,1]}]);
  }
});
test('vendored deletion asks before treating an ambiguous target as stored information',()=>{
  for(const text of ['Nora deleted Mira.','Nora deleted the file or the child.']){
    const plan=storyReading(text,authority);assert(plan?.question,text);
    assert.equal(storyReading(text,authority,{answers:{[plan.question.key]:'other'}}),null,text);
  }
});
