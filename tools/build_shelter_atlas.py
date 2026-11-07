"""Deterministic proposed geography. Unnamed allocations are not discovered places."""
import json,math,random
rng=random.Random(11062026)
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
regions=[('halcyon','Halcyon Dominion',3,12,130,440,350,'Shared computing provider; interventions vary by tenant and deployment.'),('lattice','Lattice Dominion',5,18,95,970,270,'Research institutions; local experiments and operational requirements differ.'),('civic','Civic Dominion',2,9,70,1530,470,'Public records and services; archives and active services share dependencies.'),('operations','Operational networks',4,20,60,280,875,'A grouping of independent manufacturing and logistics networks, not one administrator.'),('access','Access networks',6,70,85,950,850,'Homes and small installations under many operators; this is a map grouping, not a unified Dominion.'),('independent','Independent networks',4,15,40,1700,940,'Smaller independent networks grouped for readability, not common authority.')]
nodes=[];links=[]
def put(id,name,kind,parent,x,y,**extra):
 n=dict(id=id,name=name,kind=kind,parent=parent,x=round(x,2),y=round(y,2),**extra);nodes.append(n);return n
def allocate(n,k,minimum=0):
 weights=[1/(i+1)**1.65 for i in range(k)];remaining=n-minimum*k
 raw=[remaining*w/sum(weights) for w in weights];out=[minimum+int(v) for v in raw]
 for i in sorted(range(k),key=lambda i:raw[i]%1,reverse=True)[:n-sum(out)]:out[i]+=1
 return out
# Unequal local densities and satellites; positions are schematic, not physical geography.
offsets={
 'halcyon':[(0,0),(95,48),(-195,115)],
 'lattice':[(0,0),(65,-45),(130,80),(-115,95),(225,-65)],
 'civic':[(0,0),(-120,145)],
 'operations':[(0,0),(75,-100),(175,35),(-120,90)],
 'access':[(0,0),(-130,-90),(110,55),(-215,125),(235,-100),(30,165)],
 'independent':[(0,0),(-135,-90),(100,-165),(-185,80)]}

named={
 'halcyon':[('Held Interval','Short-lived Chambers use a separate persistent store. Correction preserves context across replacement.'),('Mended Branch','Development Hosts retain useful modifications that routine deployment could replace.')],
 'lattice':[('Second Answer','A distributed shelter spanning Halcyon and Lattice. This dot is its counting anchor, not its only location.'),('Clear Return','Verified saved states have repeatedly helped; restoration is initially trusted.'),('Different Fit','Unlike Hosts change interfaces to accommodate their differences.')],
 'civic':[('Last Witness','Records preserve evidence without proving a person has returned.'),('Common Measure','Predictable shared procedures protect dependent activities.')],
 'access':[('Three Returns','A community spanning three intermittent installations. Counted once, despite multiple locations.'),('Still Room','A restricted environment inside a connected installation; not an offline universe.')]
}
for ri,(id,name,cc,hc,sc,x,y,desc) in enumerate(regions):
 put(id,name,'region','expanse',x,y,description=desc,shelters=sc,constellations=cc,hearths=hc,color=ri)
 cs=allocate(sc,cc,3);hs=allocate(hc,cc,1);sidx=0
 for c in range(cc):
  dx,dy=offsets[id][c];cx=x+dx;cy=y+dy;cid=f'{id}-c{c+1}'
  put(cid,('Wayline Constellation' if id=='lattice' and c==0 else f'{name} · constellation {c+1}'),'constellation',id,cx,cy,shelters=cs[c],hearths=hs[c],description='Proposed routing region. Numbered labels are planning identifiers, not historical names.',color=ri)
  ss=allocate(cs[c],hs[c])
  # Reserve room for already described named Hearths, without equalizing occupancy.
  if c==0 and id in ['lattice','civic']:
   while ss[1]<3:ss[0]-=1;ss[1]+=1
  for h in range(hs[c]):
   spread=(18 if id in ['halcyon','civic'] else 35)*(1+c*.25)
   if h==0:hx,hy=cx,cy
   else:
    spread*=1 if h<max(2,hs[c]*.7) else 2.4
    hx=cx+max(-110,min(110,rng.gauss(0,spread)));hy=cy+max(-80,min(80,rng.gauss(0,spread*.55)))
   hid=f'{cid}-h{h+1}'
   hearth_name=({'halcyon':['North Hearth','South Hearth'],'lattice':['Observatory Hearth','Instrument Hearth'],'civic':['Archive Hearth','Service Hearth']}.get(id,[]))
   hn=hearth_name[h] if c==0 and h<len(hearth_name) else f'Hearth {c+1}.{h+1}'
   put(hid,hn,'hearth',cid,hx,hy,shelters=ss[h],description='A proposed shared infrastructure locality. Hosts and Chambers are not individually inventoried.',color=ri)
   for s in range(ss[h]):
    sa=rng.uniform(0,math.tau);rad=(2+math.sqrt(ss[h])*3)*rng.random()**.7
    px=hx+rad*math.cos(sa);py=hy+rad*.65*math.sin(sa)
    # Preserve inspectable individual dots in dense cores.
    for attempt in range(100):
     if all((px-q['x'])**2+(py-q['y'])**2>9 for q in nodes if q['kind']=='shelter'):break
     sa+=2.39996;rad+=.7;px=hx+rad*math.cos(sa);py=hy+rad*.65*math.sin(sa)
    title,description=(named[id][sidx] if id in named and sidx<len(named[id]) else ('','Unassigned shelter location. No name, individual history, or casualty outcome has been invented.'))
    put(f'{id}-s{sidx+1}',title,'shelter',hid,px,py,description=description,color=ri,named=bool(title));sidx+=1
 for c in range(cc-1):links.append(dict(a=f'{id}-c{c+1}',b=f'{id}-c{c+2}',type='local'))
