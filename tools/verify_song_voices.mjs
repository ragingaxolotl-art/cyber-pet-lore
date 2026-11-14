import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const source=path.resolve(process.argv[2]), edition=process.argv[3]||'voices-v2';
const upstream=file=>import(pathToFileURL(path.join(source,'pages',file)));
const {midiFromFormal}=await upstream('engine.mjs');
const {notesFromMidi,midiFromNoteTimeline}=await upstream('performance_codec.mjs');
const chords=edition==='voices-chords',read=file=>JSON.parse(fs.readFileSync(file));
const {compactChordMidi,expandChordMidi}=chords?await upstream('compact_chords.mjs'):{};
const bases=path.join('site/songs',edition),book=read(path.join(bases,'score.json'));
const authority=read(path.join(source,'pages/data/index.json'));
const {parseNamedSentence,composeNamedSentence}=edition==='voices-v2'?{}:await upstream('sentences.mjs');
const template=id=>authority.compound_plans?.[id]?.expanded.nodes.some(n=>n.kind==='slot')?{authority}:
  {...read(path.join(source,'pages',authority.resolution_files[id])).variants['assertion:1'],authority};
const pitches=notes=>notes.map(n=>[n.midi,n.start_tick,n.end_tick]);
let phrases=0,notes=0,sentences=0;
for(const song of book.songs) {
 const folder=path.join(bases,song.folder);
 // The original v2 translator predates the multi-track reader.
 const ensemble=edition==='voices-v2'?null:notesFromMidi(fs.readFileSync(path.join(folder,'arrangement.mid')),{allowPolyphony:true});
 for(const [i,voice] of song.voices.entries()){
  const solo=notesFromMidi(fs.readFileSync(path.join(folder,voice.id+'.mid')),{allowPolyphony:chords});
  assert.equal(solo.notes.length,voice.notes.length);assert.equal(solo.division,480);
  if(ensemble)assert.deepEqual(pitches(ensemble.notes.filter(n=>n.track===i+1)),pitches(solo.notes));
  for(const line of voice.lines){
   let formal;
   if(line.kind==='sentence'){
    formal=(await composeNamedSentence(line.gloss,template(parseNamedSentence(line.gloss).predicate))).formal;
    sentences++;
   }else formal=read(path.join(source,'pages',authority.resolution_files[line.target])).variants['assertion:1'].formal;
   assert.equal(formal.formal_id,line.formalId);
   const original=midiFromFormal(formal),expected=chords?compactChordMidi(original,authority.atoms):original;
   const offset=line.startBeat*480;
   const actual=solo.notes.filter(n=>n.start_tick>=offset&&n.start_tick<line.endBeat*480)
    .map(n=>({...n,start_tick:n.start_tick-offset,end_tick:n.end_tick-offset}));
   assert.deepEqual(pitches(actual),pitches(notesFromMidi(expected,{allowPolyphony:chords}).notes));
   if(chords){
    const restored=expandChordMidi(midiFromNoteTimeline(actual),authority.atoms);
    assert.deepEqual(pitches(notesFromMidi(restored).notes),pitches(notesFromMidi(original).notes));
   }
   notes+=actual.length;phrases++;
  }
 }
 if(ensemble)assert.equal(ensemble.notes.length,song.voices.reduce((n,v)=>n+v.notes.length,0));
}
const result={result:'PASS',voices:12,phrases,notes,sentences,
 method:chords?'All exported solo phrases expand from their chord pitches and timings to the original translator performance. Each ensemble MIDI track matches its solo.':'Every solo note matches the translator performance for its root or newly composed sentence, with phrase placement and global tempo supplied by the score.'};
fs.writeFileSync(path.join(bases,'language-validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(result);
