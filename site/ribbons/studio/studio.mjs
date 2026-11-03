import {WIDTH,HEIGHT,LIBRARY,METALS,clone,createLayer,encodeRecipe,decodeRecipe,recolor,bounds,hits,materialMasks,localPoint,withLayerTransform,drawLayer} from './model.mjs?v=rotation-1';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const selections=new Map(),images=new Map(),tinted=new Map(),history=[],future=[];let catalog,recipe,selected=-1,category='all',picking=false,drag=null,ready=false;
const storageKey='cyberpath.ribbon-studio.v1';
const say=text=>{$('status').textContent=text;};
function part(id){return catalog.parts.find(p=>p.id===id);}
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function checkpoint(){history.push(clone(recipe));if(history.length>80)history.shift();future.length=0;}
function persist(){try{localStorage.setItem(storageKey,encodeRecipe(recipe,catalog));}catch{say('Browser storage is unavailable. Download your recipe to keep this design.');}}
function commit(message){render();refresh();persist();if(message)say(message);}
function mutate(fn,message){checkpoint();fn();commit(message);}
function painted(layer){const key=JSON.stringify([layer.part,layer.mode,layer.color,layer.source,layer.tolerance,layer.materialColors]);if(tinted.has(key))return tinted.get(key);const p=part(layer.part),source=images.get(layer.part),c=document.createElement('canvas');c.width=p.bounds[2]-p.bounds[0];c.height=p.bounds[3]-p.bounds[1];const x=c.getContext('2d');x.drawImage(source,p.bounds[0],p.bounds[1],c.width,c.height,0,0,c.width,c.height);if(layer.mode!=='original'||layer.materialColors){const d=x.getImageData(0,0,c.width,c.height);recolor(d.data,layer,selections.get(layer.part));x.putImageData(d,0,0);}if(tinted.size>150)tinted.clear();tinted.set(key,c);return c;}
function draw(target,outline=false){target.clearRect(0,0,WIDTH,HEIGHT);target.imageSmoothingEnabled=false;for(const layer of recipe.layers){if(layer.visible)drawLayer(target,layer,part(layer.part),painted(layer));}if(outline&&selected>=0&&recipe.layers[selected]?.visible){const layer=recipe.layers[selected];withLayerTransform(target,layer,part(layer.part),b=>{target.strokeStyle='#e8c27f';target.lineWidth=1;target.setLineDash([5,5]);target.strokeRect(-b.w/2-3,-b.h/2-3,b.w+6,b.h+6);});}}
function render(){if(ready)draw(ctx,true);}
function refresh(){
 $('name').value=recipe.name;$('code').value=encodeRecipe(recipe,catalog);$('undo').disabled=!history.length;$('redo').disabled=!future.length;
 const list=$('layers');list.replaceChildren();if(!recipe.layers.length)list.append(element('p','Add your first part from the cabinet.','note'));
 for(let i=recipe.layers.length-1;i>=0;i--){const l=recipe.layers[i],b=element('button',part(l.part).name);b.setAttribute('aria-pressed',String(i===selected));if(!l.visible)b.append(element('small','Hidden'));b.onclick=()=>{selected=i;picking=false;render();refresh();};list.append(b);}
 const l=recipe.layers[selected];$('edit').disabled=!l;$('selected-name').textContent=l?part(l.part).name:'Choose a layer';if(!l)return;
 for(const key of ['x','y','color','source','tolerance','mode'])$(key).value=l[key];$('scale').value=Math.round(l.scale*100);$('scale-value').textContent=Math.round(l.scale*100)+'%';$('rotation').value=l.rotation||0;$('visible').checked=l.visible;refreshMaterials(l);
 $('source-label').hidden=l.mode!=='family';$('tolerance-label').hidden=l.mode!=='family';$('pick').hidden=l.mode!=='family';$('pick').textContent=picking?'Click a colour on the selected part…':'Pick a colour from this part';$('forward').disabled=selected===recipe.layers.length-1;$('backward').disabled=selected===0;
}
function refreshMaterials(layer){
 const keys=part(layer.part).materials||[];
 $('material-controls').hidden=!keys.length;
 $('separate-materials').checked=!!layer.materialColors;
 $('mode').querySelector('[value="all"]').textContent=layer.materialColors?'Metal / remaining part':'This whole layer';
 for(const key of ['gem','leaf']){
  $(key+'-controls').hidden=!keys.includes(key);
  $(key+'-enabled').checked=!!layer.materialColors?.[key];
  $(key+'-color').value=layer.materialColors?.[key]||(key==='gem'?'#7855ce':'#459759');
  $(key+'-color').disabled=!layer.materialColors?.[key];
 }
}
function separateMaterials(layer){if(!layer.materialColors)layer.materialColors=Object.fromEntries((part(layer.part).materials||[]).map(key=>[key,null]));}
function showParts(){const query=$('search').value.toLowerCase();$('parts').replaceChildren();const filtered=catalog.parts.filter(p=>(category==='all'||p.kind===category)&&`${p.name} ${p.kind}`.toLowerCase().includes(query));$('count').textContent=`${filtered.length} / ${catalog.parts.length}`;for(const p of filtered){const b=element('button',undefined,'part');b.title=`Add ${p.name}`;const im=new Image();im.src=p.file;im.alt='';b.append(im,element('span',p.name));b.onclick=()=>{if(recipe.layers.length>=24){say('This design has 24 layers. Remove one before adding another.');return;}mutate(()=>{recipe.layers.push(createLayer(p));selected=recipe.layers.length-1;},`Added ${p.name}.`);};$('parts').append(b);}}
function bind(){
 for(const [id,label] of [['all','All'],['ribbon','Ribbons'],['medal','Medals'],['rosette','Rosettes'],['accent','Tails & trims'],['clasp','Clasps']]){const b=element('button',label);b.dataset.category=id;b.setAttribute('aria-pressed',String(category===id));b.onclick=()=>{category=id;for(const x of $('categories').children)x.setAttribute('aria-pressed',String(x===b));showParts();};$('categories').append(b);}
 $('search').oninput=showParts;$('background').onchange=()=>{$('canvas-wrap').className='canvas-wrap '+$('background').value;};
 for(const key of ['x','y','scale','rotation','mode','color','source','tolerance','visible']){$(key).onchange=()=>{const l=recipe.layers[selected];if(!l)return;let value=$(key).value;if(['x','y','scale','rotation','tolerance'].includes(key)){value=Number(value);if(!Number.isFinite(value))return;const limits={x:[-512,1024],y:[-640,1280],scale:[20,300],rotation:[-180,180],tolerance:[0,90]}[key];value=Math.max(limits[0],Math.min(limits[1],value));}mutate(()=>{l[key]=key==='visible'?$(key).checked:key==='scale'?value/100:value;});};}
 $('separate-materials').onchange=()=>{const l=recipe.layers[selected];if(!l)return;mutate(()=>{if($('separate-materials').checked)separateMaterials(l);else delete l.materialColors;});};
 for(const key of ['gem','leaf']){
  $(key+'-enabled').onchange=()=>{const l=recipe.layers[selected];if(!l)return;mutate(()=>{separateMaterials(l);l.materialColors[key]=$(key+'-enabled').checked?$(key+'-color').value:null;});};
  $(key+'-color').onchange=()=>{const l=recipe.layers[selected];if(!l)return;mutate(()=>{separateMaterials(l);l.materialColors[key]=$(key+'-color').value;});};
 }
 for(const [id,step] of [['rotate-left',-15],['rotate-right',15],['reset-rotation',0]])$(id).onclick=()=>{const layer=recipe.layers[selected];if(!layer)return;mutate(()=>{layer.rotation=step?(((layer.rotation||0)+step+540)%360)-180:0;},'Rotation: '+(step?'updated.':'reset.'));};
 $('pick').onclick=()=>{picking=!picking;refresh();if(picking)canvas.scrollIntoView({block:'center',behavior:'instant'});say(picking?'Click the fabric or metal colour you want to change on the selected part.':'Colour picker cancelled.');};
 for(const [name,color] of Object.entries(METALS)){const b=element('button',name);b.style.setProperty('--metal',color);b.onclick=()=>{const l=recipe.layers[selected];if(!l)return;mutate(()=>{l.color=color;if(part(l.part).materials?.length)separateMaterials(l);if(l.mode==='original')l.mode='all';},`Applied ${name.toLowerCase()} to ${l.mode==='family'?'the selected colour family':l.materialColors?'the metal / remaining part':'this layer'}.`);};$('metals').append(b);}
 $('forward').onclick=()=>moveLayer(1);$('backward').onclick=()=>moveLayer(-1);
 $('duplicate').onclick=()=>{if(selected<0||recipe.layers.length>=24)return;mutate(()=>{recipe.layers.splice(selected+1,0,clone(recipe.layers[selected]));selected++;},'Layer duplicated.');};
 $('remove').onclick=()=>{if(selected<0)return;mutate(()=>{recipe.layers.splice(selected,1);selected=Math.min(selected,recipe.layers.length-1);},'Layer removed. Undo brings it back.');};
 $('reset-position').onclick=()=>{const l=recipe.layers[selected],p=part(l.part);mutate(()=>{l.x=p.x;l.y=p.y;l.scale=1;},'Restored the part’s starting position and size.');};
 $('undo').onclick=()=>{if(!history.length)return;future.push(clone(recipe));recipe=history.pop();selected=Math.min(selected,recipe.layers.length-1);commit('Undone.');};
 $('redo').onclick=()=>{if(!future.length)return;history.push(clone(recipe));recipe=future.pop();selected=Math.min(selected,recipe.layers.length-1);commit('Redone.');};
 $('clear').onclick=()=>mutate(()=>{recipe.layers=[];selected=-1;},'Design cleared. Undo brings it back.');
 $('name').onchange=()=>mutate(()=>{recipe.name=$('name').value.slice(0,80);});
 $('copy').onclick=async()=>{const code=encodeRecipe(recipe,catalog);$('code').value=code;try{await navigator.clipboard.writeText(code);say('Recipe copied. Paste it into your conversation with Codex.');}catch{$('code').focus();$('code').select();say('Select and copy the highlighted recipe code.');}};
 $('load-code').onclick=()=>loadCode($('code').value);$('save-code').onclick=()=>download(new Blob([encodeRecipe(recipe,catalog)+'\n'],{type:'text/plain'}),filename()+'.ribbon.txt');
 $('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;if(file.size>40000){say('Recipe file is too large.');return;}loadCode(await file.text());$('file').value='';};
 $('png').onclick=()=>{const out=document.createElement('canvas');out.width=WIDTH;out.height=HEIGHT;draw(out.getContext('2d'));out.toBlob(blob=>{if(blob){download(blob,filename()+'.png');say('Transparent PNG downloaded. Keep its recipe too if you want to edit it later.');}else say('PNG export failed. Please try again.');},'image/png');};
 canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
 for(const preset of catalog.presets){const b=element('button',preset.name);b.onclick=()=>mutate(()=>{recipe={version:1,library:LIBRARY,name:preset.name,layers:clone(preset.layers)};selected=-1;},'Example loaded. Every part can be changed.');$('presets').append(b);}
}
function moveLayer(direction){if(selected<0)return;const target=selected+direction;if(target<0||target>=recipe.layers.length)return;mutate(()=>{[recipe.layers[selected],recipe.layers[target]]=[recipe.layers[target],recipe.layers[selected]];selected=target;});}
function loadCode(code){try{const next=decodeRecipe(code,catalog);mutate(()=>{recipe=next;selected=-1;picking=false;},'Recipe restored exactly.');}catch(e){say(e.message);}}
function filename(){return (recipe.name.replace(/[^\p{L}\p{N}_-]+/gu,'-').replace(/^-|-$/g,'')||'ribbon').slice(0,70);}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);}
function point(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*WIDTH/r.width,y:(event.clientY-r.top)*HEIGHT/r.height};}
function pixel(layer,p){const item=part(layer.part),b=bounds(layer,item),c=painted(layer),local=localPoint(layer,item,p.x,p.y);const x=Math.floor((local.x-b.x)*c.width/b.w),y=Math.floor((local.y-b.y)*c.height/b.h);if(x<0||y<0||x>=c.width||y>=c.height)return null;return c.getContext('2d').getImageData(x,y,1,1).data;}
function pointerDown(event){if(!ready)return;const p=point(event);if(picking&&selected>=0){const l=recipe.layers[selected],original={...l,mode:'original'},color=pixel(original,p);if(!color||color[3]<30){say('Click a visible pixel of the selected part.');return;}mutate(()=>{l.source='#'+Array.from(color.slice(0,3),v=>v.toString(16).padStart(2,'0')).join('');l.mode='family';picking=false;},'Colour family selected. Choose a new colour.');return;}
 for(let i=recipe.layers.length-1;i>=0;i--){const l=recipe.layers[i];if(hits(l,part(l.part),p.x,p.y)&&pixel(l,p)?.[3]>30){selected=i;checkpoint();drag={x:p.x,y:p.y,lx:l.x,ly:l.y};canvas.setPointerCapture(event.pointerId);refresh();render();return;}}selected=-1;refresh();render();}
