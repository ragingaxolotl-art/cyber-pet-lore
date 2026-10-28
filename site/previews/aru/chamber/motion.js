import {loadArtwork,artworkLayers,drawArtwork} from './art-layers.js?v=mix-1';
import {livingLayers,drawLivingLayer,drawLivingHeart,bodyVersions} from './living-parts.js?v=mix-1';
const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d');
const status=document.querySelector('#status'),play=document.querySelector('#play');
const TAU=Math.PI*2,DURATION=12,W=1920,H=1080,CX=960,CY=500,SCALE=.40;
let bodyVersion=Math.max(0,Math.min(2,Number(new URLSearchParams(location.search).get('version'))||0));
let chamberMode=new URLSearchParams(location.search).get('view')==='chamber';
const mix={body:'painted',head:'painted',wings:'painted',hands:'mixed'};
for(const key of Object.keys(mix)){const value=new URLSearchParams(location.search).get(key);if(['painted','faceted','mixed','off'].includes(value))mix[key]=value;}
let running=true,started=performance.now(),frozen=0,ready=false;
function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});}
const [background,artwork]=await Promise.all([loadImage('chamber-background.png'),loadArtwork()]);
// Cached glow sprites keep hundreds of translucent lights inexpensive on phones.
const particleColors=['#ffe6a3','#8cecff','#c5a4ff','#ffacd9','#b2ffde'];
const glowSprites=particleColors.map(color=>{const sprite=document.createElement('canvas');sprite.width=sprite.height=64;const g=sprite.getContext('2d'),light=g.createRadialGradient(32,32,0,32,32,32);light.addColorStop(0,'#ffffff');light.addColorStop(.08,'#ffffff');light.addColorStop(.22,color);light.addColorStop(.5,color+'65');light.addColorStop(1,color+'00');g.fillStyle=light;g.fillRect(0,0,64,64);return sprite;});
const particles=Array.from({length:480},(_,i)=>({
 phase:i*2.399963, speed:(i%2?-1:1)*(1+i%5),
 rx:65+(i*37%230),ry:90+(i*47%245),tilt:.32*Math.sin(i*1.7),
 size:i%19===0?17:i%7===0?9:3.5+(i%4),color:i%5,seed:i
}));
function particlePose(p,a){const theta=p.phase+a*p.speed+.13*Math.sin(a*3+p.seed),breath=1+.055*Math.sin(a*2+p.seed),x=Math.cos(theta)*p.rx*breath,y=Math.sin(theta)*p.ry*breath;
 return{x:CX+x*Math.cos(p.tilt)-y*Math.sin(p.tilt),y:CY+25+x*Math.sin(p.tilt)+y*Math.cos(p.tilt)+10*Math.sin(a*4+p.seed),z:Math.sin(theta)};
}
function drawDust(c,t,front){const a=t/DURATION*TAU;c.save();c.globalCompositeOperation='lighter';
 for(const p of particles){const v=particlePose(p,a);if((v.z>0)!==front)continue;
 const pulse=.55+.45*(.5+.5*Math.sin(a*(2+p.seed%4)+p.seed)),alpha=(.45+.4*(v.z+1)/2)*pulse;
 // Trails follow each particle's own direction and angular speed.
 for(let lag=3;lag>=0;lag--){const q=lag?particlePose(p,a-lag*.012):v,size=p.size*(lag? .65:1);c.globalAlpha=alpha/(1+lag*1.7);c.drawImage(glowSprites[p.color],q.x-size,q.y-size,size*2,size*2);}
 if(p.seed%19===0){c.globalAlpha=alpha*.65;c.strokeStyle=particleColors[p.color];c.lineWidth=1;c.beginPath();c.moveTo(v.x-p.size*.8,v.y);c.lineTo(v.x+p.size*.8,v.y);c.moveTo(v.x,v.y-p.size*.8);c.lineTo(v.x,v.y+p.size*.8);c.stroke();}
 }
 c.restore();
}
export function paint(target,t,width=1280,height=720){t=((t%DURATION)+DURATION)%DURATION;target.save();target.setTransform(width/W,0,0,height/H,0,0);target.clearRect(0,0,W,H);if(chamberMode)target.drawImage(background,0,0,W,H);
 const a=t/DURATION*TAU;if(chamberMode){target.save();target.translate(CX,895);target.scale(1,.13);let floor=target.createRadialGradient(0,0,0,0,0,110);floor.addColorStop(0,'rgba(255,195,91,.18)');floor.addColorStop(.5,'rgba(105,206,234,.06)');floor.addColorStop(1,'rgba(255,195,91,0)');target.fillStyle=floor;target.fillRect(-112,-112,224,224);target.restore();}
 target.save();if(chamberMode){target.translate(CX,CY);target.scale(.78,.78);target.translate(-CX,-CY);}
 const layers=[...livingLayers(t,bodyVersion,mix),...artworkLayers(artwork,t,bodyVersion,mix)].sort((a,b)=>a.z-b.z);
 const drawLayer=layer=>layer.part?drawArtwork(target,layer):drawLivingLayer(target,layer);
 drawDust(target,t,false);
 for(const layer of layers)if(layer.z<0)drawLayer(layer);
 let light=target.createRadialGradient(CX,CY,0,CX,CY,58);light.addColorStop(0,'rgba(255,225,150,.38)');light.addColorStop(.35,'rgba(255,176,65,.13)');light.addColorStop(1,'rgba(255,176,65,0)');target.fillStyle=light;target.fillRect(CX-60,CY-60,120,120);
 target.save();target.translate(3*Math.sin(a*2)+2*Math.sin(a*5),2*Math.cos(a*3));drawLivingHeart(target,t);target.restore();
 for(const layer of layers)if(layer.z>=0)drawLayer(layer);drawDust(target,t,true);
 target.restore();
 // Reflections sit IN FRONT of Aru so the character reads as inside the glass.
 if(chamberMode){target.save();target.globalCompositeOperation='screen';
 const glass=target.createLinearGradient(650,0,1270,0);glass.addColorStop(0,'rgba(100,220,255,.12)');glass.addColorStop(.12,'rgba(100,220,255,.025)');glass.addColorStop(.83,'rgba(100,220,255,.015)');glass.addColorStop(1,'rgba(150,235,255,.12)');target.fillStyle=glass;target.fillRect(650,140,620,750);
 target.strokeStyle='rgba(182,239,255,.18)';target.lineWidth=3;for(const x of [676,1230]){target.beginPath();target.moveTo(x,160);target.bezierCurveTo(x-14,380,x-14,650,x,862);target.stroke();}target.restore();}
 target.restore();
}
function time(){return running?((performance.now()-started)/1000)%DURATION:frozen;}
function tick(){if(ready&&running)paint(ctx,time(),canvas.width,canvas.height);requestAnimationFrame(tick);}
ready=true;status.textContent='Painted body & flickering head · 8 hovering wings · independent shards · 480 lights';play.disabled=false;document.querySelector('#still').disabled=false;paint(ctx,0,canvas.width,canvas.height);tick();
play.onclick=()=>{if(running){frozen=time();running=false;}else{started=performance.now()-frozen*1000;running=true;}play.textContent=running?'Pause animation':'Play animation';};
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);}
document.querySelector('#still').onclick=()=>{const c=document.createElement('canvas');c.width=1920;c.height=1080;paint(c.getContext('2d'),time(),1920,1080);c.toBlob(blob=>download(blob,`aru-${bodyVersions[bodyVersion].name.toLowerCase()}-${chamberMode?'chamber':'transparent'}.png`),'image/png');};

