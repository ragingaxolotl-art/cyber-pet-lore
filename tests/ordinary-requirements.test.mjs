import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const a=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
async function hear(text,answers={},preferences=[]){
 const plan=storyReading(text,a,{answers,preferences});assert(plan?.events,JSON.stringify(plan));
 const {midi}=await scoreStory(plan,a),m=decodeStoryMidi(midi,a.atoms);
 assert.deepEqual(decodeStoryMidi(expandChordMidi(compactChordMidi(midi,a.atoms),a.atoms),a.atoms),m);
 return m;
}
for(const state of [0,1,2])test('duty/necessity preserve inner and outer negatives at runtime '+state,async()=>{
 for(const mode of ['obligated','necessary'])for(const [text,scopes] of [
  ['Nora must not open the hatch.',['modality_'+mode,'negation']],
  ['Nora does not have to open the hatch.',['negation','modality_'+mode]],
  ['Nora had to open the hatch.',['time_before_speech','modality_'+mode]]
 ]){
  const m=await hear(text+' ['+state+']',{requirement0:mode}),e=m.events[0];
  assert.equal(e.predicate,'CMP:0b0461b1975240868e0bed8d');assert.deepEqual(e.scopes,scopes);
  assert.deepEqual(e.arguments.map(v=>[v.role,v.entity]),[['cause',0],['bearer',1]]);assert.equal(m.runtime_state,state);
 }
});
test('requirement questions keep the selected mode while another meaning remains unresolved',async()=>{
 const text='Must Nora keep the file stored?';assert.equal(storyReading(text,a).question.key,'requirement0');
 const m=await hear(text,{requirement0:'obligated'});assert.equal(m.speech_act,'question');
 assert.equal(m.events[0].condition,'DAT:000');assert.deepEqual(m.events[0].scopes,['modality_obligated']);
 assert(storyReading(text,a,{answers:{requirement0:'other'}}).unsupported);
});
test('date and quantity choices retain the selected obligation',async()=>{
 for(const answer of ['event','claim']){
  const text='Nora must save the file tomorrow.';
  const p=storyReading(text,a,{answers:{requirement0:'obligated'}});assert.equal(p.question.key,'timeScope0');
  assert.equal(p.question.options[1].label,'When the obligation applies');
  const m=await hear(text,{requirement0:'obligated',timeScope0:answer});
  assert.deepEqual(m.events[0].scopes,answer==='event'?['modality_obligated','time_next_day']:['time_next_day','modality_obligated']);
 }
 const m=await hear('Every program does not have to save the file.',{requirement0:'obligated',quantityScope0:'not_all'});
 assert.equal(m.events[0].quantifier,'all');assert(m.events[0].negated_quantifier);assert.deepEqual(m.events[0].scopes,['modality_obligated']);
});
test('personal verb meanings and neutral references survive requirement sentences',async()=>{
 const preference={word:'notice',forms:['notice'],target:'MIN:011',root:'MIN:011',quality:false,roles:'experiencer/target'};
 const privateMeaning=await hear('Nora must notice the panel.',{requirement0:'obligated'},[preference]);
 assert.equal(privateMeaning.events[0].predicate,'MIN:011');assert.deepEqual(privateMeaning.events[0].scopes,['modality_obligated']);
 const m=await hear('Nora must save the file. They have to copy it.',{requirement0:'obligated',requirement1:'necessary'});
 assert.deepEqual(m.events[1].arguments.map(v=>v.entity),[0,1]);assert.deepEqual(m.events[1].scopes,['modality_necessary']);
});
test('unsupported requirement scope, complements and agreement remain unresolved',()=>{
 for(const text of ['Nora must have saved the file.','The file must be saved by Nora.','Nora must save the file and copy it.',
  'We has to save the file.','Every robot must make a box.','Nora might have to save the file tomorrow.']){
  assert(!storyReading(text,a,{answers:{requirement0:'obligated',timeScope0:'event'}})?.events,text);
 }
});
