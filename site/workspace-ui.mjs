import {getNotebookStore} from './notebook-store.mjs';
import {validateTarget,targetHref} from './workspace-targets.mjs';
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const root=new URL('./',import.meta.url);
export function downloadNotebook(){const store=getNotebookStore(),url=URL.createObjectURL(new Blob([store.export()],{type:'application/json'}));const a=el('a');a.href=url;a.download='cyber-pet-notebook-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function openNoteEditor(target,{id=null,note=null}={}){
 target=validateTarget(target);const editing=!!id;id=id||crypto.randomUUID();const store=getNotebookStore(),base=store.snapshot().workspace;const dialog=el('dialog');dialog.className='workspace-note-dialog';dialog.setAttribute('aria-label','Note on '+target.title);
 const heading=el('h2',editing?'Edit my note':'Note on '+target.title),context=el('p',target.kind==='map'?'Historical stage '+target.stage:target.kind==='audio'?'At '+target.start.toFixed(1)+' seconds':'Saved in your notebook, separate from public comments.');
 const label=el('label','My note'),text=el('textarea');text.rows=6;text.maxLength=30000;text.value=note?.text||'';label.append(text);
 const tagsLabel=el('label','Tags'),tags=el('input');tags.value=(note?.tags||[]).join(', ');tags.placeholder='Separate tags with commas';tagsLabel.append(tags);
 const statusLabel=el('label','Type'),status=el('select');for(const [value,title] of [['note','Note'],['question','Open question'],['resolved','Resolved question']]){const o=el('option',title);o.value=value;status.append(o);}status.value=note?.status||'note';statusLabel.append(status);
 const pinLabel=el('label','Pin this note '),pin=el('input');pin.type='checkbox';pin.checked=!!note?.pinned;pinLabel.prepend(pin);
 const feedback=el('p');feedback.setAttribute('role','status');const save=el('button','Save note');save.type='button';save.onclick=()=>{store.updateWorkspace('notes',id,{target,text:text.value,tags:[...new Set(tags.value.split(',').map(s=>s.trim().slice(0,70)).filter(Boolean))].slice(0,30),status:status.value,pinned:pin.checked,createdAt:note?.createdAt||Date.now()},base);feedback.textContent=store.status;if(!store.unsaved)dialog.close();};
 const cancel=el('button','Cancel');cancel.onclick=()=>dialog.close();const notebook=el('a','Open my notebook');notebook.href=new URL('notebook.html',root).href;
 dialog.append(heading,context,label,tagsLabel,statusLabel,pinLabel,save,cancel,notebook,feedback);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();text.focus();
}
export function noteButton(getTarget,label='Add my note'){const button=el('button',label);button.type='button';button.className='workspace-note-button';button.onclick=()=>{try{openNoteEditor(typeof getTarget==='function'?getTarget():getTarget);}catch(error){button.textContent=error.message;}};return button;}
export function mountWorkspaceBar(){
 if(document.getElementById('workspace-bar'))return;
 const bar=el('aside');bar.id='workspace-bar';bar.setAttribute('aria-label','My workspace');
 const notebook=el('a','My notebook');notebook.href=new URL('notebook.html',root).href;
 const search=el('a','Search all lore');search.href=new URL('search.html',root).href;
 const status=el('span');status.setAttribute('role','status');const backup=el('a','Backups');backup.href=new URL('notebook.html#backups',root).href;
 bar.append(search,notebook,backup,status);document.body.append(bar);getNotebookStore().subscribe((_,message)=>{status.textContent=message;});
 const css=el('link');css.rel='stylesheet';css.href=new URL('workspace.css',root).href;document.head.append(css);
}
