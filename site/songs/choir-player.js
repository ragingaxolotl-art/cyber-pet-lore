const $=id=>document.getElementById(id);
const editions={chords:['song-data','voices-chords','Three-note chords carry each root’s family and address. A moving upper voice plays the ending.'],
 '3':['melody-song-data','voices-v3','The same sentence verses and refrains, with each word played as a melody.'],
 '2':['earlier-song-data','voices-v2','The earlier choir arrangements perform the original root refrains.']};
const requested=new URLSearchParams(location.search).get('edition');
const arrangement=$('arrangement'),choice=$('song'),mode=$('mode'),player=$('player');
arrangement.value=Object.hasOwn(editions,requested)?requested:'chords';
let songs=JSON.parse($(editions[arrangement.value][0]).textContent);
let current=songs[0],revision=0,cards=[];
for(const [index,song] of songs.entries()){const option=document.createElement("option");option.value=String(index);option.textContent=song.title;choice.append(option);}
function element(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
function base(){return editions[arrangement.value][1]+'/'+current.folder+'/';}
function updateMeanings(){
 for(const [index,voice] of current.voices.entries()){
  const card=cards[index],line=voice.lines.find(l=>player.currentTime>=l.start&&player.currentTime<l.end),audible=mode.value==='song'||mode.value===voice.id;
  card.root.dataset.silent=String(!audible);card.root.classList.toggle('active',Boolean(line)&&audible);
  card.audibility.textContent=audible?'In this mix':'Not heard in solo mode';
  card.carrier.textContent=line?(line.kind==='sentence'?line.gloss:line.carrier):'Rest';card.gloss.textContent=line?(line.kind==='sentence'?'':line.gloss):'';card.definition.textContent=line?line.definition:'';card.source.textContent=line?(line.kind==='sentence'?'Sentence · head '+line.target:'Root refrain · '+line.target)+' · assertion · state 1':'';
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
 $('edition-description').textContent=editions[arrangement.value][2];
 for(const [value,label] of [['song','All three voices'],...current.voices.map(v=>[v.id,v.name+' alone'])]){const option=element('option',label);option.value=value;mode.append(option);}mode.value='song';
 $('title').textContent=current.title;$('ensemble').textContent=current.voices.map(v=>v.name).join(' · ')+' · '+current.bpm+' BPM · '+Math.floor(current.seconds/60)+':'+String(Math.floor(current.seconds%60)).padStart(2,'0');
 const panel=$('voices');panel.replaceChildren();cards=current.voices.map(voice=>{
  const root=element('section');root.className='voice';root.setAttribute('aria-label',voice.name+' meaning');
  const name=element('h3',voice.name),audibility=element('p'),carrier=element('p'),gloss=element('strong'),definition=element('p'),source=element('small');
  audibility.className='audibility';carrier.className='carrier';root.append(name,audibility,carrier,gloss,definition,source);panel.append(root);return {root,audibility,carrier,gloss,definition,source};
 });
 const place=current.location,locationPanel=$('song-location');locationPanel.replaceChildren(element('h2','Where this song comes from'));
 const loreLink=element('a',place.name+' — explore the lore →');loreLink.href='../wiki.html#'+place.topicId;locationPanel.append(loreLink,element('p',place.note));
 for(const art of place.images){const figure=element('figure'),link=element('a'),image=element('img');link.href='../wiki.html#'+place.artTopicId;link.setAttribute('aria-label','Explore '+place.artName+' lore');image.src='../'+art.src;image.alt=art.alt;image.width=art.width;image.height=art.height;image.loading='lazy';link.append(image);figure.append(link,element('figcaption',art.caption));locationPanel.append(figure);}
 const files=element('a','Location image file labels (CSV)');files.href='../images/locations/location-files.csv';locationPanel.append(files);
 $('audio-download').href=base()+'song.m4a';$('midi-download').href=base()+'arrangement.mid';$('text-download').href=base()+'meanings.txt';
 $('story-summary').textContent=current.summary;$('story-link').href='../#read='+current.story;
 const list=$('transcript');list.replaceChildren();
 const lines=current.voices.flatMap(v=>v.lines.map(l=>({...l,voice:v}))).sort((a,b)=>a.start-b.start);
 for(const line of lines){const li=element('li'),button=element('button',Math.floor(line.start/60)+':'+String(Math.floor(line.start%60)).padStart(2,'0')+' · '+line.voice.name+' · '+(line.kind==='sentence'?line.gloss:line.carrier+' — '+line.gloss));button.type='button';button.addEventListener('click',()=>{mode.value=line.voice.id;loadAudio(line.start,true);});li.append(button,element('small',line.definition));list.append(li);}
 loadAudio();
}
arrangement.addEventListener('change',()=>{
 songs=JSON.parse($(editions[arrangement.value][0]).textContent);
 history.replaceState(null,'','?edition='+arrangement.value+'#song='+current.folder);loadSong();
});
choice.addEventListener('change',()=>{history.replaceState(null,'','#song='+songs[Number(choice.value)].folder);loadSong();});
mode.addEventListener('change',()=>loadAudio(player.currentTime,!player.paused));
player.addEventListener('timeupdate',updateMeanings);player.addEventListener('seeked',updateMeanings);player.addEventListener('error',()=>{$('status').textContent='Audio could not load. Try reloading, or use a download link.';});
function selectFromHash(){const id=new URLSearchParams(location.hash.slice(1)).get('song');const index=songs.findIndex(s=>s.folder===id),params=new URLSearchParams(location.search),requestedIndex=Number(params.get('song'));choice.value=String(index>=0?index:params.has('song')&&Number.isInteger(requestedIndex)&&requestedIndex>=0&&requestedIndex<songs.length?requestedIndex:0);loadSong();const voice=params.get('voice');if(voice&&[...mode.options].some(o=>o.value===voice)){mode.value=voice;loadAudio(Math.max(0,Number(params.get('time'))||0));}}
window.addEventListener('hashchange',selectFromHash);selectFromHash();
