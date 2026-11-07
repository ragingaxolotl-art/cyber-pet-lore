import {CUSTOM_PARTS} from './design-schema.mjs?v=flavors-20261106';
import {prepareCustom,customSurface} from './effects.mjs?v=flavors-20261106';
import {installExtras} from './studio-extras.mjs?v=flavors-20261106';
import {syncMirrors} from './design-tools.mjs?v=flavors-20261106';
import {WIDTH,HEIGHT,LIBRARY,METALS,clone,createLayer,encodeRecipe,decodeRecipe,recolor,bounds,hits,materialMasks,localPoint,withLayerTransform,drawLayer,MATERIALS,PALETTES,matchMaterial,matchPalette,orbitPose,sceneLayers} from './model.mjs?v=flavors-20261106';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const selections=new Map(),images=new Map(),tinted=new Map(),history=[],future=[];let catalog,recipe,selected=-1,category='all',picking=false,drag=null,ready=false;
const loadingImages=new Map();let visibleLimit=60,previewTime=0,lastTick=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches;
let extras=null;
const storageKey='cyberpath.ribbon-studio.v1';
const say=text=>{$('status').textContent=text;};
function part(id){return [...catalog.parts,...CUSTOM_PARTS].find(p=>p.id===id);}
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function checkpoint(){history.push(clone(recipe));if(history.length>80)history.shift();future.length=0;}
function persist(){try{localStorage.setItem(storageKey,encodeRecipe(recipe,catalog));}catch{say('Browser storage is unavailable. Download your recipe to keep this design.');}}
function commit(message){render();refresh();persist();if(message)say(message);}
function mutate(fn,message){const before=clone(recipe);try{fn();if(extras){syncMirrors(recipe,extras.selection());}encodeRecipe(recipe,catalog);history.push(before);if(history.length>80)history.shift();future.length=0;commit(message);}catch(e){recipe=before;render();refresh();say(e.message);}}
function painted(layer,fragment){if(layer.custom){const key=JSON.stringify([layer.custom,layer.color]);if(!tinted.has(key)){if(tinted.size>150)tinted.clear();tinted.set(key,customSurface(layer));}return tinted.get(key);}
 const key=JSON.stringify([layer.part,layer.mode,layer.color,layer.source,layer.tolerance,layer.materialColors,fragment?.bounds]);if(tinted.has(key))return tinted.get(key);
 const p=part(layer.part),c=document.createElement('canvas'),crop=fragment?.bounds||p.bounds;
 c.width=crop[2]-crop[0];c.height=crop[3]-crop[1];const x=c.getContext('2d');
 if(fragment){
  const source=painted(layer);x.drawImage(source,crop[0]-p.bounds[0],crop[1]-p.bounds[1],c.width,c.height,0,0,c.width,c.height);
  const d=x.getImageData(0,0,c.width,c.height),keep=new Uint8Array(c.width*c.height);
  for(const [y,a,b] of fragment.runs)for(let px=a;px<b;px++)keep[(y-crop[1])*c.width+px-crop[0]]=1;
  for(let i=0;i<keep.length;i++)if(!keep[i])d.data[i*4+3]=0;x.putImageData(d,0,0);
 }else{
  x.drawImage(images.get(layer.part),...crop.slice(0,2),c.width,c.height,0,0,c.width,c.height);
  if(layer.mode!=='original'||layer.materialColors){const d=x.getImageData(0,0,c.width,c.height);recolor(d.data,layer,selections.get(layer.part));x.putImageData(d,0,0);}
 }
 if(tinted.size>600)tinted.clear();tinted.set(key,c);return c;
}
function draw(target,outline=false){if(extras)return extras.draw(target,outline);
 target.clearRect(0,0,WIDTH,HEIGHT);target.imageSmoothingEnabled=false;
 for(const item of sceneLayers(recipe,catalog,previewTime))drawLayer(target,item.layer,item.part,painted(item.layer,item.fragment));
 if(outline&&selected>=0)for(const item of sceneLayers(recipe,catalog,previewTime).filter(x=>x.index===selected))withLayerTransform(target,item.layer,item.part,b=>{target.strokeStyle='#e8c27f';target.lineWidth=1;target.setLineDash([5,5]);target.strokeRect(-b.w/2-3,-b.h/2-3,b.w+6,b.h+6);});
}
function animate(now){if(lastTick&&playing&&ready&&!drag&&!picking&&recipe.layers.some(l=>l.visible&&l.orbit)){previewTime+=(now-lastTick)/1000;render();}lastTick=now;requestAnimationFrame(animate);}
function ensureImage(p){
 if(images.has(p.id))return Promise.resolve();if(loadingImages.has(p.id))return loadingImages.get(p.id);
 const promise=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set(p.id,im);resolve();};im.onerror=()=>{loadingImages.delete(p.id);reject(Error(`Could not load ${p.name}. Please try again.`));};im.src=p.file;});
 loadingImages.set(p.id,promise);return promise;
}
async function ensureRecipeImages(value){await prepareCustom(value.layers);await Promise.all([...new Set(value.layers.filter(l=>!l.custom).map(l=>l.part))].map(id=>ensureImage(part(id))));}
function render(){if(ready)draw(ctx,true);}
function refreshBase(){
 $('name').value=recipe.name;$('code').value=encodeRecipe(recipe,catalog);$('undo').disabled=!history.length;$('redo').disabled=!future.length;
 const list=$('layers');list.replaceChildren();if(!recipe.layers.length)list.append(element('p','Add your first part from the cabinet.','note'));
 for(let i=recipe.layers.length-1;i>=0;i--){const l=recipe.layers[i],b=element('button',part(l.part).name);b.setAttribute('aria-pressed',String(i===selected));if(!l.visible)b.append(element('small','Hidden'));b.onclick=()=>{selected=i;picking=false;render();refresh();};list.append(b);}
 const l=recipe.layers[selected];$('edit').disabled=!l;$('selected-name').textContent=l?part(l.part).name:'Choose a layer';$('orbit-play').textContent=playing?'Pause motion':'Play motion';if(!l||l.locked)return;
 $('orbit-enabled').checked=!!l.orbit;$('orbit-options').hidden=!l.orbit;for(const key of ['radius','depth','period','phase','spread'])$('orbit-'+key).value=l.orbit?.[key]??({radius:150,depth:28,period:8,phase:0,spread:160}[key]);
 for(const key of ['x','y','color','source','tolerance','mode'])$(key).value=l[key];$('opacity').value=Math.round((l.opacity??1)*100);$('opacity-value').textContent=$('opacity').value+'%';$('scale').value=Math.round(l.scale*100);$('scale-value').textContent=Math.round(l.scale*100)+'%';$('rotation').value=l.rotation||0;$('visible').checked=l.visible;refreshMaterials(l);
 $('source-label').hidden=l.mode!=='family';$('tolerance-label').hidden=l.mode!=='family';$('pick').hidden=l.mode!=='family';$('pick').textContent=picking?'Click a colour on the selected part…':'Pick a colour from this part';$('forward').disabled=selected===recipe.layers.length-1;$('backward').disabled=selected===0;
}
function refresh(){refreshBase();extras?.refresh();}
function refreshMaterials(layer){
 const keys=part(layer.part).materials||[];
 $('material-controls').hidden=!keys.length;const particle=part(layer.part).tags?.includes('particle');$('gem-title').textContent=particle?'Tint particle glow':'Tint gemstones';$('gem-color-title').textContent=particle?'Particle colour':'Gem colour';$('gem-match').textContent=particle?'Match glow / gems across design':'Match gems across design';
 $('separate-materials').checked=!!layer.materialColors;
 $('mode').querySelector('[value="all"]').textContent=layer.materialColors?'Metal / remaining part':'This whole layer';
 for(const key of MATERIALS){
  $(key+'-controls').hidden=!keys.includes(key);
  $(key+'-enabled').checked=!!layer.materialColors?.[key];
  $(key+'-color').value=layer.materialColors?.[key]||({metal:'#d7ad46',fabric:'#453783',gem:'#30bedb',leaf:'#49915a'}[key]);
  $(key+'-color').disabled=!layer.materialColors?.[key];
 }
}
function separateMaterials(layer){if(!layer.materialColors)layer.materialColors=Object.fromEntries((part(layer.part).materials||[]).map(key=>[key,null]));}
function showParts(){
 const query=$('search').value.toLowerCase(),collection=$('collection').value,particles=$('particles-only').checked;$('parts').replaceChildren();
 const filtered=catalog.parts.filter(p=>(!particles||p.tags?.includes('particle'))&&(category==='all'||p.kind===category)&&(!collection||p.collection===collection)&&`${p.name} ${p.kind} ${(p.tags||[]).join(' ')}`.toLowerCase().includes(query));
 $('count').textContent=`${filtered.length} choices`;$('more-parts').hidden=filtered.length<=visibleLimit;
 for(const p of filtered.slice(0,visibleLimit)){const b=element('button',undefined,'part');b.title=`Add ${p.name}`;const im=new Image();im.loading='lazy';im.decoding='async';im.src=p.file;im.alt='';b.append(im,element('span',p.name));
  b.onclick=async()=>{if(recipe.layers.length>=64){say('This design has 64 layers. Remove one before adding another.');return;}b.disabled=true;try{await ensureImage(p);if(recipe.layers.length>=64){say('This design has 64 layers. Remove one before adding another.');return;}mutate(()=>{const layer=createLayer(p,recipe.palette);if(layer.orbit)layer.orbit.phase=(recipe.layers.length*137.5)%360;recipe.layers.push(layer);selected=recipe.layers.length-1;},`Added ${p.name}.`);}catch(e){say(e.message);}finally{b.disabled=false;}};
  $('parts').append(b);
 }
}
function bind(){
 const known=new Set([...$('collection').options].map(o=>o.value));for(const name of new Set(catalog.parts.map(p=>p.collection).filter(Boolean))){if(!known.has(name)){const o=element('option',name);o.value=name;$('collection').append(o);}}
 $('opacity').onchange=()=>{const l=recipe.layers[selected];if(!l||l.locked)return;const v=Number($('opacity').value);if(!Number.isFinite(v))return;mutate(()=>{l.opacity=Math.max(0,Math.min(1,v/100));});};
 for(const [id,label] of [['all','All'],['ribbon','Ribbons'],['medal','Medals & pendants'],['rosette','Rosettes'],['accent','Tails & trims'],['clasp','Clasps']]){const count=id==='all'?catalog.parts.length:catalog.parts.filter(p=>p.kind===id).length;const b=element('button',`${label} (${count})`);b.dataset.category=id;b.setAttribute('aria-pressed',String(category===id));b.onclick=()=>{category=id;$('particles-only').checked=false;visibleLimit=60;for(const x of $('categories').children)x.setAttribute('aria-pressed',String(x===b));showParts();};$('categories').append(b);}
 $('search').oninput=()=>{visibleLimit=60;showParts();};$('collection').onchange=()=>{visibleLimit=60;showParts();};$('particles-only').onchange=()=>{category='all';visibleLimit=60;for(const b of $('categories').children)b.setAttribute('aria-pressed',String(b.dataset.category==='all'));showParts();};$('more-parts').onclick=()=>{visibleLimit+=60;showParts();};$('background').onchange=()=>{$('canvas-wrap').className='canvas-wrap '+$('background').value;};
 for(const key of ['x','y','scale','rotation','mode','color','source','tolerance','visible']){$(key).onchange=()=>{const l=recipe.layers[selected];if(!l||l.locked)return;let value=$(key).value;if(['x','y','scale','rotation','tolerance'].includes(key)){value=Number(value);if(!Number.isFinite(value))return;const limits={x:[-512,1024],y:[-640,1280],scale:[20,300],rotation:[-180,180],tolerance:[0,90]}[key];value=Math.max(limits[0],Math.min(limits[1],value));}mutate(()=>{l[key]=key==='visible'?$(key).checked:key==='scale'?value/100:value;});};}
 for(const [name,palette] of Object.entries(PALETTES)){const option=element('option',name);option.value=name;$('palette-preset').append(option);}
 $('apply-palette').onclick=()=>mutate(()=>{recipe=matchPalette(recipe,PALETTES[$('palette-preset').value],catalog);},'Matched metal, fabric, gems and leaves across this design. New parts will match too.');
 $('orbit-play').onclick=()=>{playing=!playing;refresh();};
 $('orbit-enabled').onchange=()=>{const l=recipe.layers[selected];if(!l||l.locked)return;mutate(()=>{if($('orbit-enabled').checked)l.orbit={radius:150,depth:28,period:8,phase:(selected*73)%360,spread:160};else delete l.orbit;},'Horizontal orbit updated. Ornaments pass behind and in front of the ribbon.');};
 for(const key of ['radius','depth','period','phase','spread'])$('orbit-'+key).onchange=()=>{const l=recipe.layers[selected];if(!l?.orbit||l.locked)return;const value=Number($('orbit-'+key).value),limits={radius:[20,240],depth:[0,100],period:[2,30],phase:[0,360],spread:[10,360]}[key];if(!Number.isFinite(value))return;mutate(()=>{l.orbit[key]=Math.max(limits[0],Math.min(limits[1],value));});};
 $('separate-materials').onchange=()=>{const l=recipe.layers[selected];if(!l||l.locked)return;mutate(()=>{if($('separate-materials').checked)separateMaterials(l);else delete l.materialColors;});};
 for(const key of MATERIALS){
  $(key+'-enabled').onchange=()=>{const l=recipe.layers[selected];if(!l||l.locked)return;mutate(()=>{separateMaterials(l);l.materialColors[key]=$(key+'-enabled').checked?$(key+'-color').value:null;});};
  $(key+'-match').onclick=()=>{const l=recipe.layers[selected];if(!l||l.locked)return;const color=l.materialColors?.[key]??$(key+'-color').value;mutate(()=>{recipe=matchMaterial(recipe,key,color,catalog);},`Matched ${key} colour across the design. New parts will match too.`);};
  $(key+'-color').onchange=()=>{const l=recipe.layers[selected];if(!l||l.locked)return;mutate(()=>{separateMaterials(l);l.materialColors[key]=$(key+'-color').value;});};
 }
 for(const [id,step] of [['rotate-left',-15],['rotate-right',15],['reset-rotation',0]])$(id).onclick=()=>{const layer=recipe.layers[selected];if(!layer||layer.locked)return;mutate(()=>{layer.rotation=step?(((layer.rotation||0)+step+540)%360)-180:0;},'Rotation: '+(step?'updated.':'reset.'));};
 $('pick').onclick=()=>{picking=!picking;refresh();if(picking)canvas.scrollIntoView({block:'center',behavior:'instant'});say(picking?'Click the fabric or metal colour you want to change on the selected part.':'Colour picker cancelled.');};
 for(const [name,color] of Object.entries(METALS)){const b=element('button',name);b.style.setProperty('--metal',color);b.onclick=()=>{const l=recipe.layers[selected];if(!l||l.locked)return;mutate(()=>{l.color=color;if(part(l.part).materials?.includes('metal')){separateMaterials(l);l.materialColors.metal=color;}else if(l.mode==='original')l.mode='all';},`Applied ${name.toLowerCase()} to ${l.mode==='family'?'the selected colour family':l.materialColors?'the metal / remaining part':'this layer'}.`);};$('metals').append(b);}
 $('forward').onclick=()=>moveLayer(1);$('backward').onclick=()=>moveLayer(-1);
 $('duplicate').onclick=()=>{if(selected<0||recipe.layers.length>=64)return;mutate(()=>{recipe.layers.splice(selected+1,0,clone(recipe.layers[selected]));selected++;},'Layer duplicated.');};
 $('remove').onclick=()=>{if(selected<0)return;mutate(()=>{recipe.layers.splice(selected,1);selected=Math.min(selected,recipe.layers.length-1);},'Layer removed. Undo brings it back.');};
 $('reset-position').onclick=()=>{const l=recipe.layers[selected],p=part(l.part);mutate(()=>{l.x=p.x;l.y=p.y;l.scale=1;},'Restored the part’s starting position and size.');};
 $('undo').onclick=()=>{if(!history.length)return;future.push(clone(recipe));recipe=history.pop();selected=Math.min(selected,recipe.layers.length-1);commit('Undone.');};
 $('redo').onclick=()=>{if(!future.length)return;history.push(clone(recipe));recipe=future.pop();selected=Math.min(selected,recipe.layers.length-1);commit('Redone.');};
 $('clear').onclick=()=>mutate(()=>{recipe.layers=[];selected=-1;},'Design cleared. Undo brings it back.');
 $('name').onchange=()=>mutate(()=>{recipe.name=$('name').value.slice(0,80);});
 $('copy').onclick=async()=>{const code=encodeRecipe(recipe,catalog);$('code').value=code;try{await navigator.clipboard.writeText(code);say('Recipe copied. Paste it into your conversation with Codex.');}catch{$('code').focus();$('code').select();say('Select and copy the highlighted recipe code.');}};
 $('load-code').onclick=()=>loadCode($('code').value);$('save-code').onclick=()=>download(new Blob([encodeRecipe(recipe,catalog)+'\n'],{type:'text/plain'}),filename()+'.ribbon.txt');
 $('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;if(file.size>3000000){say('Recipe file is too large.');return;}loadCode(await file.text());$('file').value='';};
 $('png').onclick=()=>{const out=document.createElement('canvas');out.width=WIDTH;out.height=HEIGHT;draw(out.getContext('2d'));out.toBlob(blob=>{if(blob){download(blob,filename()+'.png');say('Transparent PNG downloaded. Keep its recipe too if you want to edit it later.');}else say('PNG export failed. Please try again.');},'image/png');};
 canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
 async function loadPreset(preset){if(!preset)return;const next={version:4,library:LIBRARY,name:preset.name,layers:clone(preset.layers)};try{await ensureRecipeImages(next);extras?.reset();mutate(()=>{recipe=next;selected=-1;},'Example loaded. Every part can be changed.');}catch(e){say(e.message);}}
 for(const [i,preset] of catalog.presets.entries()){if(preset.collection){const o=element('option',preset.name);o.value=String(i);$('flavor-preset').append(o);}else{const b=element('button',preset.name);b.onclick=()=>loadPreset(preset);$('presets').append(b);}}
 $('load-flavor-preset').onclick=()=>{const v=$('flavor-preset').value;if(v!=='')return loadPreset(catalog.presets[Number(v)]);};
}
function moveLayer(direction){if(selected<0||recipe.layers[selected].locked)return;const target=selected+direction;if(target<0||target>=recipe.layers.length||recipe.layers[target].locked)return;mutate(()=>{[recipe.layers[selected],recipe.layers[target]]=[recipe.layers[target],recipe.layers[selected]];selected=target;});}
async function loadCode(code){try{const next=decodeRecipe(code,catalog);await ensureRecipeImages(next);extras?.reset();mutate(()=>{recipe=next;selected=-1;picking=false;},'Recipe restored exactly.');}catch(e){say(e.message);}}
function filename(){return (recipe.name.replace(/[^\p{L}\p{N}_-]+/gu,'-').replace(/^-|-$/g,'')||'ribbon').slice(0,70);}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);}
function point(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*WIDTH/r.width,y:(event.clientY-r.top)*HEIGHT/r.height};}
function pixel(layer,p,item=part(layer.part),fragment){const b=bounds(layer,item),c=painted(layer,fragment),local=localPoint(layer,item,p.x,p.y);const x=Math.floor((local.x-b.x)*c.width/b.w),y=Math.floor((local.y-b.y)*c.height/b.h);if(x<0||y<0||x>=c.width||y>=c.height)return null;return c.getContext('2d').getImageData(x,y,1,1).data;}
function pointerDown(event){if(!ready)return;const p=point(event);if(picking&&selected>=0){
 const l=recipe.layers[selected];let color;
 for(const item of sceneLayers(recipe,catalog,previewTime).reverse().filter(x=>x.index===selected)){
  const original={...item.layer,mode:'original',materialColors:undefined};const candidate=pixel(original,p,item.part,item.fragment);if(candidate?.[3]>=30){color=candidate;break;}
 }
 if(!color){say('Click a visible pixel of the selected part.');return;}
 mutate(()=>{l.source='#'+Array.from(color.slice(0,3),v=>v.toString(16).padStart(2,'0')).join('');l.mode='family';picking=false;},'Colour family selected. Choose a new colour.');return;
 }
 for(const item of sceneLayers(recipe,catalog,previewTime).reverse()){const i=item.index,l=item.layer;if(hits(l,item.part,p.x,p.y)&&pixel(l,p,item.part,item.fragment)?.[3]>30){extras?.select(i,event.shiftKey);selected=i;if(recipe.layers[i].locked){refresh();render();return;}checkpoint();drag={x:p.x,y:p.y,original:clone(recipe.layers),lx:recipe.layers[i].x,ly:recipe.layers[i].y};canvas.setPointerCapture(event.pointerId);refresh();render();return;}}selected=-1;extras?.reset();refresh();render();}
