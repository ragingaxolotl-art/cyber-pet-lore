import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseNamedSentence,composeNamedSentence} from '../site/translator/sentences.mjs';
import {midiFromFormal} from '../site/translator/engine.mjs';
import {decodeContextualStandardMidi} from '../site/translator/contextual_standard_decoder.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
import {analyzeEnglish} from '../site/translator/english.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
for(const runtime of [0,1,2])test('contextual width keeps its bearer, norm and scopes at runtime '+runtime,async()=>{
 for(const norm of ['wide','narrow']){
  const text=`The board was not ${norm}. [${runtime}]`,parsed=parseNamedSentence(text);
  assert.equal(parsed.requiredInterpretation,'width_standard');
  const template=JSON.parse(fs.readFileSync(new URL('../site/translator/'+authority.resolution_files[parsed.predicate],import.meta.url))).variants['assertion:1'];
  const result=await composeNamedSentence(text,template,{interpretation:'width_standard',standard:{kind:'contextual',dimension:'physical_width'}});
  const midi=midiFromFormal(result.formal);
  for(const bytes of [midi,expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms)]){
   const heard=decodeContextualStandardMidi(bytes,authority.atoms);
   assert.equal(heard.standard.norm,norm);assert.equal(heard.dimension,'physical_width');assert.equal(heard.runtime_state,runtime);
   assert.deepEqual(heard.scopes,[{operator:'time',relation:'before_speech'},{operator:'negation'}]);
   assert(heard.bearer.phonemes.length>0);
  }
 }
});
test('width routes are descriptive grammar with explicit interpretation',()=>{
 for(const word of ['wide','narrow']){
  const reading=analyzeEnglish(word,authority);assert.equal(reading.decision.auto_resolution_allowed,false);
  const sense=authority.senses.find(s=>s.lemma===word&&s.sense_key==='contextual_physical_width_'+word);
  assert.equal(sense.route,'semantic_ir');assert.equal(sense.target_id,undefined);
 }
 for(const text of ['The board is wider.','The board is very wide.','The wide board fell.'])assert.equal(parseNamedSentence(text),null,text);
});
