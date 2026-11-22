import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeEnglish} from '../site/translator/english.mjs';
import {wordScorePlan} from '../site/translator/word_score.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
test('restrictive only is unscored scope, not a phonemic noun',()=>{
 for(const text of ['Nora copied only the file.','Only Nora copied the file.','Nora holds only the rope.']){
  const rows=analyzeEnglish(text,authority).term_coverage,only=rows.find(row=>row.term==='only');
  assert.equal(only.status,'function_word');assert(only.unscored_scope);
  assert(wordScorePlan(rows,new Map(),authority).omitted.includes('only'));
 }
});
test('explicit quoted names survive contraction and Unicode contexts',()=>{
 for(const text of ["Nora didn't copy 'Only'.",'Cafe\u0301ine copied “Only”.']){
  const row=analyzeEnglish(text,authority).term_coverage.find(row=>row.term==='only');assert.equal(row.status,'phonemic_label');
 }
});
