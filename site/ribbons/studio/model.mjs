import {CUSTOM_PARTS,extraLayer,extraRecipe} from './design-schema.mjs?v=flavors-20261106';
export const WIDTH=512, HEIGHT=640, LIBRARY='ornate-v1';
export const METALS={Gold:'#d7ad46',Silver:'#b9cfdb',Bronze:'#ad7543',Copper:'#c77b54','Rose gold':'#d6a18f',Platinum:'#d8e5ec',Gunmetal:'#566776'};
export const MATERIALS=['metal','fabric','gem','leaf'];
export const PALETTES={
 'Royal sapphire':{metal:'#d7ad46',fabric:'#453783',gem:'#30bedb',leaf:'#49915a'},
 'Silver moon':{metal:'#becbd8',fabric:'#314569',gem:'#a6d8f5',leaf:'#659c9e'},
 'Rose garden':{metal:'#d6a18f',fabric:'#922f62',gem:'#e49fc9',leaf:'#4a8e59'},
 'Copper forest':{metal:'#c77b54',fabric:'#285949',gem:'#56cb9c',leaf:'#609642'},
 'Bronze ember':{metal:'#ad7543',fabric:'#733631',gem:'#ee8a37',leaf:'#9c8040'},
 'Midnight data':{metal:'#566776',fabric:'#32245c',gem:'#58e2de',leaf:'#538bb9'}
};
export const clone=value=>JSON.parse(JSON.stringify(value));
export function checksum(text){let h=2166136261;for(const c of new TextEncoder().encode(text)){h^=c;h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
export function validateRecipe(value,catalog){
 if(!value||![1,2,3,4].includes(value.version)||value.library!==LIBRARY||!Array.isArray(value.layers)||value.layers.length>64)throw Error('This is not a supported ribbon recipe (maximum 64 layers).');
 const ids=new Set([...catalog.parts,...CUSTOM_PARTS].map(p=>p.id));const number=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
 const color=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
 if(typeof value.name!=='string'||value.name.length>80)throw Error('Use a ribbon name of 80 characters or fewer.');
 for(const l of value.layers){if(!l||!ids.has(l.part)||!number(l.x,-512,1024)||!number(l.y,-640,1280)||!number(l.scale,.2,3)||typeof l.visible!=='boolean'||!['original','all','family'].includes(l.mode)||!color(l.color)||!color(l.source)||!number(l.tolerance,0,180)||(l.rotation!==undefined&&!number(l.rotation,-180,180)))throw Error('A layer has an unknown part or invalid setting.');}
 for(const l of value.layers){if(l.materialColors!==undefined){if(!l.materialColors||typeof l.materialColors!=='object'||Array.isArray(l.materialColors))throw Error('Invalid material colours.');for(const [key,tint] of Object.entries(l.materialColors)){if(!MATERIALS.includes(key)||!catalog.parts.find(p=>p.id===l.part).materials?.includes(key)||(tint!==null&&!color(tint)))throw Error('Invalid material colour.');}}}
 if(value.palette!==undefined){if(!value.palette||typeof value.palette!=='object'||Array.isArray(value.palette))throw Error('Invalid design palette.');for(const [key,tint] of Object.entries(value.palette))if(!MATERIALS.includes(key)||(tint!==null&&!color(tint)))throw Error('Invalid design palette colour.');}
 for(const l of value.layers)if(l.orbit!==undefined){const o=l.orbit;if(!o||!number(o.radius,20,240)||!number(o.depth,0,100)||!number(o.period,2,30)||!number(o.phase,0,360)||(o.spread!==undefined&&!number(o.spread,10,360)))throw Error('Invalid horizontal orbit setting.');}
 const extras=value.layers.map(extraLayer),extra=extraRecipe(value);
 const idsUsed=value.layers.map(l=>l.uid).filter(Boolean);if(new Set(idsUsed).size!==idsUsed.length)throw Error('Duplicate layer identifiers.');
 for(const l of value.layers)if(l.mirror&&(!l.uid||l.mirror===l.uid||!value.layers.some(p=>p.uid===l.mirror&&p.mirror===l.uid)))throw Error('A symmetry pair is incomplete.');
 return {...extra,version:extras.some(e=>Object.keys(e).length)||Object.keys(extra).length||value.layers.length>24?4:(value.palette||value.layers.some(l=>l.orbit||l.materialColors&&('metal' in l.materialColors||'fabric' in l.materialColors)))?3:value.layers.some(l=>l.rotation)?2:1,library:LIBRARY,name:value.name,...(value.palette===undefined?{}:{palette:{...value.palette}}),layers:value.layers.map((l,i)=>({...extras[i],part:l.part,x:l.x,y:l.y,scale:l.scale,visible:l.visible,mode:l.mode,color:l.color,source:l.source,tolerance:l.tolerance,...(l.rotation===undefined?{}:{rotation:l.rotation}),...(l.orbit===undefined?{}:{orbit:{radius:l.orbit.radius,depth:l.orbit.depth,period:l.orbit.period,phase:l.orbit.phase,...(l.orbit.spread===undefined?{}:{spread:l.orbit.spread})}}),...(l.materialColors===undefined?{}:{materialColors:{...l.materialColors}})}))};
}
export function encodeRecipe(recipe,catalog){const text=JSON.stringify(validateRecipe(recipe,catalog));if(text.length>2200000)throw Error('Design is too large. Use fewer picture emblems.');const bytes=new TextEncoder().encode(text);let raw='';for(const b of bytes)raw+=String.fromCharCode(b);return 'RBN1.'+btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')+'.'+checksum(text);}
export function decodeRecipe(code,catalog){if(typeof code!=='string'||code.length>3000000)throw Error('Recipe code is too long.');const match=code.trim().match(/^RBN1\.([A-Za-z0-9_-]+)\.([0-9a-f]{8})$/);if(!match)throw Error('Paste a complete RBN1 recipe code.');try{const raw=atob(match[1].replace(/-/g,'+').replace(/_/g,'/'));const text=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0)));if(checksum(text)!==match[2])throw Error('The code is incomplete or changed. Copy it again.');return validateRecipe(JSON.parse(text),catalog);}catch(e){throw Error(e.message||'Could not read that recipe.');}}
export function createLayer(part,palette){return {part:part.id,x:part.x,y:part.y,scale:1,visible:true,mode:'original',color:'#9677d8',source:'#7755aa',tolerance:32,...(part.defaultOpacity===undefined?{}:{opacity:part.defaultOpacity}),...(part.tags?.includes('particle')?{orbit:{radius:150,depth:24,period:8,phase:0,spread:160}}:{}),...(part.materials?.length?{materialColors:Object.fromEntries(part.materials.map(key=>[key,palette?.[key]??null]))}:{})};}
export function rgb(hex){return hex.slice(1).match(/../g).map(x=>parseInt(x,16));}
export function hsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=(h*60+360)%360;}return [h,s,l];}
export function fromHsl(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;const t=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return t.map(v=>Math.round((v+m)*255));}
export function recolor(data,layer,materials={}){if(layer.mode==='original'&&!layer.materialColors)return data;const target=hsl(...rgb(layer.color)),source=hsl(...rgb(layer.source));for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const p=hsl(data[i],data[i+1],data[i+2]);const material=layer.materialColors&&Object.keys(materials).find(key=>Object.hasOwn(layer.materialColors,key)&&materials[key][i/4]);if(material){const tint=layer.materialColors[material];if(tint){const t=hsl(...rgb(tint));const light=p[2]<=.5?p[2]*(.6+.8*t[2]):1-(1-p[2])*(1.4-.8*t[2]);const saturation=t[1]*(.35+.65*p[1])*Math.min(1,(1-p[2])/.12);const c=fromHsl(t[0],saturation,light);data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];}if(tint||material!=='metal'||layer.mode==='original')continue;}let selected=layer.mode==='all';if(layer.mode==='family'){const dh=Math.min(Math.abs(p[0]-source[0]),360-Math.abs(p[0]-source[0]));selected=source[1]<.12?p[1]<.2:p[1]>=.12&&dh<=layer.tolerance;}
 if(selected){const light=Math.max(.025,Math.min(.98,p[2]+(target[2]-.5)*.65));const c=fromHsl(target[0],target[1],light);data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];}}
 return data;}
