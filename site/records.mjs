export const STORAGE_KEY='cyber-pet-lore.reading.v1';
export const emptyState=()=>({format:'cyber-pet-lore-reading',version:1,readings:{},preferences:{fontSize:19,warm:false},lastReading:null,nextClipNumber:1});
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const string=(v,max=30000)=>typeof v==='string'&&v.length<=max;
export function validateState(value){
 if(!object(value)||value.format!=='cyber-pet-lore-reading'||value.version!==1||!object(value.readings))throw Error('This is not a Cyber Pet Lore reading backup.');
 if(Object.keys(value.readings).length>10000)throw Error('This backup has too many reading records.');
 const result=emptyState();
 for(const [id,r] of Object.entries(value.readings)){
  if(!/^[a-zA-Z0-9_-]{1,150}$/.test(id)||!object(r)||!string(r.note??'')||!Number.isFinite(r.updatedAt)||!Array.isArray(r.highlights??[])||(r.highlights??[]).length>1500)throw Error('A reading record is invalid. Nothing was imported.');
  const highlights=[];
  for(const h of r.highlights??[]){
   if(!object(h)||!string(h.id,100)||!string(h.note??'')||!Array.isArray(h.segments)||!h.segments.length||h.segments.length>500||!['gold','blue','rose'].includes(h.color))throw Error('A highlight is invalid. Nothing was imported.');
   for(const s of h.segments)if(!object(s)||!string(s.block,200)||!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.start<0||s.end<=s.start||!string(s.quote,100000)||s.quote.length!==s.end-s.start)throw Error('A highlight location is invalid. Nothing was imported.');
   if(h.tags!==undefined&&(!Array.isArray(h.tags)||h.tags.length>30||h.tags.some(t=>!string(t,70))))throw Error('Highlight tags are invalid. Nothing was imported.');
   if(h.context!==undefined&&(!object(h.context)||!string(h.context.storyTitle,300)||!Array.isArray(h.context.era)||h.context.era.some(e=>!Number.isInteger(e)||e< -3||e>4)))throw Error('Highlight context is invalid. Nothing was imported.');
   let clip;
   if(h.clip!==undefined){const c=h.clip;if(!object(c)||!Number.isSafeInteger(c.number)||c.number<1||!string(c.storyId,150)||!string(c.storyTitle,300)||!string(c.timeLabel,500)||!Array.isArray(c.era)||c.era.some(e=>!Number.isInteger(e)||e< -3||e>4)||!Array.isArray(c.characters)||c.characters.length>100||c.characters.some(n=>!string(n,150)))throw Error('A clip is invalid. Nothing was imported.');clip={number:c.number,storyId:c.storyId,storyTitle:c.storyTitle,timeLabel:c.timeLabel,era:[...c.era],characters:[...c.characters]};}
   highlights.push({...(h.tags!==undefined?{tags:[...h.tags]}:{}),...(h.context?{context:{storyTitle:h.context.storyTitle,era:[...h.context.era]}}:{}),...(clip?{clip}:{}),id:h.id,color:h.color,note:h.note??'',segments:h.segments.map(s=>({...s})),createdAt:Number(h.createdAt)||0});
  }
  result.readings[id]={read:r.read===true,readAt:Number(r.readAt)||null,note:r.note??'',tags:Array.isArray(r.tags)?r.tags.filter(t=>string(t,70)).slice(0,30):[],highlights,updatedAt:r.updatedAt,position:object(r.position)&&string(r.position.block,200)?{block:r.position.block}:null};
 }
 if(object(value.preferences))result.preferences={fontSize:Math.max(15,Math.min(27,Number(value.preferences.fontSize)||19)),warm:value.preferences.warm===true};
 result.lastReading=string(value.lastReading,150)?value.lastReading:null;
 result.nextClipNumber=Math.max(Number.isSafeInteger(value.nextClipNumber)?value.nextClipNumber:1,1,...Object.values(result.readings).flatMap(r=>r.highlights.filter(h=>h.clip).map(h=>h.clip.number+1)));
 return result;
}
export function mergeStates(current,incoming){
 const result=validateState(current),other=validateState(incoming);
 for(const [id,r] of Object.entries(other.readings))if(!result.readings[id]||r.updatedAt>result.readings[id].updatedAt)result.readings[id]=r;
 result.nextClipNumber=Math.max(result.nextClipNumber,other.nextClipNumber);
 // Keep local clip numbers stable; renumber an imported collision once.
 const localNumbers=new Map(Object.values(current.readings).flatMap(r=>r.highlights.filter(h=>h.clip).map(h=>[h.id,h.clip.number])));
 const clips=Object.values(result.readings).flatMap(r=>r.highlights.filter(h=>h.clip).map(h=>({h,r})));
 clips.sort((a,b)=>Number(localNumbers.has(b.h.id))-Number(localNumbers.has(a.h.id)));
 const used=new Set();
 for(const {h,r} of clips){let n=localNumbers.get(h.id)??h.clip.number;if(used.has(n))n=result.nextClipNumber++;if(n!==h.clip.number){h.clip.number=n;r.updatedAt=Math.max(Date.now(),r.updatedAt+1);}used.add(n);result.nextClipNumber=Math.max(result.nextClipNumber,n+1);}
 return result;
}
export function highlightIntervals(text,block,highlights){
 const segments=highlights.flatMap(h=>h.segments.filter(s=>s.block===block&&text.slice(s.start,s.end)===s.quote).map(s=>({...s,color:h.color,id:h.id})));
 const edges=[...new Set([0,text.length,...segments.flatMap(s=>[s.start,s.end])])].sort((a,b)=>a-b);
 return edges.slice(0,-1).map((start,i)=>{const end=edges[i+1],h=segments.filter(s=>s.start<=start&&s.end>=end).at(-1);return {text:text.slice(start,end),id:h?.id,color:h?.color};});
}

export function detectedCharacters(quote,candidates){
 const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return candidates.filter(name=>{const full=name.replace(/\s*\([^)]*\)$/,'');return new RegExp('(?<![\\p{L}\\p{N}_])'+escaped(full)+'(?![\\p{L}\\p{N}_])','iu').test(quote);});
}
export function clipContext(entry,blocks,segments){
 const index=blocks.findIndex(b=>b.id===segments[0]?.block);
 const ends=blocks.findIndex(b=>b.id===segments.at(-1)?.block);
 const eraAt=i=>{for(let j=i;j>=0;j--){const b=blocks[j];if(!/HEADING|TITLE/.test(b.style||''))continue;const m=b.text.match(/\bEra\s+([−-]?[0-4]|Zero|One|Two|Three|Four)\b/i);if(m){const v=m[1].toLowerCase().replace('−','-'),e=({zero:0,one:1,two:2,three:3,four:4})[v]??Number(v);if(entry.era.includes(e))return e;}}return null;};
 const startEra=eraAt(index),endEra=eraAt(ends);
 const era=startEra!==null&&startEra===endEra?[startEra]:[...entry.era];
 return {storyId:entry.id,storyTitle:entry.title,era,timeLabel:era.length===1?'Era '+era[0]:entry.timeLabel,characters:detectedCharacters(segments.map(s=>s.quote).join('\n'),entry.characters||[])};
}
