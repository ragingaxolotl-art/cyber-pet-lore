import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {matchesSound,pauseOthers} from '../site/sounds/sounds.mjs';
const root=new URL('../site/sounds/',import.meta.url);
const data=JSON.parse(fs.readFileSync(new URL('catalog.json',root),'utf8'));
const page=fs.readFileSync(new URL('index.html',root),'utf8');
test('audio library preserves complete inventory and verified public audio',()=>{
  assert.equal(data.entries.filter(e=>e.kind==='music').length,42);
  assert.equal(data.entries.filter(e=>e.kind==='ambience').length,14);
  assert.equal(data.entries.filter(e=>e.kind==='footstep').length,12);
  assert.equal(data.entries.flatMap(e=>e.clips).length,320);
  assert.equal(data.entries.filter(e=>e.new).flatMap(e=>e.clips).length,149);
  assert.equal(new Set(data.entries.map(e=>e.id)).size,241);
  const sources=new Set();
  for(const entry of data.entries){
    assert(page.includes(`id="${entry.id}"`));
    for(const clip of entry.clips){
      assert.match(clip.src,/^(audio\/[a-z0-9_]+\.(ogg|mp3|wav)|\.\.\/songs\/voices-chords\/[a-z0-9_]+\/song\.m4a)$/);
      assert(!sources.has(clip.src));sources.add(clip.src);
      const bytes=fs.readFileSync(new URL(clip.src,root));
      assert.equal(bytes.length,clip.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);
    }
  }
});
test('all 106 locations have valid independently categorized music ambience and floors',()=>{
  assert.equal(data.locations.length,106);
  assert.equal(new Set(data.locations.map(l=>l.id)).size,106);
  const entries=new Map(data.entries.map(e=>[e.id,e]));
  for(const l of data.locations){
    for(const id of [l.music,'amb_'+l.ambience_tag,'step_'+l.floor_tag]){
      assert(entries.has(id),`${l.name}: ${id}`);
      assert(entries.get(id).locations.includes(l.id));
    }
    assert(page.includes(`id="location-${l.atlas_id}"`));
  }
  assert(data.locations.some(l=>l.floor_tag!==l.ambience_tag));
});
test('filter combines category, collection and all search words',()=>{
 const e={kind:'footstep',new:true,search:'Snow Atlas 45 Frozen shore'};
 assert(matchesSound(e,{query:'FROZEN snow',kind:'footstep',collection:'new'}));
 assert(!matchesSound(e,{query:'mud'}));assert(!matchesSound(e,{kind:'music'}));
 assert(!matchesSound(e,{collection:'existing'}));assert(matchesSound(e));
});
test('starting one clip pauses every other clip',()=>{
 const players=Array.from({length:3},()=>({paused:false,pause(){this.paused=true;}}));
 pauseOthers(players,players[1]);assert.deepEqual(players.map(p=>p.paused),[true,false,true]);
 pauseOthers(players);assert(players.every(p=>p.paused));
});
test('all clips have explicit native playback and do not preload or autoplay',()=>{
 const audios=page.match(/<audio\b[^>]*>/g);assert.equal(audios.length,320);
 for(const audio of audios){assert.match(audio,/controls/);assert.match(audio,/preload="none"/);assert.match(audio,/aria-label=/);assert(!audio.includes('autoplay'));}
 assert(page.includes('href="locations.csv"'));assert(page.includes('id="sound-empty" hidden'));
 assert(fs.readFileSync(new URL('../site/index.html',import.meta.url),'utf8').includes('sounds/index.html'));
});
