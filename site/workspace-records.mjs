import {validateCell,seedCell,mergeCells,editCell,cellValue} from './note-revisions.mjs';
import {validateTarget} from './workspace-targets.mjs';
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export const emptyWorkspace=()=>({version:1,notes:{},artifacts:{}});
export function validateWorkspaceNote(n){
 if(n===null)return null;
 if(!object(n)||typeof n.text!=='string'||n.text.length>30000||!Array.isArray(n.tags)||n.tags.length>30||n.tags.some(t=>typeof t!=='string'||t.length>70)||!['note','question','resolved'].includes(n.status)||typeof n.pinned!=='boolean'||!Number.isFinite(n.createdAt))throw Error('Invalid workspace note.');
 return {target:validateTarget(n.target),text:n.text,tags:[...n.tags],status:n.status,pinned:n.pinned,createdAt:n.createdAt};
}
export const artifactTypes=['creation-log','song-lines','song-arrangement','word-choices','local-compounds','ribbon-recipe'];
export function validateArtifact(a){
 if(a===null)return null;
 if(!object(a)||!artifactTypes.includes(a.type)||typeof a.title!=='string'||a.title.length>300||!Number.isInteger(a.version)||a.version<1||!Number.isFinite(a.createdAt)||a.data===undefined)throw Error('Invalid workspace artifact.');
 const encoded=JSON.stringify(a.data);if(encoded.length>10000000)throw Error('Artifact exceeds the portable workspace limit.');
 return {type:a.type,title:a.title,version:a.version,createdAt:a.createdAt,data:JSON.parse(encoded),...(a.target?{target:validateTarget(a.target)}:{})};
}
export function validateWorkspace(w){
 if(!object(w)||w.version!==1||!object(w.notes)||!object(w.artifacts))throw Error('Invalid workspace.');const result=emptyWorkspace();
 for(const collection of ['notes','artifacts']){const entries=Object.entries(w[collection]);if(entries.length>10000)throw Error('Workspace has too many records.');for(const [id,c] of entries){if(['__proto__','constructor','prototype'].includes(id)||!/^[a-zA-Z0-9_-]{1,150}$/.test(id))throw Error('Invalid workspace ID.');const cell=validateCell(c);for(const v of cell.versions)v.value=(collection==='notes'?validateWorkspaceNote:validateArtifact)(v.value);result[collection][id]=cell;}}
 return result;
}
export function mergeWorkspaces(a,b){a=validateWorkspace(a);b=validateWorkspace(b);for(const collection of ['notes','artifacts'])for(const [id,cell] of Object.entries(b[collection]))a[collection][id]=a[collection][id]?mergeCells(a[collection][id],cell):cell;return a;}
export function editWorkspace(w,collection,id,value,at=Date.now()){
 if(!['notes','artifacts'].includes(collection))throw Error('Unknown workspace collection');
 const result=validateWorkspace(w||emptyWorkspace());value=(collection==='notes'?validateWorkspaceNote:validateArtifact)(value);result[collection][id]=editCell(result[collection][id]||seedCell(null),value,at);return validateWorkspace(result);
}
export function workspaceItems(workspace,collection='notes'){return Object.entries(workspace?.[collection]||{}).map(([id,cell])=>({id,cell,value:cellValue(cell)})).filter(x=>x.value!==null);}
