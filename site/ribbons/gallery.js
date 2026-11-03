import {sections, sectionFor, matches, statusLabel, highHonorsBonus} from './gallery-model.mjs';
const $=id=>document.getElementById(id);
const entries=JSON.parse($('gallery-data').textContent), byId=new Map(entries.map(e=>[e.id,e]));
const tiles=[...document.querySelectorAll('.ribbon-tile')];
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let paused=preference.matches, section=new URLSearchParams(location.search).get('section')||'game', returnFocus=null, previewOwner=null, dismissed=null;
if(!['all',...sections.map(s=>s[0])].includes(section))section='game';
const params=new URLSearchParams(location.search);
for(const id of ['search','category','kind'])if(params.has(id))$(id).value=params.get(id);
function element(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function filter(updateURL=true){
 const state={section,query:$('search').value,category:$('category').value,kind:$('kind').value};let count=0;
 for(const tile of tiles){tile.hidden=!matches(byId.get(tile.dataset.id),state);if(!tile.hidden)count++;}
 for(const group of document.querySelectorAll('.category-group'))group.hidden=![...group.querySelectorAll('.ribbon-tile')].some(t=>!t.hidden);
 for(const group of document.querySelectorAll('.gallery-section'))group.hidden=![...group.querySelectorAll('.category-group')].some(t=>!t.hidden);
 for(const b of document.querySelectorAll('[data-section]'))b.setAttribute('aria-pressed',String(b.dataset.section===section));
 $('honors-display').hidden=!matches(byId.get('quarter-galaxy-gala'),state);
 $('count').textContent=`${count} of ${entries.length} ribbons, awards & designs`;$('empty').hidden=!!count;hidePreview();
 if(updateURL){const url=new URL(location.href);url.search='';if(section!=='game')url.searchParams.set('section',section);for(const id of ['search','category','kind'])if($(id).value)url.searchParams.set(id,$(id).value);history.replaceState(null,'',url);}
}
for(const b of document.querySelectorAll('[data-section]'))b.addEventListener('click',()=>{section=b.dataset.section;$('category').value='';filter();});
for(const id of ['search','category','kind'])$(id).addEventListener('input',()=>{if(id==='category'&&$(id).value)section='all';filter();});
$('reset').onclick=()=>{section='all';for(const id of ['search','category','kind'])$(id).value='';filter();};
// Images load only when their gallery tile or detail card is visible.
const cache=new Map(),drawings=new Map();
function load(src){if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;}));return cache.get(src);}
function drawHonor(canvas,art,clasp,count){canvas.width=371;canvas.height=602;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,371,602);ctx.drawImage(art,0,0,371,602);for(let i=0;i<count;i++)ctx.drawImage(clasp,24,24,112,30,164.5,[330,377,424,471][i],42,42*30/112);}
async function prepare(canvas){
 if(canvas.dataset.loaded)return;canvas.dataset.loaded='true';const entry=byId.get(canvas.dataset.id),r=entry.render||{};
 try{
  if(canvas.dataset.honors!==undefined){const [art,clasp]=await Promise.all([load('art/high-honors/divine_code.png'),load('art/high-honors/clasp.png')]);drawHonor(canvas,art,clasp,Number(canvas.dataset.honors));return;}
  const images=await Promise.all((r.mode==='scroll'?r.frames:[entry.art,...(r.base?[r.base]:[])]).map(load));
  const draw=time=>{const ctx=canvas.getContext('2d');
   if(r.mode==='medal'){canvas.width=256;canvas.height=448;const f=Math.floor(time/r.seconds)%r.count;ctx.drawImage(images[0],f%8*256,Math.floor(f/8)*448,256,448,0,0,256,448);}
   else if(r.mode==='scroll'){canvas.width=256;canvas.height=128;ctx.drawImage(images[Math.floor(time/r.seconds)%images.length],0,0);ctx.font='bold 18px sans-serif';ctx.fillStyle='#57320c';ctx.textAlign='center';ctx.fillText('FOUNDLING',128,63);}
   else {canvas.width=80;canvas.height=80;const x=r.slot%7*80,y=Math.floor(r.slot/7)*80;ctx.drawImage(images[0],x,y,80,80,0,0,80,80);if(images[1])ctx.drawImage(images[1],x,y,80,80,0,0,80,80);}
  };draw(0);if(r.mode!=='trophy'&&canvas.isConnected)drawings.set(canvas,draw);
 }catch{const fallback=element('img');fallback.src=entry.art;fallback.alt=entry.name;canvas.replaceWith(fallback);}
}
const visible=new Set();const observer=new IntersectionObserver(rows=>{for(const row of rows){if(row.isIntersecting){visible.add(row.target);prepare(row.target);}else visible.delete(row.target);}},{rootMargin:'80px'});
function watch(root){for(const canvas of root.querySelectorAll('canvas'))observer.observe(canvas);}
function forget(root){for(const canvas of root.querySelectorAll('canvas')){observer.unobserve(canvas);visible.delete(canvas);drawings.delete(canvas);}}
function motion(){ $('motion').textContent=paused?'Play animations':'Pause animations';$('motion').setAttribute('aria-pressed',String(paused));if(paused)for(const draw of drawings.values())draw(0);}
$('motion').onclick=()=>{paused=!paused;motion();};preference.addEventListener('change',e=>{paused=e.matches;motion();});
let last=0;function tick(time){if(!paused&&time-last>=90){for(const canvas of visible)if(!canvas.closest('[hidden]'))drawings.get(canvas)?.(time/1000);last=time;}requestAnimationFrame(tick);}requestAnimationFrame(tick);
function artwork(entry,cls){const wrap=element('div',undefined,cls);let art;
 if(entry.id==='quarter-galaxy-gala'||entry.render?.mode){art=element('canvas');art.dataset.id=entry.id;art.setAttribute('role','img');art.setAttribute('aria-label',entry.name);if(entry.id==='quarter-galaxy-gala')art.dataset.honors='4';}
 else{art=element('img');art.src=entry.art;art.alt=entry.name;art.loading='lazy';}wrap.append(art);return wrap;}
