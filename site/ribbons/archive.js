const $=id=>document.getElementById(id),cards=[...document.querySelectorAll('article')];
const inputs=['search','status','category','kind'];
function filter(){const query=$('search').value.trim().toLowerCase();let count=0;for(const card of cards){card.hidden=!!((query&&!card.textContent.toLowerCase().includes(query))||['status','category','kind'].some(k=>$(k).value&&card.dataset[k]!==$(k).value));if(!card.hidden)count++;}$('count').textContent=`${count} of ${cards.length} cards`;$('empty').hidden=!!count;}
for(const id of inputs)$(id).addEventListener('input',filter);
$('reset').onclick=()=>{for(const id of inputs)$(id).value='';filter();};
const preference=matchMedia('(prefers-reduced-motion: reduce)');let paused=preference.matches;
function updateMotion(){ $('motion').textContent=paused?'Play animations':'Pause animations';$('motion').setAttribute('aria-pressed',String(paused));}
$('motion').onclick=()=>{paused=!paused;updateMotion();};preference.addEventListener('change',e=>{paused=e.matches;updateMotion();});updateMotion();
const visible=new Set();const observer=new IntersectionObserver(rows=>{for(const row of rows)row.isIntersecting?visible.add(row.target):visible.delete(row.target);},{rootMargin:'100px'});
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
const animated=[];
fetch('directory.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json();}).then(async data=>{
 const byId=new Map(data.entries.map(e=>[e.id,e]));
 await Promise.all([...document.querySelectorAll('canvas[data-id]')].map(async canvas=>{
  const entry=byId.get(canvas.dataset.id),r=entry.render,ctx=canvas.getContext('2d');
  try{
   const images=await Promise.all((r.mode==='scroll'?r.frames:[entry.art,...(r.base?[r.base]:[])]).map(load));
   function draw(clock){
    if(r.mode==='medal'){
     canvas.width=r.mini?34:256;canvas.height=r.mini?71:448;
     const f=paused?0:Math.floor(clock/r.seconds)%r.count;
     ctx.imageSmoothingEnabled=!r.mini;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(images[0],f%8*256,Math.floor(f/8)*448,256,448,0,0,canvas.width,canvas.height);
    }else if(r.mode==='scroll'){
     canvas.width=256;canvas.height=128;ctx.drawImage(images[paused?0:Math.floor(clock/r.seconds)%images.length],0,0);ctx.font='bold 18px sans-serif';ctx.fillStyle='#57320c';ctx.textAlign='center';ctx.fillText('FOUNDLING',128,63);
    }else if(r.mode==='trophy'){
     canvas.width=80;canvas.height=80;const x=r.slot%7*80,y=Math.floor(r.slot/7)*80;ctx.drawImage(images[0],x,y,80,80,0,0,80,80);if(images[1])ctx.drawImage(images[1],x,y,80,80,0,0,80,80);
    }
   }
   draw(0);if(r.mode!=='trophy'){animated.push({canvas,draw});observer.observe(canvas);}
  }catch{const img=document.createElement('img');img.src=entry.art;img.alt=entry.name;canvas.replaceWith(img);}
 }));
 let last=0;function tick(time){if(time-last>=90){for(const item of animated)if(visible.has(item.canvas)&&!item.canvas.closest('article').hidden)item.draw(time/1000);last=time;}requestAnimationFrame(tick);}requestAnimationFrame(tick);
}).catch(()=>{$('count').textContent+=' · Animation preview unavailable; original artwork downloads remain available.';});
filter();
// A direct reference opens its card even if earlier filters were selected.
window.addEventListener('hashchange',()=>{for(const id of inputs)$(id).value='';filter();});
