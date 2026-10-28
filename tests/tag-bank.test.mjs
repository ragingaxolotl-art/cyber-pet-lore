import test from 'node:test';
import assert from 'node:assert/strict';
import {tagBank,matchingTags,insertTag,tagToken} from '../site/tag-suggestions.mjs';
test('bank collects article and highlight tags, including imported records, without case duplicates',()=>{
 const state={readings:{story:{tags:[' Favorite '],highlights:[{tags:['identity','favorite']}]},article:{tags:[],highlights:[{tags:['connections']}]}}};
 assert.deepEqual(tagBank(JSON.parse(JSON.stringify(state))),['connections','Favorite','identity']);
});
test('suggestions match the active comma-separated tag and skip already-selected tags',()=>{
 const bank=['connections','Favorite','identity'];assert.deepEqual(matchingTags(bank,'Favorite, co'),['connections']);assert.deepEqual(matchingTags(bank,'favorite, '),['connections','identity']);assert.deepEqual(matchingTags(bank,'ID'),['identity']);assert.deepEqual(matchingTags(bank,'new tag'),[]);
});
test('choosing a suggestion preserves earlier and later tags',()=>{
 assert.deepEqual(insertTag('favorite, co',12,'connections'),{value:'favorite, connections, ',caret:23});
 assert.equal(insertTag('co, favorite',2,'connections').value,'connections, favorite');
 assert.equal(insertTag('favorite, id, connections',12,'identity').value,'favorite, identity, connections');
 assert.equal(tagToken(', favorite',0).start,0);
});
