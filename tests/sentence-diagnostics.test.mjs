import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dictionaryClausePlan,recognizedClausePredicate} from '../site/translator/dictionary_clauses.mjs';
const authority=JSON.parse(fs.readFileSync(new URL('../site/translator/data/index.json',import.meta.url)));
test('known unsupported constructions cannot become unrelated definitions',()=>{
  for(const [text,word] of [['The file was deleted.','deleted'],['Nora copied the file to the folder.','copied'],['Nora recalls.','recalls']]){
    assert.equal(recognizedClausePredicate(text,authority),word);
    assert.equal(dictionaryClausePlan(text,authority,{offerDefinition:true}),null);
  }
});
test('unfamiliar predicates still offer reusable meanings',()=>{
  for(const text of ['Nora zorbled the file.','The lamp is glimmerwise.']){
    assert.equal(recognizedClausePredicate(text,authority),null);
    assert(dictionaryClausePlan(text,authority,{offerDefinition:true})?.needsDefinition);
  }
});