export function bounds(layer,part){const w=Math.round(part.width*layer.scale),h=Math.round(part.height*layer.scale);return {x:Math.round(layer.x-w/2),y:Math.round(layer.y),w,h};}
// Position remains the unrotated top-center; rotate around the part's visual center.
export function localPoint(layer,part,x,y){const b=bounds(layer,part),cx=b.x+b.w/2,cy=b.y+b.h/2,a=(layer.rotation||0)*Math.PI/180,dx=x-cx,dy=y-cy;return {x:cx+(layer.flip?-1:1)*(Math.cos(a)*dx+Math.sin(a)*dy),y:cy-Math.sin(a)*dx+Math.cos(a)*dy};}
export function hits(layer,part,x,y){const b=bounds(layer,part),p=localPoint(layer,part,x,y);return layer.visible&&p.x>=b.x&&p.x<b.x+b.w&&p.y>=b.y&&p.y<b.y+b.h;}
export function withLayerTransform(context,layer,part,draw){const b=bounds(layer,part);context.save();try{context.globalAlpha=(context.globalAlpha??1)*(layer.opacity??1);context.translate(b.x+b.w/2,b.y+b.h/2);context.rotate((layer.rotation||0)*Math.PI/180);if(layer.flip)context.scale(-1,1);draw(b);}finally{context.restore();}}
export function drawLayer(context,layer,part,image){withLayerTransform(context,layer,part,b=>context.drawImage(image,-b.w/2,-b.h/2,b.w,b.h));}

