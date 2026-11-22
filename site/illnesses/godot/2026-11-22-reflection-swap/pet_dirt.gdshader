shader_type canvas_item;
// Stable source-pixel stains adapted from the legacy apply_dirt_tint procedure.
uniform float condition_desaturation : hint_range(0, 1) = 0.0;
uniform float condition_alpha : hint_range(0.5, 1) = 1.0;
uniform int dirt_level : hint_range(0, 10) = 0;

// Original condition effects deform the actual character before dirt/care tinting.
uniform int original_chronic_mode = 0; // 1 Chronofrost, 2 unfinished outline, 3 misrestore.
uniform float original_floor_fracture = 0.0;
uniform float original_dissonance = 0.0;
uniform float original_tide = 0.0;
uniform float original_tide_clock = 0.0;
uniform vec2 original_tide_span = vec2(-.38,1.76);
uniform float original_tide_amplitude = .08;
uniform bool original_tide_flip = false;
uniform bool original_scanner = false;
uniform bool original_palette_remap = false;
uniform float original_reply_visibility = 1.0;
uniform vec4 original_head_region = vec4(0.0,0.0,1.0,1.0);
uniform float original_clock = 0.0;
uniform sampler2D original_past_near : filter_nearest;
uniform sampler2D original_past_middle : filter_nearest;
uniform sampler2D original_past_far : filter_nearest;
// Shared body choreography for the eight reviewed disease presentations.
uniform vec3 review_signal_rings = vec3(-1.0);
uniform bool review_door_active = false;
uniform float review_door_phase = 0.0;
uniform float review_door_stride = 0.0;
uniform vec2 review_door_limits = vec2(-.18,1.18);
uniform vec3 review_moon_droop = vec3(0.0);
uniform vec3 review_dawn = vec3(0.0);
uniform vec2 review_shear = vec2(0.0);
uniform vec4 review_gravity = vec4(0.0);
uniform vec2 review_folds = vec2(0.0);
uniform vec4 review_body_region = vec4(0.0,0.0,1.0,1.0);
uniform vec4 review_frame_region = vec4(0.0,0.0,1.0,1.0);
uniform vec2 review_canvas_size = vec2(160.0);
uniform float review_padding = 0.0;
uniform bool review_deforming = false;
uniform bool review_flip = false;
// Follow-up: body seasons, footing, local discharge, terrain abrasion and mixed weather.
uniform vec4 follow_season = vec4(0.0);
uniform vec4 follow_slip = vec4(0.0);
uniform vec2 follow_storm = vec2(0.0);
uniform float follow_scar = 0.0;
uniform float follow_reflection = 0.0;
uniform float follow_clock = 0.0;
uniform vec3 follow_mismatch = vec3(0.0);
varying vec4 original_vertex_color;
void vertex() {
	original_vertex_color=COLOR;
	if(review_padding>0.0) {
		VERTEX=(VERTEX-review_canvas_size*.5)*(1.0+2.0*review_padding)+review_canvas_size*.5;
		vec2 frame_uv=(UV-review_frame_region.xy)/review_frame_region.zw;
		UV=review_frame_region.xy+((frame_uv-.5)*(1.0+2.0*review_padding)+.5)*review_frame_region.zw;
	}
}
float original_hash(vec2 p) { return fract(sin(dot(p,vec2(43.71,91.13)))*17341.317); }

