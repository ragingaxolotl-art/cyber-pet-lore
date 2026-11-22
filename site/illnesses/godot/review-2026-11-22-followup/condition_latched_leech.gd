class_name ConditionLatchedLeech
extends TextureRect
## A rear-body layer. The suction point stays fixed while only the free tail bends.
const ART := preload("res://assets/care/illness-originals/pumpwire_leech_v2.png")
const WIGGLE := preload("res://assets/shaders/latched_leech.gdshader")
var wiggle_material := ShaderMaterial.new()
var latch := Vector2.ZERO
var eye_texture := AtlasTexture.new()
var eye_rect := Rect2()
const EYE_REGION := Rect2(8,27,21,22)
const EYE_CENTER := Vector2(18.5/96.0,38.0/64.0)
var anchor_cache: Dictionary = {}
func _init() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	stretch_mode = TextureRect.STRETCH_SCALE
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	texture = ART
	eye_texture.atlas = ART
	eye_texture.region = EYE_REGION
	wiggle_material.shader = WIGGLE
	material = wiggle_material
func _side_anchor(frame: Texture2D) -> Vector2:
	if anchor_cache.has(frame): return anchor_cache[frame]
	var image := frame.get_image()
	if image == null or image.is_empty(): return Vector2(.75,.62)
	var result := Vector2(.75,.62)
	# Search a small waist-height band for the outer body, not transparent padding.
	for offset in [0,-1,1,-2,2,-3,3]:
		var y := clampi(int(image.get_height()*.62)+offset,0,image.get_height()-1)
		var found := false
		for x in range(image.get_width()-1,-1,-1):
			if image.get_pixel(x,y).a > .85:
				var left := x
				while left > 0 and image.get_pixel(left-1,y).a > .85: left -= 1
				var inset := minf(image.get_width()*.075,(x-left)*.30)
				result = Vector2((x-inset)/image.get_width(),(y+.5)/image.get_height())
				found = true
				break
		if found: break
	if anchor_cache.size() >= 64: anchor_cache.clear()
	anchor_cache[frame] = result
	return result
func update_leech(pet: PetAnimation, seconds: float, reduced_motion: bool, opacity: float) -> void:
	var k := maxf(.25,minf(pet.size.x,pet.size.y)/192.0)
	var anchor := _side_anchor(pet.texture)
	if pet.flip_h: anchor.x = 1.0-anchor.x
	latch = pet.position+anchor*pet.size
	size = Vector2(120,80)*k
	flip_h = pet.flip_h
	position = latch-Vector2(size.x*(1.0-EYE_CENTER.x if flip_h else EYE_CENTER.x),size.y*EYE_CENTER.y)
	var pixel_scale := size/Vector2(96,64)
	var crop_origin := Vector2(96-EYE_REGION.end.x if flip_h else EYE_REGION.position.x,EYE_REGION.position.y)
	eye_rect = Rect2(position+crop_origin*pixel_scale,EYE_REGION.size*pixel_scale)
	modulate.a = opacity
	wiggle_material.set_shader_parameter("clock",seconds)
	wiggle_material.set_shader_parameter("reduced_motion",reduced_motion)
	show()
