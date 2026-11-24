import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory,decodeStoryMidi} from '../site/translator/story_music.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const a=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
for(const state of [0,1,2])test('every/no/not every preserve class scope and runtime '+state,async()=>{
 for(const [prefix,q,negative] of [['Every','all',false],['No','none',false],['Not every','all',true]]){
  const {midi}=await scoreStory(storyReading(prefix+' worker waited. ['+state+']',a),a),m=decodeStoryMidi(midi,a.atoms),e=m.events[0];
  assert.equal(e.predicate,'CMP:e17374fbc08546afa196b2cd');assert.equal(e.quantifier,q);assert.equal(e.negated_quantifier,negative);
  assert.deepEqual(e.scopes,['time_before_speech']);assert.equal(m.runtime_state,state);
  assert.equal(m.entities[0].identity.reference_mode,'nominal_class');assert.deepEqual(m.entities[0].identity.phonemes,['W','AO','R','K','ER']);
  assert.deepEqual(decodeStoryMidi(expandChordMidi(compactChordMidi(midi,a.atoms),a.atoms),a.atoms),m);
 }
});
test('negative quantity choice preserves both supported scopes and another meaning',async()=>{
 const text='Every program cannot save the file.';assert.equal(storyReading(text,a).question.key,'quantityScope0');
 for(const [choice,scopes,negative] of [['each',['negation','ability'],false],['not_all',['ability'],true]]){
  const {midi}=await scoreStory(storyReading(text,a,{answers:{quantityScope0:choice}}),a),m=decodeStoryMidi(midi,a.atoms);
  assert.deepEqual(m.events[0].scopes,scopes);assert.equal(m.events[0].negated_quantifier,negative);
 }
 assert(storyReading(text,a,{answers:{quantityScope0:'other'}}).unsupported);
});
test('names and questions keep their meaning while unsupported restricted groups remain unresolved',()=>{
 for(const text of ['Every saved the file yesterday.','Yesterday, Every saved the file.','Today, Each saved the file.']){
  const p=storyReading(text,a);assert(p?.events);assert.equal(p.events[0].quantifier,null);assert.equal(p.entities[0].plural,false);
 }
 const question=storyReading('Did every worker wait?',a);assert.equal(question.act,'question');assert(!question.notes.includes('Every member performed this action.'));
 for(const text of ['Every tired worker waited.','Every workers waited.','Every worker waited and returned.','Every file was stored today.'])assert(storyReading(text,a).unsupported,text);
});
test('quantified indefinite items do not silently become one shared reference',()=>{
 for(const text of ['Every robot made a box.','No worker copied a file.','Not every robot put the box at a gate.','Every robot copied files.'])assert(storyReading(text,a).unsupported,text);
 assert(storyReading('Every worker noticed.',a,{answers:{object0:'new:a signal'}}).unsupported);
 assert(storyReading('Every worker noticed.',a,{answers:{object0:'new:the signal'}})?.events);
});
