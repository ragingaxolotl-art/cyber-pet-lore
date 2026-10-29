const $=id=>document.getElementById(id);
const cards=[...document.querySelectorAll('.plan-card')];
const normalize=text=>text.normalize('NFKD').toLowerCase().replace(/[−–]/g,'-').replace(/[’‘]/g,"'");
function erasOf(text){
 if(text.includes('Across'))return Array.from({length:8},(_,i)=>i-3);
 const values=new Set();
 for(const part of text.split(' / ')){
  const numbers=[...normalize(part).matchAll(/-?\d+/g)].map(m=>Number(m[0]));
  if(numbers.length===2&&/→| to /.test(part)){for(let i=numbers[0];i<=numbers[1];i++)values.add(i);}
  else numbers.forEach(n=>values.add(n));
 }
 return [...values];
}
const records=cards.map(card=>({card,text:normalize(card.textContent),category:card.dataset.category,statuses:card.dataset.status.split(' | '),eras:erasOf(card.dataset.eras)}));
for(const [id,values] of [['plan-category',records.map(r=>r.category)],['plan-status',records.flatMap(r=>r.statuses)]]){
 for(const value of [...new Set(values)].sort()){const option=document.createElement('option');option.value=value;option.textContent=value;$(id).append(option);}
}
let page=0;const size=24;
function render(scroll=false){
 const query=normalize($('plan-search').value.trim()).split(/\s+/).filter(Boolean);
 const category=$('plan-category').value,status=$('plan-status').value,era=$('plan-era').value;
 const found=records.filter(r=>query.every(q=>r.text.includes(q))&&(!category||r.category===category)&&(!status||r.statuses.includes(status))&&(era===''||r.eras.includes(Number(era))));
 page=Math.min(Math.max(page,0),Math.max(0,Math.ceil(found.length/size)-1));
 const shown=new Set(found.slice(page*size,(page+1)*size).map(r=>r.card));
 cards.forEach(c=>c.hidden=!shown.has(c));
 $('plan-count').textContent=`${found.length} of ${cards.length} title groups and possibilities · showing ${found.length?page*size+1:0}–${Math.min((page+1)*size,found.length)}`;
 $('no-plans').hidden=found.length>0;$('plan-prev').disabled=page===0;$('plan-next').disabled=(page+1)*size>=found.length;$('plan-page').textContent=`Page ${page+1} of ${Math.max(1,Math.ceil(found.length/size))}`;
 if(scroll)$('search-plans').scrollIntoView({block:'start'});
}
function followHash(){
 const id=decodeURIComponent(location.hash.slice(1));const target=cards.find(c=>c.id===id);
 if(!target)return;
 $('search-plans').reset();page=Math.floor(cards.indexOf(target)/size);render();target.querySelector('details').open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
$('search-plans').addEventListener('submit',e=>e.preventDefault());
$('search-plans').addEventListener('input',()=>{page=0;render();});
$('search-plans').addEventListener('reset',()=>{page=0;queueMicrotask(()=>render());});
$('plan-prev').addEventListener('click',()=>{page--;render(true);});$('plan-next').addEventListener('click',()=>{page++;render(true);});
document.addEventListener('click',event=>{const a=event.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)queueMicrotask(followHash);});
window.addEventListener('hashchange',followHash);render();followHash();
