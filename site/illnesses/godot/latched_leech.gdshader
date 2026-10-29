shader_type canvas_item;
render_mode unshaded;
uniform float clock = 0.0;
uniform bool reduced_motion = false;
void fragment() {
 // The suction disc at x=.19 stays fixed. Bending increases toward the free tail.
 float free_end=clamp((UV.x-.23)/.64,0.0,1.0);
 float bend=reduced_motion?0.0:(sin(clock*1.35-free_end*5.0)*.105+sin(clock*.675-free_end*3.0)*.025)*pow(free_end,1.4);
 vec2 source_uv=UV+vec2(0.0,bend);
 vec4 body=texture(TEXTURE,source_uv);
 float luminance=dot(body.rgb,vec3(.299,.587,.114));
 body.rgb=mix(vec3(luminance),body.rgb,.72);
 // Quiet travelling fluid pulse; no flashing or whole-sprite scale changes.
 float pulse=reduced_motion?0.0:pow(.5+.5*sin(clock*1.35-source_uv.x*9.0),5.0)*.045;
 body.rgb+=vec3(pulse,pulse*.58,0.0);
 COLOR=body;
}
