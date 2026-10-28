// Restore the original painted surfaces, using their irregular alpha masks.
// These layers supplement the independently modelled shards and jointed hands.
const TAU=Math.PI*2;
const loadImage=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
export async function loadArtwork(){const [source,manifest]=await Promise.all([loadImage('../chapel-motion/aru-chapel-character.png'),fetch('../chapel-motion/parts.json').then(r=>r.json())]);
 const selected=manifest.parts.filter(p=>['head','wing','body'].includes(p.role)||['fragment-3','fragment-5','fragment-8','fragment-9','fragment-10','fragment-13','fragment-14'].includes(p.id)||p.id.startsWith('arm-'));
 return selected.map(p=>{const [x,y,w,h]=p.bounds,sprite=document.createElement('canvas');sprite.width=w;sprite.height=h;const c=sprite.getContext('2d');c.beginPath();for(const [yy,xx,n]of p.runs)c.rect(xx,yy,n,1);c.clip();c.drawImage(source,x,y,w,h,0,0,w,h);return{...p,sprite};});
}
export function artworkLayers(art,t,variant,mix={body:"painted",head:"painted",wings:"painted",hands:"mixed"}){const a=t/12*TAU,out=[],wings=art.filter(p=>p.role==='wing'),spread=[1,1.12,.96][variant],strength=[.82,.7,.58][variant];
 // Eight recognizable painted wing remnants hover around the same anchor points.
 for(let w=0;w<(["painted","mixed"].includes(mix.wings)?8:0);w++){const p=wings[w%wings.length],theta=w*TAU/8-Math.PI/2,cycle=(t+w*1.713)%[3,4,2,6][w%4],burst=cycle<.75?Math.sin(cycle/.75*Math.PI):0;
 if(burst<.02)continue;const sourceAngle=Math.atan2(p.center[1]-620,p.center[0]-570);
 out.push({part:p,x:960+Math.cos(theta)*172+3*Math.sin(a*2+w),y:500+Math.sin(theta)*172+4*Math.cos(a*2+w),z:-65,angle:theta-sourceAngle+.018*Math.sin(a*2+w),tilt:.16*Math.sin(a+w),scale:.48,alpha:burst*.88,wing:true});}
 for(const [i,p]of art.filter(p=>p.role!=='wing').entries()){const category=p.role==='head'?'head':p.id.startsWith('arm-')?'hands':'body';if(!['painted','mixed'].includes(mix[category]))continue;const head=p.role==='head',phase=a*[3,5,2][variant]+i*.63,visibility=.5+.5*Math.sin(phase),blink=((Math.floor(t*10)+i*7)%41)<3;
 let x=960+(p.center[0]-570)*.40*spread,y=500+(p.center[1]-620)*.40;
 // The head returns clearly, then becomes a faint offset echo rather than vanishing permanently.
 if(head){x=960;y=363;}x+=4*Math.sin(a*2+i)+[5,11,8][variant]*Math.sin(phase);y+=3*Math.cos(a*3+i);
 const pose={part:p,x,y,z:head?12:-16+8*Math.sin(a+i),angle:head?.07*Math.sin(a*2):.055*Math.sin(a*2+i),tilt:head?.5*Math.sin(a):.32*Math.sin(a*(i%2?1:2)+i),scale:head?.48:.40,alpha:(blink?.09:strength*(.35+.65*visibility))};
 for(const side of [-1,1])out.push({...pose,x:x+side*[7,13,10][variant],y:y+side*1.5,alpha:pose.alpha*.19,z:pose.z-2,echo:true});out.push(pose);
 }return out;
}
export function drawArtwork(c,p){c.save();c.globalAlpha=p.alpha;c.translate(p.x,p.y);c.rotate(p.angle);
 // Perspective compression, a slight shear, and a light-catching edge give the
 // painted surfaces depth without replacing their feather and filigree detail.
 c.transform(Math.cos(p.tilt),Math.sin(p.tilt)*.09,Math.sin(p.tilt)*.14,1,0,0);c.scale(p.scale,p.scale);
 if(p.echo){c.globalCompositeOperation='screen';}
 const w=p.part.sprite.width,h=p.part.sprite.height;
 c.shadowColor=p.wing?'rgba(174,219,255,.65)':'rgba(255,210,142,.5)';c.shadowBlur=p.wing?9:4;
 c.drawImage(p.part.sprite,-w/2,-h/2);c.restore();}
