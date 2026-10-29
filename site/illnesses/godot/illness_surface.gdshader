shader_type canvas_item;
render_mode unshaded;
uniform int surface_kind = 0; // 0: Bitrot oxidation, 1: translucent bruise.
uniform float clock = 0.0;
uniform float spread : hint_range(0.0, 1.0) = 0.0;
uniform float severity : hint_range(0.0, 3.0) = 1.0;
uniform float opacity : hint_range(0.0, 1.0) = 1.0;
float grain(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) {
 vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(grain(i),grain(i+vec2(1,0)),f.x),mix(grain(i+vec2(0,1)),grain(i+vec2(1,1)),f.x),f.y);
}
void fragment() {
 vec4 body=texture(TEXTURE,UV);
 vec2 q=floor(UV*128.0)/128.0;
 float mottling=noise(q*35.0);
 float alpha=0.0;
 vec3 tint;
 if(surface_kind==0) {
  float a=length((q-vec2(.38,.56))*vec2(1.0,.85));
  float b=length((q-vec2(.64,.71))*vec2(.85,1.0));
  float c=length((q-vec2(.55,.33))*vec2(1.0,1.2));
  float distance=min(a,min(b+.025,c+.06));
  float edge=distance+noise(q*19.0)*.055+mottling*.018;
  float radius=.035+spread*.19+severity*.012;
  alpha=(1.0-smoothstep(radius-.008,radius+.008,edge))*(.30+.39*mottling);
  tint=mix(vec3(.22,.075,.025),vec3(.78,.33,.085),mottling);
  float flakes=step(.79,grain(floor(q*100.0)));
  tint=mix(tint,vec3(.90,.52,.16),flakes*.6);
 } else if(surface_kind==2) {
  // Living map contours grow from three centers; leaf pairs emerge on routes.
  float field=length((q-vec2(.43,.55))*vec2(1.1,.8));
  field+=.016*sin(q.y*35.0)+.012*sin(q.x*28.0)+.003*sin(clock*.22+q.y*8.0);
  float contour=1.0-smoothstep(.03,.10,abs(fract(field*30.0)-.5));
  float growth=1.0-smoothstep(.10+spread*.30,.13+spread*.30,field);
  vec2 leaf_cell=fract(q*vec2(15.0,12.0))-.5;
  float leaves=(1.0-smoothstep(.12,.25,length(leaf_cell*vec2(1.0,1.8))))*step(.55,noise(floor(q*vec2(15.0,12.0))*3.0));
  alpha=max(contour*.62,leaves*.75)*growth;
  tint=mix(vec3(.12,.40,.23),vec3(.59,.84,.31),leaves);
 } else if(surface_kind==3) {
  // Individual hinged threshold marks; interiors never resemble coral growth.
  alpha=0.0; tint=vec3(.0);
  for(int i=0;i<3;i++) {
   vec2 center=vec2(.35+float(i)*.15,.44+float(i%2)*.19);
   vec2 door=(q-center)/vec2(.08,.12);
   float open=.20+.70*(.5+.5*sin(clock*.8+float(i)*2.1));
   float inside=(1.0-step(open,abs(door.x)))*(1.0-step(1.0,abs(door.y)));
   float border=inside*max(step(open-.11,abs(door.x)),step(.88,abs(door.y)));
   float pattern=step(.5,fract((door.x+door.y)*3.0+float(i)*.25));
   vec3 hue=i==0?vec3(.92,.58,.20):(i==1?vec3(.30,.76,.95):vec3(.79,.32,.77));
   tint=mix(tint,mix(hue*.3,hue,pattern),inside);
   tint=mix(tint,vec3(.92,.85,.57),border);
   alpha=max(alpha,inside*.64+border*.24);
  }
 } else if(surface_kind==4) {
  // Jagged vein branches build hot spots then discharge along their own paths.
  float vein=0.0;
  for(int i=0;i<4;i++) {
   float start=.30+float(i)*.115;
   float zig=start+.032*sin(q.y*42.0+float(i)*2.0)+.012*sin(q.y*91.0);
   float line=1.0-smoothstep(.002,.008,abs(q.x-zig));
   line*=smoothstep(.25,.36,q.y)*(1.0-smoothstep(.72,.81,q.y));
   float pulse=pow(.5+.5*sin(clock*1.6-q.y*7.0+float(i)*1.3),3.0);
   vein=max(vein,line*(.22+.67*pulse));
  }
  tint=mix(vec3(.38,.40,.83),vec3(.83,.96,1.0),vein);
  alpha=vein;
 } else if(surface_kind==5) {
  // Historical mosaic seams scuff actual skin; translucent abrasion never floats.
  vec2 patch=(q-vec2(.5,.64))/vec2(.29,.16);
  float mask=1.0-smoothstep(.65,1.05,length(patch));
  vec2 tile=q*vec2(27.0,22.0);
  float row=floor(tile.y);
  tile.x+=mod(row,2.0)*.5;
  vec2 cell=fract(tile);
  float edge=min(min(cell.x,1.0-cell.x),min(cell.y,1.0-cell.y));
  float seam=1.0-smoothstep(.025,.12,edge);
  float rub=.5+.5*sin(clock*.65+row*.8);
  float scrape=step(.78,grain(floor(q*160.0)))*(.6+.4*rub);
  tint=mix(vec3(.38,.20,.18),vec3(.86,.58,.42),scrape);
  alpha=mask*(seam*.28+scrape*.32)*(.65+severity*.13);
 } else {
  vec2 center=vec2(.42,.67);
  float distance=length((q-center)/vec2(.20,.135));
  float feather=1.0-smoothstep(.24,.99,distance+(mottling-.5)*.24);
  float rim=smoothstep(.28,.88,distance);
  tint=mix(vec3(.28,.12,.38),vec3(.46,.32,.26),rim);
  // Slow capillary shading stays translucent and never flashes or moves off skin.
  alpha=feather*(.19+severity*.055)*(.78+.22*mottling)*(.94+.06*sin(clock*.35+distance*3.0));
 }
 COLOR=vec4(tint,alpha*body.a*opacity);
}
