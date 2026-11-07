import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const source=read('sources/catalistym.json'),atlas=read('site/shelter-atlas.json'),catalog=read('site/catalog.json');
test('community ledger conserves the cohort without confusing fragments with deaths',()=>{for(const p of source.phases){assert.equal(p.functioning+p.fragmented+p.destroyed,520);for(const k of ['functioning','fragmented','destroyed'])assert.ok(p[k]>=0);}const end=source.phases.at(-1);assert.deepEqual([end.functioning,end.fragmented,end.destroyed],[320,35,165]);assert.equal(Math.min(...source.phases.map(p=>p.functioning)),285);});
test('atlas conserves nested allocations and keeps Elsewheres disconnected',()=>{const by=new Map(atlas.nodes.map(n=>[n.id,n]));assert.equal(by.size,atlas.nodes.length);for(const [kind,count] of [['shelter',520],['constellation',24],['hearth',144],['elsewhere',8]])assert.equal(atlas.nodes.filter(n=>n.kind===kind).length,count);for(const n of atlas.nodes){assert.ok(n.parent===null||n.parent==='expanse'||by.has(n.parent));assert.ok(Number.isFinite(n.x)&&Number.isFinite(n.y));if(['region','constellation','hearth','elsewhere'].includes(n.kind)){let total=0;for(const s of atlas.nodes.filter(n=>n.kind==='shelter')){let p=s;while(p){if(p.id===n.id){total++;break;}p=by.get(p.parent);}}assert.equal(total,n.shelters,n.id);}}for(const l of atlas.links){assert.ok(by.has(l.a)&&by.has(l.b));assert.notEqual(by.get(l.a).kind,'elsewhere');assert.notEqual(by.get(l.b).kind,'elsewhere');}assert.ok(atlas.nodes.filter(n=>n.kind==='shelter'&&!n.name).length>450);});
test('dossiers remain labeled development and every related reading exists',()=>{const ids=new Set(catalog.entries.map(e=>e.id));for(const e of source.entries){const c=catalog.entries.find(x=>x.id===e.id);assert.equal(c.kind,'Reference');assert.match(c.status,/proposed/i);for(const link of e.links)assert.ok(ids.has(link),link);const content=read('site/content/'+e.id+'.json');assert.equal(new Set(content.blocks.map(b=>b.id)).size,content.blocks.length);}});
test('reviewed related dossiers have additive labeled context, while story prose has no inserted Catalistym',()=>{for(const id of ['lore-p00935','lore-p00941','lore-p00954','lore-p00960','lore-p00966','lore-p00984','lore-p01027','lore-p01033','lore-p01271','lore-p01283']){const d=read('site/content/'+id+'.json');assert.ok(d.blocks.some(b=>b.id===id+'-catalistym'));assert.ok(d.blocks.some(b=>b.sourceParagraph!==undefined));}for(const e of catalog.entries.filter(e=>['Story','Draft'].includes(e.kind))){const d=read('site/content/'+e.id+'.json');assert.ok(!d.blocks.some(b=>b.id.includes('-catalistym')),e.id);}});
test('haven identifiers and feeding systems preserve community counts and connection meaning',()=>{
 const registry=read('sources/shelter-system-labels.json'),by=new Map(atlas.nodes.map(n=>[n.id,n])),coded=atlas.nodes.filter(n=>n.code);
 assert.equal(new Set(coded.map(n=>n.code)).size,coded.length);
 for(const n of coded){assert.match(n.code,/^[0-9A-Z]{3}$/);assert.equal(registry[n.id],n.code);}
 for(const h of atlas.nodes.filter(n=>n.kind==='shelter')){const children=atlas.nodes.filter(n=>n.kind==='system'&&n.parent===h.id);assert.equal(children.length,h.feedingSystems);assert.ok(children.length>=3&&children.length<=36);assert.ok(h.hubRadius>.4);assert.equal(atlas.links.filter(l=>l.type==='support'&&l.a===h.id).length,children.length);}
 for(const l of atlas.links.filter(l=>l.type==='support')){assert.equal(by.get(l.a).kind,'shelter');assert.equal(by.get(l.b).kind,'system');assert.equal(by.get(l.b).parent,l.a);}
});
test('history separates proposed origins, permanent system losses and community recovery',()=>{
 const havens=atlas.nodes.filter(n=>n.kind==='shelter'),systems=atlas.nodes.filter(n=>n.kind==='system');
 assert.deepEqual(atlas.timeline.map(p=>p.stage),Array.from({length:13},(_,i)=>i-5));
 for(let stage=0;stage<8;stage++)for(const status of ['functioning','fragmented','destroyed'])assert.equal(havens.filter(h=>h.history[stage].status===status).length,source.phases[stage][status]);
 let previous=0;for(let stage=-5;stage<=0;stage++){const count=havens.filter(h=>h.born<=stage).length;assert.ok(count>=previous);previous=count;}assert.equal(previous,520);
 for(const h of havens){const children=systems.filter(n=>n.parent===h.id);assert.ok(children.some(n=>n.born===h.born));assert.ok(children.every(n=>n.born>=h.born&&n.born<=0));let lost=0;for(let stage=0;stage<8;stage++){const state=h.history[stage];assert.ok(state.lost>=lost);assert.equal(state.lost,children.filter(n=>n.lostAt!==null&&n.lostAt<=stage).length);lost=state.lost;if(h.parent.startsWith('elsewhere'))assert.equal(state.status,'functioning');}}
 assert.ok(havens.some(h=>h.history.some(s=>s.disruptionSteps>=3)));
 assert.ok(havens.some(h=>h.history.some(s=>s.status==='functioning'&&s.lost>0)));
});
test('sparse route histories respect births, losses, isolation and discovery',()=>{
 const by=new Map(atlas.nodes.map(n=>[n.id,n]));
 assert.equal(new Set(atlas.links.map(l=>l.id)).size,atlas.links.length);
 for(const l of atlas.links){assert.equal(l.strengths.length,13);const a=by.get(l.a),b=by.get(l.b);for(let i=0;i<13;i++){const stage=i-5,v=l.strengths[i];assert.ok(v>=0&&v<=1);if(stage<Math.max(a.born,b.born)||l.discovered===null||stage<l.discovered)assert.equal(v,0);for(const n of [a,b])if(n.kind==='system'&&n.lostAt!==null&&stage>=n.lostAt)assert.equal(v,0);}if(l.type==='peer')assert.equal(a.parent,b.parent);if(l.type==='haven')assert.equal(a.parent,b.parent);}
 assert.ok(atlas.links.some(l=>l.discovered===null));
 assert.ok(atlas.links.some(l=>l.strengths.some((v,i)=>i&&v>l.strengths[i-1])));
 assert.ok(atlas.links.some(l=>l.strengths.some((v,i)=>i&&v>0&&v<l.strengths[i-1])));
 assert.ok(atlas.links.some(l=>l.strengths.some((v,i)=>i&&v===0&&l.strengths[i-1]>0)));
 assert.ok(atlas.nodes.filter(n=>n.kind==='system').some(n=>!atlas.links.some(l=>(l.a===n.id||l.b===n.id)&&l.strengths.some(v=>v>0))));
});
test('selective dossiers resolve both ways without filling the atlas',()=>{
 const profiles=read('sources/catalistym-atlas-profiles.json').profiles,by=new Map(atlas.nodes.map(n=>[n.id,n]));
 assert.equal(profiles.length,18);assert.equal(atlas.nodes.filter(n=>n.kind==='shelter'&&n.name).length,12);assert.equal(atlas.nodes.filter(n=>n.kind==='system'&&n.name).length,6);
 for(const p of profiles){const n=by.get(p.node);assert.equal(n.name,p.name);assert.equal(n.dossier,p.dossier);assert.equal(n.hostSystem,p.hostSystem);assert.ok(catalog.entries.some(e=>e.id===p.dossier));const content=read('site/content/'+p.dossier+'.json');assert.ok(content.blocks.some(b=>b.referenceUrl==='shelter-atlas.html#'+p.node));assert.ok(content.blocks.some(b=>/unresolved|uncertain/i.test(b.text)));}
 const history=source.entries.find(e=>e.id==='catalistym-history');assert.equal(history.sections.length,18);assert.deepEqual(history.sections.filter(s=>'atlasStage' in s).map(s=>s.atlasStage),Array.from({length:13},(_,i)=>i-5));assert.match(history.sections.at(-1).title,/Charter/);
 const html=fs.readFileSync(new URL('../site/shelter-atlas.html',import.meta.url),'utf8');assert.match(html,/id="detail-dossier"/);
});