function hidePreview(){if(previewOwner)previewOwner.removeAttribute('aria-describedby');previewOwner=null;$('preview').hidden=true;}
function preview(tile){if(dismissed===tile||$('details').open)return;const entry=byId.get(tile.dataset.id);hidePreview();previewOwner=tile;
 $('preview').replaceChildren(element('span',statusLabel(entry),'category'),element('h3',entry.name),element('p',entry.definition.length>240?entry.definition.slice(0,237)+'…':entry.definition),element('p','Click or press Enter for requirements, rewards, lore & artwork.','hint'));
 $('preview').hidden=false;tile.setAttribute('aria-describedby','preview');const box=tile.getBoundingClientRect(),tip=$('preview').getBoundingClientRect();
 $('preview').style.left=Math.max(12,Math.min(innerWidth-tip.width-12,box.left+box.width/2-tip.width/2))+'px';
 $('preview').style.top=Math.max(12,box.bottom+tip.height+10<innerHeight?box.bottom+8:box.top-tip.height-8)+'px';
}
for(const card of document.querySelectorAll('.honors-open')){
 card.dataset.id='quarter-galaxy-gala';
 card.addEventListener('pointerenter',e=>{clearTimeout(leaveTimer);if(e.pointerType==='mouse')preview(card);});
 card.addEventListener('pointerleave',()=>{dismissed=null;leaveTimer=setTimeout(hidePreview,150);});
 card.addEventListener('focus',()=>preview(card));card.addEventListener('blur',()=>{dismissed=null;hidePreview();});
 card.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();returnFocus=card;location.hash='quarter-galaxy-gala';openDetails('quarter-galaxy-gala');});
}
let leaveTimer;for(const tile of tiles){tile.addEventListener('pointerenter',e=>{clearTimeout(leaveTimer);if(e.pointerType==='mouse')preview(tile);});tile.addEventListener('pointerleave',()=>{dismissed=null;leaveTimer=setTimeout(hidePreview,150);});tile.addEventListener('focus',()=>preview(tile));tile.addEventListener('blur',()=>{dismissed=null;hidePreview();});tile.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();returnFocus=tile;location.hash=tile.dataset.id;openDetails(tile.dataset.id);});}
$('preview').addEventListener('pointerenter',()=>clearTimeout(leaveTimer));$('preview').addEventListener('pointerleave',hidePreview);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('preview').hidden){dismissed=previewOwner;hidePreview();}});addEventListener('resize',hidePreview);addEventListener('scroll',hidePreview,{passive:true});
function openDetails(id){const entry=byId.get(id);if(!entry)return;hidePreview();const body=$('detail-body');forget(body);body.replaceChildren(artwork(entry,'detail-art'));
 const copy=element('div',undefined,'detail-copy'),title=element('h2',entry.name);title.id='detail-title';copy.append(element('span',statusLabel(entry),'category'),title,element('p',entry.definition));
 const dl=element('dl');for(const [label,value] of [['Collection',entry.category],['How it is awarded / used',entry.where],['Reward',entry.reward]])dl.append(element('dt',label),element('dd',value));copy.append(dl);
 if(entry.notes)copy.append(element('h3','Lore & design notes'),element('p',entry.notes));
 const credits=element('details'),source=element('dl',undefined,'source');credits.append(element('summary','Artwork credits & history'),element('p',entry.animation));for(const [k,v] of Object.entries(entry.source||{}))source.append(element('dt',k.replaceAll('_',' ')),element('dd',String(v)));credits.append(source);copy.append(credits);
 const actions=element('div',undefined,'detail-actions'),notes=element('a','Open in lore book & add notes →');notes.href='../index.html#read=ribbon-'+entry.id;const download=element('a','Download original artwork');download.href=entry.art;download.download='';actions.append(notes,download);copy.append(actions);body.append(copy);
 if(id==='quarter-galaxy-gala'){
  const panel=element('section',undefined,'honors-panel');panel.append(element('h3','High Honors display cards'),element('p','Celestial · Divine Code. Examples show the ribbon with zero to four clasps; these are previews, not student awards.'));
  const cards=element('div',undefined,'honors-cards');for(let count=0;count<=4;count++){const card=element('article',undefined,'honor-card'),scroll=element('img');scroll.src='art/high-honors/celestial_scroll.png';scroll.alt='Celestial';scroll.className='scroll';const art=artwork(entry,'');art.querySelector('canvas').dataset.honors=String(count);card.append(scroll,art,element('h3',count?`${count} clasp${count===1?'':'s'}`:'Ribbon'),element('p',`Every skill cap +${highHonorsBonus(count)}`));cards.append(card);}panel.append(cards,element('p','Only the strongest quarter applies; quarters do not stack. Train to earn the extra levels. The displayed ribbon uses the latest awarded quarter.','hint'));body.append(panel);
 }
 watch(body);if(!$('details').open)$('details').showModal();$('details').scrollTop=0;$('close-details').focus();
}
$('close-details').onclick=()=>$('details').close();
$('details').addEventListener('click',e=>{if(e.target===$('details')){const r=$('details').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('details').close();}});
$('details').addEventListener('close',()=>{forget($('detail-body'));if(location.hash){const url=new URL(location.href);url.hash='';history.replaceState(null,'',url);}if(returnFocus&&!returnFocus.hidden){dismissed=returnFocus;returnFocus.focus();}returnFocus=null;});
function route(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}if(byId.has(id)){const tile=tiles.find(t=>t.dataset.id===id);section=sectionFor(byId.get(id));for(const key of ['search','category','kind'])$(key).value='';filter(false);returnFocus=returnFocus||tile;openDetails(id);}else if($('details').open)$('details').close();}
addEventListener('hashchange',route);filter(false);watch(document);motion();route();
