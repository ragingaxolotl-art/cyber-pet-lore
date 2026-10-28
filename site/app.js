import {renderContinuityNotes} from './profiles.mjs';
import {renderLocationArt} from './location-art.mjs';
import {loadWiki,appendWiki,readingConnections} from './wiki-links.mjs?v=profiles-1';
import {CloudBackup,SESSION_KEY} from './cloud-backup.mjs?v=code-1';
import {STORAGE_KEY,emptyState,validateState,mergeStates,highlightIntervals,clipContext} from './records.mjs';
const $=id=>document.getElementById(id);
const ERA_NAMES={'-3':'Borrowed Thought','-2':'Shelter','-1':'Becoming',0:'Great Flourishing',1:'Echoes',2:'Great Reduction',3:'Small Lives',4:'Reopening'};
const eraName=e=>`Era ${e<0?'−'+Math.abs(e):e} · ${ERA_NAMES[e]||''}`;
let wikiData;
let state=emptyState(),catalog,entries=[],byId=new Map(),kind='Story',page=0,filtered=[],current=null,currentContent=null,selection=[],beforeImport=null,routeSequence=0,lastWrite=0,tagFilter='';
const contentCache=new Map();
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
function alertSave(text){$('save-alert').textContent=text;$('save-alert').hidden=false;$('reader-save').textContent='Not saved — download a backup';}
try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)state=validateState(JSON.parse(raw));}catch{alertSave('Your saved reading data could not be opened. It has not been overwritten. Use Backups to export your current work.');}
let storageCorrupt=false;try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)validateState(JSON.parse(raw));}catch{storageCorrupt=true;}
function record(id){return state.readings[id]??{read:false,readAt:null,note:'',tags:[],highlights:[],updatedAt:0,position:null};}
function save(){
 let saved=false;
 try{
  if(storageCorrupt)throw Error('Existing data needs recovery');
  const raw=localStorage.getItem(STORAGE_KEY);
  if(raw){const previous=validateState(JSON.parse(raw));state=mergeStates(state,previous);try{localStorage.setItem(STORAGE_KEY+'.previous',raw);}catch{}}
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));$('reader-save').textContent='Saved in this browser';$('save-alert').hidden=true;lastWrite=Date.now();saved=true;
 }catch{alertSave('Browser storage is unavailable or full. Your latest changes are in this open page only. Download a reading backup before leaving.');}
 queueCloudBackup();updateProgress();return saved;
}
let confirmationTimer;
$('save-reading').onclick=()=>{
 clearTimeout(confirmationTimer);
 const saved=save();
 if(cloud)void backUpCloud();
 $('save-confirmation').textContent=saved?'✓ Saved — your reading progress, highlights, and notes are saved in this browser.':'Could not save. See the storage warning above.';
 $('save-confirmation').hidden=false;
 confirmationTimer=setTimeout(()=>{$('save-confirmation').hidden=true;},6000);
};
function updateRecord(id,changes){state.readings[id]={...record(id),...changes,updatedAt:Math.max(Date.now(),record(id).updatedAt+1)};save();}
function setRead(id,checked){updateRecord(id,{read:checked,readAt:checked?Date.now():null});if(current?.id===id){$('reader-read').checked=checked;$('finish-read').textContent=checked?'✓ Read':'✓ Mark as read';}renderLibrary();}
function updateProgress(){
 if(!entries.length)return;
 const count=entries.filter(e=>record(e.id).read).length;$('entry-count').textContent=entries.length;$('progress-count').textContent=count;$('progress-fill').style.width=`${count/entries.length*100}%`;
 $('note-count').textContent=Object.values(state.readings).filter(r=>r.note||r.highlights.length).length;
 const recent=byId.get(state.lastReading);$('resume').hidden=!recent;if(recent){$('resume').href='#read='+encodeURIComponent(recent.id);$('resume').replaceChildren(node('span','Continue: '+recent.title),node('span','→'));}
}
function fillSelect(id,values,label){const s=$(id);s.replaceChildren(new Option(label,''));for(const v of values)s.add(new Option(v,v));}
function renderNav(){const labels={'':'All readings',Story:'Stories',Song:'Songs & backstories',Timeline:'Timeline',People:'People',Locations:'Locations',Language:'Language',Reference:'Reference',Draft:'Drafts & alternate copies'};const nav=$('kind-nav');nav.replaceChildren();for(const [k,label] of Object.entries(labels)){const b=node('button',label);b.classList.toggle('selected',kind===k);b.setAttribute('aria-pressed',kind===k);b.append(node('span',entries.filter(e=>!k||e.kind===k).length));b.onclick=()=>{kind=k;page=0;renderNav();renderLibrary();};nav.append(b);}$('collection-title').textContent=labels[kind]||'All readings';}
function searchable(e){return [e.title,e.summary,e.timeLabel,e.status,...(e.characters||[]),...(e.places||[]),...(e.topics||[]),...(record(e.id).tags||[])].join(' ').toLocaleLowerCase();}
function renderLibrary(){
 if(!catalog)return;
 const query=$('search').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean),era=$('era-filter').value,person=$('character-filter').value,place=$('place-filter').value,read=$('read-filter').value,sort=$('sort-filter').value;
 filtered=entries.filter(e=>(!kind||e.kind===kind)&&(!era||(e.era||[]).includes(Number(era)))&&(!person||(e.characters||[]).includes(person))&&(!place||(e.places||[]).includes(place))&&(!tagFilter||record(e.id).tags.includes(tagFilter))&&(!read||(read==='read'?record(e.id).read:read==='unread'?!record(e.id).read:record(e.id).note||record(e.id).highlights.length))&&query.every(q=>searchable(e).includes(q)));
 if(sort==='title')filtered.sort((a,b)=>a.title.localeCompare(b.title));else if(sort==='timeline')filtered.sort((a,b)=>(Math.min(...(a.era?.length?a.era:[99]))-Math.min(...(b.era?.length?b.era:[99])))||((a.timeOrder??0)-(b.timeOrder??0))||a.title.localeCompare(b.title));
 page=Math.min(page,Math.max(0,Math.ceil(filtered.length/40)-1));$('result-count').textContent=`${filtered.length} readings`;$('empty').hidden=!!filtered.length;
 const tbody=$('toc-body');tbody.replaceChildren();let group=null;
 for(const e of filtered.slice(page*40,page*40+40)){
  const primary=e.era?.length?Math.min(...e.era):null,groupText=primary===null?'Across eras / time unspecified':eraName(primary);
  if(sort==='timeline'&&group!==groupText){group=groupText;const tr=node('tr',undefined,'group-row');const td=node('td',groupText);td.colSpan=4;tr.append(td);tbody.append(tr);}
  const tr=node('tr');const titleCell=node('td');const a=node('a',e.title,'row-title');a.href='#read='+encodeURIComponent(e.id);titleCell.append(a);
  titleCell.append(node('div',`${e.kind} · ${Math.max(1,Math.ceil((e.wordCount||0)/220))} min read`,'row-meta'));
  if(e.status){const s=node('span',e.status,'status-pill');if(/draft|superseded|unfinished|alternate|proposal/i.test(e.status))s.classList.add('draft');titleCell.append(s);}
  for(const tag of record(e.id).tags){const b=node('button',tag,'my-tag');b.onclick=()=>{tagFilter=tag;page=0;renderLibrary();};titleCell.append(b);}
  const time=node('td');time.append(node('span',e.era?.length?e.era.map(x=>'Era '+String(x).replace('-','−')).join(' · '):'Time unspecified','era-label'),node('span',e.timeLabel||'See source chronology','time-detail'));
  const context=node('td');for(const person of (e.characters||[]).slice(0,3)){const b=node('button',person,'person-chip');b.title='Filter readings mentioning '+person;b.onclick=()=>{$('character-filter').value=person;page=0;renderLibrary();};context.append(b);}if(e.characters?.length>3)context.append(node('span',`+${e.characters.length-3} more`,'context-topics'));context.append(node('div',(e.topics||[]).slice(0,3).join(' · '),'context-topics'));
  const readCell=node('td',undefined,'read-column'),check=node('input');check.type='checkbox';check.checked=record(e.id).read;check.setAttribute('aria-label','Mark '+e.title+' as read');check.onchange=()=>setRead(e.id,check.checked);readCell.append(check);if(record(e.id).read)readCell.append(node('span','Read','read-date'));
  tr.append(titleCell,time,context,readCell);tbody.append(tr);
 }
 $('page-label').textContent=filtered.length?`${page+1} / ${Math.ceil(filtered.length/40)}`:'0 readings';$('previous-page').disabled=page===0;$('next-page').disabled=(page+1)*40>=filtered.length;
 $('active-tags').replaceChildren();if(tagFilter){const b=node('button','My tag: '+tagFilter+' ×','my-tag');b.onclick=()=>{tagFilter='';renderLibrary();};$('active-tags').append(b);}
 for(const b of $('era-strip').children)b.classList.toggle('active',b.dataset.era===era);
 renderNav();updateProgress();
}
function renderBlocks(){
 const parent=$('reading-text');parent.replaceChildren();const r=record(current.id);
 for(const block of currentContent.blocks){
  let tag='p';const style=String(block.style||'');if(/TITLE|HEADING_1|^h1$|^h2$/i.test(style))tag='h2';else if(/HEADING_2|^h3$/i.test(style))tag='h3';else if(/HEADING_[3-6]|^h4$/i.test(style))tag='h4';else if(/^>/.test(block.text))tag='blockquote';
  const el=node(tag,undefined,'reading-block');el.dataset.block=block.id;el.id='block-'+block.id;
  if(/^[-—*_]{3,}$/.test(block.text.trim()))el.classList.add('divider');
  for(const part of highlightIntervals(block.text,block.id,r.highlights)){if(part.id){const m=node('mark',part.text);m.dataset.color=part.color;m.dataset.highlight=part.id;const highlighted=r.highlights.find(h=>h.id===part.id);m.title=highlighted?.clip?'Clip #'+highlighted.clip.number+(highlighted.note?' — '+highlighted.note:''):(highlighted?.note||'Highlighted passage');m.onclick=()=>{const card=document.getElementById('highlight-'+part.id);card?.scrollIntoView({block:'center'});card?.querySelector('textarea')?.focus({preventScroll:true});};el.append(m);}else appendWiki(el,part.text,{readingId:current.id});}
  parent.append(el);
 }
}
function renderConnections(entry){
 const panel=$('reading-connections');panel.replaceChildren(node('h2','Follow the connections'));
 if(entry.song){const listen=node('a','Listen to '+entry.title.split(' — ')[0]+' →','primary');listen.href='songs/#song='+encodeURIComponent(entry.song);panel.append(listen);}
 if(entry.kind==='Language'||entry.kind==='Song'){
  const translator=node('a','Open DBA translator ↗');translator.href='https://ragingaxolotl-art.github.io/era-zero-translator/';translator.target='_blank';translator.rel='noopener';panel.append(node('p','Explore the language in the translator.'),translator);
 }
 const facets=node('div',undefined,'connection-facets');
 for(const [key,values] of [['character',entry.characters||[]],['place',entry.places||[]]])for(const value of values){
  const a=node('a',value,'person-chip');a.href='#'+key+'='+encodeURIComponent(value);a.title='Browse all readings mentioning '+value;facets.append(a);
 }
 if(facets.children.length)panel.append(node('p','Browse people, groups and places mentioned:'),facets);
 const connections=(entry.connections||[]).filter(c=>byId.has(c.id));
 if(connections.length){
  panel.append(node('p','Named mentions and song-cycle connections. A mention alone does not establish a shared identity, event or location.','small-note'));
  const groups=new Map();
  for(const c of connections){const target=byId.get(c.id);if(!groups.has(target.kind))groups.set(target.kind,[]);groups.get(target.kind).push([c,target]);}
  for(const [kind,items] of groups){const details=node('details'),summary=node('summary',kind+' · '+items.length),list=node('ul');details.open=items.length<=6;
   for(const [c,target] of items){const li=node('li'),a=node('a',target.title);a.href='#read='+encodeURIComponent(target.id);li.append(a,node('span',' — '+c.label+' · '+target.status,'small-note'));list.append(li);}details.append(summary,list);panel.append(details);
  }
 }else panel.append(node('p','No direct reading connections have been indexed yet. Browse the library for more context.'));
}
function scrollToBlock(id){document.getElementById('block-'+id)?.scrollIntoView({block:'start',behavior:'instant'});}
function renderHighlights(){
 const r=record(current.id);$('highlight-count').textContent=r.highlights.length;const list=$('highlights-list');list.replaceChildren();
 for(const h of r.highlights){const card=node('div',undefined,'highlight-card');card.id='highlight-'+h.id;if(h.clip){card.append(node('strong','Clip #'+h.clip.number,'clip-label'),node('p',h.clip.timeLabel+' · '+(h.clip.characters.join(', ')||'No characters identified'),'small-note'));}const quote=node('blockquote',h.segments.map(s=>s.quote).join('\n'));quote.style.borderColor={gold:'#d5aa46',blue:'#68aaca',rose:'#c77c8a'}[h.color];const note=node('textarea');note.rows=3;note.maxLength=30000;note.value=h.note;note.placeholder='Add a note to this passage…';note.setAttribute('aria-label','Note for highlighted passage');note.oninput=()=>{const highlights=record(current.id).highlights.map(x=>x.id===h.id?{...x,note:note.value}:x);updateRecord(current.id,{highlights});};const actions=node('div',undefined,'highlight-actions');const go=node('button','Go to passage');go.onclick=()=>scrollToBlock(h.segments[0].block);const remove=node('button','Remove');remove.onclick=()=>{updateRecord(current.id,{highlights:record(current.id).highlights.filter(x=>x.id!==h.id)});renderBlocks();renderHighlights();};if(!h.clip){const clip=node('button','Clip');clip.onclick=()=>prepareClip(h.segments,h);actions.append(clip);}actions.append(go,remove);if(h.clip){const copy=node('button','Copy passage');copy.onclick=()=>copyPassage(h,copy);actions.append(copy);}card.append(quote,note,actions);list.append(card);}
}
async function openReading(id,anchor=null){
 const seq=++routeSequence,e=byId.get(id);if(!e){location.hash='';return;}hideSelection();current=e;$('library').hidden=true;$('notebook').hidden=true;$('reader').hidden=false;$('reader-title').textContent=e.title;$('reader-kind').textContent=e.kind;$('reader-summary').textContent=e.summary||'';$('reading-text').replaceChildren(node('p','Opening this reading…','loading'));$('reader-meta').replaceChildren();for(const value of [e.timeLabel,e.status,`${(e.wordCount||0).toLocaleString()} words`].filter(Boolean))$('reader-meta').append(node('span',value));$('reader-read').checked=record(id).read;$('finish-read').textContent=record(id).read?'✓ Read':'✓ Mark as read';$('reading-note').value=record(id).note;$('reading-tags').value=record(id).tags.join(', ');$('original-source').href=e.source?.url||'#';$('original-source').hidden=true;
 renderConnections(e);
 renderContinuityNotes($('reader-continuity'),wikiData?.readingNotes?.[e.id]||[]);
 renderLocationArt($('reader-art'),wikiData?.readingImages?.[e.id]||[]);
 window.scrollTo({top:0,behavior:'instant'});
 try{let content=contentCache.get(id);if(!content){const response=await fetch('content/'+encodeURIComponent(id)+'.json');if(!response.ok)throw Error('Reading unavailable');content=await response.json();contentCache.set(id,content);}if(seq!==routeSequence)return;currentContent=content;renderBlocks();renderHighlights();renderWikiConnections();const outline=$('outline');outline.replaceChildren();for(const b of content.blocks.filter(b=>/HEADING|TITLE|^h[1-4]$/i.test(b.style||''))){const a=node('a',b.text);a.href='#block-'+b.id;a.onclick=ev=>{ev.preventDefault();scrollToBlock(b.id);};outline.append(a);}if(!outline.children.length)outline.append(node('p','A continuous reading.'));const connectionsLink=node('a','People, places & related readings ↓');connectionsLink.href='#reading-connections';connectionsLink.onclick=ev=>{ev.preventDefault();$('reading-connections').scrollIntoView({block:'start'});};outline.append(connectionsLink);state.lastReading=id;save();requestAnimationFrame(()=>{if(seq===routeSequence&&(anchor||record(id).position))scrollToBlock(anchor||record(id).position.block);});}catch{if(seq===routeSequence)$('reading-text').replaceChildren(node('p','This reading could not load. Check your connection and reopen it. Your notes are still saved.'));}
}
function hideSelection(){selection=[];$('selection-toolbar').hidden=true;}
function captureSelection(){
 if(!current||$('reader').hidden)return;const s=window.getSelection();if(!s||s.isCollapsed||!s.rangeCount)return hideSelection();const range=s.getRangeAt(0),container=$('reading-text');if(!container.contains(range.startContainer)||!container.contains(range.endContainer))return hideSelection();
 const segments=[];for(const el of container.children){if(!range.intersectsNode(el))continue;const text=el.textContent;let start=0,end=text.length;if(el.contains(range.startContainer)){const before=document.createRange();before.selectNodeContents(el);before.setEnd(range.startContainer,range.startOffset);start=before.toString().length;}if(el.contains(range.endContainer)){const before=document.createRange();before.selectNodeContents(el);before.setEnd(range.endContainer,range.endOffset);end=before.toString().length;}if(end>start)segments.push({block:el.dataset.block,start,end,quote:text.slice(start,end)});}
 if(!segments.length)return hideSelection();selection=segments;$('selection-toolbar').hidden=false;
}
function addHighlight(withNote){if(!selection.length||!current)return;const h={id:crypto.randomUUID(),color:$('highlight-color').value,note:'',segments:structuredClone(selection),createdAt:Date.now()};updateRecord(current.id,{highlights:[...record(current.id).highlights,h]});window.getSelection()?.removeAllRanges();hideSelection();renderBlocks();renderHighlights();if(withNote){const note=$('highlight-'+h.id)?.querySelector('textarea');note?.scrollIntoView({block:'center'});note?.focus({preventScroll:true});}}
let pendingClip=null;
function prepareClip(segments,existing=null){
 if(!current||!segments.length)return;
 pendingClip={readingId:current.id,segments:structuredClone(segments),existingId:existing?.id,context:clipContext(current,currentContent.blocks,segments),color:existing?.color||$('highlight-color').value};
 $('clip-context').textContent=pendingClip.context.storyTitle+' · '+pendingClip.context.timeLabel;
 $('clip-quote').textContent=segments.map(s=>s.quote).join('\n');
 $('clip-characters').value=pendingClip.context.characters.join(', ');$('clip-note').value=existing?.note||'';
 hideSelection();$('clip-dialog').showModal();$('clip-note').focus();
}
$('confirm-clip').onclick=()=>{
 if(!pendingClip)return;
 const p=pendingClip;
 // Refresh the shared browser counter before assigning a number.
 try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)state=mergeStates(state,validateState(JSON.parse(raw)));}catch{}
 const number=state.nextClipNumber++;
 const h={id:p.existingId||crypto.randomUUID(),color:p.color,note:$('clip-note').value,segments:p.segments,createdAt:Date.now(),clip:{...p.context,number,characters:[...new Set($('clip-characters').value.split(',').map(x=>x.trim().slice(0,150)).filter(Boolean))].slice(0,100)}};
 updateRecord(p.readingId,{highlights:[...record(p.readingId).highlights.filter(x=>x.id!==h.id),h]});
 $('clip-dialog').close();pendingClip=null;window.getSelection()?.removeAllRanges();renderBlocks();renderHighlights();
 const card=$('highlight-'+h.id);card?.scrollIntoView({block:'nearest'});
};
async function copyPassage(h,button){try{await navigator.clipboard.writeText(h.segments.map(s=>s.quote).join('\n'));button.textContent='Copied';}catch{button.textContent='Select the quote to copy';}}
function renderNotebook(){
 ++routeSequence;hideSelection();current=null;$('library').hidden=true;$('reader').hidden=true;$('notebook').hidden=false;const list=$('notebook-list');list.replaceChildren();const onlyClips=$('clips-only').checked;
 for(const [id,r] of Object.entries(state.readings).filter(([,r])=>onlyClips?r.highlights.some(h=>h.clip):r.note||r.highlights.length||r.tags.length).sort((a,b)=>b[1].updatedAt-a[1].updatedAt)){
  const e=byId.get(id),card=node('article',undefined,'notebook-entry'),heading=node('h2'),a=node('a',e?.title||'Reading no longer in this snapshot');if(e)a.href='#read='+encodeURIComponent(id);heading.append(a);card.append(heading,node('div',[e?.timeLabel,r.read?'✓ Read':'Not yet read',...r.tags].filter(Boolean).join(' · '),'row-meta'));if(r.note&&!onlyClips)card.append(node('p',r.note,'entry-note'));
  for(const item of r.highlights.filter(h=>!onlyClips||h.clip)){
   const section=node('section',undefined,'notebook-passage');
   if(item.clip)section.append(node('h3','Clip #'+item.clip.number),node('p',item.clip.storyTitle+' · '+item.clip.timeLabel+' · Characters: '+(item.clip.characters.join(', ')||'None identified'),'row-meta'));
   section.append(node('blockquote',item.segments.map(s=>s.quote).join('\n')));
   const label=node('label',item.clip?'Clip notes':'Passage notes'),note=node('textarea');note.rows=3;note.maxLength=30000;note.value=item.note;label.append(note);note.oninput=()=>updateRecord(id,{highlights:record(id).highlights.map(h=>h.id===item.id?{...h,note:note.value}:h)});section.append(label);
   if(e){const go=node('a','Return to passage →');go.href='#read='+encodeURIComponent(id)+'&block='+encodeURIComponent(item.segments[0].block);section.append(go);}
   if(item.clip){const copy=node('button','Copy passage');copy.onclick=()=>copyPassage(item,copy);section.append(copy);}card.append(section);
  }list.append(card);
 }
 if(!list.children.length)list.append(node('p',onlyClips?'No clips yet. Select a passage in a reading and choose Clip.':'Your notebook is waiting. Open a reading, select a passage, and add your first note.'));window.scrollTo({top:0,behavior:'instant'});
}
$('clips-only').onchange=renderNotebook;
function route(){if(!catalog)return;const hash=location.hash.slice(1);if(hash.startsWith('read=')){const params=new URLSearchParams(hash);openReading(params.get('read'),params.get('block'));}else if(hash==='notebook')renderNotebook();else{++routeSequence;hideSelection();current=null;$('library').hidden=false;$('reader').hidden=true;$('notebook').hidden=true;if(hash.startsWith('place=')||hash.startsWith('character=')){const params=new URLSearchParams(hash);kind='';page=0;tagFilter='';$('search').value='';for(const id of ['era-filter','character-filter','place-filter','read-filter'])$(id).value='';for(const key of ['place','character'])if(params.has(key))$(key+'-filter').value=params.get(key);}renderLibrary();}}
function download(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('backup-open').onclick=()=>{$('backup-stats').textContent=`${Object.values(state.readings).filter(r=>r.read).length} read · ${Object.values(state.readings).reduce((n,r)=>n+r.highlights.length,0)} highlights · ${Object.values(state.readings).filter(r=>r.note).length} reading notes`;$('backup-dialog').showModal();};
$('export-backup').onclick=()=>download({...state,exportedAt:new Date().toISOString()},'cyber-pet-lore-reading-'+new Date().toISOString().slice(0,10)+'.json');
$('import-backup').onchange=async ev=>{const file=ev.target.files[0];if(!file)return;try{if(file.size>15*1024*1024)throw Error('Choose a reading backup smaller than 15 MB.');const incoming=validateState(JSON.parse(await file.text()));beforeImport=structuredClone(state);try{localStorage.setItem(STORAGE_KEY+'.before-import',JSON.stringify(beforeImport));}catch{}state=mergeStates(state,incoming);save();$('download-before-import').hidden=false;$('import-status').textContent='Backup imported. Reading records merged.';route();}catch(err){$('import-status').textContent=err.message||'Could not import this file. Nothing changed.';}ev.target.value='';};
$('download-before-import').onclick=()=>{if(beforeImport)download(beforeImport,'cyber-pet-lore-before-import.json');};
$('notebook-open').onclick=()=>location.hash='notebook';$('back-library').onclick=$('notebook-back').onclick=()=>location.hash='';$('sources-open').onclick=()=>$('sources-dialog').showModal();
$('reader-read').onchange=()=>setRead(current.id,$('reader-read').checked);$('finish-read').onclick=()=>setRead(current.id,!record(current.id).read);
$('reading-note').oninput=()=>{if(current)updateRecord(current.id,{note:$('reading-note').value});};$('reading-tags').oninput=()=>{if(current)updateRecord(current.id,{tags:[...new Set($('reading-tags').value.split(',').map(s=>s.trim().slice(0,70)).filter(Boolean))].slice(0,30)});};
$('next-reading').onclick=()=>{const list=filtered.length?filtered:entries,index=list.findIndex(e=>e.id===current.id);const next=list[index+1];if(next)location.hash='read='+encodeURIComponent(next.id);else location.hash='';};
function appearance(){document.documentElement.style.setProperty('--read-size',state.preferences.fontSize+'px');document.body.classList.toggle('warm-reader',state.preferences.warm);}
$('font-up').onclick=()=>{state.preferences.fontSize=Math.min(27,state.preferences.fontSize+1);appearance();save();};$('font-down').onclick=()=>{state.preferences.fontSize=Math.max(15,state.preferences.fontSize-1);appearance();save();};$('reader-theme').onclick=()=>{state.preferences.warm=!state.preferences.warm;appearance();save();};
for(const id of ['search','era-filter','character-filter','place-filter','read-filter','sort-filter'])$(id).addEventListener(id==='search'?'input':'change',()=>{page=0;renderLibrary();});
$('reset-filters').onclick=()=>{for(const id of ['search','era-filter','character-filter','place-filter','read-filter'])$(id).value='';tagFilter='';page=0;renderLibrary();};
$('previous-page').onclick=()=>{page--;renderLibrary();$('collection-title').scrollIntoView({block:'start'});};$('next-page').onclick=()=>{page++;renderLibrary();$('collection-title').scrollIntoView({block:'start'});};
$('reading-text').addEventListener('pointerup',()=>setTimeout(captureSelection,0));$('reading-text').addEventListener('keyup',captureSelection);document.addEventListener('selectionchange',()=>{if(!window.getSelection()?.isCollapsed)return;setTimeout(()=>{if(window.getSelection()?.isCollapsed)hideSelection();},150);});$('selection-toolbar').onmousedown=e=>{if(e.target.tagName!=='SELECT')e.preventDefault();};$('make-highlight').onclick=()=>addHighlight(false);$('make-note').onclick=()=>addHighlight(true);$('make-clip').onclick=()=>prepareClip(selection);$('selection-close').onclick=hideSelection;
let positionTimer;window.addEventListener('scroll',()=>{clearTimeout(positionTimer);positionTimer=setTimeout(()=>{if(!current||!currentContent||$('reader').hidden)return;const blocks=[...$('reading-text').children];const block=blocks.find(b=>b.getBoundingClientRect().bottom>110);if(block)updateRecord(current.id,{position:{block:block.dataset.block}});},500);},{passive:true});
window.addEventListener('hashchange',route);window.addEventListener('storage',e=>{if(e.key!==STORAGE_KEY||!e.newValue)return;try{state=mergeStates(state,validateState(JSON.parse(e.newValue)));updateProgress();if(!$('library').hidden)renderLibrary();}catch{}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideSelection();});
async function init(){try{wikiData=await loadWiki().catch(()=>null);const response=await fetch('catalog.json');if(!response.ok)throw Error();catalog=await response.json();entries=Array.isArray(catalog)?catalog:catalog.entries;byId=new Map(entries.map(e=>[e.id,e]));for(let era=-3;era<=4;era++)$('era-filter').add(new Option(eraName(era),String(era)));fillSelect('character-filter',[...new Set(entries.flatMap(e=>e.characters||[]))].sort(),'All characters');fillSelect('place-filter',[...new Set(entries.flatMap(e=>e.places||[]))].sort(),'All places');for(let era=-3;era<=4;era++){const b=node('button','Era '+String(era).replace('-','−'));b.dataset.era=String(era);b.title=eraName(era);b.onclick=()=>{$('era-filter').value=$('era-filter').value===String(era)?'':String(era);page=0;renderLibrary();};$('era-strip').append(b);}const sources=$('sources-list');for(const source of catalog.sources||[]){const div=node('div'),a=node('a',source.title||source.name);if(source.url||source.documentId){a.href=source.url||'https://docs.google.com/document/d/'+source.documentId+'/edit';a.target='_blank';a.rel='noopener';}div.append(a);if(source.empty)div.append(node('span','Empty source — no reading text','source-detail'));if(source.note)div.append(node('span',source.note,'source-detail'));sources.append(div);}$('snapshot-date').textContent='Archive snapshot: '+(catalog.generatedAt||catalog.generated||'October 27, 2026')+'. Reading records stay separate from the source texts.';appearance();route();try{if(sessionStorage.getItem(SESSION_KEY))void connectCloud();}catch{}}catch{alertSave('The archive could not load. Check your connection and refresh. Your reading records have not been changed.');}}
init();

// Credentials remain in memory only. Browser data continues saving independently.
let cloud=null,cloudTimer,cloudBusy=false,cloudPending=false;
function cloudStatus(message){$('cloud-status').textContent=message;$('cloud-summary').textContent=message;}
function cloudControls(){for(const id of ['cloud-save','cloud-restore','cloud-disconnect'])$(id).disabled=!cloud||cloudBusy;$('cloud-connect').disabled=cloudBusy;}
function queueCloudBackup(){if(!cloud)return;clearTimeout(cloudTimer);cloudStatus('Changes waiting for private backup…');cloudTimer=setTimeout(()=>void backUpCloud(),5000);}
async function backUpCloud(){
 clearTimeout(cloudTimer);if(!cloud)return;if(cloudBusy){cloudPending=true;return;}
 cloudBusy=true;cloudControls();const snapshot=JSON.stringify(state);cloudStatus('Saving private backup…');
 try{await cloud.save(JSON.parse(snapshot));$('cloud-token').value='';cloudStatus('Private backup saved at '+new Date().toLocaleTimeString()+'.');}
 catch(error){cloudStatus(error.message||'Private storage unavailable. Download a backup before closing.');}
 finally{cloudBusy=false;cloudControls();if(cloudPending||JSON.stringify(state)!==snapshot){cloudPending=false;queueCloudBackup();}}
}
async function connectCloud(){
 if(cloudBusy)return;clearTimeout(cloudTimer);cloudBusy=true;cloudControls();
 const token=$('cloud-token').value.trim();
 const connection=token?new CloudBackup(token):(cloud||new CloudBackup());
 try{if(!connection)throw Error('Enter your backup code to unlock.');if(storageCorrupt)throw Error('Recover the existing browser data before connecting.');cloudStatus('Unlocking private backup and merging records…');const remote=await connection.load();
 if(remote){beforeImport=structuredClone(state);try{localStorage.setItem(STORAGE_KEY+'.before-import',JSON.stringify(beforeImport));}catch{}$('download-before-import').hidden=false;state=mergeStates(state,remote);}
 if(cloud&&cloud!==connection)cloud.disconnect();cloud=connection;save();appearance();route();cloudPending=false;
 }catch(error){cloudStatus(error.message||'Could not unlock private backups.');connection?.disconnect();cloud=null;}
 finally{cloudBusy=false;cloudControls();}
 if(cloud)await backUpCloud();
}
$('cloud-connect').onclick=connectCloud;
$('cloud-restore').onclick=connectCloud;
$('cloud-save').onclick=()=>void backUpCloud();
$('cloud-disconnect').onclick=()=>{clearTimeout(cloudTimer);cloud?.disconnect();cloud=null;cloudPending=false;cloudControls();cloudStatus('Disconnected. Browser records and the private backup are preserved.');};

function renderWikiConnections(){const panel=$('reader-connections');panel.replaceChildren(node('h2','Connected on this site'),node('p','Explore named people, places, events, and ideas. Links identify mentions; they do not settle disputed identities or relationships.'));const topics=readingConnections(current.id);const links=node('div',undefined,'connection-chips');for(const topic of topics){const a=node('a',topic.title);a.href='wiki.html#'+topic.id;links.append(a);}panel.append(links);if(!topics.length){const a=node('a','Browse all lore connections →');a.href='wiki.html';panel.append(a);}const eraLinks=node('div',undefined,'source-links');for(const era of current.era||[]){const a=node('a',eraName(era));a.href='timeline.html#era-'+era;eraLinks.append(a);}panel.append(eraLinks);}