// Runs use original source coordinates; rendering works on the transparent-margin crop.
export function materialMasks(part,selections){
 const [left,top,right,bottom]=part.bounds,w=right-left,h=bottom-top,result={};
 for(const [key,selection] of Object.entries(selections||{})){
  const mask=new Uint8Array(w*h);
  for(const [y,start,end] of selection.runs){if(y<top||y>=bottom)continue;for(let x=Math.max(left,start);x<Math.min(right,end);x++)mask[(y-top)*w+x-left]=1;}
  result[key]=mask;
 }
 return result;
}

// A shared palette changes materials, never whole-layer colour or saved geometry.
export function matchMaterial(recipe,key,color,catalog){
 const next=clone(recipe);next.palette={...next.palette,[key]:color};
 for(const layer of next.layers){const part=[...catalog.parts,...CUSTOM_PARTS].find(p=>p.id===layer.part);if(layer.locked||!part?.materials?.includes(key))continue;
  layer.materialColors={...layer.materialColors,[key]:color};
 }
 return next;
}
export function matchPalette(recipe,palette,catalog){let next=recipe;for(const [key,color] of Object.entries(palette))next=matchMaterial(next,key,color,catalog);return next;}
// Orbit in a shallow horizontal ellipse around the ribbon, with real occlusion.
// x/y remain the orbit centre, so moving the orbit never destroys its anchor.
export function orbitPose(layer,part,time=0){
 if(!layer.orbit)return {layer,depth:0};
 const o=layer.orbit,a=(o.phase/180*Math.PI)+time/o.period*Math.PI*2,z=Math.sin(a),scale=layer.scale*(.85+.15*z);
 return {layer:{...layer,x:layer.x+Math.cos(a)*o.radius,y:layer.y+part.height*(layer.scale-scale)/2+z*o.depth,scale},depth:z};
}
export function sceneLayers(recipe,catalog,time=0){
 const back=[],still=[],front=[];
 recipe.layers.forEach((layer,index)=>{if(!layer.visible)return;const part=[...catalog.parts,...CUSTOM_PARTS].find(p=>p.id===layer.part);
  const add=(posed,visualPart=part,fragment)=>{const item={...posed,index,part:visualPart,...(fragment?{fragment}:{})};(layer.orbit?(item.depth<0?back:front):still).push(item);};
  if(layer.orbit&&part.fragments?.length){
   part.fragments.forEach((fragment,i)=>{
    const visualPart={...part,bounds:fragment.bounds,width:fragment.width,height:fragment.height};
    const phase=layer.orbit.phase+(i/Math.max(1,part.fragments.length-1)-.5)*(layer.orbit.spread??160);
    const bit={...layer,y:layer.y+(part.height-visualPart.height)*layer.scale/2,orbit:{...layer.orbit,phase}};
    add(orbitPose(bit,visualPart,time),visualPart,fragment);
   });
  }else add(orbitPose(layer,part,time));
 });
 back.sort((a,b)=>a.depth-b.depth);front.sort((a,b)=>a.depth-b.depth);
 return [...back,...still,...front];
}
