extends RefCounted
## Resets every uniform each frame, so curing or changing pets leaves no residue.
const Followup = preload("res://scripts/game/condition_followup_motion.gd")
const Motion = preload("res://scripts/game/condition_rework_motion.gd")
var regions := {}

func apply(material: ShaderMaterial, pet: PetAnimation, state, seconds: float, still: bool) -> void:
	var levels := {}
	if state != null:
		for entry in ConditionPresentation.entries(state):
			var care = ConditionPresentation.care(state,entry.key)
			if care.specific_kind in Motion.IDS or care.specific_kind in Followup.IDS: levels[care.specific_kind] = entry.severity
	var rings := Vector3(-1,-1,-1)
	if levels.has("trademark_020"):
		var signals := Motion.signals(levels.trademark_020,seconds,still)
		for index in range(signals.size()): rings[index] = signals[index].impact
	var door := levels.has("trademark_032")
	var walk := Motion.door_walk(levels.get("trademark_032",1),seconds,still)
	var moons := Motion.moons(levels.trademark_054,seconds,still) if levels.has("trademark_054") else Vector3.ZERO
	var dawn := Vector3.ZERO
	if levels.has("trademark_059"):
		var event := Motion.dawn(levels.trademark_059,seconds,still)
		dawn = Vector3(event.level,event.light,event.breaking)
	var shear := Vector2.ZERO
	if levels.has("trademark_061"):
		var strength := Motion.pull(seconds,6,still)
		var severity: float = levels.trademark_061
		shear = Vector2((.055+.035*severity)*strength,(.015+.012*severity)*strength)
	var gravity := Motion.gravity(levels.trademark_073,seconds,still) if levels.has("trademark_073") else Vector4.ZERO
	var folds := Motion.folds(levels.trademark_079,seconds,still) if levels.has("trademark_079") else Vector2.ZERO
	material.set_shader_parameter("review_signal_rings",rings)
	material.set_shader_parameter("review_door_active",door)
	material.set_shader_parameter("review_door_phase",walk.phase)
	material.set_shader_parameter("review_door_stride",walk.stride)
	material.set_shader_parameter("review_door_limits",Vector2(-.18,1.18))
	material.set_shader_parameter("review_moon_droop",moons)
	material.set_shader_parameter("review_dawn",dawn)
	material.set_shader_parameter("review_shear",shear)
	material.set_shader_parameter("review_gravity",gravity)
	material.set_shader_parameter("review_folds",folds)
	material.set_shader_parameter("review_flip",pet.flip_h)
	material.set_shader_parameter("review_canvas_size",pet.size)
	var followup_deforms := Followup.apply(material,levels,seconds,still)
	var deforming := followup_deforms or door or moons.length() > 0 or shear.length() > 0 or gravity.length() > 0 or folds.x > 0
	material.set_shader_parameter("review_padding",.32 if deforming else 0.0)
	material.set_shader_parameter("review_deforming",deforming)
	if pet.texture == null: return
	var region := texture_regions(pet.texture)
	material.set_shader_parameter("review_body_region",region.body)
	material.set_shader_parameter("review_frame_region",region.frame)

func texture_regions(texture: Texture2D) -> Dictionary:
	var key := texture.get_instance_id()
	if regions.has(key): return regions[key]
	var pixels := texture.get_image()
	var used := Rect2(pixels.get_used_rect())
	var dimensions := Vector2(pixels.get_size())
	var frame := Rect2(0,0,1,1)
	if texture is AtlasTexture:
		var atlas_size := Vector2(texture.atlas.get_size())
		frame = Rect2(texture.region.position/atlas_size,texture.region.size/atlas_size)
		if frame.size.is_zero_approx(): frame = Rect2(0,0,1,1)
	var body := Rect2(frame.position+used.position/dimensions*frame.size,used.size/dimensions*frame.size)
	var result := {"body":Vector4(body.position.x,body.position.y,maxf(body.size.x,.001),maxf(body.size.y,.001)),"frame":Vector4(frame.position.x,frame.position.y,frame.size.x,frame.size.y)}
	if regions.size() >= 128: regions.clear()
	regions[key] = result
	return result
