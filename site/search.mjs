import {matchDocument,matchText,queryTerms,snippet,rank} from './search-engine.mjs';
import {notebookRows,filterNotebook} from './notebook-view.mjs';
import {getNotebookStore} from './notebook-store.mjs';
import {mountWorkspaceBar} from './workspace-ui.mjs';
const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text||'';return n;};let data,byId,run=0;const cache=new Map();
function card(parent,title,href,text,meta){const article=el('article');article.className='notebook-card';const h=el('h3'),a=el('a',title);a.href=href;h.append(a);article.append(h,el('p',meta),el('p',text));parent.append(article);}
function filters(){return {query:$('global-query').value.trim(),kind:$('global-kind').value,era:$('global-era').value,status:$('global-status').value};}
async function search(push=false){
 if(!data)return;const token=++run,f=filters(),terms=queryTerms(f.query);for(const id of ['resource-results','passage-results','private-results'])$(id).replaceChildren();if(!terms.length){history.replaceState(null,'','search.html');$('search-progress').textContent='Enter a name, phrase or question to begin.';return;}
 const p=new URLSearchParams({q:f.query});for(const k of ['kind','era','status'])if(f[k])p.set(k,f[k]);if(push&&location.search!=='?'+p)history.pushState(null,'','search.html?'+p);else history.replaceState(null,'','search.html?'+p);
 const resources=data.documents.filter(d=>matchDocument(d,f)).sort((a,b)=>rank(b,f.query)-rank(a,f.query)||a.title.localeCompare(b.title));for(const d of resources.slice(0,100))card($('resource-results'),d.title,d.href,snippet(d.text,f.query),d.kind+' · '+d.status);
 if(!resources.length)$('resource-results').append(el('p','No title or metadata matches. Checking full passages…'));
 const notes=filterNotebook(notebookRows(getNotebookStore().snapshot(),data.documents),{query:f.query,era:f.era});for(const n of notes.slice(0,100))card($('private-results'),n.title,n.href,snippet(n.text+' '+n.quote,f.query),'My note · '+n.status);if(!notes.length)$('private-results').append(el('p','No matching notes on this device.'));
 let next=0,loaded=0,count=0;const matches=[];
 async function worker(){while(next<data.shards.length&&token===run){const path=data.shards[next++];try{if(!cache.has(path))cache.set(path,fetch(path).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(e=>{cache.delete(path);throw e;}));const blocks=await cache.get(path);if(token!==run)return;for(const b of blocks){const d=byId.get(b.readingId);if(!d||f.kind&&d.kind!==f.kind||f.era&&!d.era.includes(Number(f.era))||f.status&&!d.status.toLowerCase().includes(f.status))continue;if(matchText(b.text,terms)){count++;if(matches.length<200)matches.push({b,d});}}loaded++;$('search-progress').textContent=`${resources.length} resources · ${count} passages found · checked ${loaded}/${data.shards.length} text sections`;}
 catch{if(token===run)$('search-progress').textContent='Some passage text could not load. Search again to retry; available results remain below.';}}
 }
 await Promise.all([worker(),worker(),worker()]);if(token!==run)return;
 matches.sort((a,b)=>a.d.title.localeCompare(b.d.title)||a.b.id.localeCompare(b.b.id));for(const {b,d} of matches)card($('passage-results'),d.title,'index.html#read='+encodeURIComponent(d.id)+'&block='+encodeURIComponent(b.id),snippet(b.text,f.query),d.kind+' · '+d.status+(b.annotation?' · Published annotation':''));
 if(!matches.length){$('passage-results').append(el('p','No matching passages. Try fewer words or expand to all lore.'));const expand=el('button','Search all lore with these words');expand.onclick=()=>{for(const key of ['kind','era','status'])$('global-'+key).value='';void search(true);};$('passage-results').append(expand);}
 $('search-progress').textContent=`${resources.length} resources · ${count} matching passages${count>200?' (first 200 shown; refine your query)':''} · ${notes.length} private notes`+(loaded<data.shards.length?' · Some sections could not load; retry to search them.':'');
}
$('global-search').onsubmit=e=>{e.preventDefault();void search(true);};$('global-search').onreset=()=>setTimeout(()=>void search(),0);
window.addEventListener('popstate',()=>{applyURL();void search();});function applyURL(){const p=new URLSearchParams(location.search);$('global-query').value=p.get('q')||'';for(const k of ['kind','era','status'])$('global-'+k).value=p.get(k)||'';}
mountWorkspaceBar();$('search-progress').textContent='Opening search…';
try{const response=await fetch('search-index.json',{cache:'no-cache'});if(!response.ok)throw Error();data=await response.json();byId=new Map(data.documents.map(d=>[d.id,d]));for(const kind of [...new Set(data.documents.map(d=>d.kind))].sort())$('global-kind').add(new Option(kind,kind));for(let e=-3;e<=4;e++)$('global-era').add(new Option('Era '+e,String(e)));applyURL();await search();}catch{$('search-progress').textContent='Search could not load. Your notebook remains available; refresh to retry.';}
