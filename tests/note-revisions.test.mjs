import test from 'node:test';import assert from 'node:assert/strict';
import {seedCell,editCell,mergeCells,cellValue,cellConflicts,blankReading,editReading,mergeReadings} from '../site/note-revisions.mjs';
const ids=prefix=>{let i=0;return ()=>prefix+'-'+ ++i;};
const h=id=>({id,color:'gold',note:'',createdAt:1,segments:[{block:'p',start:0,end:5,quote:'hello'}]});
test('independent note and reading-position edits survive in either merge order',()=>{
 const base=blankReading(),a=editReading(base,{note:'Important question'},10,ids('a')),b=editReading(base,{position:{block:'p'}},20,ids('b'));
 const result=mergeReadings(a,b);assert.equal(result.note,'Important question');assert.deepEqual(result.position,{block:'p'});assert.deepEqual(mergeReadings(b,a),result);
});
test('concurrent highlights union and explicit deletion survives an older backup',()=>{
 const base=blankReading(),a=editReading(base,{highlights:[h('a')]},10,ids('a')),b=editReading(base,{highlights:[h('b')]},11,ids('b'));const both=mergeReadings(a,b);assert.equal(both.highlights.length,2);
 const removed=editReading(both,{highlights:[h('b')]},12,ids('remove'));assert.deepEqual(mergeReadings(removed,a).highlights.map(h=>h.id),['b']);
});
test('concurrent wording is retained until the reader deliberately resolves it',()=>{
 const base=seedCell('original'),a=editCell(base,'left',1,'a'),b=editCell(base,'right',2,'b');const merged=mergeCells(a,b);assert.equal(cellConflicts(merged).length,2);assert.equal(cellValue(merged),'right');
 const resolved=editCell(merged,'combined',3,'resolution');assert.equal(cellConflicts(mergeCells(resolved,a)).length,0);assert.equal(cellValue(mergeCells(resolved,b)),'combined');
});
test('causal register merge is associative, commutative and idempotent',()=>{const base=seedCell(''),a=editCell(base,'a',1,'a'),b=editCell(base,'b',2,'b'),c=editCell(a,'c',3,'c');assert.deepEqual(mergeCells(a,b),mergeCells(b,a));assert.deepEqual(mergeCells(a,a),a);assert.deepEqual(mergeCells(mergeCells(a,b),c),mergeCells(a,mergeCells(b,c)));});
