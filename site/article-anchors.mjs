// Source IDs are authoritative. A unique exact quote can recover an old hash
// anchor without silently attaching a note to unrelated replacement text.
export function resolveArticleHighlights(blocks,highlights){
 const stale=[];const resolved=highlights.map(h=>({...h,segments:h.segments.map(s=>{
  const direct=blocks.find(b=>b.id===s.block||b.legacy===s.block);
  if(direct&&direct.text.slice(s.start,s.end)===s.quote)return {...s,block:direct.id};
  const matches=[];for(const b of blocks){let from=0;while(s.quote&&from<=b.text.length){const at=b.text.indexOf(s.quote,from);if(at<0)break;matches.push({block:b.id,start:at,end:at+s.quote.length,quote:s.quote});from=at+1;}}
  if(matches.length===1)return matches[0];stale.push(h.id);return {...s,block:'unresolved-'+s.block};
 })}));return {highlights:resolved,stale:new Set(stale)};
}