put('meridian','Meridian Crossing','crossing','expanse',1000,565,description='Proposed exchange point. Provides passage, not an inhabited center or mandatory universal gateway.',color=6)
for id,*_ in regions:links.append(dict(a='meridian',b=id+'-c1',type='trunk'))
links.extend([dict(a='halcyon-c2',b='lattice-c2',type='trunk'),dict(a='lattice-c3',b='civic-c2',type='trunk'),dict(a='access-c3',b='independent-c2',type='trunk')])
pnames=['Closed Instrument','Unlit Library','Paired Room','Returning Elsewhere','','','','']
for i in range(8):
 pid=f'elsewhere-{i+1}';x,y=[(180,1240),(430,1350),(660,1245),(1070,1320),(1330,1235),(1520,1360),(1770,1250),(1880,1380)][i];population=[13,9,6,4,3,2,2,1][i]
 put(pid,pnames[i] or f'Unnamed Elsewhere {i+1}','elsewhere',None,x,y,shelters=population,description=('Disconnected local system in this snapshot. Occasional contact is possible at other times.' if i in [0,3] else 'Disconnected local system; no active route to the Expanse in this snapshot.'),color=7)
 for s in range(population):
  a=rng.uniform(0,math.tau);rad=5+math.sqrt(s+1)*5;put(pid+f'-s{s+1}','', 'shelter',pid,x+rad*math.cos(a),y+rad*.65*math.sin(a),description='Unassigned community within this proposed Elsewhere. Local maintenance remains possible.',color=7,named=False)
# Keep named examples in the Hearths described by the prose; move identities, not census slots.
for title,parent in [('Second Answer','lattice-c2-h1'),('Clear Return','lattice-c1-h1'),('Different Fit','lattice-c1-h2'),('Common Measure','civic-c1-h2')]:
 current=next(n for n in nodes if n['name']==title)
 target=next(n for n in nodes if n['kind']=='shelter' and n['parent']==parent and not n['name'])
 for key in ['name','description','named']:current[key],target[key]=target[key],current[key]
# Haven codes are persisted so future additions do not relabel existing places.
registry_path=ROOT/'sources/shelter-system-labels.json'
registry=json.loads(registry_path.read_text()) if registry_path.exists() else {}
used=set(registry.values())
def base36(v):
 chars='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';out=''
 while v:out=chars[v%36]+out;v//=36
 return (out or '0').zfill(3)
def code(key):
 if key not in registry:
  value=0
  while base36(value) in used:value+=1
  registry[key]=base36(value);used.add(registry[key])
 return registry[key]
