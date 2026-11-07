// Portable studio additions. No URLs, scripts or remote resources are accepted.
export const CUSTOM_PARTS=[
 {id:'custom-text',name:'Lettering',kind:'custom',width:180,height:64,x:256,y:240,bounds:[0,0,180,64]},
 {id:'custom-emblem',name:'Picture emblem',kind:'custom',width:128,height:128,x:256,y:220,bounds:[0,0,128,128]},
 {id:'custom-pixels',name:'Pixel emblem',kind:'custom',width:128,height:128,x:256,y:220,bounds:[0,0,128,128]}
];
export const EFFECTS=['shine','foil','hologram','gem','sparkle','glow','runes','orbit-stars','orbit-moons','orbit-crystals','flutter','sway'];
export const isColor=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
const finite=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
const text=(v,n)=>typeof v==='string'&&v.length<=n;
const fail=()=>{throw Error('A custom emblem, group, or effect has an invalid setting.');};
export function pngData(value){
 if(typeof value!=='string'||value.length>360000||!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(value))fail();
 let raw;try{raw=atob(value.slice(22));}catch{fail();}
 if(raw.length<33||raw.slice(0,8)!=='\x89PNG\r\n\x1a\n'||raw.slice(12,16)!=='IHDR')fail();
 const n=i=>((raw.charCodeAt(i)*16777216)+(raw.charCodeAt(i+1)<<16)+(raw.charCodeAt(i+2)<<8)+raw.charCodeAt(i+3));
 if(!finite(n(16),1,256)||!finite(n(20),1,256))fail();return value;
}
export function extraLayer(l){
 const out={};
 if(l.opacity!==undefined){if(!finite(l.opacity,0,1))fail();out.opacity=l.opacity;}
 for(const key of ['uid','group','mirror'])if(l[key]!==undefined){if(!text(l[key],64)||!/^[a-zA-Z0-9_-]*$/.test(l[key]))fail();out[key]=l[key];}
 for(const key of ['locked','flip','setOverride'])if(l[key]!==undefined){if(typeof l[key]!=='boolean')fail();out[key]=l[key];}
 if(l.custom!==undefined){const c=l.custom;if(!c||!['text','emblem','pixels'].includes(c.type)||l.part!==`custom-${c.type==='text'?'text':c.type==='emblem'?'emblem':'pixels'}`)fail();
  if(!['circle','shield','seal','square','locket'].includes(c.shape)||!isColor(c.border)||!finite(c.borderWidth,0,12))fail();
  out.custom={type:c.type,shape:c.shape,border:c.border,borderWidth:c.borderWidth};
  if(c.type==='text'){if(!text(c.text,40)||!['plain','engraved','raised','glowing'].includes(c.style)||!['serif','sans-serif','monospace'].includes(c.font)||!finite(c.size,8,64))fail();Object.assign(out.custom,{text:c.text,style:c.style,font:c.font,size:c.size});}
  if(c.type==='emblem')out.custom.data=pngData(c.data);
  if(c.type==='pixels'){if(!Array.isArray(c.pixels)||c.pixels.length!==256||c.pixels.some(v=>v!==null&&!isColor(v)))fail();out.custom.pixels=[...c.pixels];}
  if(c.message!==undefined){if(!text(c.message,60))fail();out.custom.message=c.message;}
 }
 if(l.part.startsWith('custom-')&&!out.custom)fail();
 if(l.effects!==undefined){if(!Array.isArray(l.effects)||l.effects.length>6||new Set(l.effects.map(e=>e.kind)).size!==l.effects.length)fail();out.effects=l.effects.map(e=>{if(!e||!EFFECTS.includes(e.kind)||!isColor(e.color)||!finite(e.speed,.1,3)||!finite(e.intensity,0,1)||!['always','hover','click'].includes(e.trigger))fail();return {kind:e.kind,color:e.color,speed:e.speed,intensity:e.intensity,trigger:e.trigger};});}
 return out;
}
export function extraRecipe(value){const out={};if(value.award!==undefined){const a=value.award;if(!a||!text(a.description,600)||!text(a.criteria,600))fail();out.award={description:a.description,criteria:a.criteria};}
 if(value.reveal!==undefined){if(!['none','ceremony','assemble','burst'].includes(value.reveal))fail();out.reveal=value.reveal;}
 if(value.set!==undefined){const s=value.set;if(!s||!text(s.id,64)||!text(s.variant,40)||!isColor(s.color)||!Array.isArray(s.parts)||s.parts.length>64||s.parts.some(p=>!text(p,100)))fail();out.set={id:s.id,variant:s.variant,color:s.color,parts:[...s.parts]};}return out;}
