import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

const source = path.resolve(process.argv[2]);
const upstream = name => import(pathToFileURL(path.join(source, 'pages', name)));
const {parseNamedSentence, composeNamedSentence} = await upstream('sentences.mjs');
const {midiFromFormal} = await upstream('engine.mjs');
const {notesFromMidi} = await upstream('performance_codec.mjs');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const authority = read(path.join(source, 'pages/data/index.json'));
const book = read('site/songs/voices-v2/score.json');
const verses = read('sources/song-sentence-verses.json');
const chords = process.argv[3] === '--chords';
const edition = 'site/songs/'+(chords?'voices-chords':'voices-v3');
const spacing = chords ? 2 : 4;
const {compactChordMidi} = chords ? await upstream('compact_chords.mjs') : {};
function performedNotes(formal) {
  const melody=midiFromFormal(formal);
  const {notes,division}=notesFromMidi(chords?compactChordMidi(melody,authority.atoms):melody,{allowPolyphony:chords});
  return notes.map(n=>({note:n.midi,beat:n.start_tick/division,length:(n.end_tick-n.start_tick)/division}));
}

async function sentence(line, definition) {
  const parsed = parseNamedSentence(line);
  if (!parsed) throw Error('Unscored lyric: '+line);
  const target = parsed.predicate;
  const hasSlots = authority.compound_plans[target]?.expanded.nodes.some(n => n.kind === 'slot');
  const template = hasSlots ? {} : read(path.join(source, 'pages', authority.resolution_files[target])).variants['assertion:1'];
  const result = await composeNamedSentence(line, {...template, authority});
  if (result.surface_fidelity !== 'complete_construction') throw Error('Incomplete lyric: '+line);
  return {target, kind:'sentence', gloss:line, definition, carrier:'Sentence', formal:result.formal,
    notes:performedNotes(result.formal)};
}

for (const song of book.songs) {
  if(chords) for(const phrase of Object.values(song.phrases))phrase.notes=performedNotes(phrase.formal);
  const original = song.voices.map(voice => voice.lines);
  for (const voice of song.voices) { voice.notes=[]; voice.lines=[]; }
  const stanzas = verses[song.folder];
  const stage = (voiceIndex, key, startBeat) => {
    const voice = song.voices[voiceIndex], phrase = song.phrases[key];
    const phraseIndex = voice.lines.length, endBeat = startBeat+phrase.notes.at(-1).beat+phrase.notes.at(-1).length;
    const {target, carrier, gloss, definition, formal} = phrase;
    voice.lines.push({start:startBeat*60/song.bpm, end:endBeat*60/song.bpm, startBeat, endBeat, target,
      carrier, gloss, definition, formalId:formal.formal_id, phraseKey:key, kind:phrase.kind||'refrain'});
    for (const n of phrase.notes) voice.notes.push({...n, beat:startBeat+n.beat, target, phrase:phraseIndex});
    return endBeat;
  };
  let beat=0;
  for (let bar=0; bar<original[0].length; bar++) {
    const stanza=stanzas.find(s => s.beforeRefrain===bar);
    if (stanza) {
      // Clear the last staggered refrain, then bring each voice back in on its own beat.
      beat=Math.ceil(Math.max(beat,...song.voices.map(v=>v.lines.at(-1)?.endBeat||0))/spacing)*spacing;
      const ends=[];
      for (const [i,[line,definition]] of stanza.lines.entries()) {
        const key='verse-'+bar+'-'+(i+1);
        song.phrases[key]=await sentence(line,definition);
        ends.push(stage(i,key,beat+i*spacing));
      }
      beat=Math.ceil((Math.max(...ends)+2)/spacing)*spacing;
    }
    for (const [i,lines] of original.entries()) stage(i,lines[bar].target,beat+i*spacing);
    beat+=3*spacing;
  }
  song.seconds=Math.max(...song.voices.map(v=>v.lines.at(-1).end))+.5;
}
book.format=chords?'ERA-ZERO-SEMANTIC-CHOIR-3-CHORDS':'ERA-ZERO-SEMANTIC-CHOIR-3';
book.translatorRevision=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
book.note='Two sentence verses are woven into each three-voice score. Each singer performs an independent line in active runtime. Original refrains retain their pitches, lengths and order.';
if(chords)book.note='Compact chord performance. Each root has a three-note family chord, a three-note address chord and a moving upper ending. Sentence grammar, names and contours retain their note order. Each singer has an independent part.';
fs.mkdirSync(edition,{recursive:true});
fs.writeFileSync(path.join(edition,'score.json'),JSON.stringify(book)+'\n');
console.log(book.songs.map(s=>s.title+' · '+Math.round(s.seconds)+'s').join('\n'));
