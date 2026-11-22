extends RefCounted
## Broken afterimages use actual pet pixels in irregular triangular glass shards.
## Geometry is deterministic; no saved artwork or illness rules are changed.
var triangles: Array[PackedVector2Array] = []
var atlas_textures: Dictionary = {}

func _init() -> void:
	var points := PackedVector2Array()
	for row in range(5):
		for column in range(5):
			var point := Vector2(column, row) / 4.0
			if column > 0 and column < 4: point.x += sin(row * 7.3 + column * 2.7) * .075
			if row > 0 and row < 4: point.y += cos(column * 8.1 + row * 3.1) * .075
			points.append(point)
	var indices := Geometry2D.triangulate_delaunay(points)
	for index in range(0, indices.size(), 3):
		triangles.append(PackedVector2Array([points[indices[index]], points[indices[index+1]], points[indices[index+2]]]))

func waves(pet: PetAnimation, severity: float, seconds: float, still: bool, alpha: float, bounds: Rect2) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var duration := 3.6 if severity <= 1 else 2.2 if severity <= 2 else 1.2
	var center := pet.position + pet.size * .5
	for wave in range(3):
		var phase := (wave + .5) / 3.0 if still else fposmod(seconds / duration + wave / 3.0, 1.0)
		var burst := 1.0 - pow(1.0 - phase, 2.0)
		var opacity := alpha * .54 * sin(phase * PI)
		var fragments: Array[Dictionary] = []
		for index in range(triangles.size()):
			var uv: PackedVector2Array = triangles[index]
			var middle := (uv[0] + uv[1] + uv[2]) / 3.0
			var relative := middle - Vector2.ONE * .5
			if pet.flip_h: relative.x *= -1
			var direction := relative.normalized().rotated(sin(index * 3.7 + wave) * .42)
			if direction.is_zero_approx(): direction = Vector2.from_angle(index * 2.4)
			var reach := minf(pet.size.x, pet.size.y) * (.24 + .07 * severity) * (.65 + .35 * sin(index * 2.1 + wave))
			var origin := center + relative * pet.size * (1.05 + phase * .25) + direction * reach * burst
			var spin := sin(index * 7.1 + wave) * phase * 1.1
			var points := PackedVector2Array()
			for vertex in uv:
				var offset := (vertex - middle) * pet.size
				if pet.flip_h: offset.x *= -1
				# Gaps exist immediately: no intact ghost silhouette is drawn.
				points.append(origin + (offset * (.84 - phase * .12)).rotated(spin))
			var box := Rect2(points[0],Vector2.ZERO)
			for point in points: box = box.expand(point)
			var safe_position := box.position.clamp(bounds.position, (bounds.end - box.size).max(bounds.position))
			var correction := safe_position - box.position
			for vertex in range(points.size()): points[vertex] += correction
			fragments.append({"points": points, "uv": uv, "alpha": opacity * (.70 + .30 * absf(sin(index * 1.8)))})
		result.append({"fragments": fragments, "alpha": opacity})
	return result

func draw_wave(canvas: CanvasItem, texture: Texture2D, wave: Dictionary) -> void:
	# Polygon UVs address a complete image; isolate atlas frames before sampling them.
	if texture is AtlasTexture:
		var key := texture.get_instance_id()
		if not atlas_textures.has(key):
			if atlas_textures.size() >= 64: atlas_textures.clear()
			atlas_textures[key] = ImageTexture.create_from_image(texture.get_image())
		texture = atlas_textures[key]
	for fragment in wave.fragments:
		# Texture alpha keeps empty space and holes in the original character clear.
		canvas.draw_polygon(fragment.points, PackedColorArray([Color(.76,.92,1,fragment.alpha)]), fragment.uv, texture)
