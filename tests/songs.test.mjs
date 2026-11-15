import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import test from 'node:test';
const html=fs.readFileSync(new URL('../site/songs/index.html',import.meta.url),'utf8'),code=fs.readFileSync(new URL('../site/songs/choir-player.js',import.meta.url),'utf8');
class Element{
 constructor(){this.value='0';this.children=[];this.handlers={};this.currentTime=0;this.duration=200;this.paused=true;this.hidden=false;this.dataset={};this.classList={toggle(){}};}
 append(...x){this.children.push(...x)}replaceChildren(...x){this.children=[...x]}setAttribute(){}
 addEventListener(k,fn,opts={}){(this.handlers[k]??=[]).push({fn,once:opts.once})}
 fire(k){const handlers=this.handlers[k]||[];this.handlers[k]=handlers.filter(h=>!h.once);for(const h of handlers)h.fn()}
 load(){this.currentTime=0}pause(){this.paused=true}play(){this.paused=false;return Promise.resolve()}
}
function setup(hash='',search=''){
 const nodes=new Map();for(const m of html.matchAll(/id="([^"]+)"/g))nodes.set(m[1],new Element());nodes.get('song-data').textContent=html.match(/<script id="song-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
 nodes.get('earlier-song-data').textContent=html.match(/<script id="earlier-song-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
 nodes.get('melody-song-data').textContent=html.match(/<script id="melody-song-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
 const document={getElementById:id=>nodes.get(id),createElement:()=>new Element()};
 vm.runInNewContext(code,{document,URLSearchParams,location:{hash,search},history:{replaceState(){}},window:{addEventListener(){}}});return nodes;
}
const data=JSON.parse(html.match(/<script id="song-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
test('all 168 phrases show the correct simultaneous voice meanings and playable solo links',()=>{
 const n=setup();assert.equal(n.get('song').children.length,4);assert.equal(data.reduce((sum,s)=>sum+s.voices.reduce((n,v)=>n+v.lines.length,0),0),168);
});
test('each track, each voice and every phrase remain independently inspectable',()=>{
 const n=setup();
 for(let i=0;i<data.length;i++){
  n.get('song').value=String(i);n.get('song').fire('change');n.get('player').fire('loadedmetadata');
  assert.equal(n.get('title').textContent,data[i].title);assert.equal(n.get('voices').children.length,3);assert.equal(n.get('transcript').children.length,42);
  assert.equal(n.get('mode').children.length,4);
  for(const [v,voice] of data[i].voices.entries())for(const line of voice.lines){
   n.get('player').currentTime=line.start+.1;n.get('player').fire('timeupdate');const card=n.get('voices').children[v];assert.equal(card.children[2].textContent,line.kind==='sentence'?line.gloss:line.carrier);assert.equal(card.children[3].textContent,line.kind==='sentence'?'':line.gloss);
  }
  assert.equal(n.get('story-link').href,'../#read='+data[i].story);
 }
});
test('solo switching preserves time and marks other voices as unheard',()=>{
 const n=setup();n.get('player').fire('loadedmetadata');n.get('player').currentTime=20;n.get('mode').value='voice-2';n.get('mode').fire('change');n.get('player').fire('loadedmetadata');
 assert.equal(n.get('player').currentTime,20);assert.ok(n.get('player').src.endsWith('voice-2.m4a'));assert.equal(n.get('voices').children[0].dataset.silent,'true');assert.equal(n.get('voices').children[1].dataset.silent,'false');assert.equal(n.get('solo-download').hidden,false);
});
test('deep links select a song and transcript seeking selects its voice',()=>{
 const n=setup('#song=04_room_to_restore');assert.equal(n.get('title').textContent,'Room to Restore');
 n.get('transcript').children[1].children[0].fire('click');n.get('player').fire('loadedmetadata');assert.equal(n.get('mode').value,'voice-2');assert.equal(n.get('player').currentTime,data[3].voices[1].lines[0].start);
});
test('all choir assets and canonical validation reports are present',()=>{
 const base=new URL('../site/songs/voices-chords/',import.meta.url);
 for(const s of data)for(const file of ['song.m4a','voice-1.m4a','voice-2.m4a','voice-3.m4a','arrangement.mid','voice-1.mid','voice-2.mid','voice-3.mid','meanings.txt'])assert.ok(fs.statSync(new URL(s.folder+'/'+file,base)).size>0);
 const language=JSON.parse(fs.readFileSync(new URL('language-validation.json',base)));assert.equal(language.result,'PASS');assert.equal(language.phrases,168);assert.equal(language.notes,2760);
 const audio=JSON.parse(fs.readFileSync(new URL('audio-validation.json',base)));assert.equal(audio.result,'PASS');assert.equal(audio.checks.length,12);assert.ok(audio.checks.every(c=>c.maxPitchErrorCents<8&&!c.unassignedAudio&&!c.clipping));
});
test('displayed voice meanings exactly match the verified composition score',()=>{
 const book=JSON.parse(fs.readFileSync(new URL('../site/songs/voices-chords/score.json',import.meta.url)));
 for(const song of data){const score=book.songs.find(s=>s.folder===song.folder);assert.ok(score);assert.equal(song.voices.length,score.voices.length);song.voices.forEach((v,i)=>{assert.equal(v.name,score.voices[i].name);assert.deepEqual(v.lines,score.voices[i].lines);});}
});

test('every old refrain survives the remake and the earlier edition still plays',()=>{
 const old=JSON.parse(fs.readFileSync(new URL('../site/songs/voices-v2/score.json',import.meta.url)));
 for(const [i,song] of data.entries()) {
  const oldPlayer=setup('#song='+song.folder,'?edition=2');
  assert.ok(oldPlayer.get('player').src.includes('voices-v2/'+song.folder+'/song.m4a'));
  assert.equal(oldPlayer.get('transcript').children.length,36);
  const n=setup('#song='+song.folder);
  assert.ok(n.get('player').src.includes('voices-chords/'+song.folder+'/song.m4a'));
  n.get('arrangement').value='3';n.get('arrangement').fire('change');
  assert.ok(n.get('player').src.includes('voices-v3/'+song.folder+'/song.m4a'));
  assert.equal(n.get('transcript').children.length,42);
  const melody=setup('#song='+song.folder,'?edition=3');assert.equal(melody.get('title').textContent,song.title);
  assert.ok(melody.get('player').src.includes('voices-v3/'+song.folder+'/song.m4a'));
  for(const [j,v] of song.voices.entries()) {
   assert.deepEqual(v.lines.filter(l=>l.kind==='refrain').map(l=>l.formalId),old.songs[i].voices[j].lines.map(l=>l.formalId));
   assert.equal(v.lines.filter(l=>l.kind==='sentence').length,2);
  }
 }
});
