import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderConnectedTerms} from '../site/wiki-related.mjs';
const element=tag=>({tag,children:[],append(...items){this.children.push(...items)}}),document={createElement:element};
test('every topic gets a collapsed connected-terms dropdown with usable source links',()=>{
 for(const topic of [{id:'a'},{id:'a',relatedTerms:[{topicId:'b',title:'B',source:{href:'index.html#read=example&block=one'}}]},{id:'a',register:{connections:[{topicId:'b',title:'B',source:{href:'index.html#read=example&block=one'}}]}}]){
 const parent=element('div'),details=renderConnectedTerms(parent,topic,{document});assert.equal(details.tag,'details');assert(!details.open);assert.match(details.children[0].textContent,/Connected terms & unexplained lore/);for(const card of details.children.filter(e=>e.tag==='article')){assert.equal(card.children[0].href,'wiki.html#b');assert.match(card.children[1].href,/block=one/);}
 }
});
test('duplicate shared passages collapse but distinct evidence remains',()=>{const c={topicId:'b',title:'B',source:{href:'index.html#read=r&block=one'}},parent=element('div');const d=renderConnectedTerms(parent,{id:'a',relatedTerms:[c],register:{connections:[c,{...c,source:{href:'index.html#read=r&block=two'}}]}},{document});assert.equal(d.children.filter(e=>e.tag==='article').length,2)});
test('the footer follows prose and sits next to mentions before private notes',()=>{const s=fs.readFileSync(new URL('../site/wiki.mjs',import.meta.url),'utf8');assert(s.includes("references.append(mentions);renderConnectedTerms(references,topic)"));assert(s.indexOf('parent.append(references)')>s.indexOf('Other topics in the same readings'));assert(s.indexOf('parent.append(references)')<s.indexOf(' mountArticleNotes(parent,'));assert(!s.includes("node('h2','Connected terms & unexplained lore')"));});
