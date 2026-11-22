import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
import {storyWords} from '../site/translator/story_words.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const word=label=>storyWords.find(w=>w.word===label).id;
for(const runtime of [0,1,2])test('vendored physical vocabulary preserves complete meaning at runtime '+runtime,async()=>{
  const plan=storyReading('Nora will not drop the full box. ['+runtime+']',authority);
  assert(plan?.events);
  const {midi}=await scoreStory(plan,authority);
  for(const bytes of [midi,expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms)]){
    const heard=decodeStoryMidi(bytes,authority.atoms),event=heard.events[0];
    assert.equal(heard.runtime_state,runtime);assert.equal(event.predicate,word('drop'));
    assert.deepEqual(event.scopes,['time_after_speech','negation']);
    assert.deepEqual(event.arguments.map(a=>[a.role,a.entity,a.properties]),[['actor',0,[]],['target',1,[word('full')]]]);
  }
});
test('vendored physical words require a sense choice for abstract meanings',()=>{
  for(const text of ['Nora released the update.','Nora dropped the subject.','The price fell.','The promise is empty.','I am full.']){
    const plan=storyReading(text,authority);assert(plan?.question,text);
    assert.equal(storyReading(text,authority,{answers:{[plan.question.key]:'other'}}),null,text);
  }
});
