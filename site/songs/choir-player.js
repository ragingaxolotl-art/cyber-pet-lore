const $=id=>document.getElementById(id);
const songs=JSON.parse($('song-data').textContent),choice=$('song'),mode=$('mode'),player=$('player');
let current=songs[0],revision=0,cards=[];
for(const [index,song] of songs.entries()){const option=document.createElement("option");option.value=String(index);option.textContent=song.title;choice.append(option);}
function element(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
function base(){return 'voices-v2/'+current.folder+'/';}
function updateMeanings(){
 for(const [index,voice] of current.voices.entries()){
  const card=cards[index],line=voice.lines.find(l=>player.currentTime>=l.start&&player.currentTime<l.end),audible=mode.value==='song'||mode.value===voice.id;
  card.root.dataset.silent=String(!audible);card.root.classList.toggle('active',Boolean(line)&&audible);
  card.audibility.textContent=audible?'In this mix':'Not heard in solo mode';
  card.carrier.textContent=line?line.carrier:'Rest';card.gloss.textContent=line?line.gloss:'';card.definition.textContent=line?line.definition:'';card.source.textContent=line?line.target+' · assertion · state 1':'';
 }
}
function loadAudio(at=0,play=false){
 const token=++revision;player.pause();player.src=base()+mode.value+'.m4a';player.load();
 $('solo-download').hidden=mode.value==='song';$('solo-download').href=base()+mode.value+'.m4a';$('status').textContent='';
 player.addEventListener('loadedmetadata',()=>{if(token!==revision)return;player.currentTime=Math.min(at,player.duration);updateMeanings();if(play)player.play().catch(()=>{$('status').textContent='Press Play to start the selected voice.';});},{once:true});
 updateMeanings();
}
function loadSong(){
 current=songs[Number(choice.value)];mode.replaceChildren();
 for(const [value,label] of [['song','All three voices'],...current.voices.map(v=>[v.id,v.name+' alone'])]){const option=element('option',label);option.value=value;mode.append(option);}mode.value='song';
 $('title').textContent=current.title;$('ensemble').textContent=current.voices.map(v=>v.name).join(' · ')+' · '+current.bpm+' BPM';
 const panel=$('voices');panel.replaceChildren();cards=current.voices.map(voice=>{
  const root=element('section');root.className='voice';root.setAttribute('aria-label',voice.name+' meaning');
  const name=element('h3',voice.name),audibility=element('p'),carrier=element('p'),gloss=element('strong'),definition=element('p'),source=element('small');
  audibility.className='audibility';carrier.className='carrier';root.append(name,audibility,carrier,gloss,definition,source);panel.append(root);return {root,audibility,carrier,gloss,definition,source};
 });
 $('audio-download').href=base()+'song.m4a';$('midi-download').href=base()+'arrangement.mid';$('text-download').href=base()+'meanings.txt';
 $('story-summary').textContent=current.summary;$('story-link').href='../#read='+current.story;
 const list=$('transcript');list.replaceChildren();
 const lines=current.voices.flatMap(v=>v.lines.map(l=>({...l,voice:v}))).sort((a,b)=>a.start-b.start);
 for(const line of lines){const li=element('li'),button=element('button',Math.floor(line.start/60)+':'+String(Math.floor(line.start%60)).padStart(2,'0')+' · '+line.voice.name+' · '+line.carrier+' — '+line.gloss);button.type='button';button.addEventListener('click',()=>{mode.value=line.voice.id;loadAudio(line.start,true);});li.append(button,element('small',line.definition));list.append(li);}
 loadAudio();
}
choice.addEventListener('change',()=>{history.replaceState(null,'','#song='+songs[Number(choice.value)].folder);loadSong();});
mode.addEventListener('change',()=>loadAudio(player.currentTime,!player.paused));
player.addEventListener('timeupdate',updateMeanings);player.addEventListener('seeked',updateMeanings);player.addEventListener('error',()=>{$('status').textContent='Audio could not load. Try reloading, or use a download link.';});
function selectFromHash(){const id=new URLSearchParams(location.hash.slice(1)).get('song');const index=songs.findIndex(s=>s.folder===id);choice.value=String(index<0?0:index);loadSong();}
window.addEventListener('hashchange',selectFromHash);selectFromHash();
