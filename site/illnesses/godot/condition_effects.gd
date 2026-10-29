class_name ConditionEffects
extends Control
## Shared care/activity renderer. All clocks here are presentation-only.
var marks: Array[Dictionary] = []
var echoes: Array[Dictionary] = []
var echo_texture: Texture2D
var echo_flip := false
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
		if condition.specific_kind in ["trademark_041","trademark_058","trademark_062","trademark_095"]:
			body_deformations.append(condition.specific_kind)
			continue
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
		if condition.specific_kind == "trademark_065": surface_mode = 4
		if condition.specific_kind == "trademark_066": surface_mode = 5
		if surface_mode == 4:
			for index in range(3):
				var relative := mite_paths.body_anchor(pet.texture,Vector2(.35+index*.15,.45+index%2*.18))
				if relative.x < 0: continue
				if pet.flip_h: relative.x = 1.0-relative.x
				original_motifs.add_attachment("spark",pet.position+relative*pet.size,index)
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
				var anchor := mite_paths.body_anchor(pet.texture,Vector2(.74,.50))
				if anchor.x < 0: continue
				if pet.flip_h: anchor.x = 1.0-anchor.x
				var dimensions := Vector2(48,64)*scale_factor
				var root_point := pet.position+anchor*pet.size
				original_motifs.add_attachment("reed",root_point)
				marks.append({"id":"memory_reedling_v2","rect":Rect2(root_point-Vector2(dimensions.x*.5,dimensions.y*.87),dimensions),"alpha":alpha})
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
		if effect == "echo":
			var phase := 0.45 if still else fmod(visual_seconds/3.5,1.0)
			for index in range(3):
				var direction := Vector2.from_angle(index*TAU/3.0-PI/2)
				var offset := direction*(8.0+phase*20.0)*scale_factor*minf(severity,2)
				var target := Rect2(pet.position+offset,pet.size)
				target.position = target.position.clamp(bounds.position,(bounds.end-target.size).max(bounds.position))
				echoes.append({"rect":target,"alpha":.12 if still else .18*(1.0-phase)})
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
			var rect: Rect2 = echo.rect
			if echo_flip: rect.position.x += rect.size.x; rect.size.x = -rect.size.x
			draw_texture_rect(echo_texture,rect,false,Color(.45,.7,1.0,echo.alpha))
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
