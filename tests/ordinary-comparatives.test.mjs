import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {composeNamedSentence,parseNamedSentence,composeSentenceConjunction} from '../site/translator/sentences.mjs';
import {midiFromFormal} from '../site/translator/engine.mjs';
import {decodeSupportedMeaningMidi} from '../site/translator/semantic_music_dispatch.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
import {everydayMeaning} from '../site/translator/everyday.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const load=async id=>({...JSON.parse(fs.readFileSync(new URL('../site/translator/'+authority.resolution_files[id],import.meta.url))).variants['assertion:1'],authority});
for(const runtime of [0,1,2])test('comparatives preserve physical direction, roles, time and runtime '+runtime,async()=>{
 for(const [word,dimension,relation,interpretation] of [['hotter','thermodynamic_temperature','greater_than','temperature_comparison'],['colder','thermodynamic_temperature','less_than','temperature_comparison'],['heavier','mass','greater_than','mass_comparison'],['lighter','mass','less_than','mass_comparison']]){
  const text=`Nora was not ${word} than Mira. [${runtime}]`,template=await load(parseNamedSentence(text).predicate);
  await assert.rejects(()=>composeNamedSentence(text,template));
  const result=await composeNamedSentence(text,template,{interpretation}),midi=midiFromFormal(result.formal);
  for(const bytes of [midi,expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms)]){
   const meaning=decodeSupportedMeaningMidi(bytes,authority.atoms);assert.equal(meaning.dimension,dimension);assert.equal(meaning.relation,relation);
   assert.equal(meaning.runtime_state,runtime);assert.deepEqual(meaning.scopes,[{operator:'time',relation:'before_speech'},{operator:'negation'}]);
   assert.deepEqual(meaning.participants.bearer.phonemes,['N','AO','R','AE']);assert.deepEqual(meaning.participants.comparison_standard.phonemes,['M','ER','AE']);
  }
 }
});
test('a comparative can share a whole song line with an existing state',async()=>{
 const result=await composeSentenceConjunction('The cup is hotter than the plate [0] and Nora is conscious [2].',load,[{interpretation:'temperature_comparison'},{}]);
 const bytes=midiFromFormal(result.formal),meaning=decodeSupportedMeaningMidi(bytes,authority.atoms);
 assert.equal(meaning.operator,'all_of');assert.equal(meaning.members[0].relation,'greater_than');assert.equal(meaning.members[1].predicate,'LIF:011');
 assert.deepEqual(meaning.members.map(m=>m.runtime_state),[0,2]);assert(!meaning.members.some(m=>'speech_act' in m));
 assert.deepEqual(decodeSupportedMeaningMidi(expandChordMidi(compactChordMidi(bytes,authority.atoms),authority.atoms),authority.atoms),meaning);
});
test('new structural adjective routes have concise discovery labels and bounded grammar',()=>{
 assert.equal(authority.atoms.length,324);assert.equal(authority.compounds.length,124);
 for(const word of ['hotter','colder','heavier','lighter']){
  const sense=authority.senses.find(s=>s.lemma===word&&s.part_of_speech==='adjective');assert(sense);
  assert.equal(sense.route,'semantic_ir');assert.equal(sense.target_id,undefined);assert.notEqual(everydayMeaning(authority,sense),sense.definition);
 }
 for(const text of ['The cup is hotter.','The cup is much lighter than the plate.','The cup is heavier than the plate by two kilograms.'])assert.equal(parseNamedSentence(text),null);
});
