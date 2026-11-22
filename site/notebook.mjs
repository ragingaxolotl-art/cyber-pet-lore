import {restoreArtifact} from './workspace-artifacts.mjs';
import {STORAGE_KEY} from './records.mjs';
import {getNotebookStore,MIGRATION_KEY} from './notebook-store.mjs';
import {notebookRows,filterNotebook} from './notebook-view.mjs';
import {openNoteEditor,mountWorkspaceBar,downloadNotebook,noteButton} from './workspace-ui.mjs';
import {cellValue} from './note-revisions.mjs';
const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const store=getNotebookStore();let catalog=[],state=store.snapshot(),noteLimit=60;
for(let era=-3;era<=4;era++){const option=el('option','Era '+era);option.value=String(era);$('note-era').append(option);}
function formValue(){return {query:$('note-query').value,kind:$('note-kind').value,era:$('note-era').value,tag:$('note-tag').value,status:$('note-status').value,from:$('note-from').value,to:$('note-to').value,sort:$('note-sort').value,pinned:$('note-pinned').checked,clips:$('note-clips').checked};}
function saveHighlight(row,changes){const r=row.base||state.readings[row.recordId];store.updateReading(row.recordId,{highlights:r.highlights.map(h=>h.id===row.id?{...h,...changes}:h)},r);}
function render(){
 const rows=notebookRows(state,catalog),filter=formValue(),selectedTag=filter.tag;
 $('note-tag').replaceChildren(new Option('All tags',''),new Option('Untagged notes','__untagged__'));for(const tag of [...new Set(rows.flatMap(r=>r.tags))].sort())$('note-tag').add(new Option(tag,tag));$('note-tag').value=selectedTag;
 const matches=filterNotebook(rows,filter);$('note-count').textContent=matches.length+' of '+rows.length+' notes';$('note-list').replaceChildren();
 if(!matches.length)$('note-list').append(el('p',rows.length?'No notes match. Clear filters to see everything.':'Your notebook is ready. Highlight a reading or choose Add my note on a map, sound or page.'));
 for(const row of matches.slice(0,noteLimit)){
  const baseWorkspace=state.workspace;row.base=state.readings[row.recordId];const card=el('article');card.className='notebook-card';card.dataset.noteId=row.id;const link=el('a',row.title);link.href=row.href;const h=el('h2');h.append(link);card.append(h,el('p',row.kind+' · '+new Date(row.date).toLocaleDateString()+(row.era.length?' · '+row.era.map(e=>'Era '+e).join(', '):'')+(row.clip?' · Clip #'+row.clip:'')));
  if(row.quote)card.append(el('blockquote',row.quote));
  const label=el('label','My note'),input=el('textarea');input.value=row.text;input.maxLength=30000;label.append(input);card.append(label);
  const tagLabel=el('label','Tags'),tags=el('input');tags.value=row.tags.join(', ');tagLabel.append(tags);card.append(tagLabel);
  const select=el('select');select.setAttribute('aria-label','Note type');for(const [value,title] of [['note','Note'],['question','Open question'],['resolved','Resolved question']])select.add(new Option(title,value));select.value=row.status;
  const pin=el('input');pin.type='checkbox';pin.checked=row.pinned;const pinLabel=el('label','Pinned ');pinLabel.prepend(pin);card.append(select,pinLabel);
  const save=el('button','Save changes');save.onclick=()=>{const nextTags=[...new Set(tags.value.split(',').map(x=>x.trim().slice(0,70)).filter(Boolean))].slice(0,30);if(row.source==='workspace'){const n=cellValue(baseWorkspace.notes[row.id]);store.updateWorkspace('notes',row.id,{...n,text:input.value,tags:nextTags,status:select.value,pinned:pin.checked},baseWorkspace);}else if(row.source==='highlight')saveHighlight(row,{note:input.value,tags:nextTags,noteStatus:select.value,pinned:pin.checked});else store.updateReading(row.recordId,{note:input.value,tags:nextTags},row.base);render();};
  if(row.source==='reading'){select.hidden=true;pinLabel.hidden=true;}
  const remove=el('button','Remove');remove.onclick=()=>{if(row.source==='workspace')store.updateWorkspace('notes',row.id,null);else if(row.source==='highlight'){const r=row.base||state.readings[row.recordId];store.updateReading(row.recordId,{highlights:r.highlights.filter(h=>h.id!==row.id)},r);}else store.updateReading(row.recordId,{note:'',tags:[]},state.readings[row.recordId]);render();};
  const go=el('a','Return to context');go.href=row.href;card.append(save,remove,go);$('note-list').append(card);
 }
 if(matches.length>noteLimit){const more=el('button','Show 60 more notes');more.onclick=()=>{noteLimit+=60;render();};$('note-list').append(more);}
 renderConflicts();renderArtifacts();
}
function renderConflicts(){
 const list=$('conflict-list');list.replaceChildren();
 for(const [id,r] of Object.entries(state.readings))for(const [field,cell] of Object.entries(r._sync||{})){
  if(cell.versions.length<2||['position','read','readAt'].includes(field))continue;
  const card=el('section');card.className='notebook-conflict';card.append(el('h3',(catalog.find(e=>e.id===id)?.title||id)+' · '+(field.startsWith('highlight:')?'Highlight':field)));
  for(const version of cell.versions){const value=version.value;const preview=el('pre',typeof value==='string'?value:JSON.stringify(value,null,2));preview.style.whiteSpace='pre-wrap';const use=el('button',value===null?'Keep deletion':'Use this version');use.onclick=()=>{store.resolveReadingField(id,field,value);render();};card.append(preview,use);}
  list.append(card);
 }
 for(const collection of ['notes','artifacts'])for(const [id,cell] of Object.entries(state.workspace?.[collection]||{})){if(cell.versions.length<2)continue;const card=el('section');card.className='notebook-conflict';card.append(el('h3','Saved '+(collection==='notes'?'note':'creation')+' · versions to review'));for(const v of cell.versions){card.append(el('p',v.value?.text||v.value?.title||(v.value===null?'Deleted version':'Saved version')));const button=el('button','Use this version');button.onclick=()=>{store.updateWorkspace(collection,id,v.value);render();};card.append(button);}list.append(card);}
 $('note-conflicts').hidden=!list.children.length;
}
function renderArtifacts(){const list=$('artifact-list');list.replaceChildren();for(const [id,cell] of Object.entries(state.workspace?.artifacts||{})){const value=cellValue(cell);if(!value)continue;const card=el('article');card.className='notebook-card';card.append(el('h3',value.title),el('p',value.type+' · version '+value.version));const download=el('button','Download creation');download.onclick=()=>downloadJSON(value.data,value.type+'-'+id+'.json');const restore=el('button','Restore this version');restore.onclick=()=>{try{const href=restoreArtifact(localStorage,store,value);restore.textContent='Restored — open tool to load it';restore.disabled=true;}catch(error){restore.textContent=error.message;}};card.append(download,restore);if(value.target){card.append(noteButton(value.target,'Note on this version'));const link=el('a','Open tool');link.href=value.target.href;card.append(link);}list.append(card);}if(!list.children.length)list.append(el('p','Your saved creations will appear here when captured from a tool.'));}
function downloadJSON(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('notebook-filters').onsubmit=e=>e.preventDefault();$('notebook-filters').oninput=()=>{render();const p=new URLSearchParams();for(const [k,v] of Object.entries(formValue()))if(v&&v!=='newest')p.set(k,String(v));history.replaceState(null,'','notebook.html'+(p.size?'?'+p:'')+location.hash);};$('notebook-filters').onreset=()=>setTimeout(()=>{history.replaceState(null,'','notebook.html'+location.hash);noteLimit=60;render();},0);
$('notebook-export').onclick=downloadNotebook;
$('notebook-unlock').onclick=async()=>{const code=$('notebook-code').value;$('notebook-code').value='';try{await store.connect(code);}catch(e){$('notebook-save-status').textContent=e.message;}};
$('notebook-sync').onclick=()=>void store.flush();$('notebook-lock').onclick=()=>store.lock();
$('notebook-import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>15*1024*1024)throw Error('Choose a workspace under 15 MB.');store.import(JSON.parse(await file.text()));$('notebook-import-status').textContent='Workspace merged. Review concurrent versions below.';render();}catch(error){$('notebook-import-status').textContent=error.message;}finally{e.target.value='';}};
try{const old=localStorage.getItem(MIGRATION_KEY);if(old){$('notebook-recovery').hidden=false;$('notebook-recovery').onclick=()=>downloadJSON(JSON.parse(old),'original-lore-notebook-v1.json');}}catch{}
for(const [key,label] of [[STORAGE_KEY+'.before-import','Download notebook before last import'],[STORAGE_KEY,'Download raw device recovery data']]){try{const raw=localStorage.getItem(key);if(raw&&(key!==STORAGE_KEY||store.corrupt)){const button=el('button',label);button.onclick=()=>{const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=el('a');a.href=url;a.download='lore-device-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('backups').append(button);}}catch{}}
store.subscribe((snapshot,message)=>{state=snapshot;$('notebook-save-status').textContent=message;const bytes=new TextEncoder().encode(JSON.stringify({state,revision:0})).length;$('notebook-size').textContent=(bytes/1024).toFixed(1)+' KB in your workspace · online limit 879 KB'+(bytes>800000?' · approaching online capacity; keep a download':'');$('notebook-sync').disabled=!store.cloud||store.busy;$('notebook-lock').disabled=!store.cloud;const editing=document.activeElement?.closest('.notebook-card');if(!editing)render();});
const params=new URLSearchParams(location.search);for(const [k,id] of [['query','note-query'],['kind','note-kind'],['era','note-era'],['tag','note-tag'],['status','note-status'],['from','note-from'],['to','note-to'],['sort','note-sort']])if(params.has(k))$(id).value=params.get(k);for(const k of ['pinned','clips'])$('note-'+k).checked=params.get(k)==='true';
mountWorkspaceBar();render();fetch('catalog.json').then(r=>r.json()).then(data=>{catalog=data.entries;render();}).catch(()=>{});
