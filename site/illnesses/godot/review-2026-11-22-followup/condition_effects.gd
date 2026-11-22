class_name ConditionEffects
extends Control
## Shared care/activity renderer. All clocks here are presentation-only.
var allow_meep := false
var meep_floor_y := NAN
var companion_cycle = preload("res://scripts/game/meep_cycle.gd").new()
var meep_actor: TextureRect
var marks: Array[Dictionary] = []
var echoes: Array[Dictionary] = []
var echo_texture: Texture2D
var echo_flip := false
var phase_fragments = preload("res://scripts/game/condition_phase_fragments.gd").new()
var echo_variants = preload("res://scripts/game/condition_echo_variants.gd").new()
var visual_seconds := 0.0
var still := false
var last_identity := ""
var previous := {}
var improving_until := {}
var head_impact_until := 0
var infection_points := InfectionMarks.new()
var injury_edges := InjuryMark.new()
var head_anchor := ParasiteArt.new()
var surface_layers: Dictionary = {}
var surface_started: Dictionary = {}
var mite_paths := ConditionMitePaths.new()
var cause_art: EmoteArt
var coral_started := -1.0
var original_motifs: ConditionOriginalMotifs
var rear_leech: ConditionLatchedLeech
var leech_latch := Vector2.ZERO
var show_leech_latch := false
var body_deformations: Array[String] = []

func _init() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST

func _notification(what: int) -> void:
	if what == NOTIFICATION_PREDELETE:
		infection_points.free()
		injury_edges.free()
		head_anchor.free()
		if is_instance_valid(rear_leech): rear_leech.queue_free()

