import {mountWorkspaceBar,noteButton} from './workspace-ui.mjs';
import {getNotebookStore} from './notebook-store.mjs';
import {safeWorkspaceHref} from './workspace-targets.mjs';
import {captureArtifacts} from './workspace-artifacts.mjs';
const root=new URL('./',import.meta.url),store=getNotebookStore();
mountWorkspaceBar();
let path=location.pathname.slice(root.pathname.length);if(!path||path.endsWith('/'))path+='index.html';
if(safeWorkspaceHref(path)&&!['index.html','notebook.html','search.html','shelter-atlas.html'].includes(path))document.getElementById('workspace-bar').prepend(noteButton(()=>({kind:path==='wiki.html'?'entity':'page',id:(path+location.hash).slice(0,200),title:(document.querySelector('main h1,h1')?.textContent||document.title).slice(0,300),href:path+location.search+location.hash,era:[]}),'Note on this page'));
// Only known lore tools are captured. Game saves and student data are excluded.
function capture(){try{captureArtifacts(localStorage,store);}catch(error){store.setStatus('Tool draft remains in its own storage: '+error.message);}}
capture();let timer;document.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(capture,2500);});document.addEventListener('click',()=>{clearTimeout(timer);timer=setTimeout(capture,2500);});window.addEventListener('pagehide',capture);
function mediaPath(audio){try{return new URL(audio.currentSrc||audio.getAttribute('src')||audio.querySelector('source')?.getAttribute('src')||'',location.href).pathname.slice(root.pathname.length);}catch{return '';}}
function audioTarget(audio){const media=mediaPath(audio),card=audio.closest('article,section'),title=card?.querySelector('h2,h3')?.textContent||document.querySelector('#title')?.textContent||'Audio';let href='sounds/index.html';
 if(path==='songs/index.html'){const params=new URLSearchParams({edition:document.getElementById('arrangement').value,song:document.getElementById('song').value,voice:document.getElementById('mode').value});href=path+'?'+params;}
 return {kind:'audio',id:media.slice(-200)||path,title:title.slice(0,300),href,mediaId:media.slice(-300),start:Number.isFinite(audio.currentTime)?audio.currentTime:0,era:[]};
}
function attachAudio(){for(const audio of document.querySelectorAll('audio:not([data-notebook-ready])')){audio.dataset.notebookReady='true';audio.after(noteButton(()=>audioTarget(audio),'Note at this moment'));const params=new URLSearchParams(location.search);const seek=()=>{if(params.get('media')!==mediaPath(audio).slice(-300))return;const time=Number(params.get('time'));if(Number.isFinite(time)&&time>=0){audio.currentTime=Math.min(time,audio.duration||time);audio.closest('.sound-card')?.removeAttribute('hidden');audio.scrollIntoView({block:'center'});}};if(params.get('media')===mediaPath(audio).slice(-300)){audio.preload='metadata';audio.addEventListener('loadedmetadata',seek,{once:true});if(audio.readyState>0)seek();}}}
attachAudio();new MutationObserver(attachAudio).observe(document.body,{subtree:true,childList:true});