const viewButtons=[...document.querySelectorAll('[data-view]')];
function setView(chamber){chamberMode=chamber;const viewUrl=new URL(location.href);if(chamber)viewUrl.searchParams.set('view','chamber');else viewUrl.searchParams.delete('view');history.replaceState(null,'',viewUrl);canvas.classList.toggle('transparent',!chamber);for(const b of viewButtons)b.setAttribute('aria-pressed',String((b.dataset.view==='chamber')===chamber));document.querySelector('#view-label').textContent=chamber?'Inside the blue glass chamber':'Aru alone · transparent background';paint(ctx,time(),canvas.width,canvas.height);}
for(const b of viewButtons)b.onclick=()=>setView(b.dataset.view==='chamber');setView(chamberMode);

const versionButtons=[...document.querySelectorAll('[data-version]')];
function setVersion(value){bodyVersion=value;for(const b of versionButtons)b.setAttribute('aria-pressed',String(Number(b.dataset.version)===value));document.querySelector('#version-description').textContent=bodyVersions[value].description;paint(ctx,time(),canvas.width,canvas.height);const url=new URL(location.href);url.searchParams.set('version',String(value));history.replaceState(null,'',url);}
for(const b of versionButtons)b.onclick=()=>setVersion(Number(b.dataset.version));setVersion(bodyVersion);

