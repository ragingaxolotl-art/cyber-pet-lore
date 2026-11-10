import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {annotationVisible} from '../site/story-annotations.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const manifest=read('sources/haven-stories/manifest.json');
test('sixty notes attach to exact passages while preserving original highlight anchors and text',()=>{
 let count=0;
 for(const story of manifest.stories){const path='site/content/haven-fiction-'+story.id+'.json',current=read(path),original=fs.readFileSync(new URL('../sources/haven-stories/'+story.id+'/manuscript.md',import.meta.url),'utf8').trim().split(/\n\s*\n/).map((part,i)=>{const heading=part.match(/^(#{1,6}) (.+)$/);return {id:'haven-fiction-'+story.id+'-p'+String(i).padStart(4,'0'),text:heading?heading[2]:part,style:heading?'HEADING_'+heading[1].length:'NORMAL_TEXT'};});
  assert.deepEqual(current.blocks.filter(b=>!b.annotation&&!b.id.endsWith('-status')),original);
  assert.deepEqual(current.outline,original.filter(b=>b.style.startsWith('HEADING_')).map(b=>({id:b.id,title:b.text,level:Number(b.style.slice(-1))})));
  assert.equal(new Set(current.blocks.map(b=>b.id)).size,current.blocks.length);
  const notes=current.blocks.filter(b=>b.annotation?.anchor);assert.equal(notes.length,12);count+=notes.length;
  for(const note of notes){const anchor=current.blocks.findIndex(b=>b.id===note.annotation.anchor);const index=current.blocks.indexOf(note);assert.ok(anchor>=0&&index>anchor&&index<=anchor+3);assert.ok(note.text.length>100);}
  assert.equal(notes.filter(b=>b.annotation.layer==='editorial').length,4);
 }
 assert.equal(count,60);
});
test('annotation filters retain prose and context, distinguish explanation from interpretation',()=>{
 const prose={text:'story'},frame={annotation:{layer:'frame'}},interpretation={annotation:{layer:'interpretation'}},editor={annotation:{layer:'editorial'}};
 for(const mode of ['all','off','editorial','interpretation'])assert.equal(annotationVisible(prose,mode),true);
 assert.equal(annotationVisible(frame,'off'),false);assert.equal(annotationVisible(frame,'editorial'),true);
 assert.equal(annotationVisible(interpretation,'editorial'),false);assert.equal(annotationVisible(editor,'interpretation'),false);
 assert.equal(annotationVisible(editor,'editorial'),true);assert.equal(annotationVisible(interpretation,'all'),true);
});
test('marginal readers are explicitly proposed and distinct from canon and event dates',()=>{
 const data=read('sources/haven-stories/annotations.json');assert.deepEqual(Object.values(data.voices).map(v=>v.era),[0,2,4]);assert.match(data.frame,/not eyewitnesses/);assert.match(data.frame,/not the events/);assert.match(data.status,/not confirmed historical canon/);
 const app=fs.readFileSync(new URL('../site/app.js',import.meta.url),'utf8');assert.match(app,/if\(!annotationVisible\(block,annotationMode\)\)continue/);assert.match(app,/annotationMode='all';renderBlocks\(\)/);
});
