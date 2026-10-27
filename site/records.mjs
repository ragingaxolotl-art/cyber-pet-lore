export const STORAGE_KEY='cyber-pet-lore.reading.v1';
export const emptyState=()=>({format:'cyber-pet-lore-reading',version:1,readings:{},preferences:{fontSize:19,warm:false},lastReading:null});
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
   highlights.push({id:h.id,color:h.color,note:h.note??'',segments:h.segments.map(s=>({...s})),createdAt:Number(h.createdAt)||0});
  }
  result.readings[id]={read:r.read===true,readAt:Number(r.readAt)||null,note:r.note??'',tags:Array.isArray(r.tags)?r.tags.filter(t=>string(t,70)).slice(0,30):[],highlights,updatedAt:r.updatedAt,position:object(r.position)&&string(r.position.block,200)?{block:r.position.block}:null};
 }
 if(object(value.preferences))result.preferences={fontSize:Math.max(15,Math.min(27,Number(value.preferences.fontSize)||19)),warm:value.preferences.warm===true};
 result.lastReading=string(value.lastReading,150)?value.lastReading:null;
 return result;
}
export function mergeStates(current,incoming){
 const result=validateState(current),other=validateState(incoming);
 for(const [id,r] of Object.entries(other.readings))if(!result.readings[id]||r.updatedAt>result.readings[id].updatedAt)result.readings[id]=r;
 return result;
}
export function highlightIntervals(text,block,highlights){
 const segments=highlights.flatMap(h=>h.segments.filter(s=>s.block===block&&text.slice(s.start,s.end)===s.quote).map(s=>({...s,color:h.color,id:h.id})));
 const edges=[...new Set([0,text.length,...segments.flatMap(s=>[s.start,s.end])])].sort((a,b)=>a-b);
 return edges.slice(0,-1).map((start,i)=>{const end=edges[i+1],h=segments.filter(s=>s.start<=start&&s.end>=end).at(-1);return {text:text.slice(start,end),id:h?.id,color:h?.color};});
}
