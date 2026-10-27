import {validateState} from './records.mjs';
export const REPOSITORY='ragingaxolotl-art/cyber-pet-lore-backup';
const BASE='https://api.github.com/repos/'+REPOSITORY;
export function encodeBackup(state){const bytes=new TextEncoder().encode(JSON.stringify(validateState(state)));if(bytes.length>900000)throw Error('Backup exceeds 900 KB. Download a reading backup instead.');let text='';for(const byte of bytes)text+=String.fromCharCode(byte);return btoa(text);}
export function decodeBackup(content){return validateState(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0)))));}
export class GitHubBackup{
 constructor(token,request=fetch){this.token=token;this.request=request;this.sha=null;this.ready=false;}
 async api(path,options={}){const response=await this.request(BASE+path,{...options,cache:'no-store',redirect:'error',headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+this.token,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(20000)});return response;}
 async verify(){const response=await this.api('');if(!response.ok)throw Error('GitHub access failed. Check your token and repository access.');const repo=await response.json();if(repo.private!==true)throw Error('Backup stopped: the backup repository must be private.');if(repo.permissions?.push===false)throw Error('The token needs Contents: read and write access.');}
 async load(){this.ready=false;await this.verify();const response=await this.api('/contents/reading-backup.json');if(response.status===404){this.sha=null;this.ready=true;return null;}if(!response.ok)throw Error('Could not read the GitHub backup. Nothing was overwritten.');const file=await response.json();const state=decodeBackup(file.content);this.sha=file.sha;this.ready=true;return state;}
 async save(state){if(!this.ready)throw Error('Connect and load the existing backup first.');const content=encodeBackup(state);await this.verify();const response=await this.api('/contents/reading-backup.json',{method:'PUT',body:JSON.stringify({message:'Back up lore reading records',content,...(this.sha?{sha:this.sha}:{})})});if(response.status===409||response.status===422){this.ready=false;throw Error('The GitHub backup changed elsewhere. Reconnect to merge it before saving.');}if(!response.ok)throw Error('GitHub backup failed. Your browser copy is unchanged. Check token access or try again.');const file=await response.json();this.sha=file.content.sha;return this.sha;}
 disconnect(){this.token='';this.ready=false;}
}
