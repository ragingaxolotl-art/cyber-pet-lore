import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
import {storyWords} from '../site/translator/story_words.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const word=label=>storyWords.find(w=>w.word===label).id;
for(const runtime of [0,1,2])test('vendored copy and recall retain meaning at runtime '+runtime,async()=>{
  for(const [text,verb,scopes,answers,roles] of [
    ['Nora will not copy the file.','copy',['time_after_speech','negation'],{},['actor','target']],
    ['Nora remembered Mira.','recall',['time_before_speech'],{retrieval0:'retrieval'},['experiencer','target']]
  ]){
    const plan=storyReading(text+' ['+runtime+']',authority,{answers});assert(plan?.events);
    const {midi}=await scoreStory(plan,authority);
    for(const bytes of [midi,expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms)]){
      const heard=decodeStoryMidi(bytes,authority.atoms),event=heard.events[0];
      assert.equal(heard.runtime_state,runtime);assert.equal(event.predicate,word(verb));
      assert.deepEqual(event.scopes,scopes);assert.deepEqual(event.arguments.map(a=>a.role),roles);
      assert.deepEqual(event.arguments.map(a=>a.entity),[0,1]);
    }
  }
});
test('vendored information meanings do not silently replace another sense',()=>{
  for(const text of ['Nora copied Mira.','Nora remembers Mira.','Nora recalled the message.']){
    const plan=storyReading(text,authority);assert(plan?.question,text);
    assert.equal(storyReading(text,authority,{answers:{[plan.question.key]:'other'}}),null,text);
  }
});
