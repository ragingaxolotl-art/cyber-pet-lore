class_name DirtAppearance
extends RefCounted
## One lightweight material per pet; imported artwork is never changed.
const SHADER := preload("res://assets/shaders/pet_dirt.gdshader")
var material := ShaderMaterial.new()
var original_history := ConditionFrameHistory.new()

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
	var chronic_mode := 0
	var fracture := 0.0
	if state != null:
		if state.chronic_care.active():
			chronic_mode = {"trademark_041":1,"trademark_058":2,"trademark_062":3}.get(state.chronic_care.specific_kind,0)
		if state.injury_care.active() and state.injury_care.specific_kind == "trademark_095": fracture = state.injury_care.severity
	material.set_shader_parameter("original_chronic_mode",chronic_mode)
	material.set_shader_parameter("original_floor_fracture",fracture)
	material.set_shader_parameter("original_clock",2.35 if reduced_motion else time)
	if pet.texture == null: return
	if chronic_mode == 1 and not reduced_motion:
		original_history.record(pet,time,str(state.character_id))
		for pair in [["near",.45],["middle",1.25],["far",2.3]]:
			var sample := original_history.at(time-float(pair[1]))
			material.set_shader_parameter("original_past_"+str(pair[0]),sample.get("texture",pet.texture))
	else:
		original_history.samples.clear()
		for suffix in ["near","middle","far"]: material.set_shader_parameter("original_past_"+suffix,pet.texture)
