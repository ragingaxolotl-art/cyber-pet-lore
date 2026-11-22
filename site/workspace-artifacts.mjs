import {fingerprint,cellValue} from './note-revisions.mjs';
const definitions=[
 ['song-arrangement','era-zero-song-arrangement-v1','Song arrangement','translator/index.html'],
 ['creation-log','cyber-pet-creation-log-v1','My creation log','recent.html'],
 ['song-lines','era-zero-song-lines-v1','Saved song lines','translator/index.html'],
 ['word-choices','era-zero-sentence-word-choices-v1','My word choices','translator/index.html'],
 ['local-compounds','era-zero-local-compounds-v1','My compounds','translator/compound-builder.html'],
 ['ribbon-recipe','cyberpath.ribbon-studio.v1','My ribbon design','ribbons/studio/index.html']
];
export function artifactDefinition(key){return definitions.find(d=>d[1]===key)||(key.startsWith('era-zero-song-v2:')?['song-lines',key,'Saved song line','translator/index.html']:null);}
const songKey=key=>key==='era-zero-song-lines-v1'||key==='era-zero-song-arrangement-v1'||key.startsWith('era-zero-song-v2:');
export function captureArtifacts(storage,store){
 let count=0;const songEntries={};for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key&&songKey(key))songEntries[key]=storage.getItem(key);}
 if(Object.keys(songEntries).length){const data={songEntries:Object.fromEntries(Object.entries(songEntries).sort(([a],[b])=>a.localeCompare(b)))},id='song-session-'+fingerprint(data),items=store.snapshot().workspace?.artifacts||{};if(!items[id]){const versions=Object.values(items).map(cellValue).filter(v=>v?.data?.songEntries);store.updateWorkspace('artifacts',id,{type:'song-lines',title:'Complete saved song workspace',version:versions.length+1,createdAt:Date.now(),data,target:{kind:'artifact',id,title:'Complete saved song workspace',href:'translator/index.html',artifactId:id,era:[0]}});count++;}}
for(let i=0;i<storage.length;i++){const key=storage.key(i),def=key&&artifactDefinition(key);if(!def)continue;const raw=storage.getItem(key);if(raw===null)continue;
 const data={storageKey:key,raw},id='saved-'+fingerprint(key)+'-'+fingerprint(raw),items=store.snapshot().workspace?.artifacts||{};if(items[id])continue;
 const versions=Object.values(items).map(cellValue).filter(v=>v?.data?.storageKey===key);store.updateWorkspace('artifacts',id,{type:def[0],title:def[2],version:versions.length+1,createdAt:Date.now(),data,target:{kind:'artifact',id,title:def[2],href:def[3],artifactId:id,era:[]}});count++;
 }return count;
}
export function restoreArtifact(storage,store,artifact){
 if(artifact?.type==='song-lines'&&artifact.data?.songEntries){const entries=Object.entries(artifact.data.songEntries);if(entries.length>10000||entries.some(([key,value])=>!songKey(key)||typeof value!=='string'))throw Error('Invalid song workspace.');captureArtifacts(storage,store);if(store.unsaved)throw Error('Download or save the current workspace before restoring.');const previous={};for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key&&songKey(key))previous[key]=storage.getItem(key);}storage.setItem('cyber-pet-lore.song-before-restore',JSON.stringify(previous));for(const key of Object.keys(previous))if(!Object.hasOwn(artifact.data.songEntries,key))storage.removeItem(key);for(const [key,value] of entries)storage.setItem(key,value);return 'translator/index.html';}
 const data=artifact?.data,def=data&&typeof data.storageKey==='string'&&artifactDefinition(data.storageKey);
 if(!def||def[0]!==artifact.type||typeof data.raw!=='string'||data.raw.length>10000000)throw Error('This creation cannot be restored to a supported tool.');
 // Retain all previous supported drafts before replacing a single tool key.
 captureArtifacts(storage,store);if(store.unsaved)throw Error('Save or download the current notebook before restoring a tool.');
 storage.setItem('cyber-pet-lore.tool-before-restore',JSON.stringify({key:data.storageKey,raw:storage.getItem(data.storageKey)}));storage.setItem(data.storageKey,data.raw);return def[3];
}
