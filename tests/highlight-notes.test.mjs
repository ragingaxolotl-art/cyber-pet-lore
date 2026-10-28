import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {emptyState,validateState,mergeStates} from '../site/records.mjs';
const highlight={id:'h1',color:'gold',note:'Remember this',tags:['mystery'],context:{storyTitle:'A Story',era:[-2]},createdAt:1700000000000,segments:[{block:'p1',start:0,end:5,quote:'Hello'}]};
function sample(){const s=emptyState();s.readings.story={note:'Old article note',tags:['article'],updatedAt:1,highlights:[structuredClone(highlight)]};return s;}
test('highlight tags and context survive backup round trip and merge independently of article tags',()=>{const s=validateState(JSON.parse(JSON.stringify(sample())));assert.deepEqual(s.readings.story.highlights[0],highlight);const newer=structuredClone(s);newer.readings.story.updatedAt=2;newer.readings.story.highlights[0].tags=['favorite'];const merged=mergeStates(s,newer);assert.deepEqual(merged.readings.story.highlights[0].tags,['favorite']);assert.deepEqual(merged.readings.story.tags,['article']);assert.equal(merged.readings.story.highlights[0].createdAt,highlight.createdAt);});
test('invalid highlight tags are rejected before importing',()=>{for(const tags of ['wrong',[42],['x'.repeat(71)]]){const s=sample();s.readings.story.highlights[0].tags=tags;assert.throws(()=>validateState(s));}});
test('heading displays title date and era; editing tags only updates that highlight',()=>{
 const s=sample();s.readings.story.highlights.push({...structuredClone(highlight),id:'h2',tags:['other']});
 const node=(tag,text='',className='')=>({tag,textContent:text,className,children:[],append(...items){this.children.push(...items);}});
 const code=fs.readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 const context={node,byId:new Map([['story',{title:'Catalog title',era:[0]}]]),eraName:e=>'Era '+e,Date,Number,Set,record:id=>s.readings[id],updateRecord(id,changes){Object.assign(s.readings[id],changes);}};
 vm.runInNewContext(code.slice(code.indexOf('function highlightHeading'),code.indexOf('function renderHighlights')),context);
 const card=node('article');context.highlightHeading(card,'story',highlight);assert.equal(card.children[0].children[0].textContent,'A Story');assert.match(card.children[1].textContent,/2023.*Era -2/);
 const field=context.highlightTags('story',highlight),input=field.children[0];input.value='favorite, mystery, favorite';input.oninput();assert.deepEqual(Array.from(s.readings.story.highlights[0].tags),['favorite','mystery']);assert.deepEqual(s.readings.story.highlights[1].tags,['other']);assert.equal(s.readings.story.highlights[0].createdAt,highlight.createdAt);
});