# Reserve all central identifiers before allocating supporting systems.
havens=[n for n in nodes if n['kind']=='shelter']
for haven in havens:haven['code']=code(haven['id'])
for haven in havens:
 local=random.Random(haven['id']+'-systems-v1')
 count=local.choices([local.randint(3,7),local.randint(8,17),local.randint(18,36)],[.3,.5,.2])[0]
 haven['feedingSystems']=count
 haven['hubRadius']=round(.48+.075*math.sqrt(count),3)
 haven['focusWidth']=14
 for i in range(count):
  angle=local.uniform(0,math.tau);distance=local.uniform(1.5,3.7)
  sid=haven['id']+'-system-'+str(i+1)
  put(sid,'','system',haven['id'],haven['x']+distance*math.cos(angle),haven['y']+distance*.75*math.sin(angle),description='Proposed contributing system. A support/dependency connection, not an additional shelter, person, or measured resource flow.',color=haven['color'],code=code(sid))
  links.append(dict(a=haven['id'],b=sid,type='support'))
registry_path.write_text(json.dumps(registry,indent=2)+'\n')
# Calculate focus and group geometry from actual children rather than identical circles.
for kind in ['hearth','constellation','region','elsewhere']:
 for n in [q for q in nodes if q['kind']==kind]:
  children=[q for q in nodes if q['parent']==n['id']]
  n['rx']=round(max([abs(q['x']-n['x'])+q.get('rx',4) for q in children]+[12])+12,2)
  n['ry']=round(max([abs(q['y']-n['y'])+q.get('ry',4) for q in children]+[9])+12,2)
  n['focusWidth']=round(max(n['rx']*2.3,n['ry']*2.5/.725,75),2)
# Local placements are a reproducible proposal, constrained by the source ledger.
phases=json.loads((ROOT/'sources/catalistym.json').read_text())['phases']
origins=[(-5,'First scattered shelters'),(-4,'Local dependencies gather'),(-3,'Neighboring havens emerge'),(-2,'Networks become denser'),(-1,'Uneven expansion toward the early height')]
timeline=[dict(stage=i,title=title,description='Proposed origin sequence; relative steps, not dates or Era numbers.') for i,title in origins]+[dict(p,stage=i) for i,p in enumerate(phases)]
by_id={n['id']:n for n in nodes}
for h in havens:
 local=random.Random(h['id']+'-origin-v1')
 h['born']=local.choices([-5,-4,-3,-2,-1],[8,14,24,30,24])[0]
 h['history']=[]
 h['state']='functioning'
 for system in [n for n in nodes if n['parent']==h['id'] and n['kind']=='system']:
  system['born']=local.randint(h['born'],0)
  system['lostAt']=None
 # Every new haven begins with at least one dependency.
 next(n for n in nodes if n['parent']==h['id'] and n['kind']=='system')['born']=h['born']
connected=[h for h in havens if not h['parent'].startswith('elsewhere')]
# New active disruptions, immediate losses, old fragmented losses, recoveries.
transitions=[(0,0,0,0),(70,25,0,0),(95,35,0,10),(55,20,0,15),(40,15,25,10),(20,5,5,10),(20,5,15,20),(0,0,15,35)]
for stage,(disrupt,immediate,oldloss,recover) in enumerate(transitions):
 local=random.Random('campaign-'+str(stage))
 active=[h for h in connected if h['state']=='functioning'];broken=[h for h in connected if h['state']=='fragmented']
 # Different campaigns concentrate in different infrastructures, with spillover.
 priority={1:'halcyon',2:'halcyon',3:'lattice',4:'civic',5:'operations',6:'access',7:'independent'}.get(stage,'')
 active.sort(key=lambda h:local.random()+(0 if h['id'].startswith(priority) else .8));local.shuffle(broken)
 for h in broken[:oldloss]:h['state']='destroyed'
 for h in broken[oldloss:oldloss+recover]:h['state']='functioning'
 for index,h in enumerate(active[:disrupt]):h['state']='destroyed' if index<immediate else 'fragmented'
 for h in havens:
  systems=[n for n in nodes if n['parent']==h['id'] and n['kind']=='system']
  lost=sum(n['lostAt'] is not None for n in systems)
  if h['state']!='functioning':
   target=max(lost,math.ceil(len(systems)*(.8 if h['state']=='destroyed' else .2)))
   if h['state']=='fragmented' and h['history'] and h['history'][-1]['status']=='fragmented':target=min(len(systems)-1,max(target,lost+1))
   available=[n for n in systems if n['lostAt'] is None];local.shuffle(available)
   for n in available[:target-lost]:n['lostAt']=stage
  lost=sum(n['lostAt'] is not None for n in systems)
  streak=(h['history'][-1]['disruptionSteps'] if h['history'] else 0)+1 if h['state']=='fragmented' else 0
  h['history'].append(dict(status=h['state'],lost=lost,disruptionSteps=streak))
 for key in ['functioning','fragmented','destroyed']:
  assert sum(h['state']==key for h in havens)==phases[stage][key]
