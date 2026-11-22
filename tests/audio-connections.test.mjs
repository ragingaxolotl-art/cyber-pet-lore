import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {audioForContext,renderAudioCards,clearAudioConnections} from '../site/audio-connections.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const audio=read('site/sounds/catalog.json'),links=read('site/sounds/connections.json'),wiki=read('site/wiki.json'),catalog=read('site/catalog.json');
const topics=new Set(wiki.topics.map(t=>t.id)),readings=new Set(catalog.entries.map(e=>e.id));
test('all 106 places have inline music, ambience and each floor variation in topics and exact source readings',()=>{
 for(const location of audio.locations){
  const ids=[location.music,'amb_'+location.ambience_tag,'step_'+location.floor_tag];
  for(const context of [{topicId:location.topic_id},...location.reading_ids.map(readingId=>({readingId}))]){
   const cards=audioForContext(links,context);for(const id of ids)assert(cards.some(c=>c.id===id),JSON.stringify(context)+' '+id);
  }
 }
 assert.equal(audioForContext(links,{topicId:'not-an-atlas-place'}).length,0);
});
test('every prepared game clip and existing song has a contextual home with valid two-way links',()=>{
 const inventory=read('sources/game-audio-inventory.json');
 const game=audio.entries.flatMap(e=>e.clips).filter(c=>!c.source_path.startsWith('lore:'));
 assert.equal(game.length,244);assert.deepEqual(game.map(c=>c.source_path).sort(),inventory.files.map(f=>f.path).sort());
 for(const entry of audio.entries){
  assert(Object.values(links.topics).some(ids=>ids.includes(entry.id)),entry.id);
  assert(entry.related.length>0,entry.id);
  for(const link of entry.related){if(link.href.startsWith('wiki.html#'))assert(topics.has(link.href.split('#')[1]));else assert(readings.has(new URLSearchParams(link.href.split('#')[1]).get('read')));}
 }
 for(const id of Object.keys(links.topics))assert(topics.has(id));
 for(const id of Object.keys(links.readings))assert(readings.has(id));
 assert(links.topics['audio-title'].includes('soft_circuit'));
 assert(audio.entries.filter(e=>e.kind==='song').every(e=>links.readings[e.reading_ids[0]].includes(e.id)));
});
test('local Tactical effects remain explicitly labeled as previews',()=>{
 const previews=audio.entries.filter(e=>e.clips.some(c=>c.source_path.includes('elevenlabs-hurdles')));
 assert.equal(previews.length,18);assert(previews.every(e=>e.status==='Tactical course preview'));
});
class E {
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.handlers={};this.attributes={};this.classList={add(){}};this.paused=false;}
 append(...v){this.children.push(...v);}replaceChildren(...v){this.children=v;}setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,fn){this.handlers[k]=fn;}pause(){this.paused=true;}
 querySelectorAll(selector){return this.children.flatMap(c=>typeof c==='string'?[]:[...(selector.split(',').some(s=>c.tagName===s.toUpperCase())?[c]:[]),...c.querySelectorAll(selector)]);}
}
test('inline player switches floor variations without autoplay, supports repeats and stops before clearing',()=>{
 const previous=globalThis.document;globalThis.document={createElement:tag=>new E(tag),createTextNode:text=>text};
 try{
  const parent=new E('section');const cards=[links.entries.soft_circuit,links.entries.step_wood];renderAudioCards(parent,cards);
  const players=parent.querySelectorAll('audio');assert.equal(players.length,2);assert(players.every(p=>p.controls&&p.preload==='none'&&!p.autoplay));
  const select=parent.querySelectorAll('select')[0];select.value='2';select.handlers.change();assert(players[1].src.endsWith('step_wood_3.ogg'));assert(players[1].paused);
  const repeat=parent.querySelectorAll('input')[0];repeat.checked=true;repeat.handlers.change();assert.equal(players[0].loop,true);
  clearAudioConnections(parent);assert(players.every(p=>p.paused));assert(parent.hidden);assert.equal(parent.children.length,0);
 }finally{globalThis.document=previous;}
});
test('audio stays outside source paragraphs and reader routes stop previous playback',()=>{
 const app=fs.readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 const html=fs.readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 assert(app.includes("mountAudioConnections($('reader-audio'),{readingId:e.id}"));
 assert(app.includes("function route(){if(!catalog)return;stopAudio();clearAudioConnections($('reader-audio'))"));
 assert(html.includes('id="reader-audio"'));assert(html.includes('id="home-audio"'));
 const wikiJS=fs.readFileSync(new URL('../site/wiki.mjs',import.meta.url),'utf8');assert(wikiJS.includes('{topicId:topic.id}'));assert(wikiJS.includes('function render(){stopAudio();'));
});
