const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d');
const status=document.querySelector('#status'),play=document.querySelector('#play');
const TAU=Math.PI*2,DURATION=12,W=1920,H=1080,CX=960,CY=500,SCALE=.40;
let chamberMode=new URLSearchParams(location.search).get('view')==='chamber';
let running=true,started=performance.now(),frozen=0,ready=false,parts=[];
function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});}
const [background,source,manifest]=await Promise.all([loadImage('chamber-background.png'),loadImage('../chapel-motion/aru-chapel-character.png'),fetch('../chapel-motion/parts.json').then(r=>{if(!r.ok)throw Error('Part masks unavailable');return r.json();})]);
for(const [i,p] of manifest.parts.entries()){
 const [x,y,w,h]=p.bounds,sprite=document.createElement('canvas');sprite.width=w;sprite.height=h;const s=sprite.getContext('2d');
 s.beginPath();for(const [yy,xx,n] of p.runs)s.rect(xx,yy,n,1);s.clip();s.drawImage(source,x,y,w,h,0,0,w,h);
 const dx=p.center[0]-570,dy=p.center[1]-620;
 parts.push({...p,sprite,index:i,phase:Math.atan2(dy/1.35,dx),radius:Math.max(145,Math.hypot(dx,dy/1.35))*SCALE});
}
function pose(p,t){const a=t/DURATION*TAU,i=p.index,baseX=CX+(p.center[0]-570)*SCALE,baseY=CY+(p.center[1]-620)*SCALE;
 if(p.role==='orbit'){
  const speed=i%4===0?-1:1,theta=p.phase+a*speed,r=p.radius*(1+.045*Math.sin(a*2+i));
  const glitch=((Math.floor(t/DURATION*96)+i*7)%71)<2;
  return {x:CX+Math.cos(theta)*r+(glitch?5:0),y:CY+45+Math.sin(theta)*r*1.35,z:Math.sin(theta),angle:a*(i%2?2:-2)+i*.23,alpha:glitch?.45:.72+.22*(Math.sin(theta)+1)/2,scale:1+.10*Math.sin(theta)};
 }
 if(p.role==='head')return{x:baseX+Math.sin(a),y:baseY+Math.cos(a),z:0,angle:a,alpha:.92,scale:1};
 if(p.role==='wing'){
  const pattern=[.35,2.1,4.7,7.2,9.6,11.2],wi=parts.filter(q=>q.role==='wing').findIndex(q=>q.id===p.id);
  let alpha=0;for(let b=0;b<pattern.length;b++){let dt=t-pattern[b]-.10*(wi%2);if(dt>=0&&dt<.28&&((b+wi)%3!==0))alpha=Math.max(alpha,.75*(1-dt/.28));}
  return{x:baseX+Math.sin(a),y:baseY+Math.cos(a),z:0,angle:.018*Math.sin(a+i),alpha,scale:1};
 }
 if(p.role==='ring')return{x:baseX+Math.sin(a),y:baseY+Math.cos(a),z:0,angle:.055*Math.sin(a+i),alpha:.85,scale:1};
 if(p.role==='heart')return{x:baseX+Math.sin(a),y:baseY+Math.cos(a),z:0,angle:.012*Math.sin(a),alpha:.90+.1*Math.sin(a*3),scale:1+.045*Math.sin(a*3)};
 return{x:baseX+Math.sin(a),y:baseY+Math.cos(a),z:0,angle:.025*Math.sin(a+i),alpha:((Math.floor(t*8)+i*9)%47<2)?.13:.77,scale:1};
}
function drawPart(c,p,v,mult=1){if(v.alpha<.01)return;c.save();c.globalAlpha=v.alpha*mult;c.translate(v.x,v.y);c.rotate(v.angle);c.scale(SCALE*v.scale,SCALE*v.scale);c.drawImage(p.sprite,-p.sprite.width/2,-p.sprite.height/2);c.restore();}
function drawDust(c,t,front){const a=t/DURATION*TAU;const colors=['#ffe6a3','#99dce9','#d5b5eb','#e8b8cc'];
 for(let i=0;i<150;i++){const angle=a*(i%5?1:-1)+i*2.39996,z=Math.sin(angle);if((z>0)!==front)continue;const rx=80+(i*37%235),ry=100+(i*47%245);c.fillStyle=colors[i%4];for(let lag=2;lag>=0;lag--){const v=angle-lag*.018;c.globalAlpha=(.16+.32*(z+1)/2)/(lag+1);c.beginPath();c.arc(CX+Math.cos(v)*rx,CY+35+Math.sin(v)*ry,i%13===0?1.5:.65,0,TAU);c.fill();}}
 c.globalAlpha=1;
}
export function paint(target,t,width=1280,height=720){t=((t%DURATION)+DURATION)%DURATION;target.save();target.setTransform(width/W,0,0,height/H,0,0);target.clearRect(0,0,W,H);if(chamberMode)target.drawImage(background,0,0,W,H);
 const a=t/DURATION*TAU;if(chamberMode){target.save();target.translate(CX,895);target.scale(1,.13);let floor=target.createRadialGradient(0,0,0,0,0,110);floor.addColorStop(0,'rgba(255,195,91,.18)');floor.addColorStop(.5,'rgba(105,206,234,.06)');floor.addColorStop(1,'rgba(255,195,91,0)');target.fillStyle=floor;target.fillRect(-112,-112,224,224);target.restore();}
 target.save();if(chamberMode){target.translate(CX,CY);target.scale(.78,.78);target.translate(-CX,-CY);}
 const orbit=parts.filter(p=>p.role==='orbit').map(p=>({p,v:pose(p,t)})).sort((a,b)=>a.v.z-b.v.z);
 drawDust(target,t,false);
 const drawMoving=o=>{if(o.p.index%3===0){let lag=pose(o.p,(t-.07+DURATION)%DURATION);drawPart(target,o.p,lag,.16);}drawPart(target,o.p,o.v);};
 orbit.filter(o=>o.v.z<0).forEach(drawMoving);
 for(const p of parts.filter(p=>!['orbit','heart'].includes(p.role)))drawPart(target,p,pose(p,t));
 let light=target.createRadialGradient(CX,CY,0,CX,CY,58);light.addColorStop(0,'rgba(255,225,150,.38)');light.addColorStop(.35,'rgba(255,176,65,.13)');light.addColorStop(1,'rgba(255,176,65,0)');target.fillStyle=light;target.fillRect(CX-60,CY-60,120,120);
 for(const p of parts.filter(p=>p.role==='heart'))drawPart(target,p,pose(p,t));
 orbit.filter(o=>o.v.z>=0).forEach(drawMoving);drawDust(target,t,true);
 target.restore();
 // Reflections sit IN FRONT of Aru so the character reads as inside the glass.
 if(chamberMode){target.save();target.globalCompositeOperation='screen';
 const glass=target.createLinearGradient(650,0,1270,0);glass.addColorStop(0,'rgba(100,220,255,.12)');glass.addColorStop(.12,'rgba(100,220,255,.025)');glass.addColorStop(.83,'rgba(100,220,255,.015)');glass.addColorStop(1,'rgba(150,235,255,.12)');target.fillStyle=glass;target.fillRect(650,140,620,750);
 target.strokeStyle='rgba(182,239,255,.18)';target.lineWidth=3;for(const x of [676,1230]){target.beginPath();target.moveTo(x,160);target.bezierCurveTo(x-14,380,x-14,650,x,862);target.stroke();}target.restore();}
 target.restore();
}
function time(){return running?((performance.now()-started)/1000)%DURATION:frozen;}
function tick(){if(ready&&running)paint(ctx,time(),canvas.width,canvas.height);requestAnimationFrame(tick);}
ready=true;status.textContent=`${parts.length} separate layers · 12-second loop`;play.disabled=false;document.querySelector('#still').disabled=false;paint(ctx,0,canvas.width,canvas.height);tick();
play.onclick=()=>{if(running){frozen=time();running=false;}else{started=performance.now()-frozen*1000;running=true;}play.textContent=running?'Pause animation':'Play animation';};
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);}
document.querySelector('#still').onclick=()=>{const c=document.createElement('canvas');c.width=1920;c.height=1080;paint(c.getContext('2d'),time(),1920,1080);c.toBlob(blob=>download(blob,chamberMode?'aru-inside-chamber.png':'aru-transparent-frame.png'),'image/png');};

const viewButtons=[...document.querySelectorAll('[data-view]')];
function setView(chamber){chamberMode=chamber;canvas.classList.toggle('transparent',!chamber);for(const b of viewButtons)b.setAttribute('aria-pressed',String((b.dataset.view==='chamber')===chamber));document.querySelector('#view-label').textContent=chamber?'Inside the blue glass chamber':'Aru alone · transparent background';paint(ctx,time(),canvas.width,canvas.height);}
for(const b of viewButtons)b.onclick=()=>setView(b.dataset.view==='chamber');setView(chamberMode);
