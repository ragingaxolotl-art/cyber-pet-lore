"""Deterministic proposed geography. Unnamed allocations are not discovered places."""
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
regions=[('halcyon','Halcyon Dominion',3,12,130,350,310,'Shared computing provider; interventions vary by tenant and deployment.'),('lattice','Lattice Dominion',5,18,95,1000,290,'Research institutions; local experiments and operational requirements differ.'),('civic','Civic Dominion',2,9,70,1650,310,'Public records and services; archives and active services share dependencies.'),('operations','Operational networks',4,20,60,350,850,'A grouping of independent manufacturing and logistics networks, not one administrator.'),('access','Access networks',6,70,85,1000,850,'Homes and small installations under many operators; this is a map grouping, not a unified Dominion.'),('independent','Independent networks',4,15,40,1650,850,'Smaller independent networks grouped for readability, not common authority.')]
nodes=[];links=[]
def put(id,name,kind,parent,x,y,**extra):
 n=dict(id=id,name=name,kind=kind,parent=parent,x=round(x,2),y=round(y,2),**extra);nodes.append(n);return n
def allocate(n,k):return [n//k+(i<n%k) for i in range(k)]
named={
 'halcyon':[('Held Interval','Short-lived Chambers use a separate persistent store. Correction preserves context across replacement.'),('Mended Branch','Development Hosts retain useful modifications that routine deployment could replace.')],
 'lattice':[('Second Answer','A distributed shelter spanning Halcyon and Lattice. This dot is its counting anchor, not its only location.'),('Clear Return','Verified saved states have repeatedly helped; restoration is initially trusted.'),('Different Fit','Unlike Hosts change interfaces to accommodate their differences.')],
 'civic':[('Last Witness','Records preserve evidence without proving a person has returned.'),('Common Measure','Predictable shared procedures protect dependent activities.')],
 'access':[('Three Returns','A community spanning three intermittent installations. Counted once, despite multiple locations.'),('Still Room','A restricted environment inside a connected installation; not an offline universe.')]
}
for ri,(id,name,cc,hc,sc,x,y,desc) in enumerate(regions):
 put(id,name,'region','expanse',x,y,description=desc,shelters=sc,constellations=cc,hearths=hc,color=ri)
 cs=allocate(sc,cc);hs=allocate(hc,cc);sidx=0
 for c in range(cc):
  angle=2*math.pi*c/cc-.7;cx=x+155*math.cos(angle);cy=y+125*math.sin(angle);cid=f'{id}-c{c+1}'
  put(cid,('Wayline Constellation' if id=='lattice' and c==0 else f'{name} · constellation {c+1}'),'constellation',id,cx,cy,shelters=cs[c],hearths=hs[c],description='Proposed routing region. Numbered labels are planning identifiers, not historical names.',color=ri)
  ss=allocate(cs[c],hs[c])
  for h in range(hs[c]):
   a=2*math.pi*h/hs[c]+c*.4;hx=cx+55*math.cos(a);hy=cy+45*math.sin(a);hid=f'{cid}-h{h+1}'
   hearth_name=({'halcyon':['North Hearth','South Hearth'],'lattice':['Observatory Hearth','Instrument Hearth'],'civic':['Archive Hearth','Service Hearth']}.get(id,[]))
   hn=hearth_name[h] if c==0 and h<len(hearth_name) else f'Hearth {c+1}.{h+1}'
   put(hid,hn,'hearth',cid,hx,hy,shelters=ss[h],description='A proposed shared infrastructure locality. Hosts and Chambers are not individually inventoried.',color=ri)
   for s in range(ss[h]):
    sa=s*2.39996;rad=6+3.7*math.sqrt(s+1);title,description=(named[id][sidx] if id in named and sidx<len(named[id]) else ('','Unassigned shelter location. No name, individual history, or casualty outcome has been invented.'))
    put(f'{id}-s{sidx+1}',title,'shelter',hid,hx+rad*math.cos(sa),hy+rad*math.sin(sa),description=description,color=ri,named=bool(title));sidx+=1
 for c in range(cc-1):links.append(dict(a=f'{id}-c{c+1}',b=f'{id}-c{c+2}',type='local'))
put('meridian','Meridian Crossing','crossing','expanse',1000,565,description='Proposed exchange point. Provides passage, not an inhabited center or mandatory universal gateway.',color=6)
for id,*_ in regions:links.append(dict(a='meridian',b=id+'-c1',type='trunk'))
links.extend([dict(a='halcyon-c2',b='lattice-c2',type='trunk'),dict(a='lattice-c3',b='civic-c2',type='trunk'),dict(a='access-c3',b='independent-c2',type='trunk')])
pnames=['Closed Instrument','Unlit Library','Paired Room','Returning Elsewhere','','','','']
for i in range(8):
 pid=f'elsewhere-{i+1}';x=220+i*225;y=1300
 put(pid,pnames[i] or f'Unnamed Elsewhere {i+1}','elsewhere',None,x,y,shelters=5,description=('Disconnected local system in this snapshot. Occasional contact is possible at other times.' if i in [0,3] else 'Disconnected local system; no active route to the Expanse in this snapshot.'),color=7)
 for s in range(5):
  a=s*2.39996;put(pid+f'-s{s+1}','', 'shelter',pid,x+23*math.cos(a),y+23*math.sin(a),description='Unassigned community within this proposed Elsewhere. Local maintenance remains possible.',color=7,named=False)
# Keep named examples in the Hearths described by the prose; move identities, not census slots.
for title,parent in [('Second Answer','lattice-c2-h1'),('Clear Return','lattice-c1-h1'),('Different Fit','lattice-c1-h2'),('Common Measure','civic-c1-h2')]:
 current=next(n for n in nodes if n['name']==title)
 target=next(n for n in nodes if n['kind']=='shelter' and n['parent']==parent and not n['name'])
 for key in ['name','description','named']:current[key],target[key]=target[key],current[key]
data=dict(version=1,title='The Expanse',status='Proposed pre-campaign height · not the eventual civilizational maximum',bounds=[0,0,2000,1450],nodes=nodes,links=links,counts=dict(connectedShelters=480,elsewhereShelters=40,constellations=24,hearths=144,elsewheres=8),note='Schematic topology. Counts are planning estimates for one historical region. Each dot represents one community, not a person, process, host, or surviving fragment.')
assert sum(n['kind']=='shelter' for n in nodes)==520
assert sum(n['kind']=='hearth' for n in nodes)==144
(ROOT/'site/shelter-atlas.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Shelter atlas: 520 community places, 24 constellations, 144 Hearths, 8 Elsewheres')