func refresh(state, pet: PetAnimation, action: String, reaction_active: bool, bounds: Rect2, reduced_motion: bool = true, presentation_seconds: float = -1.0) -> bool:
	if is_instance_valid(meep_actor): meep_actor.hide()
	body_deformations.clear()
	show_leech_latch = false
	if is_instance_valid(rear_leech): rear_leech.hide()
	for layer in surface_layers.values(): layer.hide()
	marks.clear()
	echoes.clear()
	echo_texture = pet.texture
	echo_flip = pet.flip_h
	visual_seconds = presentation_seconds if presentation_seconds >= 0 else Time.get_ticks_msec()/1000.0
	still = reduced_motion
	var now := Time.get_ticks_msec()
	var current := ConditionPresentation.snapshot(state)
	if last_identity != str(state.character_id):
		last_identity = str(state.character_id)
		surface_started.clear()
		coral_started = -1.0
		previous = current.duplicate()
		improving_until.clear()
		head_impact_until = 0
	for key in current:
		if current[key] > 0 and current[key] < previous.get(key,0.0): improving_until[key] = now+3000
		if current[key] > previous.get(key,0.0): improving_until.erase(key)
	if current.injury > 0 and previous.get("injury",0.0) == 0 and state.injury_care.injury_type == "head": head_impact_until = now+2000
	previous = current
	if current.infection <= 0: coral_started = -1.0
	if pet.texture == null:
		queue_redraw()
		return false
	if original_motifs == null:
		original_motifs = ConditionOriginalMotifs.new()
		add_child(original_motifs)
	original_motifs.prepare(pet,str(state.character_id),visual_seconds,still,bounds)
	if allow_meep and preload("res://scripts/game/meep_companion.gd").owns(str(state.character_id)):
		if meep_actor == null:
			meep_actor = load("res://scripts/game/meep_actor.gd").new()
			add_child(meep_actor)
		companion_cycle.elapsed = companion_cycle.ATTACHED+companion_cycle.VULNERABLE+1.0
		meep_actor.update_actor(pet,companion_cycle,bounds,visual_seconds,still,meep_floor_y,true)
	var entries := ConditionPresentation.entries(state)
	var scale_factor := maxf(.25,minf(pet.size.x,pet.size.y)/192.0)
	for entry in entries:
		var condition = ConditionPresentation.care(state,entry.key)
		var kind := ConditionKinds.get_kind(condition.specific_kind)
		var effect: String = str(kind.get("effect",""))
		var severity: float = entry.severity
		var width := (32.0 if severity <= 1 else 44.0 if severity <= 2 else 52.0)*scale_factor
		var improving: bool = improving_until.get(entry.key,0) > now or not ConditionPresentation.feedback(state,entry.key).is_empty()
		var alpha := .78 if improving else 1.0
		if effect == "meep":
			if not allow_meep: continue
			if meep_actor == null:
				meep_actor = load("res://scripts/game/meep_actor.gd").new()
				add_child(meep_actor)
			meep_actor.update_actor(pet,condition.meep_cycle,bounds,visual_seconds,still,meep_floor_y)
			continue
		if condition.specific_kind in ["trademark_006","trademark_011","trademark_016","trademark_041","trademark_058","trademark_062","trademark_095"]:
			body_deformations.append(condition.specific_kind)
			continue
		if condition.specific_kind == "phase_scarring":
			echoes.append_array(phase_fragments.waves(pet,severity,visual_seconds,still,alpha,bounds))
			continue
		if condition.specific_kind == "muscle_fatigue":
			_add_fatigue_drips(pet,severity,alpha,bounds)
			continue
		if condition.specific_kind == "echo_fright":
			echoes.append_array(echo_variants.fright(pet,severity,visual_seconds,still,alpha))
			continue
		if condition.specific_kind == "trademark_001":
			echoes.append_array(echo_variants.reply(pet,severity,visual_seconds,still,alpha))
			continue
		if effect == "echo":
			_add_echoes(pet,severity,alpha)
			continue
		if condition.specific_kind == "trademark_032" and pet.material is ShaderMaterial and pet.material.shader == DirtAppearance.SHADER:
			var body: Rect2 = original_motifs.signal_visuals.body
			var doors: Dictionary = preload("res://scripts/game/condition_rework_motion.gd").door_layout(body,bounds,scale_factor,severity)
			pet.material.set_shader_parameter("review_door_limits",(doors.mouths-Vector2.ONE*body.position.x)/maxf(1,body.size.x))
		if condition.specific_kind == "trademark_023" and pet.material is ShaderMaterial and pet.material.shader == DirtAppearance.SHADER:
			# Both water and body use the exact same screen-space wavelength, even near an edge.
			var span: Vector2 = original_motifs.tide_waves.span(original_motifs.signal_visuals.body,bounds)
			pet.material.set_shader_parameter("original_tide_span",Vector2((span.x-pet.position.x)/pet.size.x,(span.y-span.x)/pet.size.x))
			pet.material.set_shader_parameter("original_tide_amplitude",(18+severity*7)*scale_factor*.55/pet.size.y)
		original_motifs.signal_visuals.show_emote = action != "sleep" and not reaction_active
		if original_motifs.add_kind(condition.specific_kind,severity):
			if entry.key == "injury":
				if ConditionPresentation.feedback(state,"injury").get("bandaged",false):
					_add("injury_bandages",pet.position+pet.size*Vector2(.42,.67),width*.65,alpha,bounds)
				if head_impact_until > now and action != "sleep":
					_add("injury_bump",pet.position+Vector2(20,-25),width,1.0,bounds)
			continue
		var surface_mode := -1
		if condition.specific_kind == "bitrot" or (condition.specific_kind.is_empty() and entry.asset == "bitrot_patch"): surface_mode = 0
		if condition.specific_kind == "seam_bruise" or (condition.specific_kind.is_empty() and entry.asset == "injury_bruise"): surface_mode = 1
		if condition.specific_kind == "trademark_101": surface_mode = 2
		if condition.specific_kind == "trademark_074": surface_mode = 3
		if surface_mode >= 0:
			var surface_key: String = entry.key+"/"+str(surface_mode)
			if not surface_layers.has(surface_key):
				var layer := ConditionSurface.new()
				surface_layers[surface_key] = layer
				add_child(layer)
			if not surface_started.has(surface_key): surface_started[surface_key] = visual_seconds
			surface_layers[surface_key].update_surface(pet,surface_mode,severity,maxf(0,visual_seconds-float(surface_started[surface_key])),still,alpha,visual_seconds)
			if entry.key == "injury":
				if ConditionPresentation.feedback(state,"injury").get("bandaged",false):
					_add("injury_bandages",pet.position+pet.size*Vector2(.42,.67),width*.65,alpha,bounds)
				if head_impact_until > now and action != "sleep":
					_add("injury_bump",pet.position+Vector2(20,-25),width,1.0,bounds)
			continue
		if condition.specific_kind == "static_mites" or (condition.specific_kind.is_empty() and entry.asset == "static_mites"):
			var routes := mite_paths.routes_for_pet(pet)
			for index in range(mini(routes.size(),2+int(severity)*2)):
				var motion := ConditionMitePaths.sample(routes[index],0.0 if still else visual_seconds,index)
				var relative: Vector2 = motion.point
				if pet.flip_h: relative.x = 1.0-relative.x
				var center := pet.position+relative*pet.size
				var mite_width := 18.0*scale_factor
				marks.append({"id":"static_mite_single","rect":Rect2(center-Vector2.ONE*mite_width*.5,Vector2.ONE*mite_width),"alpha":alpha,"rotation":-motion.angle if pet.flip_h else motion.angle,"static":false,"phase":index*.137})
			continue
		if condition.specific_kind == "trademark_007":
			if not is_instance_valid(rear_leech):
				rear_leech = ConditionLatchedLeech.new()
				pet.get_parent().add_child(rear_leech)
				pet.get_parent().move_child(rear_leech,pet.get_index())
			rear_leech.update_leech(pet,visual_seconds,still,alpha)
			leech_latch = rear_leech.latch
			show_leech_latch = true
			continue
		if condition.specific_kind in ["trademark_025","trademark_030"]:
			infection_points._select(str(state.character_id))
			var body_points := infection_points._points_for(pet.texture)
			if condition.specific_kind == "trademark_025":
				var edges := injury_edges.edges_for(pet.texture,"holding")
				if edges.is_empty(): continue
				var edge := "left" if pet.flip_h else "right"
				var root_point := injury_edges._screen_point(edges,edge,pet)
				var outward := (root_point-(pet.position+pet.size*.5)).normalized()
				var rotation := outward.angle()+PI/2
				var dimensions := Vector2(48,64)*scale_factor
				original_motifs.add_attachment("reed",root_point,0,rotation)
				var center := root_point+Vector2(0,-dimensions.y*.37).rotated(rotation)
				marks.append({"id":"memory_reedling_v2","rect":Rect2(center-dimensions*.5,dimensions),"alpha":alpha,"rotation":rotation})
			else:
				var coral: bool = condition.specific_kind == "trademark_030"
				if coral_started < 0: coral_started = visual_seconds
				var growth := .75 if still else lerpf(.45,1.0,clampf((visual_seconds-coral_started)/45.0,0,1))
				var anchors := [Vector2(.32,.53),Vector2(.69,.60),Vector2(.46,.76)] if coral else [Vector2(.70,.65)]
				for index in range(mini(anchors.size(),int(severity)+1 if coral else 1)):
					var relative := mite_paths.body_anchor(pet.texture,anchors[index])
					if relative.x < 0: continue
					if pet.flip_h: relative.x = 1.0-relative.x
					var dimensions := (Vector2(32,32) if coral else Vector2(55,37))*scale_factor*growth
					original_motifs.add_attachment("coral",pet.position+relative*pet.size,index)
					marks.append({"id":"coral_polyp_branch" if coral else "pumpwire_leech_v2","rect":Rect2(pet.position+relative*pet.size-dimensions*.5,dimensions),"alpha":alpha,"phase":index*.29})
			continue
		if effect in ["orbit","flicker"]:
			for index in range(2 if severity <= 1 else 3):
				var angle := index*TAU/3.0+(0.0 if still else visual_seconds*.45)
				var center := pet.position+pet.size*Vector2(.5,.22)+Vector2(cos(angle)*pet.size.x*.55,sin(angle)*width*.5)
				_add(entry.asset,center,width*.58,alpha*(.8 if still else .7+.3*sin(visual_seconds*.8+index)),bounds)
				marks[-1]["rotation"] = 0.0 if still else visual_seconds*.45+index*TAU/3.0
				marks[-1]["static"] = true
			continue
		if effect == "heat":
			for index in range(2):
				var phase := .4 if still else fmod(visual_seconds*.25+index*.5,1.0)
				_add(entry.asset,pet.position+Vector2(pet.size.x*(.3+index*.4),pet.size.y*(.4-phase*.3)),width*.8,alpha*(1-phase*.45),bounds)
			continue
		if entry.key in ["stress","fatigue","digestive"]:
			var bob := 0.0 if still else sin(visual_seconds*1.5)*3*scale_factor
			_add(entry.asset,pet.position+Vector2(pet.size.x+width*.25,pet.size.y*(.4 if entry.key == "digestive" else .15)+bob),width,alpha,bounds)
			continue
		# Local condition marks remain visible while sleep/reactions own the head slot.
		if entry.key == "infection":
			infection_points._select(str(state.character_id))
			var points := infection_points._points_for(pet.texture)
			var count := mini(points.size(),2 if severity <= 1 else 4 if severity <= 2 else 6)
			for index in count:
				var point: Vector3 = points[index]
				var relative := Vector2(1-point.x if pet.flip_h else point.x,point.y)
				_add(entry.asset,pet.position+relative*pet.size,width*.48,alpha,bounds)
		elif entry.key == "parasites":
			var anchor := head_anchor.head_point(pet.texture,.06)
			if anchor.x >= 0:
				if pet.flip_h: anchor.x = 1-anchor.x
				_add(entry.asset,pet.position+anchor*pet.size+Vector2(0,-width*.4),width,alpha,bounds)
		elif entry.key == "injury":
			var points := injury_edges.edges_for(pet.texture,state.injury_care.injury_type)
			if not points.is_empty():
				var edge: String = InjuryMark.EDGES[state.injury_care.injury_type]
				if pet.flip_h and edge in ["left","right"]: edge = InjuryMark.OPPOSITE[edge]
				var rect := InjuryMark._outside(injury_edges._screen_point(points,edge,pet),edge,width,4*scale_factor)
				var art: String = "injury_bandages" if ConditionPresentation.feedback(state,"injury").get("bandaged",false) else entry.asset
				_add(art,rect.get_center(),width,alpha,bounds)
				if head_impact_until > now and action != "sleep":
					_add("injury_bump",pet.position+Vector2(20,-25),width,1.0,bounds)
		elif entry.key == "chronic":
			_add(entry.asset,pet.position+Vector2(-width*.5,pet.size.y*.55),width,alpha,bounds)
	var cause_emote := ""
	var cause_severity := 0.0
	if action != "sleep" and not reaction_active:
		for entry in entries:
			if not str(entry.emote).is_empty() and entry.severity > cause_severity:
				cause_emote = str(entry.emote)
				cause_severity = entry.severity
	if not cause_emote.is_empty():
		if cause_art == null: cause_art = EmoteArt.new()
		_add("emote:"+cause_emote,pet.position+Vector2(pet.size.x+20*scale_factor,-8*scale_factor),48*scale_factor,1,bounds)
	for key in surface_started.keys():
		if not surface_layers[key].visible: surface_started.erase(key)
	queue_redraw()
	return not cause_emote.is_empty()