const mixSelectors=[...document.querySelectorAll('[data-part]')];
for(const select of mixSelectors){select.value=mix[select.dataset.part];select.onchange=()=>{mix[select.dataset.part]=select.value;const url=new URL(location.href);for(const [key,value]of Object.entries(mix))url.searchParams.set(key,value);history.replaceState(null,'',url);paint(ctx,time(),canvas.width,canvas.height);document.querySelector('#sheet-status').textContent='Mix changed. Generate a new sheet to capture this combination.';};}
const scrub=document.querySelector('#frame-scrub');
function seekFrame(frame){running=false;frozen=frame*DURATION/48;play.textContent='Play animation';scrub.value=frame;document.querySelector('#frame-label').textContent=`Frame ${frame+1} of 48 · ${frozen.toFixed(2)} s`;paint(ctx,frozen,canvas.width,canvas.height);}
scrub.oninput=()=>seekFrame(Number(scrub.value));
let sheetResult=null;
document.querySelector('#build-sheet').onclick=async()=>{
 const button=document.querySelector('#build-sheet'),sheetStatus=document.querySelector('#sheet-status'),grid=document.querySelector('#frame-grid');
 const config={version:bodyVersions[bodyVersion].name,background:chamberMode?'chamber':'transparent',mix:{...mix}},count=48,columns=8,fw=chamberMode?320:256,fh=chamberMode?180:256;
 const locked=[...document.querySelectorAll('button,select,input')];locked.forEach(e=>e.disabled=true);frozen=time();running=false;play.textContent='Play animation';
 const sheet=document.createElement('canvas');sheet.width=columns*fw;sheet.height=Math.ceil(count/columns)*fh;const sc=sheet.getContext('2d'),frame=document.createElement('canvas');frame.width=960;frame.height=540;const fc=frame.getContext('2d'),frames=[];grid.replaceChildren();
 try{for(let i=0;i<count;i++){paint(fc,i*DURATION/count,960,540);const x=i%columns*fw,y=Math.floor(i/columns)*fh;
 if(chamberMode)sc.drawImage(frame,0,0,960,540,x,y,fw,fh);else sc.drawImage(frame,280,50,400,400,x,y,fw,fh);
 const tile=document.createElement('button');tile.className='frame-tile';tile.type='button';tile.title=`Inspect frame ${i+1}`;const thumb=document.createElement('canvas');thumb.width=fw;thumb.height=fh;thumb.className='transparent';thumb.getContext('2d').drawImage(sheet,x,y,fw,fh,0,0,fw,fh);const label=document.createElement('span');label.textContent=`${String(i+1).padStart(2,'0')} · ${(i*DURATION/count).toFixed(2)} s`;tile.append(thumb,label);tile.onclick=()=>{seekFrame(i);canvas.scrollIntoView({block:'center',behavior:'smooth'});};grid.append(tile);
 frames.push({frame:i+1,x,y,width:fw,height:fh,timeSeconds:i*DURATION/count,durationMs:250});sheetStatus.textContent=`Rendering frame ${i+1} of ${count}…`;if(i%4===3)await new Promise(requestAnimationFrame);}
 sheetResult={sheet,metadata:{...config,columns,rows:6,frameCount:count,framesPerSecond:4,durationSeconds:12,sheetWidth:sheet.width,sheetHeight:sheet.height,frames}};
 sheetStatus.textContent=`${config.version} · ${count} frames · ${fw} × ${fh} per frame · ${config.background}. Click a numbered frame to inspect it.`;
 }catch(error){sheetStatus.textContent='Could not finish the sheet. Try generating it again.';console.error(error);}finally{locked.forEach(e=>e.disabled=false);document.querySelector('#sheet-png').disabled=!sheetResult;document.querySelector('#sheet-json').disabled=!sheetResult;document.querySelector('#sheet-csv').disabled=!sheetResult;}
};
document.querySelector('#sheet-png').onclick=()=>{if(sheetResult)sheetResult.sheet.toBlob(blob=>download(blob,`aru-${sheetResult.metadata.version.toLowerCase()}-sprite-sheet.png`),'image/png');};
document.querySelector('#sheet-json').onclick=()=>{if(sheetResult)download(new Blob([JSON.stringify(sheetResult.metadata,null,2)],{type:'application/json'}),'aru-frame-data.json');};
document.querySelector('#sheet-csv').onclick=()=>{if(!sheetResult)return;const m=sheetResult.metadata,header='frame,x,y,width,height,time_seconds,duration_ms,version,background,body,head,wings,hands';const rows=m.frames.map(f=>[f.frame,f.x,f.y,f.width,f.height,f.timeSeconds,f.durationMs,m.version,m.background,m.mix.body,m.mix.head,m.mix.wings,m.mix.hands].join(','));download(new Blob([[header,...rows].join('\n')],{type:'text/csv'}),'aru-frame-spreadsheet.csv');};
// Prevent a displayed/exported sheet from silently belonging to an older mix.
function invalidateSheet(){sheetResult=null;document.querySelector('#frame-grid').replaceChildren();for(const id of ['sheet-png','sheet-json','sheet-csv'])document.getElementById(id).disabled=true;document.querySelector('#sheet-status').textContent='Selection changed. Generate a sheet for this mix.';}
for(const control of document.querySelectorAll('[data-part]'))control.addEventListener('change',invalidateSheet);
for(const control of document.querySelectorAll('[data-view],[data-version]'))control.addEventListener('click',invalidateSheet);
