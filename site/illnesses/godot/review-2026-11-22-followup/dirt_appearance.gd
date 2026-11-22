class_name DirtAppearance
extends RefCounted
## One lightweight material per pet; imported artwork is never changed.
const SHADER := preload("res://assets/shaders/pet_dirt.gdshader")
var material := ShaderMaterial.new()
var original_history := ConditionFrameHistory.new()
var head_regions: Dictionary = {}
var reviewed_material = preload("res://scripts/game/condition_rework_material.gd").new()

func _init() -> void:
	material.shader = SHADER

func apply(pet: PetAnimation, cleanliness: float, state = null, reduced_motion: bool = true, seconds: float = -1.0) -> void:
	pet.material = material
	material.set_shader_parameter("dirt_level",CleaningRun.dirt_level(cleanliness))

	var effect := ConditionCauses.visual(state,reduced_motion,Time.get_ticks_msec()/1000.0 if seconds < 0 else seconds)
	material.set_shader_parameter("condition_desaturation",effect.x)
	material.set_shader_parameter("condition_alpha",effect.y)
	_apply_original_conditions(pet,state,reduced_motion,seconds)

func _apply_original_conditions(pet: PetAnimation, state, reduced_motion: bool, seconds: float) -> void:
	var time := Time.get_ticks_msec()/1000.0 if seconds < 0 else seconds
	reviewed_material.apply(material,pet,state,time,reduced_motion)
	var chronic_mode := 0
	var fracture := 0.0
	var dissonance := 0.0
	var tide := 0.0
	var scanner := false
	var remap := false
	var reply_visibility := 1.0
	if state != null:
		if state.chronic_care.active():
			chronic_mode = {"trademark_041":1,"trademark_058":2,"trademark_062":3}.get(state.chronic_care.specific_kind,0)
		if state.injury_care.active() and state.injury_care.specific_kind == "trademark_095": fracture = state.injury_care.severity
		if state.stress_care.active() and state.stress_care.specific_kind == "trademark_006": dissonance = state.stress_care.severity
		if state.stress_care.active() and state.stress_care.specific_kind == "trademark_023": tide = state.stress_care.severity
		scanner = state.chronic_care.active() and state.chronic_care.specific_kind == "trademark_011"
		remap = state.injury_care.active() and state.injury_care.specific_kind == "trademark_016"
		if state.stress_care.active() and state.stress_care.specific_kind == "trademark_001":
			reply_visibility = preload("res://scripts/game/condition_echo_variants.gd").event(time,state.stress_care.severity,reduced_motion).visibility
	material.set_shader_parameter("original_chronic_mode",chronic_mode)
	material.set_shader_parameter("original_floor_fracture",fracture)
	material.set_shader_parameter("original_dissonance",dissonance)
	material.set_shader_parameter("original_tide",tide)
	material.set_shader_parameter("original_tide_clock",1.6 if reduced_motion else time)
	material.set_shader_parameter("original_tide_flip",pet.flip_h)
	material.set_shader_parameter("original_scanner",scanner)
	material.set_shader_parameter("original_palette_remap",remap)
	material.set_shader_parameter("original_reply_visibility",reply_visibility)
	material.set_shader_parameter("original_clock",2.35 if reduced_motion else time)
	if pet.texture == null: return
	if dissonance > 0:
		material.set_shader_parameter("original_head_region",_head_region(pet.texture))
	if chronic_mode == 1 and not reduced_motion:
		original_history.record(pet,time,str(state.character_id))
		for pair in [["near",.45],["middle",1.25],["far",2.3]]:
			var sample := original_history.at(time-float(pair[1]))
			material.set_shader_parameter("original_past_"+str(pair[0]),sample.get("texture",pet.texture))
	else:
		original_history.samples.clear()
		for suffix in ["near","middle","far"]: material.set_shader_parameter("original_past_"+suffix,pet.texture)

func _head_region(texture: Texture2D) -> Vector4:
	var key := texture.get_instance_id()
	if not head_regions.has(key):
		var pixels := texture.get_image()
		var used := pixels.get_used_rect()
		var top := used.position.y
		# Thin antennae belong to the moving head; find the main body's top below them.
		for y in range(used.position.y,used.end.y):
			var count := 0
			for x in range(used.position.x,used.end.x):
				if pixels.get_pixel(x,y).a > .5: count += 1
			if count >= maxf(1,used.size.x*.4): top = y; break
		var dimensions := Vector2(pixels.get_size())
		if head_regions.size() >= 128: head_regions.clear()
		head_regions[key] = Vector4(used.position.x/dimensions.x,top/dimensions.y,used.size.x/dimensions.x,maxf(1,used.end.y-top)/dimensions.y)
	return head_regions[key]
