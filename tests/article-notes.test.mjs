import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,validateState,mergeStates,safeArticleHref} from '../site/records.mjs';
import {textKey,parseTags} from '../site/article-notes.mjs';
test('article highlights retain their source, notes, tags and dates in backups and merges',()=>{
 const s=emptyState();s.readings['article-topic-aru']={note:'',tags:[],updatedAt:1,highlights:[{id:'article-highlight',note:'Who is the keeper?',tags:['identity'],context:{storyTitle:'Aru',era:[-1],href:'wiki.html#topic-aru'},createdAt:123,color:'gold',segments:[{block:'text-stable',start:0,end:3,quote:'Aru'}]}]};
 const restored=validateState(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.readings['article-topic-aru'].highlights,s.readings['article-topic-aru'].highlights);
 const merged=mergeStates(emptyState(),restored);assert.equal(merged.readings['article-topic-aru'].highlights[0].context.href,'wiki.html#topic-aru');
});
test('article links are limited to local article pages',()=>{
 for(const href of ['wiki.html#topic-1','terms.html?term=topic-2','timeline.html#era--2','illnesses/index.html#bitrot'])assert.equal(safeArticleHref(href),true);
 for(const href of ['javascript:alert(1)','https://example.com','//example.com','../wiki.html','wiki.html/../../other'])assert.equal(safeArticleHref(href),false);
});
test('article anchors depend on exact prose rather than surrounding article order',()=>{assert.equal(textKey('P\nAru meets Iri.'),textKey('P\nAru meets Iri.'));assert.notEqual(textKey('P\nAru meets Iri.'),textKey('P\nAru leaves Iri.'));assert.deepEqual(parseTags(' identity, favorite, identity, '),['identity','favorite']);});
