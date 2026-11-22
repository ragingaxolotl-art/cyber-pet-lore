extends RefCounted
## Extra body parts are sampled from the current pet, never from saved profiles.
const REGIONS := [Rect2(.18,.12,.64,.48),Rect2(.20,.22,.60,.46),Rect2(0,.30,.34,.48),Rect2(.66,.30,.34,.48),Rect2(.12,.73,.38,.27),Rect2(.50,.73,.38,.27)]
const ANCHORS := [Vector2(-.40,-.06),Vector2(.40,-.10),Vector2(-.46,.20),Vector2(.46,.24),Vector2(-.24,.45),Vector2(.24,.45)]
const ANGLES := [-.40,.48,.38,-.36,.24,-.26]
var regions_by_texture := {}

func regions(texture: Texture2D) -> Array[Rect2]:
	var key := texture.get_instance_id()
	if regions_by_texture.has(key): return regions_by_texture[key]
	var image := texture.get_image()
	var used := Rect2(image.get_used_rect())
	var result: Array[Rect2] = []
	for fraction in REGIONS:
		var source := Rect2i(used.position+fraction.position*used.size,fraction.size*used.size)
		var part := image.get_region(source).get_used_rect()
		result.append(Rect2(source.position+part.position,part.size))
	if regions_by_texture.size() >= 64: regions_by_texture.clear()
	regions_by_texture[key] = result
	return result

func parts(texture: Texture2D, body: Rect2, severity: float, seconds: float, still: bool, flip: bool) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var sources := regions(texture)
	var count := clampi(int(severity),1,3)*2
	for index in range(count):
		var source: Rect2 = sources[index]
		if source.size.x <= 0 or source.size.y <= 0: continue
		var anchor: Vector2 = ANCHORS[index]
		if flip: anchor.x *= -1
		var size := source.size/Vector2(texture.get_size())*body.size*1.45
		var flex := 0.0 if still else sin(seconds*TAU/5.0+index)*.045
		result.append({"source":source,"center":body.get_center()+anchor*body.size,"size":size,"angle":(ANGLES[index]+flex)*(-1 if flip else 1)})
	return result

func draw_parts(canvas: CanvasItem, texture: Texture2D, body: Rect2, severity: float, seconds: float, still: bool, flip: bool) -> void:
	for part in parts(texture,body,severity,seconds,still,flip):
		canvas.draw_set_transform(part.center,part.angle,Vector2(-1 if flip else 1,1))
		canvas.draw_texture_rect_region(texture,Rect2(-part.size*.5,part.size),part.source,Color.WHITE)
	canvas.draw_set_transform(Vector2.ZERO)
