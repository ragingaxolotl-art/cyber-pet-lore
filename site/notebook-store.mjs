import {STORAGE_KEY,emptyState,validateState,mergeStates} from './records.mjs?v=workspace-20261122';
import {blankReading,editReading,editCell,projectReading,readingCells} from './note-revisions.mjs';
import {editWorkspace,mergeWorkspaces} from './workspace-records.mjs';
import {CloudBackup,SESSION_KEY} from './cloud-backup.mjs?v=workspace-20261122';
export const MIGRATION_KEY=STORAGE_KEY+'.before-workspace-v2';
const copy=value=>structuredClone(value);
export class NotebookStore{
 constructor({storage,session,request,delay=1500,onStatus=()=>{}}={}){
  this.storage=storage;this.session=session;this.request=request;this.delay=delay;this.onStatus=onStatus;
  this.state=emptyState();this.listeners=new Set();this.corrupt=false;this.unsaved=false;this.cloud=null;this.busy=false;this.pending=false;this.timer=null;this.generation=0;this.status='Saved on this device';
  try{this.readLocal();}catch(error){this.corrupt=true;this.setStatus(error.message);}
 }
 setStatus(message){this.status=message;this.onStatus(message);for(const fn of this.listeners)fn(this.snapshot(),message);}
 snapshot(){return copy(this.state);}
 subscribe(fn){this.listeners.add(fn);fn(this.snapshot(),this.status);return ()=>this.listeners.delete(fn);}
 readLocal(){
  const raw=this.storage?.getItem(STORAGE_KEY);if(!raw)return;
  let stored;try{stored=JSON.parse(raw);const validated=validateState(stored);this.state=mergeStates(this.state,validated);}
  catch{throw Error('Existing notebook could not be read. It has not been overwritten. Download recovery data before continuing.');}
  if(stored.version===1&&!this.storage.getItem(MIGRATION_KEY))this.storage.setItem(MIGRATION_KEY,raw);
 }
 write(){
  this.unsaved=true;
  try{if(this.corrupt)throw Error('Existing notebook needs recovery.');this.readLocal();this.storage.setItem(STORAGE_KEY,JSON.stringify(this.state));this.unsaved=false;this.setStatus(this.cloud?'Saved on this device · waiting for online backup':'Saved on this device · online backup locked');if(this.cloud)this.queue();return true;}
  catch(error){this.setStatus(error.message+' Keep this page open and download your notebook.');return false;}
 }
 commit(snapshot){this.state=mergeStates(this.state,validateState(snapshot));this.state.preferences=copy(snapshot.preferences||this.state.preferences);this.state.lastReading=snapshot.lastReading??this.state.lastReading;return this.write();}
 updateReading(id,changes,base){
  const previous=base||this.state.readings[id]||blankReading();const edited=editReading(previous,changes,Math.max(Date.now(),previous.updatedAt+1));
  const incoming=emptyState();incoming.readings[id]=edited;this.state=mergeStates(this.state,incoming);this.write();return copy(this.state.readings[id]);
 }
 resolveReadingField(id,field,value){
  const record=this.state.readings[id];if(!record)throw Error('Reading unavailable');const cells=readingCells(record);if(!cells[field])throw Error('Revision unavailable');cells[field]=editCell(cells[field],value);this.state.readings[id]=projectReading(record,cells);this.write();return this.snapshot();
 }
 updateWorkspace(collection,id,value,base){const edited=editWorkspace(base||this.state.workspace,collection,id,value);this.state.workspace=this.state.workspace?mergeWorkspaces(this.state.workspace,edited):edited;this.write();return this.snapshot();}
 import(value){const incoming=validateState(value);if(this.corrupt)throw Error('Recover the existing notebook before importing.');this.storage?.setItem(STORAGE_KEY+'.before-import',JSON.stringify(this.state));this.state=mergeStates(this.state,incoming);this.write();return this.snapshot();}
 refresh(){try{this.readLocal();this.setStatus(this.status);if(this.cloud)this.queue();}catch(error){this.corrupt=true;this.setStatus(error.message);}}
 queue(){clearTimeout(this.timer);this.timer=setTimeout(()=>void this.flush(),this.delay);}
 async connect(code=''){
  if(this.corrupt)throw Error('Recover the existing notebook before connecting.');
  if(this.busy)throw Error('A backup is in progress. Wait for it to finish before reconnecting.');this.generation++;this.cloud=new CloudBackup(code,this.request||globalThis.fetch,this.session);this.setStatus('Opening private online notebook…');
  await this.flush();
 }
 async flush(){
  if(!this.cloud)return false;if(this.busy){this.pending=true;return false;}
  clearTimeout(this.timer);this.busy=true;this.pending=false;let saved;const cloud=this.cloud,generation=this.generation;
  try{
   if(this.corrupt)throw Error('Recover the existing notebook before syncing.');this.readLocal();
   const remote=await cloud.load();if(generation!==this.generation){cloud.disconnect();return false;}if(remote)this.state=mergeStates(this.state,remote);
   // Local persistence before network write keeps merged work recoverable.
   try{this.storage.setItem(STORAGE_KEY,JSON.stringify(this.state));this.unsaved=false;}catch{this.unsaved=true;}
   saved=JSON.stringify(this.state);await cloud.save(JSON.parse(saved));if(generation!==this.generation)return false;
   this.setStatus('Backed up online at '+new Date().toLocaleTimeString()+(this.unsaved?' · device save unavailable':''));return true;
  }catch(error){if(generation!==this.generation)return false;if(error.status===409)this.pending=true;this.setStatus(error.message+' Your current notebook can still be downloaded.');return false;}
  finally{this.busy=false;this.setStatus(this.status);if(this.cloud&&(this.pending||(saved&&JSON.stringify(this.state)!==saved)))this.queue();}
 }
 lock(){this.generation++;clearTimeout(this.timer);this.cloud?.disconnect();this.cloud=null;this.setStatus('Online backup locked · device notes retained');}
 export(){return JSON.stringify({...this.state,exportedAt:new Date().toISOString()},null,2);}
 destroy(){clearTimeout(this.timer);this.listeners.clear();}
}
let singleton;
export function getNotebookStore(){
 if(singleton)return singleton;
 let storage,session;try{storage=globalThis.localStorage;session=globalThis.sessionStorage;}catch{}
 singleton=new NotebookStore({storage,session});
 if(typeof window!=='undefined'){
  window.addEventListener('online',()=>{if(singleton.cloud)void singleton.flush();});
  window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY)singleton.refresh();});
  window.addEventListener('beforeunload',event=>{if(singleton.unsaved){event.preventDefault();event.returnValue='';}});
  try{if(session?.getItem(SESSION_KEY))void singleton.connect();}catch{}
 }
 return singleton;
}
