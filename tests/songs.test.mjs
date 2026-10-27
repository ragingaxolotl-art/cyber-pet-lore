import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../site/songs/index.html', import.meta.url),'utf8');
class Element{constructor(){this.value='0';this.children=[];this.handlers={};this.currentTime=0;this.paused=true;this.checked=true;this.hidden=false;this.classList={toggle(){}}}append(x){this.children.push(x)}replaceChildren(){this.children=[]}addEventListener(k,fn){this.handlers[k]=fn}load(){this.currentTime=0}pause(){this.paused=true}play(){this.paused=false;return Promise.resolve()}}
const nodes=new Map();for(const match of html.matchAll(/id="([^"]+)"/g))nodes.set(match[1],new Element());nodes.get('song-data').textContent=html.match(/<script id="song-data" type="application\/json">([\s\S]*?)<\/script>/)[1];nodes.get('mode').value='song.m4a';const details=new Element();
const document={getElementById:id=>nodes.get(id),createElement:()=>new Element(),querySelectorAll:()=>nodes.get('transcript').children,querySelector:()=>details};
const code=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];vm.runInNewContext(code,{document,console});
assert.equal(nodes.get('song').children.length,4);assert.equal(nodes.get('carrier').textContent,'Instrumental introduction');
const data=JSON.parse(nodes.get('song-data').textContent);
for(let i=0;i<4;i++){
 nodes.get('song').value=String(i);nodes.get('song').handlers.change();assert.equal(nodes.get('title').textContent,data[i].title);assert.equal(nodes.get('transcript').children.length,12);
 for(const line of data[i].lines){nodes.get('player').currentTime=line.start+.01;nodes.get('player').handlers.timeupdate();assert.equal(nodes.get('gloss').textContent,line.gloss);assert.equal(nodes.get('carrier').textContent,line.carrier)}
}
nodes.get('translate').checked=false;nodes.get('translate').handlers.change();assert(nodes.get('meaning').hidden&&details.hidden);
nodes.get('translate').checked=true;nodes.get('translate').handlers.change();assert(!nodes.get('meaning').hidden&&!details.hidden);
nodes.get('player').currentTime=20;nodes.get('mode').value='language-only.wav';nodes.get('mode').handlers.change();nodes.get('player').handlers.loadedmetadata();assert.equal(nodes.get('player').currentTime,20);assert(nodes.get('player').src.endsWith('language-only.wav'));
console.log('PASS: four song choices, 48 synchronized meanings, translation toggle, and preserving playback position when switching to the language stem. Browser visual preview not performed.');