function pointerMove(event){if(!drag)return;const p=point(event),l=recipe.layers[selected];l.x=Math.round(Math.max(-512,Math.min(1024,drag.lx+p.x-drag.x)));l.y=Math.round(Math.max(-640,Math.min(1280,drag.ly+p.y-drag.y)));render();}
function pointerUp(){if(drag){drag=null;commit();}}
async function start(){try{const response=await fetch('catalog.json?v=materials-1');if(!response.ok)throw Error('The parts catalog could not load.');catalog=await response.json();const materialResponse=await fetch('material-selections.json?v=1');if(!materialResponse.ok)throw Error('Material selections could not load. Reload to try again.');const materialData=await materialResponse.json();for(const p of catalog.parts)selections.set(p.id,materialMasks(p,materialData.parts[p.id]));await Promise.all(catalog.parts.map(p=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set(p.id,im);resolve();};im.onerror=()=>reject(Error(`Could not load ${p.name}. Reload to try again.`));im.src=p.file;})));recipe={version:1,library:LIBRARY,name:catalog.presets[0].name,layers:clone(catalog.presets[0].layers)};let restored=false;try{const saved=localStorage.getItem(storageKey);if(saved){recipe=decodeRecipe(saved,catalog);restored=true;}}catch{say('The previous browser draft could not be restored. You can load a recipe file.');}bind();ready=true;showParts();render();refresh();say(restored?'Your previous draft is restored.':'Choose a part to start. Everything here can be mixed and recoloured.');}catch(e){say(e.message);}}
start();
