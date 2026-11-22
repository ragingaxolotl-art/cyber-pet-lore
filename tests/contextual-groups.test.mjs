import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {composeSentenceSequence,composeSentenceConjunction,composeSentenceConditional,composeSentenceDisjunction} from '../site/translator/sentences.mjs';
import {midiFromFormal} from '../site/translator/engine.mjs';
import {decodeSupportedMeaningMidi} from '../site/translator/semantic_music_dispatch.mjs';
import {compactChordMidi,expandChordMidi} from '../site/translator/compact_chords.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
const load=async id=>JSON.parse(fs.readFileSync(new URL('../site/translator/'+authority.resolution_files[id],import.meta.url))).variants['assertion:1'];
const choices=[{interpretation:'width_standard',standard:{kind:'contextual',dimension:'physical_width'}},
 {interpretation:'thermal_standard',standard:{kind:'contextual',dimension:'thermodynamic_temperature'}}];
for(const [operator,compose,text] of [
 ['sequence',composeSentenceSequence,'The gate was not wide [0], then the board is hot [2].'],
 ['all_of',composeSentenceConjunction,'The gate was not wide [0] and the board is hot [2].'],
 ['conditional',composeSentenceConditional,'If the gate was not wide [0], then the board is hot [2].'],
 ['any_of',(t,l,c)=>composeSentenceDisjunction(t,l,c,{disjunction:'any_of'}),'The gate was not wide [0] or the board is hot [2].'],
 ['exactly_one',(t,l,c)=>composeSentenceDisjunction(t,l,c,{disjunction:'exactly_one'}),'The gate was not wide [0] or the board is hot [2].']
])test('vendored adjective groups independently recover '+operator,async()=>{
 const result=await compose(text,load,choices),midi=midiFromFormal(result.formal);
 const heard=decodeSupportedMeaningMidi(midi,authority.atoms);
 assert.equal(heard.operator,operator);assert.equal(heard.speech_act,'assertion');
 assert.deepEqual(heard.members.map(m=>m.standard.norm),['wide','hot']);
 assert.deepEqual(heard.members.map(m=>m.runtime_state),[0,2]);
 assert.deepEqual(heard.members[0].scopes,[{operator:'time',relation:'before_speech'},{operator:'negation'}]);
 assert.notDeepEqual(heard.members[0].bearer,heard.members[1].bearer);
 assert(!heard.members.some(m=>'speech_act' in m));
 assert.deepEqual(decodeSupportedMeaningMidi(expandChordMidi(compactChordMidi(midi,authority.atoms),authority.atoms),authority.atoms),heard);
});
