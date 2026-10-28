// Independent volumetric parts. No fragment is cropped from the character image.
const TAU=Math.PI*2;
const colors=[[164,222,255],[207,174,255],[255,181,214],[173,255,224],[255,221,159]];
const outlines=[[[0,-1],[.68,-.42],[.42,.42],[-.25,1],[-.68,.13]],[[.3,-1],[.75,-.6],[.45,.3],[-.65,1],[-.28,-.2]],[[0,-1],[.7,-.2],[.45,.8],[-.55,.5],[-.75,-.4]],[[.45,-1],[.7,.1],[0,1],[-.28,.1],[-.72,-.45]]];
const frac=x=>x-Math.floor(x),rand=(seed,n)=>frac(Math.sin(seed*127.1+n*311.7)*43758.5453);
function rotate(v,r){let [x,y,z]=v;let c=Math.cos(r[0]),s=Math.sin(r[0]);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(r[1]);s=Math.sin(r[1]);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(r[2]);s=Math.sin(r[2]);return[x*c-y*s,x*s+y*c,z];}
function add(a,b){return a.map((v,i)=>v+b[i]);}
function makeShard(seed,length,width,depth){const shape=outlines[seed%outlines.length],n=shape.length;const vertices=shape.map(([x,y],i)=>[x*width*(.8+rand(seed,i)*.4),y*length/2,depth*(.35+rand(seed,i+9)*.2)]);vertices.push(...vertices.map(([x,y,z])=>[x*.86,y*.94,-z]));vertices.push([width*.08,-length*.07,depth*.95]);const faces=[];for(let i=0;i<n;i++){faces.push([i,(i+1)%n,n*2]);faces.push([i,n+i,n+(i+1)%n,(i+1)%n]);}faces.push(Array.from({length:n},(_,i)=>n+i).reverse());return{vertices,faces,color:colors[seed%colors.length]};}
const shards=Array.from({length:62},(_,i)=>({mesh:makeShard(i+1,12+rand(i,2)*48,5+rand(i,3)*18,3+rand(i,4)*10),phase:i*2.399963,speed:(i%2?-1:1)*(1+i%3),radius:100+rand(i,5)*165,height:140+rand(i,6)*165,seed:i}));
const featherMeshes=Array.from({length:8},(_,i)=>Array.from({length:7},(_,j)=>makeShard(100+i*7+j,38+j*8,7+j*1.1,3)));
const palm=makeShard(91,40,22,7),finger=makeShard(92,17,5,4),forearm=makeShard(94,65,18,9);
const head=makeShard(103,70,31,16);
function normal(vertices,face){const a=vertices[face[0]],b=vertices[face[1]],c=vertices[face[2]],u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]);const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],m=Math.hypot(...n)||1;return n.map(x=>x/m);}
function meshItem(mesh,center,rotation,alpha=1,scale=1){return{mesh,center,rotation,alpha,scale,z:center[2]};}
function drawMesh(c,item){const {mesh,center,rotation,alpha,scale}=item,vertices=mesh.vertices.map(v=>add((item.parentRotation?rotate(rotate(v.map(x=>x*scale),rotation),item.parentRotation):rotate(v.map(x=>x*scale),rotation)),center)),project=v=>{const k=900/(900-v[2]);return[960+v[0]*k,500+v[1]*k];};
 const faces=mesh.faces.map(f=>({f,z:f.reduce((sum,i)=>sum+vertices[i][2],0)/f.length})).sort((a,b)=>a.z-b.z);
 c.save();for(const {f}of faces){const n=normal(vertices,f),light=Math.abs(n[0]*-.35+n[1]*-.6+n[2]*.72),shine=Math.pow(Math.max(0,n[2]*.9-n[1]*.3),12),rgb=mesh.color.map(v=>Math.min(255,Math.round(v*(.35+.65*light)+shine*100)));c.beginPath();for(let j=0;j<f.length;j++){const p=project(vertices[f[j]]);j?c.lineTo(...p):c.moveTo(...p);}c.closePath();c.fillStyle=`rgba(${rgb.join(',')},${alpha*(.38+.35*light)})`;c.fill();c.strokeStyle=`rgba(255,${Math.round(166+light*72)},${Math.round(88+light*95)},${alpha*.85})`;c.lineWidth=.7+light*.65;c.stroke();if(shine>.3){c.strokeStyle=`rgba(235,251,255,${alpha*shine*.8})`;c.lineWidth=1.4;c.stroke();}}
 c.restore();
}
function handItems(t,side){const a=t/12*TAU,root=[side*(125+25*Math.sin(a*2+side)),120+35*Math.sin(a+side),40*Math.sin(a*2+side)],rotation=[a*(side===1?1:-2)+.4,a*(side===1?-2:1),side*.6+.35*Math.sin(a*3)],out=[];
 const place=(mesh,local,r,scale=1)=>out.push({...meshItem(mesh,add(root,rotate(local,rotation)),r,.6,scale),parentRotation:rotation,body:true});
 place(palm,[0,0,0],[0,0,0]);place(forearm,[0,70,0],[.15*Math.sin(a*2),0,0]);
 // Each digit has three independently positioned phalanges; curl changes their joint angles.
 for(let f=0;f<5;f++){const thumb=f===0,base=[thumb?-24:-15+(f-1)*10,thumb?0:-20,0],spread=(f-2)*.13+(thumb?-.65:0),curl=.15+(.5+.5*Math.sin(a*(side===1?2:3)+f*.3+side))*1.55;let joint=base;
  for(let j=0;j<3;j++){const bend=curl*(.5+j*.33),dir=rotate([0,-(thumb?11:15-j*2),0],[bend,0,spread]),mid=joint.map((x,k)=>x+dir[k]/2);place(finger,mid,[bend,0,spread],thumb?.66:1-j*.1);joint=add(joint,dir);}
 }
 return out;
}
function wingItems(t){const a=t/12*TAU,out=[];for(let w=0;w<8;w++){
 const cycle=(t+(w*1.713))%[3,4,2,6][w%4],burst=cycle<.46?Math.sin(cycle/.46*Math.PI):0;if(!burst)continue;
 const direction=w*TAU/8+.2,extent=135,root=[Math.cos(direction)*extent,Math.sin(direction)*extent, -60],rotation=[.12*Math.sin(w),.18*Math.cos(w),direction+Math.PI/2];
 for(let j=0;j<7;j++){if((Math.floor(t*13)+w+j)%7===0)continue;const offset=rotate([(j-3)*11,-28-j*13,8*Math.sin(j)],rotation),breakoff=j>3?1.04:1;out.push({...meshItem(featherMeshes[w][j],add(root,offset.map(x=>x*breakoff)),rotation,burst*(.33+j*.055)),anchored:true});}
 }return out;
}
function ringSegments(t){const a=t/12*TAU,out=[];for(let ring=0;ring<2;ring++){
 const rotation=[.55+a*(ring? -1:1),a*(ring?2:-1)+.8,ring?-.65:.55],radius=ring?89:108;
 for(let j=0;j<96;j++){const points=[j,j+1].map(k=>rotate([Math.cos(k*TAU/96)*radius,Math.sin(k*TAU/96)*radius,0],rotation));out.push({ring:true,points,z:(points[0][2]+points[1][2])/2,color:ring?'#aaf2ff':'#ffda86',bright:j%12===0});}
 }return out;
}
export function livingLayers(t,variant=0){const a=t/12*TAU,items=shards.map(p=>{const angle=p.phase+a*p.speed+.13*Math.sin(a*3+p.seed);return meshItem(p.mesh,[Math.cos(angle)*p.radius,25+Math.sin(angle)*p.height,55*Math.sin(angle+p.seed*.3)],[a*(1+p.seed%3),a*(p.seed%2?-2:3)+p.phase,a*(p.seed%3-1)+p.phase],.85);});
 items.push(...handItems(t,-1),...handItems(t,1),...ringSegments(t));
 return glitchLayers(items,t,variant).sort((a,b)=>a.z-b.z);
}
export function drawLivingLayer(c,item){if(!item.ring){drawMesh(c,item);return;}c.save();const project=v=>[960+v[0]*900/(900-v[2]),500+v[1]*900/(900-v[2])];c.strokeStyle=item.color;c.globalAlpha=item.z<0?.52:.94;c.lineWidth=item.bright?2.6:1.5;c.shadowColor=item.color;c.shadowBlur=item.bright?8:3;c.beginPath();c.moveTo(...project(item.points[0]));c.lineTo(...project(item.points[1]));c.stroke();c.restore();}