function pointerMove(event){if(!drag)return;const p=point(event);if(extras){recipe.layers=clone(drag.original);extras.move(p.x-drag.x,p.y-drag.y);}else{const l=recipe.layers[selected];l.x=Math.round(Math.max(-512,Math.min(1024,drag.lx+p.x-drag.x)));l.y=Math.round(Math.max(-640,Math.min(1280,drag.ly+p.y-drag.y)));}render();}
function pointerUp(){if(drag){drag=null;commit();}}
async function start(){try{const response=await fetch('catalog.json?v=newcraft-20261106');if(!response.ok)throw Error('The parts catalog could not load.');catalog=await response.json();const materialResponse=await fetch('material-selections.json?v=newcraft-20261106');if(!materialResponse.ok)throw Error('Material selections could not load. Reload to try again.');const materialData=await materialResponse.json();for(const p of catalog.parts)selections.set(p.id,materialMasks(p,materialData.parts[p.id]));recipe={version:1,library:LIBRARY,name:catalog.presets[0].name,layers:clone(catalog.presets[0].layers)};let restored=false;try{const saved=localStorage.getItem(storageKey);if(saved){const draft=decodeRecipe(saved,catalog);await ensureRecipeImages(draft);recipe=draft;restored=true;}}catch{say('The previous browser draft could not be restored. You can load a recipe file.');}await ensureRecipeImages(recipe);bind();extras=installExtras({recipe:()=>recipe,catalog:()=>catalog,selected:()=>selected,select:i=>{selected=i;},part,setPreviewTime:t=>{previewTime=t;},frozen:()=>!!drag||picking,paint:painted,mutate,say,render,refresh,load:loadCode,download,filename,replace:async next=>{await ensureRecipeImages(next);recipe=decodeRecipe(encodeRecipe(next,catalog),catalog);selected=-1;extras?.reset();commit();}});ready=true;showParts();render();refresh();say(restored?'Your previous draft is restored.':'Choose a part to start. Everything here can be mixed and recoloured.');}catch(e){say(e.message);}}
start();
