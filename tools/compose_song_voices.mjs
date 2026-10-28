// Rebuild three semantic voices from the read-only canonical translator.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const source=process.argv[2];if(!source)throw Error('Pass the canonical translator directory.');
const {midiFromFormal}=await import(pathToFileURL(path.join(source,'pages/engine.mjs')));
const {notesFromMidi}=await import(pathToFileURL(path.join(source,'pages/performance_codec.mjs')));
const indexBytes=fs.readFileSync(path.join(source,'pages/data/index.json')),index=JSON.parse(indexBytes);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const specs=[
 ['01_care_in_the_quiet','Care in the Quiet',86,['Sova','The answering neighbor','A fellow garden caretaker'],[['LIF:211','LIF:210','CON:220','LIF:200','LIF:211','CON:211'],['CON:111','LIF:200','CON:201','LIF:210','CON:221','LIF:211'],['CON:020','MIN:200','LIF:220','CON:220','LIF:200','CON:210']]],
 ['02_paths_that_meet','Paths That Meet',112,['Neral','The arriving traveler','The waiting traveler'],[['MOV:100','MOV:011','MOV:121','MOV:110','CON:110','CON:220'],['MOV:110','CON:111','MOV:001','CON:201','MOV:211','CON:221'],['MOV:200','MOV:012','CON:201','MOV:220','CON:210','MOV:020']]],
 ['03_a_shared_question','A Shared Question',100,['Pelli','The first classmate','The second classmate'],[['MIN:201','MIN:211','MIN:111','CON:100','MIN:221','CON:110'],['CON:111','MIN:201','MIN:210','CON:101','MIN:220','CON:221'],['CON:020','MIN:200','MIN:020','CON:220','MIN:220','CON:210']]],
 ['04_room_to_restore','Room to Restore',76,['Keshet','The resting visitor','Sova'],[['REP:200','REP:101','REP:211','REP:110','LIF:200','LIF:210'],['REP:201','CON:111','MIN:201','LIF:200','CON:201','CON:110'],['LIF:211','CON:020','REP:210','LIF:210','CON:220','LIF:200']]]
];
const songbook={format:'ERA-ZERO-SEMANTIC-CHOIR-2',sourceIndexSha256:sha(indexBytes),note:'Every musical line is a sequence of canonical assertions, state 1. Concurrent voices are separate statements, not a newly approved polyphonic grammar. Voice timbre and stereo placement are presentation only.',songs:[]};
for(const [folder,title,bpm,names,roots] of specs){
 const phrases={};
 for(const target of new Set(roots.flat())){
  const bytes=fs.readFileSync(path.join(source,'pages',index.resolution_files[target]));
  const resolved=JSON.parse(bytes).variants['assertion:1'];if(resolved.status!=='resolved'||!resolved.round_trip_equal)throw Error(target);
  const formal=resolved.formal,sense=index.senses.find(s=>s.target_id===target&&s.sense_key==='canonical_atom_label');
  const notes=notesFromMidi(midiFromFormal(formal)).notes.map(n=>({note:n.midi,beat:n.start_tick/480,length:(n.end_tick-n.start_tick)/480}));
  phrases[target]={target,gloss:sense.lemma,definition:sense.definition,carrier:formal.performance.lexical_events[0].formal_carrier,formal,sourceSha256:sha(bytes),notes};
 }
 const voices=roots.map((six,i)=>{
  const order=[...six,six[0],six[2],six[1],six[4],six[5],six[0]],lines=[],notes=[];
  for(const [j,target] of order.entries()){
   const startBeat=j*12+i*4,phrase=phrases[target];const endBeat=startBeat+Math.max(...phrase.notes.map(n=>n.beat+n.length));
   if(endBeat>startBeat+12)throw Error('Overlapping phrases in a voice');
   lines.push({start:startBeat*60/bpm,end:endBeat*60/bpm,startBeat,endBeat,target,carrier:phrase.carrier,gloss:phrase.gloss,definition:phrase.definition,formalId:phrase.formal.formal_id});
   for(const n of phrase.notes)notes.push({...n,beat:n.beat+startBeat,target,phrase:j});
  }
  return{id:'voice-'+(i+1),name:names[i],timbre:['rounded','bright','resonant'][i],pan:[-.48,.48,0][i],lines,notes};
 });
 const seconds=Math.max(...voices.flatMap(v=>v.lines.map(l=>l.end)))+.5;
 songbook.songs.push({folder,title,bpm,seconds,phrases,voices});
}
fs.mkdirSync('site/songs/voices-v2',{recursive:true});
fs.writeFileSync('site/songs/voices-v2/score.json',JSON.stringify(songbook,null,2)+'\n');
console.log('Composed 4 songs × 3 voices × 12 complete canonical assertions.');
