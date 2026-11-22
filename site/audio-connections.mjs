import {stopAudio} from './audio-playback.mjs';
const rootURL = new URL('./',import.meta.url);
const requests = new WeakMap();
let pending;
export function loadAudioConnections() {
  if (!pending) pending=fetch(new URL('sounds/connections.json',rootURL)).then(r=>{
    if(!r.ok)throw Error('Audio connections unavailable');return r.json();
  }).catch(e=>{pending=null;throw e;});
  return pending;
}
export function audioForContext(data,{readingId,topicId,ids}={}) {
  const matches=ids||data.readings[readingId]||data.topics[topicId]||[];
  return [...new Set(matches)].map(id=>data.entries[id]).filter(Boolean);
}
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const link=(text,path)=>{const a=el('a',text);a.href=new URL(path,rootURL).href;return a;};
export function clearAudioConnections(parent) {
  requests.set(parent,(requests.get(parent)||0)+1);
  stopAudio(parent);parent.replaceChildren();parent.hidden=true;
}
export function renderAudioCards(parent,entries,{heading='Listen here',relatedPlaces=[]}={}) {
  stopAudio(parent);parent.replaceChildren();parent.hidden=!entries.length&&!relatedPlaces.length;
  if(parent.hidden)return;
  parent.classList.add('connected-audio');parent.append(el('h2',heading));
  if(entries.length){
    parent.append(el('p','Press Play to listen. Audio stays off until you choose a clip.','audio-note'));
    const stop=el('button','Stop audio');stop.type='button';stop.addEventListener('click',()=>stopAudio(parent));parent.append(stop);
    const grid=el('div',undefined,'connected-audio-grid');
    for(const entry of entries){
      const card=el('article',undefined,'connected-audio-card');card.append(el('span',entry.kind==='footstep'?'Footsteps · '+entry.title:entry.category,'audio-kind'),el('h3',entry.title));
      if(entry.status?.includes('preview')||entry.status?.includes('Reserved')||entry.status?.includes('variant'))card.append(el('p',entry.status,'audio-note'));
      const player=el('audio');player.controls=true;player.preload='none';
      const download=link('Download clip','sounds/'+entry.clips[0].src);download.download='';
      const choose=index=>{player.pause();const c=entry.clips[index];player.src=new URL('sounds/'+c.src,rootURL).href;player.setAttribute('aria-label',entry.title+' · '+c.label);download.href=player.src;};choose(0);
      if(entry.clips.length>1){
        const label=el('label','Variation '),select=el('select');select.setAttribute('aria-label',entry.title+' variation');
        entry.clips.forEach((c,i)=>{const option=el('option',c.label);option.value=String(i);select.append(option);});
        select.addEventListener('change',()=>choose(Number(select.value)));label.append(select);card.append(label);
      }
      card.append(player);
      if(['music','ambience','song'].includes(entry.kind)){
        const label=el('label',undefined,'audio-repeat'),box=el('input');box.type='checkbox';box.addEventListener('change',()=>{player.loop=box.checked;});label.append(box,document.createTextNode(' Repeat this clip'));card.append(label);
      }
      card.append(download,link('Sound details & related topics','sounds/index.html#'+entry.id));
      if(entry.player_href)card.append(link('Full song player · voices & other arrangements',entry.player_href));
      grid.append(card);
    }
    parent.append(grid);
  }
  if(relatedPlaces.length){const details=el('details');details.append(el('summary','Listen to places connected with this reading'),el('p','These are settings named in the text, not a claim that the reading has a fixed soundtrack.','audio-note'));for(const place of relatedPlaces)details.append(link(place.title,'wiki.html#'+place.topic_id));parent.append(details);}
}
export async function mountAudioConnections(parent,context={},options={}) {
  clearAudioConnections(parent);const request=requests.get(parent);
  try{
    const data=await loadAudioConnections();if(request!==requests.get(parent))return;
    renderAudioCards(parent,audioForContext(data,context),{...options,relatedPlaces:data.related_places[context.readingId]||[]});
  }catch{
    if(request!==requests.get(parent))return;
    parent.hidden=false;parent.classList.add('connected-audio');parent.append(el('p','Audio could not load.'),link('Browse the sound library','sounds/index.html'));
    const retry=el('button','Retry audio');retry.type='button';retry.addEventListener('click',()=>mountAudioConnections(parent,context,options));parent.append(retry);
  }
}