export function drawLivingHeart(c,t){const a=t/12*TAU,pulse=1+.07*Math.sin(a*3);c.save();c.translate(960,500);c.scale(pulse,pulse);c.globalCompositeOperation='lighter';const halo=c.createRadialGradient(0,0,0,0,0,42);halo.addColorStop(0,'rgba(255,243,193,.9)');halo.addColorStop(.22,'rgba(255,193,65,.7)');halo.addColorStop(.5,'rgba(255,134,45,.16)');halo.addColorStop(1,'rgba(255,155,35,0)');c.fillStyle=halo;c.fillRect(-42,-42,84,84);const core=c.createRadialGradient(-3,-4,1,0,0,13);core.addColorStop(0,'#ffffee');core.addColorStop(.3,'#fff5ac');core.addColorStop(.75,'#ffb938');core.addColorStop(1,'rgba(255,131,37,.1)');c.fillStyle=core;c.beginPath();c.arc(0,0,13,0,TAU);c.fill();
 for(let k=0;k<5;k++){c.save();c.rotate(a*(k%2?1:-1)+k);c.strokeStyle=k%2?'rgba(255,248,203,.75)':'rgba(255,171,54,.65)';c.lineWidth=.8;c.beginPath();c.ellipse(0,0,15+k,5+k*.7,0,0,TAU);c.stroke();c.restore();}c.restore();}