vec2 follow_target(int index) {
	return index==0?vec2(.50,.06):(index==1?vec2(.08,.58):vec2(.88,.82));
}
vec2 follow_scar_center(int index) {
	if(index==0) { return vec2(.28,.43); }
	if(index==1) { return vec2(.69,.66); }
	if(index==2) { return vec2(.35,.83); }
	if(index==3) { return vec2(.72,.33); }
	return vec2(.49,.57);
}
float follow_frost(vec2 p) {
	// Branching ice ridges; source coordinates keep the frost attached to the skin.
	float branches=abs(sin(p.x*42.0+p.y*18.0+sin(p.y*25.0)*2.0));
	float cross=abs(sin(p.y*49.0-p.x*21.0));
	return max(1.0-smoothstep(.10,.28,branches),.55*(1.0-smoothstep(.05,.15,cross)));
}
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
	float review_mask=1.0;
	float fold_shade=1.0;
	if(review_deforming) {
		vec2 part=(body_uv-review_body_region.xy)/review_body_region.zw;
		if(review_flip) { part.x=1.0-part.x; }
		// Follow-up symptoms attach to source-side limbs, including mirrored characters.
		if(review_flip) { part.x=1.0-part.x; }
		if(follow_slip.x>0.0) {
			vec2 offset=part-vec2(.5,.94);
			float tilt=follow_slip.x;
			offset=mat2(vec2(cos(tilt),-sin(tilt)),vec2(sin(tilt),cos(tilt)))*offset;
			offset.y/=1.0-follow_slip.y;
			offset.x/=1.0+follow_slip.y*.30;
			part=offset+vec2(.5,.94);
			part.x-=follow_slip.z*smoothstep(.76,.94,part.y)*smoothstep(.40,.65,part.x);
		}
		if(follow_mismatch.x>0.0) {
			float hot=smoothstep(.47,.72,part.x);
			float wilt=follow_mismatch.z*hot;
			part.y=1.0-(1.0-part.y)/(1.0-wilt);
			part.x-=wilt*.22*(1.0-part.y);
		}
		if(follow_storm.x>0.0) {
			float discharge=smoothstep(.64,.74,follow_storm.y)*(1.0-smoothstep(.84,.98,follow_storm.y));
			for(int limb=0;limb<3;limb++) {
				if(float(limb)>=follow_storm.x) { break; }
				vec2 target=follow_target(limb);
				float local=1.0-smoothstep(.08,.28,length(part-target));
				part+=(target-vec2(.5,.58))*.042*local*discharge*sin(follow_storm.y*37.6991118);
			}
		}
		if(review_flip) { part.x=1.0-part.x; }
		if(review_door_active) {
			// Wrap the drawn body across the linked door mouths; gameplay position never moves.
			float corridor=max(.1,review_door_limits.y-review_door_limits.x);
			if(part.x<review_door_limits.x || part.x>review_door_limits.y) { review_mask=0.0; }
			float direction=review_flip?-1.0:1.0;
			part.x=.5+mod(part.x-.5-direction*review_door_phase*corridor+corridor*.5,corridor)-corridor*.5;
			// A small alternating foot stride reads as walking without changing the current action.
			float foot=part.x<.5?0.0:3.14159265;
			part.y+=sin(review_door_stride+foot)*.040*smoothstep(.68,.88,part.y);
			part.y+=abs(sin(review_door_stride))*.012;
		}
		if(length(review_moon_droop)>0.0) {
			float column=clamp(part.x,0.0,1.0)*2.0;
			float droop=column<1.0?mix(review_moon_droop.x,review_moon_droop.y,column):mix(review_moon_droop.y,review_moon_droop.z,column-1.0);
			part.y=1.0-(1.0-part.y)/max(.5,1.0-droop);
		}
		if(review_shear.x>0.0) {
			bool top=part.y<.52;
			part.x+=top?review_shear.x:-review_shear.x;
			part.y+=top?review_shear.y:-review_shear.y;
			float join=.52+(mod(floor(part.x*9.0),2.0)-.5)*.045;
			if((top && part.y>join) || (!top && part.y<join)) { review_mask=0.0; }
			fold_shade+=.20*(1.0-smoothstep(.005,.020,abs(part.y-join)));
		}
		if(length(review_gravity)>0.0) {
			vec2 offset=part-.5;
			float total=max(abs(offset.x)+abs(offset.y),.001);
			float horizontal=pow(abs(offset.x)/total,2.0);
			float vertical=pow(abs(offset.y)/total,2.0);
			float x_pull=offset.x<0.0?review_gravity.x:review_gravity.y;
			float y_pull=offset.y<0.0?review_gravity.z:review_gravity.w;
			part=.5+offset/vec2(1.0+x_pull*horizontal,1.0+y_pull*vertical);
		}
		if(review_folds.x>0.0) {
			part.x=.5+(part.x-.5)/(1.0-review_folds.x);
			float pleat=fract(part.x*review_folds.y);
			float ridge=1.0-abs(pleat*2.0-1.0);
			part.y+=(ridge-.5)*review_folds.x*.20;
			fold_shade*=1.0-review_folds.x*(pleat<.5?.65:.18);
			fold_shade+=review_folds.x*.35*(1.0-smoothstep(.02,.10,abs(pleat-.5)));
		}
		if(review_flip) { part.x=1.0-part.x; }
		body_uv=review_body_region.xy+part*review_body_region.zw;
		COLOR=texture(TEXTURE,body_uv)*original_vertex_color;
		vec2 frame_uv=(body_uv-review_frame_region.xy)/review_frame_region.zw;
		if(any(lessThan(frame_uv,vec2(0.0))) || any(greaterThan(frame_uv,vec2(1.0)))) { COLOR.a=0.0; }
	}

	if(original_dissonance>0.0) {
		float head_y=(UV.y-original_head_region.y)/max(original_head_region.w,.001);
		// A pronounced side-to-side wave, tapering to exactly zero at the quarter line.
		float head_weight=1.0-smoothstep(.17,.25,head_y);
		float amplitude=original_head_region.z*(.060+.025*original_dissonance);
		body_uv.x+=sin(original_clock*2.0943951+head_y*8.0)*amplitude*head_weight;
		COLOR=texture(TEXTURE,body_uv)*original_vertex_color;
		if(body_uv.x<0.0 || body_uv.x>1.0) { COLOR.a=0.0; }
	}
	if(original_tide>0.0) {
		float screen_x=original_tide_flip?1.0-UV.x:UV.x;
		float fraction=(screen_x-original_tide_span.x)/max(original_tide_span.y,.001);
		float phase=fraction*6.2831853*1.65-original_tide_clock*6.2831853/4.0;
		// Columns rise and fall with the water. Ease near canvas edges to retain antennae/feet.
		float room=smoothstep(0.0,.14,UV.y)*(1.0-smoothstep(.86,1.0,UV.y));
		body_uv.y-=sin(phase)*original_tide_amplitude*room;
		COLOR=texture(TEXTURE,body_uv)*original_vertex_color;
		if(body_uv.y<0.0 || body_uv.y>1.0 || body_uv.x<0.0 || body_uv.x>1.0) { COLOR.a=0.0; }
	}
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

	vec2 review_local=(body_uv-review_body_region.xy)/review_body_region.zw;
	float heat=0.0;
	for(int pulse=0;pulse<3;pulse++) {
		float progress=review_signal_rings[pulse];
		if(progress>=0.0) {
			float distance_from_center=length((review_local-vec2(.5,.58))*vec2(1.0,.9));
			float ring=1.0-smoothstep(.025,.10,abs(distance_from_center-progress*.85));
			heat=max(heat,ring*sin(progress*3.14159265));
		}
	}
	COLOR.rgb=mix(COLOR.rgb,vec3(1.0,.32,.10),heat*.78);
	if(review_dawn.y>0.0) {
		float lit=smoothstep(review_dawn.x-.015,review_dawn.x+.015,review_local.y);
		float grain=step(review_dawn.z,original_hash(floor(review_local*35.0)));
		vec3 warm=mix(COLOR.rgb,vec3(1.0,.66,.24),.62);
		vec3 cool=COLOR.rgb*vec3(.64,.72,.96);
		COLOR.rgb=mix(COLOR.rgb,mix(cool,warm,lit),review_dawn.y*grain);
	}


	// Surface patterns are calculated in the original body coordinates after deformation.
	vec2 follow_local=review_local;
	if(follow_season.w>0.0) {
		float cover=(1.0-smoothstep(follow_season.w-.08,follow_season.w+.08,abs(follow_local.x-.5)*1.5))*follow_season.z;
		float stem=1.0-smoothstep(.012,.027,abs(sin(follow_local.y*9.0)*.08+follow_local.x-.5));
		float frost=follow_frost(follow_local);
		vec3 seasonal=vec3(.30,.68,.19);
		float mix_amount=.28+stem*.55;
		if(follow_season.x>.5 && follow_season.x<1.5) {
			seasonal=mix(vec3(.42,.69,.85),vec3(.88,.98,1.0),frost);
			mix_amount=.60+frost*.26;
		} else if(follow_season.x>1.5 && follow_season.x<2.5) {
			seasonal=mix(vec3(.66,.25,.10),vec3(.97,.60,.18),.5+.5*sin(follow_local.y*26.0+follow_local.x*18.0));
			mix_amount=.50;
		} else if(follow_season.x>2.5) {
			seasonal=mix(vec3(.40,.30,.17),vec3(.76,.60,.30),frost);
			mix_amount=.54;
		}
		COLOR.rgb=mix(COLOR.rgb,seasonal,cover*mix_amount);
	}
	if(follow_storm.x>0.0) {
		float veins=0.0;
		float charge=0.0;
		vec2 torso=vec2(.5,.58);
		for(int limb=0;limb<3;limb++) {
			if(float(limb)>=follow_storm.x) { break; }
			vec2 path=follow_target(limb)-torso;
			float progress=clamp(dot(follow_local-torso,path)/dot(path,path),0.0,1.0);
			vec2 normal=normalize(vec2(-path.y,path.x));
			float bend=sin(progress*31.0+float(limb))*sin(progress*3.14159265)*.025;
			float distance_to_vein=length(follow_local-(torso+path*progress+normal*bend));
			float vein=1.0-smoothstep(.008,.024,distance_to_vein);
			veins=max(veins,vein);
			float travel=clamp((follow_storm.y-.08)/.60,0.0,1.0);
			float pulse=1.0-smoothstep(.06,.22,abs(progress-travel));
			float active=smoothstep(0.0,.10,follow_storm.y)*(1.0-smoothstep(.85,1.0,follow_storm.y));
			charge=max(charge,pulse*vein*active);
		}
		COLOR.rgb=mix(COLOR.rgb,vec3(.23,.39,.77),veins*.70);
		COLOR.rgb=mix(COLOR.rgb,vec3(.87,.98,1.0),charge*.95);
	}
	if(follow_scar>0.0) {
		for(int patch=0;patch<4;patch++) {
			if(float(patch)>=1.0+follow_scar) { break; }
			vec2 offset=follow_local-follow_scar_center(patch);
			float angle=atan(offset.y,offset.x);
			float radius=.08+follow_scar*.05;
			float jagged=1.0+.11*sin(angle*7.0+float(patch))+.08*sin(angle*13.0);
			float scrape=.5+.5*sin(follow_clock*6.2831853/12.0+float(patch)*1.3);
			float distance=length(offset*vec2(1.0,1.13))/(radius*jagged);
			float mask=1.0-smoothstep(.88,1.0,distance);
			float edge=smoothstep(.72,.88,distance)*mask;
			float contour=sin(follow_local.y*90.0+sin(follow_local.x*29.0)*3.0);
			float grain=original_hash(floor(follow_local*100.0));
			vec3 sand=mix(vec3(.64,.39,.20),vec3(.94,.76,.45),step(.0,contour));
			vec3 moss=mix(vec3(.19,.37,.28),vec3(.43,.64,.37),step(.55,grain));
			vec3 rock=mix(vec3(.34,.40,.52),vec3(.62,.65,.68),step(.4,contour));
			vec3 upper=patch%2==0?sand:moss;
			vec3 lower=patch%2==0?rock:sand;
			float reveal=smoothstep(scrape*.32-.18,scrape*.32-.14,offset.y);
			vec3 terrain=mix(upper,lower,reveal);
			COLOR.rgb=mix(COLOR.rgb,terrain,mask*.79);
			COLOR.rgb=mix(COLOR.rgb,vec3(.92,.73,.46),edge*(.42+scrape*.28));
		}
	}
	if(follow_mismatch.x>0.0) {
		float cold=1.0-smoothstep(.46,.52,follow_local.x);
		float hot=smoothstep(.48,.55,follow_local.x);
		float reach=1.0-smoothstep(follow_mismatch.x*.7,follow_mismatch.x*.7+.10,abs(follow_local.y-.57));
		float ice=follow_frost(follow_local);
		vec3 cold_color=mix(COLOR.rgb*vec3(.65,.85,1.1),vec3(.87,.98,1.0),.4+ice*.43);
		vec3 hot_color=mix(COLOR.rgb*vec3(1.1,.75,.46),vec3(.98,.43,.13),.40+follow_mismatch.y*.16);
		COLOR.rgb=mix(COLOR.rgb,cold_color,cold*reach*.90);
		COLOR.rgb=mix(COLOR.rgb,hot_color,hot*reach*.85);
	}

	if(original_palette_remap) {
		// A bijective color mapping: identical source RGB always gets identical new RGB.
		COLOR.rgb=vec3(1.0-COLOR.g,COLOR.b,1.0-COLOR.r);
	}
	if(original_scanner) {
		float scan_y=mix(-.12,1.12,fract(original_clock/3.8));
		float distance_to_line=abs(UV.y-scan_y);
		float core=1.0-smoothstep(.004,.012,distance_to_line);
		float halo=(1.0-smoothstep(.008,.045,distance_to_line))*.58;
		COLOR.rgb=mix(COLOR.rgb,vec3(1.0),max(core*.96,halo));
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
	// Other simultaneously active conditions may have resampled the body above.
	if(review_deforming) {
		vec2 final_frame=(body_uv-review_frame_region.xy)/review_frame_region.zw;
		if(any(lessThan(final_frame,vec2(0.0))) || any(greaterThan(final_frame,vec2(1.0)))) { COLOR.a=0.0; }
		COLOR.a*=review_mask;
		COLOR.rgb*=fold_shade;
	}
	float gray = dot(COLOR.rgb, vec3(0.299, 0.587, 0.114));
	COLOR.rgb = mix(COLOR.rgb, vec3(gray), condition_desaturation);
	COLOR.a *= condition_alpha * original_reply_visibility;
	if(follow_reflection>0.0) {
		// Deferred Reflection reverses visual substance: upright ghost, solid image below.
		COLOR.rgb*=vec3(.66,.88,1.0);
		float ripple=max(1.0-smoothstep(.004,.012,abs(review_local.y-.30)),1.0-smoothstep(.004,.012,abs(review_local.y-.70)));
		COLOR.rgb=mix(COLOR.rgb,vec3(.62,.88,1.0),ripple*.20);
		COLOR.a*=.78-.08*clamp(follow_reflection,1.0,3.0);
	}
}
