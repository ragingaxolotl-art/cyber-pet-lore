// Display authored partial samples. No scores are inferred for unsampled systems.
export function renderHavenProfile(container,{node,data,lookup,stage,setStage,focus}){
 container.replaceChildren();
 if(!node||!['shelter','system'].includes(node.kind))return;
 const haven=node.kind==='shelter'?node:lookup.get(node.parent),model=data.behaviorProfiles;
 const profile=model?.profiles.find(p=>p.haven===haven.id);
 const add=(tag,text,parent=container)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;parent.append(e);return e;};
 add('h3',node.kind==='system'?'Microsystem profile':'Haven profile');
 if(!profile){add('p','Not profiled yet. No scores or philosophy have been inferred for this haven.');return;}
 add('p','Proposed system-level profile · not a measure of personhood.');
 const controls=add('div');controls.className='profile-snapshots';
 for(const s of profile.snapshots){const b=add('button',s.label+' · '+s.stage,controls);b.type='button';b.onclick=()=>setStage(s.stage);b.setAttribute('aria-pressed',String(stage===s.stage));}
 const method=add('a','How ratings and philosophy suggestions work →');method.href='index.html#read=catalistym-profile-method';
 if(stage<0){add('p','No scored snapshot before the early height (stage 0). Origins do not imply an assessed capacity.');return;}
 if(haven.history[stage].status==='destroyed'){add('p','Community continuity has ended. No current shared personality or philosophy is assigned. Use an earlier snapshot to inspect its historical profile.');return;}
 if(node.kind==='system'&&node.lostAt!==null&&stage>=node.lostAt){add('p','This microsystem is lost at the selected stage. Use an earlier snapshot for its historical assessment.');return;}
 const snap=[...profile.snapshots].reverse().find(s=>s.stage<=stage);
 const record=node.kind==='system'?snap.records.find(r=>r.node===node.id):null;
 if(node.kind==='system'&&!record){add('p','This microsystem has no individual rating. Its haven has a small sample of other components; no values are copied to this system.');const b=add('button','Inspect associated haven sample');b.onclick=()=>focus(haven);return;}
 add('p',`Assessment: ${snap.label}, stage ${snap.stage}. ${stage===snap.stage?'':'Historical snapshot retained for reference; not an interpolated rating of this stage.'}`);
 const covered=snap.records.filter(r=>Object.values(r.axes).some(a=>a.value!==null)).length;
 add('p',`${covered} rated microsystems / ${haven.feedingSystems} peak-associated systems (${Math.round(covered/haven.feedingSystems*100)}% coverage). Two deliberately contrasting components; not a representative sample of inhabitants.`);
 if(record)add('p',`${record.role} · ${record.reliability}. ${record.support}`);
 for(const [title,axes,capacity] of [['Capacities · 0–5',model.capacities,true],['Collective tendencies · −2 to +2',model.tendencies,false]]){
  const disclosure=add('details');add('summary',title,disclosure);
  const table=add('table',undefined,disclosure);table.className='profile-table';add('caption',record?'Selected microsystem ratings':'Known-value mean and sample range',table);
  const head=add('thead',undefined,table),hr=add('tr',undefined,head);
  for(const label of ['Trait',record?'Score':'Mean','Evidence']){const th=add('th',label,hr);th.scope='col';}
  const body=add('tbody',undefined,table);
  for(const axis of axes){const row=add('tr',undefined,body),th=add('th',axis.label,row);th.scope='row';
   const stat=snap.summary[axis.id],value=record?record.axes[axis.id].value:stat.mean;
   add('td',value===null?'Unknown':String(value)+(capacity?' / 5':''),row);
   const evidence=add('td',undefined,row);
   add('span',record?record.axes[axis.id].reason:value===null?'No known ratings':`Range ${stat.minimum} to ${stat.maximum}; ${stat.known}/${stat.sampleSize} known`,evidence);
   if(!capacity)add('small',`−2: ${axis.low} · +2: ${axis.high}`,evidence);
  }
 }
 add('h4','Collective practice');add('p',snap.practice);
 add('h4','Possible philosophical affinities');
 add('p','Suggestions from the haven sample, not beliefs established for any member. Several interpretations can fit the same behavior.');
 const list=add('ul');for(const candidate of snap.candidates)add('li',candidate.name+' — '+candidate.reason,list);
 if(!snap.candidates.length)add('p','Insufficient ratings for an affinity suggestion.');
 add('p','Tension / alternative explanation: '+snap.tension);
 const evidence=add('details');add('summary','Inspect sampled systems and score reasons',evidence);
 for(const r of snap.records){
  const n=lookup.get(r.node),b=add('button',(n.name||'System '+n.code)+' · '+r.role,evidence);b.onclick=()=>focus(n);
  add('p',r.evidence+' · '+r.reliability+'. '+r.support,evidence);
  const reasons=add('dl',undefined,evidence);
  for(const axis of [...model.capacities,...model.tendencies]){const score=r.axes[axis.id];add('dt',axis.label+': '+(score.value===null?'unknown':score.value),reasons);add('dd',score.reason,reasons);}
 }
}
