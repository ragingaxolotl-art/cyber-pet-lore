import {mountComments} from './comments.mjs';
import {attachTagSuggestions} from './tag-suggestions.mjs';
import {STORAGE_KEY,emptyState,validateState,mergeStates} from './records.mjs';
import {paintHighlights} from './highlight-dom.mjs';

export function textKey(text){let a=2166136261,b=5381;for(const c of text){a=Math.imul(a^c.codePointAt(0),16777619);b=Math.imul(b,33)^c.codePointAt(0);}return (a>>>0).toString(36)+'-'+(b>>>0).toString(36);}
export const parseTags=value=>[...new Set(value.split(',').map(t=>t.trim().slice(0,70)).filter(Boolean))].slice(0,30);
let state,storageDamaged=false,unsaved=false,toolbar,dialog,noteInput,tagsInput,quote,status,pending;
const mounts=new Set();
const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
const home=new URL('index.html',import.meta.url);
function read(){const raw=localStorage.getItem(STORAGE_KEY);return raw?validateState(JSON.parse(raw)):emptyState();}
function record(id){return state.readings[id]||{read:false,readAt:null,note:'',tags:[],highlights:[],updatedAt:0,position:null};}
function persist(id,edit){
 try{if(!storageDamaged)state=mergeStates(state,read());}catch{storageDamaged=true;}
 const previous=record(id);state.readings[id]={...previous,highlights:edit(previous.highlights),updatedAt:Math.max(Date.now(),previous.updatedAt+1)};
 try{if(storageDamaged)throw Error();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));unsaved=false;status.textContent='Saved in this browser';}
 catch{unsaved=true;status.textContent='Not saved in this browser — download a backup before leaving';}
 for(const mount of mounts){if(!mount.root.isConnected){mounts.delete(mount);continue;}if(mount.id===id){mount.paint();mount.refreshCount();}}
}
function exportBackup(){const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=node('a');a.href=url;a.download='cyber-pet-lore-reading-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function setup(){
 if(toolbar)return;
 try{state=read();}catch{state=emptyState();storageDamaged=true;}
 const css=node('link');css.rel='stylesheet';css.href=new URL('article-notes.css',import.meta.url);document.head.append(css);
 toolbar=node('div');toolbar.className='article-selection';toolbar.hidden=true;toolbar.addEventListener('pointerdown',event=>event.preventDefault());toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Selected article text');
 const highlight=node('button','Highlight'),add=node('button','Add note & tags'),cancel=node('button','Cancel selection');
 highlight.onclick=()=>create(false);add.onclick=()=>create(true);cancel.onclick=()=>{pending=null;toolbar.hidden=true;};toolbar.append(highlight,add,cancel);document.body.append(toolbar);
 dialog=node('dialog');dialog.className='article-note-dialog';const close=node('button','Close');close.className='article-note-close';close.onclick=()=>dialog.close();
 const title=node('h2','Highlight note');title.id='article-note-heading';dialog.setAttribute('aria-labelledby',title.id);quote=node('blockquote');
 const noteLabel=node('label','Your note (optional)');noteInput=node('textarea');noteInput.rows=4;noteInput.maxLength=30000;noteLabel.append(noteInput);
 const tagLabel=node('label','Tags for this highlight');tagsInput=node('input');tagsInput.type='text';tagsInput.maxLength=2100;tagsInput.placeholder='e.g. mystery, character, revisit';tagLabel.append(tagsInput);attachTagSuggestions(tagsInput,()=>state);
 const save=node('button','Save note & tags');save.onclick=()=>{const {mount,id}=dialog.edit;persist(mount.id,items=>items.map(h=>h.id===id?{...h,note:noteInput.value,tags:parseTags(tagsInput.value)}:h));mount.renderNotes();dialog.close();};
 dialog.append(close,title,quote,noteLabel,tagLabel,node('p','Separate tags with commas.'),save);document.body.append(dialog);
 status=node('span',storageDamaged?'Saved data could not be opened — use Backups':'Highlights save in this browser');status.setAttribute('role','status');
 const bar=node('div');bar.className='article-notes-bar';const notebook=node('a','My notebook');notebook.href=home.href+'#notebook';const backups=node('a','Backups');backups.href=home.href;const download=node('button','Download reading backup');download.onclick=exportBackup;bar.append(notebook,backups,download,status);document.body.append(bar);
 document.addEventListener('selectionchange',capture);
 window.addEventListener('beforeunload',event=>{if(unsaved){event.preventDefault();event.returnValue='';}});
 window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY||!event.newValue||storageDamaged)return;try{state=mergeStates(state,validateState(JSON.parse(event.newValue)));for(const m of mounts)if(m.root.isConnected){m.paint();m.renderNotes();}}catch{}});
}
function capture(){
 if(dialog.open)return;
 const selected=window.getSelection();if(!selected||selected.isCollapsed||!selected.rangeCount){toolbar.hidden=true;return;}
 const range=selected.getRangeAt(0);
 const mount=[...mounts].find(m=>m.root.isConnected&&m.root.contains(range.startContainer)&&m.root.contains(range.endContainer));
 if(!mount){toolbar.hidden=true;return;}
 // Both endpoints must belong to prose, not our editor controls or navigation.
 const containing=n=>mount.blocks.find(b=>b.el.contains(n));
 if(!containing(range.startContainer)||!containing(range.endContainer)){toolbar.hidden=true;return;}
 const segments=[];
 for(const {el,id} of mount.blocks){if(!range.intersectsNode(el))continue;const text=el.textContent;let start=0,end=text.length;
  if(el.contains(range.startContainer)){const before=document.createRange();before.selectNodeContents(el);before.setEnd(range.startContainer,range.startOffset);start=before.toString().length;}
  if(el.contains(range.endContainer)){const before=document.createRange();before.selectNodeContents(el);before.setEnd(range.endContainer,range.endOffset);end=before.toString().length;}
  if(end>start)segments.push({block:id,start,end,quote:text.slice(start,end)});
 }
 if(!segments.length){toolbar.hidden=true;return;}pending={mount,segments};toolbar.hidden=false;
}
function create(edit){
 if(!pending)return;const {mount,segments}=pending;
 const h={id:crypto.randomUUID(),color:'gold',note:'',tags:[],createdAt:Date.now(),segments,context:{storyTitle:mount.title.slice(0,300),era:mount.era,href:mount.href}};
 persist(mount.id,items=>[...items,h]);window.getSelection()?.removeAllRanges();pending=null;toolbar.hidden=true;mount.renderNotes();if(edit)openEditor(mount,h.id);
}
function openEditor(mount,id){const h=record(mount.id).highlights.find(h=>h.id===id);if(!h)return;dialog.edit={mount,id};quote.textContent=h.segments.map(s=>s.quote).join('\n');noteInput.value=h.note;tagsInput.value=(h.tags||[]).join(', ');dialog.showModal();noteInput.focus();}
export function mountArticleNotes(root,{id,title,era=[],href}){
 setup();if(pending?.mount.root===root){pending=null;toolbar.hidden=true;}for(const old of mounts)if(old.root===root||!old.root.isConnected)mounts.delete(old);
 root.querySelectorAll(':scope > .article-highlight-notes, :scope > .lore-comments').forEach(el=>el.remove());
 const selectors='p,blockquote,li,h1,h2,h3,h4,td,dd,dt',seen=new Map();
 const blocks=[...root.querySelectorAll(selectors)].filter(el=>!el.querySelector(selectors)&&!el.closest('nav,button,label,.article-highlight-notes')&&el.textContent.trim()).map(el=>{const key=textKey(el.tagName+'\n'+el.textContent),n=seen.get(key)||0;seen.set(key,n+1);return {el,id:'text-'+key+'-'+n};});
 const details=node('details');details.className='article-highlight-notes';const summary=node('summary'),list=node('div');details.append(summary,node('p','Select article text to highlight it or add a note and tags. Links stay clickable.'),list);root.append(details);
 const mount={root,id,title,era:era.filter(e=>Number.isInteger(e)&&e>=-3&&e<=4),href,blocks,
  paint(){for(const b of blocks)paintHighlights(b.el,b.id,record(id).highlights,key=>openEditor(mount,key));},
  refreshCount(){summary.textContent='Highlight notes ('+record(id).highlights.length+') — select text to add';},
  renderNotes(){mount.refreshCount();list.replaceChildren();for(const h of record(id).highlights){const card=node('section');card.className='article-highlight-card';card.append(node('strong',h.context?.storyTitle||title),node('p',(h.createdAt?new Date(h.createdAt).toLocaleDateString():'Date not recorded')+' · '+(h.context?.era?.length?h.context.era.map(e=>'Era '+e).join(', '):'Era unspecified')),node('blockquote',h.segments.map(s=>s.quote).join('\n')));if(h.note)card.append(node('p',h.note));if(h.tags?.length)card.append(node('p',h.tags.join(', ')));const edit=node('button','Edit note & tags');edit.onclick=()=>openEditor(mount,h.id);const remove=node('button','Remove highlight');remove.onclick=()=>{persist(id,items=>items.filter(item=>item.id!==h.id));mount.renderNotes();};card.append(edit,remove);list.append(card);}}
 };mounts.add(mount);mount.paint();mount.renderNotes();
 const requested=new URLSearchParams(location.search).get('highlight');if(requested&&record(id).highlights.some(h=>h.id===requested))requestAnimationFrame(()=>{const mark=[...root.querySelectorAll('mark[data-highlight]')].find(m=>m.dataset.highlight===requested);if(mark){for(let p=mark.parentElement;p&&p!==root;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;mark.scrollIntoView({block:'center'});}else{details.open=true;details.scrollIntoView({block:'center'});}});
 const discussion=node('section');root.append(discussion);mountComments(discussion,{id,title});
 return mount;
}
