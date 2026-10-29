import {createIndex, filterEntries, referenceCSV} from './genre-model.mjs';
const $ = id => document.getElementById(id);
const dialog = $('genre-dialog');
let index, data, activeId, opener, hashBeforeDialog = '';
const contentCache = new Map();
function element(tag, text, className) { const el=document.createElement(tag); if(text !== undefined) el.textContent=text; if(className) el.className=className; return el; }
function button(entry, className='genre-inline-link') { const el=element('button',entry.name,className); el.type='button'; el.dataset.genre=entry.id; el.setAttribute('aria-haspopup','dialog'); return el; }
function option(select,value,text) {const el=element('option',text); el.value=value; select.append(el);}
function render() {
  const filtered=filterEntries(index,{query:$('genre-search').value,category:$('genre-category').value,kind:$('genre-kind').value,match:$('genre-match').value,story:$('genre-story').value});
  const fragment=document.createDocumentFragment();
  for(const entry of filtered) {
    const path=index.path(entry), matches=index.matches(entry), direct=entry.matches.some(m=>index.stories.has(m.story));
    const row=element('tr',undefined,`${entry.parent ? '' : 'root '} ${direct?'direct-match':matches.length?'branch-match':''}`); row.dataset.entry=entry.id;
    const name=element('td');
    if(path.length>1) name.append(element('span',path.slice(0,-1).map(p=>p.name).join(' › '),'genre-path'));
    name.append(button(entry,'genre-name')); row.append(name);
    const kind=element('td'); kind.append(element('span',entry.kind,'genre-type-badge'+(entry.kind==='Planning label'?' planning':''))); row.append(kind);
    row.append(element('td',entry.definition));
    const examples=element('td'); examples.append(element('span',matches.length ? `${direct?'●':'◒'} ${matches.length} ${matches.length===1?'story':'stories'}${direct?'':' in branches'}` : '○ No reviewed match yet','genre-match-label'));
    if(matches.length) {const open=button(entry,'genre-open-matches'); open.textContent='See matches & reasons'; open.setAttribute('aria-label',`See matches and reasons for ${entry.name}`); examples.append(open);}
    row.append(examples); fragment.append(row);
  }
  $('genre-rows').replaceChildren(fragment); $('genre-count').textContent=`${filtered.length} of ${data.entries.length} entries`; $('genre-empty').hidden=!!filtered.length;
}
async function evidence(match, target) {
  target.replaceChildren(element('p','Loading supporting passage…'));
  try {
    if(!contentCache.has(match.story)) contentCache.set(match.story,fetch(`content/${encodeURIComponent(match.story)}.json`).then(r=>{if(!r.ok)throw Error('Reading unavailable');return r.json();}).catch(e=>{contentCache.delete(match.story);throw e;}));
    const reading=await contentCache.get(match.story), at=reading.blocks.findIndex(block=>block.id===match.paragraph);
    if(at<0) throw Error('Passage unavailable');
    target.replaceChildren();
    for(const block of reading.blocks.slice(Math.max(0,at-1),at+2)) {const p=element('p',block.text);p.append(element('small',block.id));target.append(p);}
    const link=element('a','Read the full story in this tab →');link.href=`index.html#read=${encodeURIComponent(match.story)}&block=${encodeURIComponent(match.paragraph)}`;target.append(link);
  } catch {const p=element('p','The supporting passage could not load.');const retry=element('button','Try again');retry.type='button';retry.addEventListener('click',()=>evidence(match,target));target.replaceChildren(p,retry);}
}
function showEntry(id, trigger) {
  const entry=index.byId.get(id); if(!entry)return;
  if(!dialog.open) {opener=trigger || document.activeElement;hashBeforeDialog=location.hash.startsWith('#genre=')?'':location.hash;}
  activeId=id; history.replaceState(null,'',`#genre=${encodeURIComponent(id)}`);
  $('genre-title').textContent=entry.name; $('genre-type').textContent=entry.kind; $('genre-definition').textContent=entry.definition; $('genre-scope').textContent=entry.scopeNote; $('genre-prompt').textContent=entry.prompt;
  const crumbs=index.path(entry).slice(0,-1);$('genre-breadcrumbs').replaceChildren();
  crumbs.forEach((parent,i)=>{if(i)$('genre-breadcrumbs').append(element('span','›'));$('genre-breadcrumbs').append(button(parent));});
  const children=index.children.get(id)||[]; $('genre-children-section').hidden=!children.length;$('genre-children').replaceChildren(...children.map(child=>button(child)));
  const matches=index.matches(entry); $('genre-examples').replaceChildren();
  if(!matches.length)$('genre-examples').append(element('p','No existing story has been reviewed as a match for this branch yet. Use the writing question above to explore a new direction.','genre-empty-matches'));
  for(const match of matches) {
    const story=index.stories.get(match.story), card=element('article',undefined,'genre-example');card.append(element('h4',story.title));
    if(story.status || /unfinished|planned|draft/i.test(story.summary || '')) card.append(element('p',[story.status,story.summary].filter(Boolean).join(' · '),'example-status'));
    const label=element('p',match.via===id?'Editorial match':'Match through a narrower branch: ','genre-small');if(match.via!==id)label.append(button(index.byId.get(match.via)));card.append(label,element('p',match.reason));
    const details=element('details');details.append(element('summary','Read supporting passage here (spoilers)'));const passage=element('div',undefined,'genre-evidence');details.append(passage);let loaded=false;details.addEventListener('toggle',()=>{if(details.open&&!loaded){loaded=true;evidence(match,passage);}});card.append(details);$('genre-examples').append(card);
  }
  if(!dialog.open)dialog.showModal(); document.body.classList.add('genre-modal-open');dialog.scrollTop=0;$('genre-close').focus();
}
dialog.addEventListener('close',()=>{document.body.classList.remove('genre-modal-open');activeId=null;history.replaceState(null,'',location.pathname+location.search+hashBeforeDialog);opener?.focus();});
$('genre-close').addEventListener('click',()=>dialog.close());
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-genre]');if(trigger&&index)showEntry(trigger.dataset.genre,trigger);});
function fromHash(){if(!index)return;const id=new URLSearchParams(location.hash.slice(1)).get('genre');if(id&&index.byId.has(id))showEntry(id);else if(dialog.open)dialog.close();}
window.addEventListener('hashchange',fromHash);
$('genre-filters').addEventListener('input',()=>{if(index)render();});
$('genre-filters').addEventListener('change',()=>{if(index)render();});
$('genre-filters').addEventListener('submit',e=>e.preventDefault());
$('genre-filters').addEventListener('reset',()=>queueMicrotask(()=>{if(index)render();}));
$('genre-export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([referenceCSV(index)],{type:'text/csv;charset=utf-8'}));const a=element('a');a.href=url;a.download='cyber-pet-story-genres.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
async function load() {
  $('genre-error').hidden=true;
  try {
    const results=await Promise.all(['genres.json','catalog.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error('Reference unavailable');return r.json();}));
    data=results[0];index=createIndex(data,results[1]);
    for(const id of ['genre-category','genre-kind','genre-story'])while($(id).options.length>1)$(id).remove(1);
    for(const root of index.children.get(null)||[])option($('genre-category'),root.id,root.name);
    for(const kind of [...new Set(data.entries.map(e=>e.kind))].sort())option($('genre-kind'),kind,kind);
    for(const story of [...index.stories.values()].sort((a,b)=>a.title.localeCompare(b.title)))option($('genre-story'),story.id,story.title);
    const matchedStories=new Set(data.entries.flatMap(e=>e.matches.map(m=>m.story)));
    $('genre-stats').textContent=`${data.entries.length} entries · ${(index.children.get(null)||[]).length} broad shelves · ${matchedStories.size} existing stories reviewed`;
    const refs=element('p','Terminology background: ');data.references.forEach((reference,i)=>{if(i)refs.append(document.createTextNode(' · '));const link=element('a',reference.title);link.href=reference.url;link.title=reference.note;refs.append(link);});$('genre-references').replaceChildren(refs,element('p','Definitions, writing questions, hierarchy, and story assessments are original editorial material. Updated '+data.updated+'.'));
    $('genre-export').disabled=false;render();fromHash();
  } catch(error) {$('genre-error').hidden=false;$('genre-stats').textContent='Reference unavailable';$('genre-count').textContent='';}
}
$('genre-retry').addEventListener('click',load);
load();
