// Isolated HTTP integration against the same handler deployed by Sites.
// No production credentials, reader records, or server data are accessed.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {NotebookStore} from '../site/notebook-store.mjs';
import {cellValue} from '../site/note-revisions.mjs';
const service=process.argv[2];if(!service)throw Error('Pass the existing Sites service checkout directory.');
const {handleLoreBackups}=await import(pathToFileURL(resolve(service,'lib/lore-backups.mjs')));
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(resolve(service,'drizzle/0011_illegal_phantom_reporter.sql'),'utf8'));
const db={prepare:query=>({first:async()=>sql.prepare(query).get()||null,bind:(...args)=>({first:async()=>sql.prepare(query).get(...args)||null})})};
const objects=new Map(),bucket={get:async k=>objects.has(k)?{json:async()=>JSON.parse(objects.get(k))}:null,put:async(k,v)=>objects.set(k,v),delete:async k=>objects.delete(k)};
const code=crypto.randomUUID();let clock=Date.now();
const server=createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const request=new Request('http://127.0.0.1'+req.url,{method:req.method,headers:req.headers,...(body.length?{body}:{} )});const response=await handleLoreBackups(request,db,bucket,code,()=>clock);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
const request=(url,options)=>fetch(base+new URL(url).pathname,{...options,headers:{...options.headers,Origin:'https://ragingaxolotl-art.github.io'}});
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const a=new NotebookStore({storage:memory(),session:memory(),request,delay:100000}),b=new NotebookStore({storage:memory(),session:memory(),request,delay:100000});
try{
 assert.equal((await fetch(base+'/lore-backups')).status,401);
 await a.connect(code);
 const targets=[
  {kind:'text',id:'reading-p1',title:'Reading passage',href:'index.html#read=story&block=p1',block:'p1',quote:'Example'},
  {kind:'entity',id:'example-person',title:'Example person',href:'wiki.html#example-person'},
  {kind:'audio',id:'example-audio',title:'Example audio',href:'sounds/index.html',mediaId:'example.ogg',start:12.5,end:16},
  {kind:'artifact',id:'ribbon-v1',title:'Ribbon version',href:'ribbons/studio/index.html',artifactId:'ribbon',revision:'1'},
  {kind:'page',id:'plans',title:'Plans',href:'plans.html'}
 ];for(const target of targets)a.updateWorkspace('notes','target-'+target.kind,{target,text:'Context round trip',tags:[],pinned:false,status:'note',createdAt:1});
 a.updateReading('article-haven',{note:'Annotation from a reference page'});a.updateWorkspace('notes','haven-note',{target:{kind:'map',id:'A01',title:'Haven A01',href:'shelter-atlas.html',stage:3,era:[-3]},text:'A question at this stage',tags:['test'],pinned:true,status:'question',createdAt:1});
 a.updateWorkspace('artifacts','ribbon',{type:'ribbon-recipe',title:'Test ribbon',version:1,createdAt:1,data:{storageKey:'cyberpath.ribbon-studio.v1',raw:'{"name":"Test ribbon"}'}});assert.equal(await a.flush(),true);
 await b.connect(code);for(const target of targets){const restored=cellValue(b.state.workspace.notes['target-'+target.kind]).target;assert.deepEqual(restored,{...target,era:[]});}assert.equal(b.state.readings['article-haven'].note,'Annotation from a reference page');assert.equal(cellValue(b.state.workspace.notes['haven-note']).target.stage,3);assert.equal(cellValue(b.state.workspace.artifacts.ribbon).data.raw,'{"name":"Test ribbon"}');
 a.updateReading('article-haven',{note:'Device A interpretation'});b.updateReading('article-haven',{note:'Device B interpretation'});await a.flush();await b.flush();assert.equal(b.state.readings['article-haven']._sync.note.versions.length,2);
 b.updateWorkspace('notes','haven-note',null);await b.flush();await a.flush();assert.equal(cellValue(a.state.workspace.notes['haven-note']),null);
 clock+=13*3600000;a.updateReading('article-haven',{position:{block:'p1'}});assert.equal(await a.flush(),false);assert.doesNotMatch(a.status,/Backed up online/);await a.connect(code);assert.match(a.status,/Backed up online/);assert.equal(a.state.readings['article-haven'].position.block,'p1');
 console.log('PASS: authenticated HTTP restore across two isolated clients; all six supported context types; simultaneous edits; deletion; expired-session recovery.');
}finally{a.destroy();b.destroy();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));sql.close();}
