shader_type canvas_item;
// Stable source-pixel stains adapted from the legacy apply_dirt_tint procedure.
uniform float condition_desaturation : hint_range(0, 1) = 0.0;
uniform float condition_alpha : hint_range(0.5, 1) = 1.0;
uniform int dirt_level : hint_range(0, 10) = 0;

// Original condition effects deform the actual character before dirt/care tinting.
uniform int original_chronic_mode = 0; // 1 Chronofrost, 2 unfinished outline, 3 misrestore.
uniform float original_floor_fracture = 0.0;
uniform float original_clock = 0.0;
uniform sampler2D original_past_near : filter_nearest;
uniform sampler2D original_past_middle : filter_nearest;
uniform sampler2D original_past_far : filter_nearest;
varying vec4 original_vertex_color;
void vertex() { original_vertex_color=COLOR; }
float original_hash(vec2 p) { return fract(sin(dot(p,vec2(43.71,91.13)))*17341.317); }

int round_even(float number) {
	int lower = int(floor(number));
	float fraction = number - float(lower);
	return lower + ((fraction > 0.5 || (fraction == 0.5 && lower % 2 == 1)) ? 1 : 0);
}
bool inside(ivec2 point, ivec2 origin, ivec2 extent) {
	return all(greaterThanEqual(point, origin)) && all(lessThan(point, origin + extent));
}
void fragment() {
	vec2 body_uv=UV;
	if(original_floor_fracture>0.0) {
		float column=floor(UV.x*6.0);
		float step_height=(mod(column,3.0)-1.0)*.018;
		float settling=.45+.55*(.5+.5*sin(original_clock*.95+column*.7));
		body_uv.y+=step_height*settling*min(original_floor_fracture,2.0)*smoothstep(.42,.56,UV.y);
		COLOR=texture(TEXTURE,body_uv)*original_vertex_color;
		float seam_y=.70+(mod(column,3.0)-1.0)*.018;
		float seam=(1.0-smoothstep(.003,.009,abs(UV.y-seam_y)))*COLOR.a;
		COLOR.rgb=mix(COLOR.rgb,vec3(.48,.28,.29),seam*.42);
	}
	if(original_chronic_mode==1) {
		// Different bands retain actual earlier poses, with layered ice at their joins.
		float band=mod(floor(UV.y*7.0),3.0);
		vec4 old_frame=band<1.0?texture(original_past_near,body_uv):(band<2.0?texture(original_past_middle,body_uv):texture(original_past_far,body_uv));
		float frost_region=smoothstep(.22,.32,UV.y)*(1.0-smoothstep(.80,.88,UV.y));
		COLOR.rgb=mix(COLOR.rgb,old_frame.rgb*original_vertex_color.rgb,frost_region*.80*old_frame.a);
		float join=1.0-smoothstep(.018,.075,abs(fract(UV.y*7.0)-.5));
		float grain=step(.84,original_hash(floor(UV*120.0)));
		COLOR.rgb=mix(COLOR.rgb,vec3(.74,.91,.97),frost_region*(.15+join*.30+grain*.18));
	}
	if(original_chronic_mode==2) {
		// Real edge sections disappear; pale construction strokes attempt to finish them.
		vec2 pixel=TEXTURE_PIXEL_SIZE*2.0;
		float neighbor=min(min(texture(TEXTURE,UV+vec2(pixel.x,0)).a,texture(TEXTURE,UV-vec2(pixel.x,0)).a),min(texture(TEXTURE,UV+vec2(0,pixel.y)).a,texture(TEXTURE,UV-vec2(0,pixel.y)).a));
		float edge=COLOR.a*(1.0-neighbor);
		float sector=floor(UV.y*8.0)+floor(UV.x*6.0);
		float missing=step(.5,mod(sector,3.0));
		float draw_phase=.5+.5*sin(original_clock*.85-sector*.7);
		float dash=step(.48,fract((UV.x+UV.y)*38.0-draw_phase*.65));
		COLOR.rgb=mix(COLOR.rgb,vec3(.91,.84,.61),edge*missing*dash);
		COLOR.a*=1.0-edge*missing*(1.0-dash*.75)*.85;
	}
	if(original_chronic_mode==3) {
		// Small selected cells reconstruct from the wrong part of this character.
		vec2 cell=floor(UV*vec2(7.0,6.0));
		float selected=step(.67,original_hash(cell));
		float cycle=fract(original_clock/7.0+original_hash(cell)*.35);
		float attempt=sin(cycle*3.14159265); attempt*=attempt;
		vec2 offset=vec2((mod(cell.x,2.0)-.5)*.24,(mod(cell.y,2.0)-.5)*.16);
		vec4 wrong=texture(TEXTURE,clamp(body_uv+offset,vec2(.01),vec2(.99)));
		float region=selected*smoothstep(.22,.30,UV.y)*(1.0-smoothstep(.78,.86,UV.y));
		vec3 replacement=mix(wrong.rgb,vec3(.72,.42,.62),.20);
		COLOR.rgb=mix(COLOR.rgb,replacement*original_vertex_color.rgb,region*attempt*.85);
		vec2 grid=fract(UV*vec2(7.0,6.0));
		float border=step(.92,max(grid.x,grid.y));
		COLOR.rgb=mix(COLOR.rgb,vec3(.94,.70,.57),border*region*attempt*.40);
	}

	if (dirt_level > 0) {
		float ratio = float(dirt_level) / 10.0;
		vec3 tint = vec3(150.0, 96.0, 48.0);
		vec3 multiplier = vec3(
			float(round_even(255.0 + (tint.r - 255.0) * ratio * 0.2)),
			float(round_even(255.0 + (tint.g - 255.0) * ratio * 0.2)),
			float(round_even(255.0 + (tint.b - 255.0) * ratio * 0.2))) / 255.0;
		COLOR.rgb *= multiplier;
		// Preserve the source alpha, including soft edges and transparent padding.
		if (texture(TEXTURE, UV).a > 127.0 / 255.0) {
			ivec2 dimensions = ivec2(round(1.0 / TEXTURE_PIXEL_SIZE));
			ivec2 pixel = ivec2(floor(UV * vec2(dimensions)));
			int unit = max(1, round_even(float(min(dimensions.x, dimensions.y)) / 24.0));
			int spacing = max(2, unit * 2);
			ivec2 grid = (pixel + ivec2(unit)) / spacing;
			vec4 stain = vec4(0.0);
			// Nearby earlier patches can extend into this pixel. Later draws win.
			for (int row = -2; row <= 0; row++) {
				for (int column = -2; column <= 0; column++) {
					int x = grid.x + column;
					int y = grid.y + row;
					ivec2 origin = ivec2(x, y) * spacing - ivec2(unit);
					if (x < 0 || y < 0 || origin.x >= dimensions.x || origin.y >= dimensions.y) { continue; }
					int pattern = (x * 73 + y * 151 + x * y * 29 + 97) & 255;
					pattern = pattern ^ ((pattern << 3) & 255);
					if (pattern > int(255.0 * (0.16 + 0.54 * ratio))) { continue; }
					int variation = (x * 47 + y * 89 + x * y * 13 + 41) & 255;
					vec3 brown = vec3(92.0, 54.0, 26.0);
					if (variation % 4 == 1) { brown = vec3(122.0, 73.0, 32.0); }
					if (variation % 4 == 2) { brown = vec3(155.0, 96.0, 44.0); }
					if (variation % 4 == 3) { brown = vec3(105.0, 64.0, 42.0); }
					float alpha = floor(float(90 + variation % 145) * (0.30 + 0.70 * pow(ratio, 0.7)));
					ivec2 extent = ivec2(unit + (variation / 7) % (unit + 1), unit + (variation / 17) % (unit + 1));
					ivec2 corner = origin + ivec2(variation % unit, (variation / 3) % unit);
					if (inside(pixel, corner, extent)) { stain = vec4(brown / 255.0, alpha / 255.0); }
					ivec2 extra = corner + ivec2(extent.x / 2, extent.y - 1);
					if (variation % 3 != 0 && inside(pixel, extra, ivec2(max(1, extent.x - 1), unit))) {
						stain = vec4(brown / 255.0, max(1.0, floor(alpha * 0.78)) / 255.0);
					}
				}
			}
			COLOR.rgb = mix(COLOR.rgb, stain.rgb, stain.a);
		}
	}
	float gray = dot(COLOR.rgb, vec3(0.299, 0.587, 0.114));
	COLOR.rgb = mix(COLOR.rgb, vec3(gray), condition_desaturation);
	COLOR.a *= condition_alpha;
}
