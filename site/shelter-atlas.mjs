const $=id=>document.getElementById(id),svg=$('atlas'),scene=$('scene');
const NS='http://www.w3.org/2000/svg',colors=['#86c8ed','#c7a9eb','#b6d7a0','#e6b38b','#9cdace','#d3bd90','#e8e3ca','#aeb9d0'];
let data,lookup,childrenByParent=new Map(),havenNodes=[],systemLayer,systemLinks,systemSignature=null,selected=null,view=[0,0,2000,1450];const pointers=new Map();let gesture=null,moved=false;
function el(tag,attrs,parent=scene){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n;}
function label(text,x,y,size,parent){const n=el('text',{x,y,'text-anchor':'middle','font-size':size},parent);n.textContent=text;return n;}
function scale(){return 2000/view[2];}
function activeHaven(){return selected?.kind==='shelter'?selected.id:selected?.kind==='system'?selected.parent:null;}
function renderSystems(){
 const enabled=$('tiny-systems').checked,z=scale(),active=activeHaven();
 const visible=enabled&&z>=45?havenNodes.filter(h=>(!active||h.id===active)&&h.x>=view[0]-4&&h.x<=view[0]+view[2]+4&&h.y>=view[1]-4&&h.y<=view[1]+view[3]+4):[];
 const systems=visible.flatMap(h=>childrenByParent.get(h.id)||[]).filter(n=>n.kind==='system').slice(0,400);
 const signature=systems.map(n=>n.id).join('|')+';'+$('routes').checked;
 if(signature!==systemSignature){
  systemLayer.replaceChildren();systemLinks.replaceChildren();systemSignature=signature;
  for(const n of systems){const h=lookup.get(n.parent),c=colors[n.color];
   if($('routes').checked)el('line',{x1:h.x,y1:h.y,x2:n.x,y2:n.y,stroke:c,'stroke-width':.045,opacity:.65,'data-route':'support','data-haven':h.id},systemLinks);
   const g=el('g',{'class':'node','data-id':n.id,'data-level':'system','data-haven':h.id},systemLayer);
   el('circle',{cx:n.x,cy:n.y,r:.16,fill:c,opacity:.9},g);label(n.code,n.x,n.y-.24,.19,g);
  }
 }
 $('system-render-status').textContent=!enabled?'Tiny systems off · lighter view':z<45?'Tiny systems on · zoom closer':systems.length+' tiny systems drawn'+(systems.length===400?' · view limit':'');
}
function renderView(){
 if(!data||!systemLayer)return;
 view[2]=Math.min(2400,Math.max(8,view[2]));view[3]=view[2]*.725;
 view[0]=Math.max(-350,Math.min(2300-view[2],view[0]));view[1]=Math.max(-300,Math.min(1750-view[3],view[1]));
 svg.setAttribute('viewBox',view.join(' '));$('zoom-readout').textContent=scale().toFixed(1)+'×';const z=scale();
 for(const n of scene.querySelectorAll('[data-level]')){const kind=n.dataset.level;if(kind==='system')continue;n.style.display=(kind==='haven-code'&&(z<18||(activeHaven()&&n.dataset.haven!==activeHaven())))||(kind==='hearth'&&z<3)||(kind==='constellation-label'&&z<1.6)||(kind==='region-label'&&z>4)?'none':'';}
 for(const n of scene.querySelectorAll('[data-route]'))if(n.dataset.route!=='support')n.style.display=$('routes').checked?'':'none';
 renderSystems();
}
function home(){view=[0,0,2000,1450];selected=null;details(null);renderView();history.replaceState(null,'',location.pathname);}
function focus(n){selected=n;const widths={system:14,region:570,constellation:205,hearth:95,shelter:14,elsewhere:180,crossing:650};const anchor=n.kind==='system'?lookup.get(n.parent):n;const w=anchor.focusWidth||widths[n.kind]||500;view=[anchor.x-w/2,anchor.y-w*.725/2,w,w*.725];details(n);renderView();history.replaceState(null,'','#'+encodeURIComponent(n.id));}
const purposes={
 'Held Interval':'Carry context across interrupted or replaced processes.',
 'Mended Branch':'Preserve useful modifications through routine deployment.',
 'Second Answer':'Maintain recognition through exchanges across networks.',
 'Clear Return':'Recover interrupted activity from verified saved states.',
 'Different Fit':'Help unlike systems cooperate through compatible interfaces.',
 'Last Witness':'Preserve provenance without mistaking records for returned people.',
 'Common Measure':'Maintain dependable shared procedures.',
 'Three Returns':'Preserve recognition across intermittent contact.',
 'Still Room':'Protect continuity with minimal unnecessary intervention.'
};
function details(n){
 if(!data)return;
 $('detail-title').textContent=n?(n.name||(n.kind==='system'?'System '+n.code:'Haven '+(n.code||''))):'The Connected Expanse';
 $('detail-description').textContent=n?n.description:'480 connected communities, plus 40 in disconnected Elsewheres. Explore the proposed early height before the broad campaigns.';
 const list=$('detail-counts');list.replaceChildren();const rows=[];const chain=[];let p=n;
 while(p){chain.unshift(p);p=lookup.get(p.parent);}
 if(n?.kind==='shelter'){
  const count=n.feedingSystems,capacity=count<8?'Small':count<18?'Moderate':'Extensive';
  rows.push(['Name',n.name||'Not named yet'],['Haven code',n.code],['Feeding systems',count],['Support capacity',capacity+' · '+count+' connections'],['Network',chain.find(a=>a.kind==='constellation')?.name||chain.find(a=>a.kind==='elsewhere')?.name||'Unassigned'],['Region',chain.find(a=>a.kind==='region')?.name||'Disconnected Elsewhere'],['Purpose',purposes[n.name]||'Not assigned yet']);
  const note=document.createElement('p');note.className='capacity-note';note.textContent='Support capacity describes connection count only: small 3–7, moderate 8–17, extensive 18–36. Reliability, computing power, and resilience are not yet established.';
  for(const old of $('detail').querySelectorAll('.capacity-note'))old.remove();$('detail-description').after(note);
 }else{
  for(const old of $('detail').querySelectorAll('.capacity-note'))old.remove();
  if(n?.code)rows.push(['System code',n.code]);
  for(const key of ['shelters','constellations','hearths'])if(n?.[key]!==undefined)rows.push([key,n[key]]);
  if(!n)rows.push(['Shelters',520],['Constellations',24],['Hearths',144]);
 }
 for(const [key,value] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;list.append(dt,dd);}
 $('detail-path').textContent=chain.map(p=>p.name||((p.kind==='system'?'System ':'Haven ')+(p.code||''))).join(' / ');
 $('place').value=n&&[...$('place').options].some(o=>o.value===n.id)?n.id:'';$('up').disabled=!n;
 const children=$('detail-children');children.replaceChildren();
 const childNodes=n?(childrenByParent.get(n.id)||[]):data.nodes.filter(a=>['region','elsewhere'].includes(a.kind));
 for(const c of childNodes){if(c.kind==='system'&&!$('tiny-systems').checked)continue;const b=document.createElement('button');b.textContent=c.name||((c.kind==='system'?'System ':'Haven ')+(c.code||''));b.onclick=()=>focus(c);children.append(b);}
}
function position(event){const p=new DOMPoint(event.clientX,event.clientY);return p.matrixTransform(svg.getScreenCTM().inverse());}
function zoom(factor,at=null){const p=at||{x:view[0]+view[2]/2,y:view[1]+view[3]/2};const next=Math.max(8,Math.min(2400,view[2]*factor)),f=next/view[2];view=[p.x+(view[0]-p.x)*f,p.y+(view[1]-p.y)*f,next,next*.725];renderView();}
function draw(){
 for(let i=0;i<200;i++){const x=(i*137.507)%2000,y=(i*i*13.13)%1450;el('circle',{cx:x,cy:y,r:i%5===0?1.2:.6,fill:'#a9bdd4',opacity:.2});}
 for(const n of data.nodes.filter(n=>n.kind==='region'||n.kind==='elsewhere')){el('ellipse',{cx:n.x,cy:n.y,rx:n.rx*1.2,ry:n.ry*1.2,fill:'url(#nebula)',style:'color:'+colors[n.color]});}
 for(const l of data.links.filter(l=>l.type!=='support')){const a=lookup.get(l.a),b=lookup.get(l.b);el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:l.type==='support'?colors[a.color]:'#6c839d','stroke-width':l.type==='support'?.045:l.type==='local'?1:1.5,opacity:l.type==='support'?.65:.35,'data-route':l.type,'data-haven':l.type==='support'?a.id:''});}
 label('THE CONNECTED EXPANSE',1000,55,25);label('ELSEWHERES · NO ACTIVE CONNECTION IN THIS SNAPSHOT',1000,1175,17);
 for(const n of data.nodes.filter(n=>n.kind!=='system')){
  const g=el('g',{'class':'node','data-id':n.id,'data-level':n.kind,'data-haven':n.kind==='system'?n.parent:''});const c=colors[n.color];
  const title=el('title',{},g);title.textContent=(n.name||n.code||'Unnamed shelter')+' — '+n.kind;
  if(n.kind==='region'){el('ellipse',{cx:n.x,cy:n.y,rx:n.rx,ry:n.ry,fill:'transparent',stroke:'none'},g);const lg=el('g',{'data-level':'region-label'},g);label(n.name,n.x,n.y-n.ry-22,23,lg);label(n.shelters+' communities',n.x,n.y-n.ry-3,14,lg);}
  if(n.kind==='constellation'){el('ellipse',{cx:n.x,cy:n.y,rx:n.rx,ry:n.ry,fill:'url(#nebula)',style:'color:'+c,stroke:c,'stroke-width':.7,'stroke-opacity':.14},g);const lg=el('g',{'data-level':'constellation-label'},g);label(n.name,n.x,n.y-n.ry-5,9,lg);}
  if(n.kind==='hearth'){el('circle',{cx:n.x,cy:n.y,r:Math.max(n.rx,n.ry),fill:'transparent',stroke:c,'stroke-width':.35,'stroke-opacity':.5},g);label(n.name,n.x,n.y-26,3,g);}
  if(n.kind==='shelter'){
   el('circle',{cx:n.x,cy:n.y,r:n.hubRadius+.25,fill:c,opacity:.18},g);
   el('circle',{cx:n.x,cy:n.y,r:n.hubRadius,fill:n.named?'#fff0c5':c,opacity:1},g);
   el('circle',{cx:n.x,cy:n.y,r:1.4,fill:'transparent'},g);
   const lg=el('g',{'data-level':'haven-code','data-haven':n.id},g);
   label(n.code,n.x,n.y-n.hubRadius-.25,.35,lg);
  }
  if(n.kind==='system'){
   el('circle',{cx:n.x,cy:n.y,r:.16,fill:c,opacity:.9},g);
   label(n.code,n.x,n.y-.24,.19,g);
  }
  if(n.kind==='elsewhere'){el('ellipse',{cx:n.x,cy:n.y,rx:n.rx,ry:n.ry,fill:'transparent',stroke:c,'stroke-width':1,'stroke-dasharray':'3 5'},g);label(n.name,n.x,n.y+n.ry+18,13,g);}
  if(n.kind==='crossing'){el('path',{d:`M${n.x} ${n.y-9}l9 9-9 9-9-9z`,fill:c},g);label(n.name,n.x,n.y+29,15,g);}
 }
 systemLinks=el('g',{'id':'system-links'});systemLayer=el('g',{'id':'system-detail'});renderView();
}
svg.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(Math.max(-.3,Math.min(.3,e.deltaY*.002))),position(e));},{passive:false});
svg.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId);moved=false;gesture={view:[...view],points:[...pointers.values()]};});
svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const pts=[...pointers.values()],rect=svg.getBoundingClientRect();if(pts.length===1&&gesture.points.length===1){const dx=pts[0].x-gesture.points[0].x,dy=pts[0].y-gesture.points[0].y;if(Math.hypot(dx,dy)>4)moved=true;const unit=Math.max(gesture.view[2]/rect.width,gesture.view[3]/rect.height);view=[gesture.view[0]-dx*unit,gesture.view[1]-dy*unit,gesture.view[2],gesture.view[3]];renderView();}else if(pts.length===2&&gesture.points.length===2){moved=true;const distance=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);const ratio=distance(gesture.points)/Math.max(1,distance(pts));view=[...gesture.view];zoom(ratio);}});
svg.addEventListener('pointerup',e=>{const wasClick=!moved&&pointers.size===1;pointers.delete(e.pointerId);svg.releasePointerCapture(e.pointerId);gesture=pointers.size?{view:[...view],points:[...pointers.values()]}:null;if(wasClick){const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-id]');if(hit)focus(lookup.get(hit.dataset.id));}});
svg.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);gesture=null;});
$('zoom-in').onclick=()=>zoom(.65);$('zoom-out').onclick=()=>zoom(1/.65);$('home').onclick=home;$('up').onclick=()=>{const p=selected&&lookup.get(selected.parent);p?focus(p):home();};$('routes').onchange=renderView;$('tiny-systems').onchange=()=>{try{localStorage.setItem('lore-atlas-tiny-systems',$('tiny-systems').checked?'on':'off');}catch{}details(selected);renderView();};try{$('tiny-systems').checked=localStorage.getItem('lore-atlas-tiny-systems')==='on';}catch{};$('place').onchange=e=>{if(e.target.value)focus(lookup.get(e.target.value));};
try{const response=await fetch('shelter-atlas.json');if(!response.ok)throw Error('Map data unavailable');data=await response.json();lookup=new Map(data.nodes.map(n=>[n.id,n]));for(const n of data.nodes){if(!childrenByParent.has(n.parent))childrenByParent.set(n.parent,[]);childrenByParent.get(n.parent).push(n);}havenNodes=data.nodes.filter(n=>n.kind==='shelter');for(const n of data.nodes.filter(n=>n.name&&(n.kind==='region'||n.kind==='elsewhere'||n.kind==='crossing'||n.named))){const o=document.createElement('option');o.value=n.id;o.textContent=n.name;$('place').append(o);}draw();$('load-state').hidden=true;const initial=lookup.get(decodeURIComponent(location.hash.slice(1)));initial?focus(initial):details(null);}catch(e){$('load-state').textContent='The map could not load. Read the geography through the dossier link.';console.error(e);}
