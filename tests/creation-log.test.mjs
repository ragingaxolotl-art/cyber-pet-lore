import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectRecords,validate,safeLink} from '../site/creation-log.mjs';
test('creation order, search and personal filters are independent of fictional chronology',()=>{const rows=validate(JSON.parse(readFileSync(new URL('../site/creation-log.json',import.meta.url))));assert.equal(selectRecords(rows)[0].id,'published-6');assert.equal(selectRecords(rows,'','oldest')[0].id,'published-1');assert.equal(selectRecords(rows,'seventeenth')[0].id,'published-5');assert.equal(selectRecords([...rows,{...rows[0],personal:true}],'','newest','personal').length,1);assert.throws(()=>validate([{title:'bad'}]));assert.equal(safeLink('javascript:alert(1)'),null);});
test('library and navigation expose Haven collection and creation log',()=>{const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');assert.match(html,/href="recent.html"/);assert.match(html,/At the Height of the Havens/);assert.match(html,/href="haven-stories\/index.html"/);});
