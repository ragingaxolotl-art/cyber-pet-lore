class_name ConditionSurface
extends TextureRect
## Transparent marks use the current character alpha as their exact body mask.
const SURFACE_SHADER := preload("res://assets/shaders/illness_surface.gdshader")
var surface_material := ShaderMaterial.new()
var spread := 0.0
func _init() -> void:
	show_behind_parent = true
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	stretch_mode = TextureRect.STRETCH_SCALE
	surface_material.shader = SURFACE_SHADER
	material = surface_material
func update_surface(pet: PetAnimation, mode: int, severity: float, elapsed: float, reduced_motion: bool, opacity: float, clock_seconds: float = 0.0) -> void:
	texture = pet.texture
	position = pet.position
	size = pet.size
	flip_h = pet.flip_h
	# Growth is monotonic during an episode; never loops back to a clean patch.
	spread = .55 if reduced_motion else clampf(elapsed/75.0,0.0,1.0)
	surface_material.set_shader_parameter("clock",1.6 if reduced_motion else clock_seconds)
	surface_material.set_shader_parameter("surface_kind",mode)
	surface_material.set_shader_parameter("spread",spread)
	surface_material.set_shader_parameter("severity",severity)
	surface_material.set_shader_parameter("opacity",opacity)
	show()
