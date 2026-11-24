import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {scoreSongText} from '../site/translator/song_lines.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const save='CMP:58cfa479709294b9809be1b7';
for(const runtime of [0,1,2])test('information commitment and state remain distinct at runtime '+runtime,async()=>{
  for(const [text,predicate,scopes,roles,condition] of [
    ['Nora will not save the file.',save,['time_after_speech','negation'],['actor','target']],
    ['Nora stored the file.',save,['time_before_speech'],['actor','target']],
    ['The file was stored.','DAT:000',['time_before_speech'],['bearer']],
    ['Nora keeps the file stored.','CMP:cac584a394535e4912c75b5a',[],['cause','bearer'],'DAT:000'],
    ['The file stayed stored.','CMP:ec3a1fad0ed828279e948372',['time_before_speech'],['bearer'],'DAT:000']
  ]){
    const plan=storyReading(text+' ['+runtime+']',authority);assert(plan?.events,text);
    const {midi}=await scoreStory(plan,authority);
    for(const bytes of [midi,expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms)]){
      const heard=decodeStoryMidi(bytes,authority.atoms),event=heard.events[0];
      assert.equal(heard.runtime_state,runtime);assert.equal(event.predicate,predicate);assert.equal(event.condition,condition);
      assert.deepEqual(event.scopes,scopes);assert.deepEqual(event.arguments.map(a=>a.role),roles);assert.deepEqual(event.arguments.map(a=>a.entity),roles.map((_,i)=>i));
    }
  }
});
test('other storage meanings and unsupported complements remain unresolved',async()=>{
  for(const text of ['Nora saved the game.','The box is stored.']){
    const plan=storyReading(text,authority);assert(plan?.question,text);
    assert.equal(storyReading(text,authority,{answers:{[plan.question.key]:'other'}}),null);
  }
  for(const text of ['Nora saved the file to the folder.','Nora has saved the file.','The file has been saved by Nora.','Nora saved Nora.']){
    assert.equal(await scoreSongText(text,authority,()=>{throw Error('No unrelated fallback');}),null,text);
  }
});
test('removing retained information preserves its explicit before/after phase',async()=>{
  assert.equal(storyReading('Nora deleted the stored file.',authority).unsupported,true);
  const plan=storyReading('The file was stored before Nora deleted it.',authority);
  const {midi}=await scoreStory(plan,authority),heard=decodeStoryMidi(midi,authority.atoms);
  assert.deepEqual(heard.relations,[{kind:'before',events:[0,1]}]);assert.equal(heard.events[0].predicate,'DAT:000');
  assert.equal(heard.events[1].predicate,'erase_stored_object');assert.equal(heard.events[0].arguments[0].entity,heard.events[1].arguments[1].entity);
});
