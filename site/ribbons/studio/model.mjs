export const WIDTH=512, HEIGHT=640, LIBRARY='ornate-v1';
export const METALS={Gold:'#d7ad46',Silver:'#b9cfdb',Bronze:'#ad7543',Copper:'#c77b54','Rose gold':'#d6a18f',Platinum:'#d8e5ec',Gunmetal:'#566776'};
export const clone=value=>JSON.parse(JSON.stringify(value));
export function checksum(text){let h=2166136261;for(const c of new TextEncoder().encode(text)){h^=c;h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
export function validateRecipe(value,catalog){
 if(!value||value.version!==1||value.library!==LIBRARY||!Array.isArray(value.layers)||value.layers.length>24)throw Error('This is not a supported ribbon recipe (maximum 24 layers).');
 const ids=new Set(catalog.parts.map(p=>p.id));const number=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
 const color=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
 if(typeof value.name!=='string'||value.name.length>80)throw Error('Use a ribbon name of 80 characters or fewer.');
 for(const l of value.layers){if(!l||!ids.has(l.part)||!number(l.x,-512,1024)||!number(l.y,-640,1280)||!number(l.scale,.2,3)||typeof l.visible!=='boolean'||!['original','all','family'].includes(l.mode)||!color(l.color)||!color(l.source)||!number(l.tolerance,0,180))throw Error('A layer has an unknown part or invalid setting.');}
 return {version:1,library:LIBRARY,name:value.name,layers:value.layers.map(l=>({part:l.part,x:l.x,y:l.y,scale:l.scale,visible:l.visible,mode:l.mode,color:l.color,source:l.source,tolerance:l.tolerance}))};
}
export function encodeRecipe(recipe,catalog){const text=JSON.stringify(validateRecipe(recipe,catalog));const bytes=new TextEncoder().encode(text);let raw='';for(const b of bytes)raw+=String.fromCharCode(b);return 'RBN1.'+btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')+'.'+checksum(text);}
export function decodeRecipe(code,catalog){if(typeof code!=='string'||code.length>40000)throw Error('Recipe code is too long.');const match=code.trim().match(/^RBN1\.([A-Za-z0-9_-]+)\.([0-9a-f]{8})$/);if(!match)throw Error('Paste a complete RBN1 recipe code.');try{const raw=atob(match[1].replace(/-/g,'+').replace(/_/g,'/'));const text=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0)));if(checksum(text)!==match[2])throw Error('The code is incomplete or changed. Copy it again.');return validateRecipe(JSON.parse(text),catalog);}catch(e){throw Error(e.message||'Could not read that recipe.');}}
export function createLayer(part){return {part:part.id,x:part.x,y:part.y,scale:1,visible:true,mode:'original',color:'#9677d8',source:'#7755aa',tolerance:32};}
export function rgb(hex){return hex.slice(1).match(/../g).map(x=>parseInt(x,16));}
export function hsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=(h*60+360)%360;}return [h,s,l];}
export function fromHsl(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;const t=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return t.map(v=>Math.round((v+m)*255));}
export function recolor(data,layer){if(layer.mode==='original')return data;const target=hsl(...rgb(layer.color)),source=hsl(...rgb(layer.source));for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const p=hsl(data[i],data[i+1],data[i+2]);let selected=layer.mode==='all';if(layer.mode==='family'){const dh=Math.min(Math.abs(p[0]-source[0]),360-Math.abs(p[0]-source[0]));selected=source[1]<.12?p[1]<.2:p[1]>=.12&&dh<=layer.tolerance;}
 if(selected){const light=Math.max(.025,Math.min(.98,p[2]+(target[2]-.5)*.65));const c=fromHsl(target[0],target[1],light);data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];}}
 return data;}
export function bounds(layer,part){const w=Math.round(part.width*layer.scale),h=Math.round(part.height*layer.scale);return {x:Math.round(layer.x-w/2),y:Math.round(layer.y),w,h};}
export function hits(layer,part,x,y){const b=bounds(layer,part);return layer.visible&&x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h;}
