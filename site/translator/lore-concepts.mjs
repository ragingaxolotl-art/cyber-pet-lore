import {STORAGE_KEY,emptyState,validateState,mergeStates} from '../records.mjs';
import {mergeConceptQueues} from '../concept-records.mjs';
import {CloudBackup} from '../cloud-backup.mjs';
import {emptyQueue,validateQueue,INTAKE_KEY} from './concept_intake.mjs';

// Keep the valid proposal in memory before attempting either persistence layer.
export class LoreConceptStore{
 constructor(data,{storage=()=>globalThis.localStorage,connection=()=>new CloudBackup(),onChange=()=>{},onStatus=()=>{}}={}){
  this.data=data;this.storage=storage;this.connection=connection;this.onChange=onChange;this.onStatus=onStatus;this.state=emptyState();this.corrupt=false;this.unsaved=false;this.busy=false;this.pending=false;this.cloud=null;
 }
 get queue(){return this.state.conceptQueue||emptyQueue();}
 readLocal(){let raw;try{raw=this.storage().getItem(STORAGE_KEY);}catch{return;}
  if(raw)try{this.state=mergeStates(this.state,validateState(JSON.parse(raw)));validateQueue(this.queue,this.data);}catch{this.corrupt=true;throw Error('Existing Lore records need recovery. They have not been overwritten. Download your current work and recover the Lore backup first.');}
 }
 load(){this.readLocal();let raw;try{raw=this.storage().getItem(INTAKE_KEY);}catch{}
  if(raw){const legacy=validateQueue(JSON.parse(raw),this.data);this.state.conceptQueue=mergeConceptQueues(this.queue,legacy);}
  validateQueue(this.queue,this.data);this.onChange(this.queue);this.onStatus('Proposals use Lore’s saves. Unlock private backup for an online copy.');
  if(raw)this.persist();return this.queue;
 }
 persist(){this.unsaved=true;
  try{if(this.corrupt)throw Error();this.readLocal();this.storage().setItem(STORAGE_KEY,JSON.stringify(this.state));this.unsaved=false;this.onStatus('Saved in this browser.');return true;}
  catch{this.onStatus(this.corrupt?'Existing Lore data needs recovery. Download your proposals before leaving.':'Browser save unavailable. Keep this page open and unlock private backup or download your proposals.');return false;}
 }
 commit(queue){validateQueue(queue,this.data);this.state.conceptQueue=mergeConceptQueues(this.queue,queue);this.persist();this.onChange(this.queue);if(this.cloud){this.onStatus('Saving to Lore’s private backup…');void this.flush();}return this.queue;}
 async connect(code=''){
  if(this.busy)return;this.cloud=code?new CloudBackup(code):this.connection();await this.flush();
 }
 async flush(){
  if(!this.cloud)return;if(this.busy){this.pending=true;return;}
  this.busy=true;this.pending=false;let saved;
  try{
   if(this.corrupt)throw Error('Recover the existing Lore browser data before connecting.');
   this.readLocal();const remote=await this.cloud.load();
   if(remote)this.state=mergeStates(this.state,remote);
   validateQueue(this.queue,this.data);this.persist();this.onChange(this.queue);
   saved=JSON.stringify(this.state);await this.cloud.save(JSON.parse(saved));
   if(JSON.stringify(this.state)===saved)this.unsaved=false;
   this.onStatus('Private backup saved at '+new Date().toLocaleTimeString()+'.');
  }catch(error){this.onStatus(error.message+' Download your proposals if they are not saved in this browser.');}
  finally{this.busy=false;if(this.pending){this.pending=false;void this.flush();}}
 }
 lock(){if(this.busy)return;this.cloud?.disconnect();this.cloud=null;this.onStatus('Private backup locked. Browser records remain on this device.');}
}

export function attachLoreSaves(data,onChange){
 const status=document.getElementById('loreSaveStatus');
 const store=new LoreConceptStore(data,{onChange,onStatus:message=>{status.textContent=message;document.getElementById('conceptSaveStatus').textContent=message;}});
 try{store.load();}catch(error){status.textContent=error.message;}
 document.getElementById('loreUnlock').onclick=async()=>{const input=document.getElementById('loreBackupCode');const code=input.value.trim();input.value='';await store.connect(code);};
 document.getElementById('loreSaveNow').onclick=document.getElementById('loreUnlock').onclick;
 document.getElementById('loreLock').onclick=()=>store.lock();
 document.getElementById('loreDownload').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(store.state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cyber-pet-lore-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 window.addEventListener('beforeunload',event=>{if(store.unsaved||store.busy){event.preventDefault();event.returnValue='';}});
 window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY)try{store.readLocal();onChange(store.queue);}catch(error){status.textContent=error.message;}});
 const connection=new CloudBackup();if(connection.token){store.connection=()=>connection;void store.connect();}
 return store;
}
