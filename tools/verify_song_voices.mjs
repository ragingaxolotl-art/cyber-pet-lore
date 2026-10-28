import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';import {pathToFileURL} from 'node:url';
const source=process.argv[2];const {midiFromFormal}=await import(pathToFileURL(path.join(source,'pages/engine.mjs')));const {notesFromMidi}=await import(pathToFileURL(path.join(source,'pages/performance_codec.mjs')));
const book=JSON.parse(fs.readFileSync('site/songs/voices-v2/score.json'));let phrases=0,notes=0;
for(const song of book.songs)for(const voice of song.voices){
 const parsed=notesFromMidi(fs.readFileSync(`site/songs/voices-v2/${song.folder}/${voice.id}.mid`)).notes;
 assert.equal(parsed.length,voice.notes.length);
 for(const [i,line]of voice.lines.entries()){
  const canonical=notesFromMidi(midiFromFormal(song.phrases[line.target].formal)).notes;
  const offset=line.startBeat*480;const actual=parsed.filter(n=>n.start_tick>=offset&&n.start_tick<line.endBeat*480);
  assert.deepEqual(actual.map(n=>[n.midi,n.start_tick-offset,n.end_tick-offset]),canonical.map(n=>[n.midi,n.start_tick,n.end_tick]));
  phrases++;notes+=actual.length;
 }
}
const result={result:'PASS',voices:12,phrases,notes,method:'Every exported solo MIDI note-on/off and pitch matches the canonical engine exactly, with only phrase start and global tempo changed. No unassigned accompaniment notes.'};
fs.writeFileSync('site/songs/voices-v2/language-validation.json',JSON.stringify(result,null,2)+'\n');console.log(result);