// Three arrangements share the same parts and fixed wing anchors.
export const bodyVersions=[
 {name:'Echo',description:'A near-aligned body with soft cyan and violet echoes.',offset:7,spread:1,opacity:.48,beat:3},
 {name:'Fracture',description:'More separated body sections with sharper sideways slips.',offset:14,spread:1.15,opacity:.42,beat:5},
 {name:'Phase',description:'A faint body that returns in waves with layered rainbow afterimages.',offset:10,spread:.94,opacity:.31,beat:2}
];
const bodyDefinitions=[
 // Separate shoulder, chest and rib fragments surround the open heart.
 [-48,-77,42,24,9], [48,-77,42,24,9],[-30,-48,48,22,10],[30,-48,48,22,10],
 [-48,-10,36,13,7],[48,-10,36,13,7],[-41,27,32,12,7],[41,27,32,12,7],
 [-26,67,30,14,7],[26,67,30,14,7],[-69,-32,48,13,9],[69,-32,48,13,9],
 [-80,35,43,12,8],[80,35,43,12,8],
 // Large gaps remain in the pelvis and legs; these are disconnected remnants.
 [-26,105,28,16,8],[26,105,28,16,8],[-37,151,45,15,9],
 [-40,243,43,13,8],[40,224,38,13,8],[-43,281,29,18,8],[43,266,29,18,8]
].map(([x,y,length,width,depth],i)=>({mesh:makeShard(300+i,length,width,depth),x,y,i}));
function bodyItems(t,version){const a=t/12*TAU,cfg=bodyVersions[version];return bodyDefinitions.map(p=>{
 const wave=.5+.5*Math.sin(a*cfg.beat+p.i*.7),drop=(Math.floor(t*8)+p.i*5)%29<4,hip=p.i===14||p.i===15;
 const alpha=hip?(wave>.93?.18:0):cfg.opacity*(drop?.08:.35+.65*wave);
 return{...meshItem(p.mesh,[p.x*cfg.spread+7*Math.sin(a*2+p.i),p.y+5*Math.cos(a*3+p.i),-12+15*Math.sin(a+p.i)], [.16*Math.sin(a*2+p.i),.35*Math.sin(a+p.i),.14*Math.sin(a*3+p.i)],alpha),body:true};
 });}
function glitchLayers(items,t,version){const a=t/12*TAU,cfg=bodyVersions[version],dx=3*Math.sin(a*2)+2*Math.sin(a*5),dy=2*Math.cos(a*3),out=[];
 for(const original of items){if(original.anchored){out.push(original);continue;}
 if(original.ring){const points=original.points.map(p=>[p[0]+dx,p[1]+dy,p[2]]);out.push({...original,points});continue;}
 const item={...original,center:[original.center[0]+dx,original.center[1]+dy,original.center[2]]};
 if(item.body){const phase=Math.sin(a*cfg.beat+item.center[1]*.031),slip=cfg.offset*phase;item.center=[item.center[0]+slip*.35,item.center[1],item.center[2]];
 for(const side of [-1,1]){const alpha=item.alpha*(version===2?.36:.24)*(.5+.5*Math.sin(a*4+side+item.center[1]*.02));out.push({...item,mesh:{...item.mesh,color:side<0?[127,239,255]:[239,157,255]},center:[item.center[0]+side*cfg.offset+slip,item.center[1]+side*2,item.center[2]-2],alpha,z:item.z-2});}
 }
 out.push(item);
 }return out;}
