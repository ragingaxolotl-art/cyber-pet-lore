// Per-field causal registers. Concurrent values remain available for review;
// explicit edits supersede only versions the editor has actually observed.
const clone=value=>JSON.parse(JSON.stringify(value));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const order=(a,b)=>a.at-b.at||a.id.localeCompare(b.id);
export function fingerprint(value){let a=2166136261,b=5381;for(const c of JSON.stringify(value)){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b,33)^c.charCodeAt(0);}return (a>>>0).toString(36)+'-'+(b>>>0).toString(36);}
const actor=globalThis.crypto?.randomUUID?.()||'local-'+Date.now();
const writerCounters=new Map();
function joinedVector(versions){const vector={};for(const v of versions)for(const [key,n] of Object.entries(v.vector))vector[key]=Math.max(vector[key]||0,n);return Object.fromEntries(Object.entries(vector).sort(([a],[b])=>a.localeCompare(b)));}
function dominates(a,b){const keys=new Set([...Object.keys(a),...Object.keys(b)]);return [...keys].every(k=>(a[k]||0)>=(b[k]||0))&&[...keys].some(k=>(a[k]||0)>(b[k]||0));}
export function seedCell(value,at=0){const id='legacy-'+at+'-'+fingerprint(value);return {versions:[{id,at,value:clone(value),vector:{[id]:1}}]};}
export function validateCell(cell){
 if(!cell||!Array.isArray(cell.versions)||!cell.versions.length||cell.versions.length>1000)throw Error('Invalid note revision history.');
 const validId=id=>typeof id==='string'&&!['__proto__','constructor','prototype'].includes(id)&&/^[a-zA-Z0-9_-]{1,150}$/.test(id);
 const versions=cell.versions.map(v=>{
  if(!v||!validId(v.id)||!Number.isFinite(v.at)||v.at<0||v.value===undefined||!v.vector||Array.isArray(v.vector)||typeof v.vector!=='object')throw Error('Invalid note revision.');
  const entries=Object.entries(v.vector);if(!entries.length||entries.length>10000||entries.some(([k,n])=>!validId(k)||!Number.isSafeInteger(n)||n<1))throw Error('Invalid revision clock.');
  return {id:v.id,at:v.at,value:clone(v.value),vector:Object.fromEntries(entries.sort(([a],[b])=>a.localeCompare(b)))};
 });
 if(new Set(versions.map(v=>v.id)).size!==versions.length)throw Error('Duplicate note revisions.');
 return {versions:versions.sort(order)};
}
export function mergeCells(a,b){
 a=validateCell(a);b=validateCell(b);const versions=new Map();
 for(const v of [...a.versions,...b.versions]){const existing=versions.get(v.id);if(existing&&!equal(existing,v))throw Error('Conflicting content for one revision ID.');versions.set(v.id,v);}
 const all=[...versions.values()];return {versions:all.filter(v=>!all.some(other=>other!==v&&dominates(other.vector,v.vector))).sort(order)};
}
export function editCell(cell,value,at=Date.now(),writer=actor){
 cell=validateCell(cell);const vector=joinedVector(cell.versions);vector[writer]=Math.max(vector[writer]||0,writerCounters.get(writer)||0)+1;writerCounters.set(writer,vector[writer]);
 return {versions:[{id:writer+'-'+vector[writer],at,value:clone(value),vector:Object.fromEntries(Object.entries(vector).sort(([a],[b])=>a.localeCompare(b)))}]};
}
export function cellValue(cell){return clone([...cell.versions].sort(order).at(-1).value);}
export function cellConflicts(cell){return cell.versions.length>1?clone(cell.versions):[];}
export const readingFields=['read','readAt','note','tags','position'];
export const blankReading=()=>({read:false,readAt:null,note:'',tags:[],highlights:[],updatedAt:0,position:null});
function fieldsOf(record){const fields=new Map(readingFields.map(k=>[k,record[k]??blankReading()[k]]));for(const h of record.highlights||[])fields.set('highlight:'+h.id,h);return fields;}
export function readingCells(record){const cells={};for(const [key,value] of fieldsOf(record))cells[key]=record._sync?.[key]||seedCell(value,record.updatedAt||0);for(const [key,cell] of Object.entries(record._sync||{}))cells[key]=cell;return cells;}
export function projectReading(record,cells){
 const result={...record,_sync:cells,highlights:[]};
 for(const [key,cell] of Object.entries(cells)){const value=cellValue(cell);if(key.startsWith('highlight:')){if(value!==null)result.highlights.push(value);}else result[key]=value;}
 result.highlights.sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id));
 result.updatedAt=Math.max(record.updatedAt||0,...Object.values(cells).flatMap(c=>c.versions.map(v=>v.at)));return result;
}
export function editReading(record,changes,at=Date.now(),makeId=()=>actor){
 const cells=readingCells(record);const next={...record,...changes};const before=fieldsOf(record),after=fieldsOf(next);
 for(const key of new Set([...before.keys(),...after.keys()])){const old=before.has(key)?before.get(key):null,value=after.has(key)?after.get(key):null;
  if(equal(old,value))continue;
  cells[key]=editCell(cells[key]||seedCell(old,0),value,at,makeId());
 }
 return projectReading(next,cells);
}
export function mergeReadings(a,b){
 const first=readingCells(a),second=readingCells(b),cells={};
 for(const key of new Set([...Object.keys(first),...Object.keys(second)]))cells[key]=first[key]&&second[key]?mergeCells(first[key],second[key]):clone(first[key]||second[key]);
 return projectReading(a,cells);
}