func _add_fatigue_drips(pet: PetAnimation, severity: float, alpha: float, bounds: Rect2) -> void:
	# An offset head-level cluster falls onto the upper body, then repeats.
	var body: Rect2 = original_motifs.signal_visuals.body
	var scale_factor := maxf(.25,minf(pet.size.x,pet.size.y)/192.0)
	var side := -1.0 if pet.flip_h else 1.0
	var width := (38.0 + severity * 4.0) * scale_factor
	var origin := Vector2(body.get_center().x + side * body.size.x * .28, body.position.y - width * .12)
	var count := int(severity)
	for index in range(count):
		var phase := (index+.45)/count if still else fposmod(visual_seconds/1.8+float(index)/count,1.0)
		var point := origin + Vector2(side*sin(phase*PI)*3*scale_factor, phase*phase*body.size.y*.48)
		var fade := smoothstep(0,.08,phase)*(1.0-smoothstep(.72,1,phase))
		_add("fatigue_droplets",point,width,alpha*fade,bounds)
		marks[-1]["phase"] = index*.17

func _add_echoes(pet: PetAnimation, severity: float, alpha: float) -> void:
	# Three staggered expanding silhouettes: mild 3.6s, moderate 2.2s, severe 1.2s.
	var duration := 3.6 if severity <= 1 else 2.2 if severity <= 2 else 1.2
	for index in range(3):
		var phase := (index+.5)/3.0 if still else fposmod(visual_seconds/duration+index/3.0,1.0)
		var expansion := 1.0+phase*(.48+.12*severity)
		var dimensions := pet.size*expansion
		var center := pet.position+pet.size*.5
		echoes.append({"rect":Rect2(center-dimensions*.5,dimensions),"alpha":alpha*.42*sin(phase*PI)})

