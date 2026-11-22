import {cellValue} from './note-revisions.mjs';
import {targetHref} from './workspace-targets.mjs';
export function notebookRows(state,catalog=[]){
 const byId=new Map(catalog.map(e=>[e.id,e])),rows=[];
 for(const [id,r] of Object.entries(state.readings)){
  const entry=byId.get(id),fallback=entry?.title||'Archived reading';
  if(r.note||r.tags?.length)rows.push({id:'reading-'+id,recordId:id,source:'reading',title:fallback,text:r.note,quote:'',tags:r.tags||[],era:entry?.era||[],kind:'text',status:'note',pinned:false,date:r.updatedAt,href:'index.html#read='+encodeURIComponent(id)});
  for(const h of r.highlights||[]){const target=h.target;rows.push({id:h.id,recordId:id,source:'highlight',title:h.context?.storyTitle||h.clip?.storyTitle||fallback,text:h.note,quote:h.segments.map(s=>s.quote).join('\n'),tags:h.tags||[],era:target?.era||h.context?.era||entry?.era||[],kind:target?.kind||'text',status:h.noteStatus||'note',pinned:!!h.pinned,date:h.createdAt,clip:h.clip?.number,href:target?targetHref(target):h.context?.href?highlightHref(h.context.href,h.id):'index.html#read='+encodeURIComponent(id)+'&block='+encodeURIComponent(h.segments[0].block)});}
 }
 for(const [id,cell] of Object.entries(state.workspace?.notes||{})){const n=cellValue(cell);if(n)rows.push({id,source:'workspace',title:n.target.title,text:n.text,quote:n.target.quote||'',tags:n.tags,era:n.target.era,kind:n.target.kind,status:n.status,pinned:n.pinned,date:n.createdAt,href:targetHref(n.target),target:n.target});}
 for(const row of rows){const entry=byId.get(row.recordId);row.search=[...(entry?.places||[]),...(entry?.characters||[]),row.target?.entityId||'',row.target?.id||''].join(' ');}
 return rows;
}
function highlightHref(href,id){const u=new URL(href,'https://lore.invalid/');u.searchParams.set('highlight',id);return u.pathname.slice(1)+u.search+u.hash;}
export function filterNotebook(rows,{query='',kind='',era='',tag='',status='',pinned=false,clips=false,from='',to='',sort='newest'}={}){
 const terms=query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const filtered=rows.filter(r=>(!kind||r.kind===kind)&&(!era||r.era.includes(Number(era)))&&(!tag||(tag==='__untagged__'?!r.tags.length:r.tags.includes(tag)))&&(!status||r.status===status)&&(!pinned||r.pinned)&&(!clips||r.clip)&&(!from||r.date>=new Date(from+'T00:00:00').getTime())&&(!to||r.date<=new Date(to+'T23:59:59.999').getTime())&&terms.every(t=>[r.title,r.text,r.quote,r.search||'',...r.tags].join(' ').toLocaleLowerCase().includes(t)));
 return filtered.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='oldest'?a.date-b.date:Number(b.pinned)-Number(a.pinned)||b.date-a.date);
}
