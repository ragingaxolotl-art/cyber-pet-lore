// Portable, same-site targets. Never interpret an imported URL as script or HTML.
const routes=new Set(['index.html','notebook.html','search.html','wiki.html','terms.html','timeline.html','chronology.html','shelter-atlas.html','sounds/index.html','songs/index.html','ribbons/index.html','ribbons/studio/index.html','illnesses/index.html','translator/index.html','translator/compound-builder.html','recent.html','plans.html','genres.html','catalistym.html']);
export function safeWorkspaceHref(value){
 if(typeof value!=='string'||value.length>3000||/[\s\\\u0000-\u001f]/.test(value)||value.startsWith('/')||/%(?:2f|5c|00)/i.test(value))return false;
 const path=value.split(/[?#]/)[0];return routes.has(path)||/^(?:haven-stories\/(?:sideways|interval|return|still|chorus)|custodian)\/(?:index|chapter-\d{2})\.html$/.test(path)||/^development-[a-z0-9-]+\.html$/.test(path);
}
const string=(v,max)=>typeof v==='string'&&v.length<=max;
export function validateTarget(t){
 if(!t||!['text','entity','map','audio','artifact','page'].includes(t.kind)||!string(t.id,200)||!t.id||!string(t.title,300)||!safeWorkspaceHref(t.href))throw Error('Invalid notebook target.');
 const result={kind:t.kind,id:t.id,title:t.title,href:t.href,era:Array.isArray(t.era)?t.era:[]};
 if(result.era.some(e=>!Number.isInteger(e)||e< -3||e>4))throw Error('Invalid target era.');
 for(const k of ['revision','block','quote','entityId','artifactId','mediaId'])if(t[k]!==undefined){if(!string(t[k],k==='quote'?100000:300))throw Error('Invalid target '+k);result[k]=t[k];}
 if(t.kind==='map'){if(!Number.isInteger(t.stage)||t.stage< -5||t.stage>7)throw Error('Invalid map stage.');result.stage=t.stage;}
 if(t.kind==='audio'){if(!Number.isFinite(t.start)||t.start<0||t.start>86400||t.end!==undefined&&(!Number.isFinite(t.end)||t.end<t.start||t.end>86400))throw Error('Invalid audio interval.');result.start=t.start;if(t.end!==undefined)result.end=t.end;}
 return result;
}
export function targetHref(target){const t=validateTarget(target);const url=new URL(t.href,'https://lore.invalid/');if(t.kind==='map'){url.searchParams.set('stage',String(t.stage));url.hash=t.id;}if(t.kind==='audio'){url.searchParams.set('media',t.mediaId||t.id);url.searchParams.set('time',String(t.start));}return url.pathname.slice(1)+url.search+url.hash;}
