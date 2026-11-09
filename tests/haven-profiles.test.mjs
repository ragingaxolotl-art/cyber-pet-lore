import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const atlas=read('site/shelter-atlas.json'),source=read('sources/haven-profiles.json'),model=atlas.behaviorProfiles,by=new Map(atlas.nodes.map(n=>[n.id,n]));
test('profiles remain selective, attached to actual systems and discrete historical states',()=>{
 assert.equal(model.profiles.length,12);assert.equal(source.profiles.length,12);
 const selected=new Set();
 for(const profile of model.profiles){const h=by.get(profile.haven);assert.equal(h.kind,'shelter');assert.equal(profile.snapshots.length,3);assert.equal(profile.snapshots[0].stage,0);assert.equal(profile.snapshots[2].stage,7);
  for(const snap of profile.snapshots){assert.equal(snap.communityStatus,h.history[snap.stage].status);assert.equal(snap.records.length,2);assert.equal(new Set(snap.records.map(r=>r.node)).size,2);
   for(const r of snap.records){const n=by.get(r.node);assert.equal(n.kind,'system');assert.equal(n.parent,h.id);selected.add(n.id);assert.match(r.evidence,/hypothesis/i);
    for(const axis of [...model.capacities,...model.tendencies]){const a=r.axes[axis.id];assert.ok(a.reason.length>15);if(a.value!==null){assert.ok(Number.isInteger(a.value));assert.ok(a.value>=(model.capacities.includes(axis)?0:-2)&&a.value<=(model.capacities.includes(axis)?5:2));assert.ok(n.born<=snap.stage);assert.ok(n.lostAt===null||n.lostAt>snap.stage);assert.notEqual(snap.communityStatus,'destroyed');}}
   }
  }
 }
 assert.equal(selected.size,24);assert.ok(atlas.nodes.filter(n=>n.kind==='system').length>selected.size*100);
});
test('means exclude unknowns and ranges retain disagreement rather than flattening it',()=>{
 let unknown=false,single=false,dividedNeutral=false;
 for(const p of model.profiles)for(const s of p.snapshots)for(const axis of [...model.capacities,...model.tendencies]){
  const values=s.records.map(r=>r.axes[axis.id].value).filter(v=>v!==null),actual=s.summary[axis.id];
  assert.equal(actual.known,values.length);assert.equal(actual.sampleSize,2);
  assert.equal(actual.mean,values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10:null);
  assert.equal(actual.minimum,values.length?Math.min(...values):null);assert.equal(actual.maximum,values.length?Math.max(...values):null);
  if(!values.length)unknown=true;if(values.length===1)single=true;if(actual.mean===0&&actual.minimum<0&&actual.maximum>0)dividedNeutral=true;
 }
 assert.ok(unknown);assert.ok(single);assert.ok(dividedNeutral);
});
test('philosophical affinities are inspectable and never assigned to a destroyed community',()=>{
 for(const p of model.profiles)for(const s of p.snapshots){if(s.communityStatus==='destroyed')assert.deepEqual(s.candidates,[]);for(const c of s.candidates){assert.ok(model.tendencies.some(a=>a.id===c.axis));assert.ok(Math.abs(s.summary[c.axis].mean)>=1);assert.ok(c.reason.length>20);}}
});
test('lore dossiers contain all snapshot ratings and link back to the methodology',()=>{
 for(const p of model.profiles){const d=read('site/content/'+p.dossier+'.json');for(const s of p.snapshots)assert.ok(d.blocks.some(b=>b.id===p.dossier+'-profile-'+s.stage));assert.ok(d.blocks.some(b=>b.referenceUrl==='#read=catalistym-profile-method'));}
 const method=read('site/content/catalistym-profile-method.json');assert.ok(method.blocks.some(b=>/Unknowns are not zero/.test(b.text)));
});