func _add(id: String, center: Vector2, width: float, alpha: float, bounds: Rect2) -> void:
	# Physical marks breathe gently; reduced motion freezes both geometry and frames.
	if not still: width *= 1.0+.035*sin(visual_seconds*1.4+float(id.hash()%11))
	width = minf(width,minf(bounds.size.x,bounds.size.y))
	var position := (center-Vector2.ONE*width/2).clamp(bounds.position,(bounds.end-Vector2.ONE*width).max(bounds.position))
	marks.append({"id":id,"rect":Rect2(position,Vector2.ONE*width),"alpha":alpha})

func _draw() -> void:
	if show_leech_latch and is_instance_valid(rear_leech):
		# The actual eye/sucker artwork overlaps the body, with the tail behind it.
		var eye: Rect2 = rear_leech.eye_rect
		draw_set_transform(eye.get_center(),0,Vector2(-1 if rear_leech.flip_h else 1,1))
		draw_texture_rect(rear_leech.eye_texture,Rect2(-eye.size*.5,eye.size),false,Color(.88,.90,.86,rear_leech.modulate.a))
		draw_set_transform(Vector2.ZERO)
	if echo_texture != null:
		for echo in echoes:
			if echo.has("fragments"):
				phase_fragments.draw_wave(self,echo_texture,echo)
				continue
			var rect: Rect2 = echo.rect
			draw_set_transform(rect.get_center(),0,Vector2(-1 if echo_flip else 1,1))
			draw_texture_rect(echo.get("texture",echo_texture),Rect2(-rect.size*.5,rect.size),false,echo.get("tint",Color(.72,.88,1.0,echo.alpha)))
			draw_set_transform(Vector2.ZERO)
	for mark in marks:
		var texture: Texture2D
		if str(mark.id).begins_with("emote:"):
			texture = cause_art.texture_for(str(mark.id).trim_prefix("emote:"),visual_seconds,still)
		else:
			texture = ConditionPresentation.texture(mark.id) if mark.get("static",false) else ConditionPresentation.animated_texture(mark.id,visual_seconds+float(mark.get("phase",0.0)),still)
		if texture != null:
			var rect: Rect2 = mark.rect
			draw_set_transform(rect.get_center(),float(mark.get("rotation",0.0)))
			draw_texture_rect(texture,Rect2(-rect.size*.5,rect.size),false,Color(1,1,1,mark.alpha))
			draw_set_transform(Vector2.ZERO)