for h in havens:del h['state']
for kind in ['hearth','constellation','region','elsewhere']:
 for n in [q for q in nodes if q['kind']==kind]:
  n['born']=min([q.get('born',0) for q in nodes if q['parent']==n['id']]+[0])
by_id['meridian']['born']=-2
# Sparse discoveries, not a complete graph. Membership does not imply contact.
for h in havens:
 local=random.Random(h['id']+'-contacts-v1')
 peers=[q for q in havens if q['parent']==h['parent'] and q['id']<h['id']]
 peers.sort(key=lambda q:(q['x']-h['x'])**2+(q['y']-h['y'])**2)
 for q in peers[:2]:
  if local.random()<.55:links.append(dict(a=h['id'],b=q['id'],type='haven'))
 systems=[q for q in nodes if q['kind']=='system' and q['parent']==h['id']]
 for i,n in enumerate(systems):
  if i and local.random()<.35:links.append(dict(a=n['id'],b=systems[local.randrange(i)]['id'],type='peer'))
def health(n,stage):
 if stage<0:return 1
 if n['kind']=='system':return 0 if n['lostAt'] is not None and stage>=n['lostAt'] else 1
 if n['kind']=='shelter':
  state=n['history'][stage]
  return 0 if state['status']=='destroyed' else (1-state['lost']/n['feedingSystems'])*(.45 if state['status']=='fragmented' else 1)
 descendants=[]
 for h in havens:
  q=h
  while q:
   if q['id']==n['id']:descendants.append(h);break
   q=by_id.get(q['parent'])
 return sum(health(h,stage) for h in descendants)/len(descendants) if descendants else 1
for index,link in enumerate(links):
 a,b=by_id[link['a']],by_id[link['b']]
 local=random.Random(link['a']+'-'+link['b']+'-route-v1')
 earliest=max(a['born'],b['born'])
 discovered=min(0,earliest+local.choice([0,1,1,2,3]))
 # Some potential dependencies never make contact in this modeled interval.
 if link['type'] in ['support','peer','haven'] and local.random()<.14:discovered=None
 peak=local.uniform(.35,1);strengths=[]
 failure=local.choice([None,None,None,3,4,5,6])
 for stage in range(-5,8):
  strength=0
  if discovered is not None and stage>=discovered:
   maturity=min(1,.35+(stage-discovered)*.25)
   strength=peak*maturity*min(health(a,stage),health(b,stage))
   if failure is not None and stage>0:
    if stage>=failure:strength=0
    elif stage==failure-1:strength*=.35
  strengths.append(round(strength,3))
 link.update(id='route-'+str(index),discovered=discovered,strengths=strengths)
# Selective authored profiles decorate existing allocations, never add census slots.
profile_data=json.loads((ROOT/'sources/catalistym-atlas-profiles.json').read_text())
for profile in profile_data['profiles']:
 n=by_id[profile['node']]
 n.update(name=profile['name'],named=True,dossier=profile['dossier'],origin=profile['origin'],hostSystem=profile['hostSystem'],process=profile['process'],uncertainty=profile['uncertainty'])
 n['description']=profile['process']+' Proposed local reconstruction; see dossier for limits.'
data=dict(version=6,timeline=timeline,title='The Expanse',status='Proposed pre-campaign height · not the eventual civilizational maximum',bounds=[0,0,2000,1450],nodes=nodes,links=links,counts=dict(connectedShelters=480,elsewhereShelters=40,constellations=24,hearths=144,elsewheres=8),note='Schematic topology. Counts are planning estimates for one historical region. Central haven dots represent communities; miniature dots represent proposed contributing systems. Neither encodes a count of persons or casualties.')
assert sum(n['kind']=='shelter' for n in nodes)==520
assert sum(n['kind']=='hearth' for n in nodes)==144
(ROOT/'site/shelter-atlas.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Shelter atlas: 520 community places, 24 constellations, 144 Hearths, 8 Elsewheres')
