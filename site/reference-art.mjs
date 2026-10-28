// Artwork is supplemental: it never adds text to a saved highlight's paragraph.
let cleanup=[],generation=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduced.matches;
const active=new Set();let frame=0,last=0;
const button=()=>document.getElementById('reference-motion');
function sync(){const b=button();if(b){b.textContent=paused?'Play reference animations':'Pause reference animations';b.setAttribute('aria-pressed',String(paused));}}
reduced.addEventListener('change',e=>{paused=e.matches;sync();for(const draw of active)draw(0);});
export function clearReferenceArt(){generation++;for(const stop of cleanup)stop();cleanup=[];active.clear();cancelAnimationFrame(frame);frame=0;if(button())button().hidden=true;}
function animate(time){if(time-last>90){for(const draw of active)draw(paused?0:time/1000);last=time;}frame=requestAnimationFrame(animate);}
const image=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
export function renderReferenceArt(parent,art,label){
 const gen=generation,b=button();if(b){b.hidden=false;b.onclick=()=>{paused=!paused;sync();for(const draw of active)draw(0);};sync();}
 const mode=art.render?.mode;
 if(!mode){const img=document.createElement('img');img.className='reference-art';img.alt=label;img.loading='lazy';img.src=paused&&art.still?art.still:art.src;parent.append(img);
  if(art.still){const draw=()=>{const target=paused?art.still:art.src;if(img.getAttribute('src')!==target)img.src=target;};active.add(draw);}return;}
 const canvas=document.createElement('canvas');canvas.className='reference-art';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',label);canvas.width=256;canvas.height=mode==='scroll'?128:mode==='trophy'?80:448;parent.append(canvas);
 const r=art.render;let draw=null,loading=false;
 const observer=new IntersectionObserver(async rows=>{for(const row of rows){
  if(!row.isIntersecting){if(draw)active.delete(draw);continue;}
  if(draw){active.add(draw);continue;}if(loading)continue;loading=true;
  try{const images=await Promise.all((mode==='scroll'?r.frames:[art.src,...(r.base?[r.base]:[])]).map(image));if(gen!==generation)return;
   const ctx=canvas.getContext('2d');draw=clock=>{ctx.clearRect(0,0,canvas.width,canvas.height);
    if(mode==='medal'){const f=paused?0:Math.floor(clock/r.seconds)%r.count;ctx.drawImage(images[0],f%8*256,Math.floor(f/8)*448,256,448,0,0,256,448);}
    else if(mode==='scroll'){ctx.drawImage(images[paused?0:Math.floor(clock/r.seconds)%images.length],0,0);ctx.font='bold 18px sans-serif';ctx.fillStyle='#57320c';ctx.textAlign='center';ctx.fillText('FOUNDLING',128,63);}
    else{canvas.width=80;canvas.height=80;const x=r.slot%7*80,y=Math.floor(r.slot/7)*80;ctx.drawImage(images[0],x,y,80,80,0,0,80,80);if(images[1])ctx.drawImage(images[1],x,y,80,80,0,0,80,80);}
   };draw(0);if(mode!=='trophy'){active.add(draw);if(!frame)frame=requestAnimationFrame(animate);}
  }catch{if(gen===generation){const img=document.createElement('img');img.src=art.src;img.alt=label;img.className='reference-art';canvas.replaceWith(img);}}
 }},{rootMargin:'100px'});observer.observe(canvas);cleanup.push(()=>observer.disconnect());
}
