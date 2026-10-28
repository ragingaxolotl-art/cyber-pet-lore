// Backup validation is structural. The translator separately checks approved
// targets against its canonical dictionary before enabling any surface mapping.
const format='EZ-CONCEPT-QUEUE-1';
const statuses=new Set(['observed','triaged','semantic_review','approved','rejected','superseded','future_era']);
const parts=new Set(['noun','noun_phrase','verb','verb_phrase','adjective','adverb','other']);
const text=(v,n)=>typeof v==='string'&&v.length<=n;
export function validateConceptQueue(q){
 if(!q||q.format!==format||q.version!=='1.0.0'||!Array.isArray(q.proposals)||q.proposals.length>5000)throw Error('Invalid DBA proposal backup.');
 const ids=new Set();
 const proposals=q.proposals.map(p=>{
  if(!p||p.format!==format||!/^EZC:[0-9a-z-]{8,80}$/.test(p.proposal_id)||ids.has(p.proposal_id)||!statuses.has(p.status)||!parts.has(p.proposed_part_of_speech))throw Error('Invalid DBA proposal.');
  ids.add(p.proposal_id);
  for(const k of ['submitted_form','intended_meaning','example_context'])if(!text(p[k],1100)||!p[k].trim())throw Error('Incomplete DBA proposal.');
  for(const k of ['collision_notes','reviewer_decision','reviewer_name'])if(!text(p[k],1100))throw Error('Invalid DBA review.');
  for(const k of ['created_at','updated_at'])if(!text(p[k],40)||!Number.isFinite(Date.parse(p[k])))throw Error('Invalid DBA proposal date.');
  for(const k of ['candidate_target','reviewed_target'])if(p[k]!==null&&!text(p[k],80))throw Error('Invalid DBA target.');
  if(!Number.isSafeInteger(p.corpus_frequency)||p.corpus_frequency<0||!Array.isArray(p.candidate_routes)||p.candidate_routes.length>12||p.candidate_routes.some(v=>!text(v,80)))throw Error('Invalid DBA evidence.');
  if(typeof p.approved_surface_mapping!=='boolean'||typeof p.entailment_confirmed!=='boolean'||(p.status==='approved'?!p.approved_surface_mapping||!p.entailment_confirmed||!p.reviewed_target||!p.reviewer_name||!p.reviewer_decision||!p.collision_notes:p.approved_surface_mapping))throw Error('Invalid DBA approval.');
  if(!Array.isArray(p.history)||p.history.length>1000||p.history.some(h=>!h||!text(h.at,40)||!Number.isFinite(Date.parse(h.at))||!statuses.has(h.status)||!text(h.note,1100)))throw Error('Invalid DBA review history.');
  return Object.fromEntries(['proposal_id','format','status','submitted_form','intended_meaning','example_context','proposed_part_of_speech','corpus_frequency','candidate_routes','candidate_target','collision_notes','reviewer_decision','reviewer_name','reviewed_target','approved_surface_mapping','entailment_confirmed','created_at','updated_at'].map(k=>[k,p[k]]).concat([['history',p.history.map(({at,status,note})=>({at,status,note}))]]));
 });
 return {format,version:'1.0.0',scope:'browser_local_noncanonical',proposals};
}
export function mergeConceptQueues(a,b){
 const current=validateConceptQueue(a),incoming=validateConceptQueue(b),all=new Map(current.proposals.map(p=>[p.proposal_id,p]));
 for(const p of incoming.proposals){const old=all.get(p.proposal_id);if(!old||Date.parse(p.updated_at)>Date.parse(old.updated_at))all.set(p.proposal_id,p);}
 return validateConceptQueue({...current,proposals:[...all.values()]});
}
