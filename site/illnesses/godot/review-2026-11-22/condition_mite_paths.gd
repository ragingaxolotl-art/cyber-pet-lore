class_name ConditionMitePaths
extends RefCounted
## Each mite walks a closed, continuous route over opaque character pixels.
## A reversed return leg closes the path without a visible end-to-start jump.
var cached: Dictionary = {}
var action_routes: Dictionary = {}
func routes_for_pet(pet: PetAnimation) -> Array:
	if pet.character == null or not pet.character.animations.has(pet.action): return routes(pet.texture)
	var key := str(pet.character.get_instance_id())+"/"+pet.action
	if action_routes.has(key): return action_routes[key]
	var textures: Array = pet.character.animations[pet.action].textures
	var images: Array[Image] = []
	for texture in textures:
		var pixels: Image = texture.get_image()
		if pixels != null and not pixels.is_empty(): images.append(pixels)
	if images.is_empty(): return routes(pet.texture)
	var mask := Image.create(32,32,false,Image.FORMAT_RGBA8)
	var shared_pixels := 0
	for y in range(32):
		for x in range(32):
			var opaque := true
			for pixels in images:
				var px := clampi(int((x+.5)*pixels.get_width()/32.0),0,pixels.get_width()-1)
				var py := clampi(int((y+.5)*pixels.get_height()/32.0),0,pixels.get_height()-1)
				if pixels.get_pixel(px,py).a <= .85: opaque = false; break
			if opaque: mask.set_pixel(x,y,Color.WHITE); shared_pixels += 1
	# One route set serves the entire animation, avoiding frame-to-frame rerouting.
	var result := routes(ImageTexture.create_from_image(mask)) if shared_pixels >= 4 else routes(textures[0])
	if action_routes.size() >= 32: action_routes.clear()
	action_routes[key] = result
	return result
func routes(texture: Texture2D) -> Array:
	if cached.has(texture): return cached[texture]
	var image := texture.get_image()
	if image == null or image.is_empty(): return []
	var cells: Array[Vector2i] = []
	var solid := {}
	const GRID := 32
	for y in range(GRID):
		for x in range(GRID):
			var px := clampi(int((x+.5)*image.get_width()/GRID),0,image.get_width()-1)
			var py := clampi(int((y+.5)*image.get_height()/GRID),0,image.get_height()-1)
			if image.get_pixel(px,py).a > .85:
				var cell := Vector2i(x,y)
				cells.append(cell)
				solid[cell] = true
	var result: Array = []
	if cells.is_empty(): return result
	for index in range(7):
		var rng := RandomNumberGenerator.new()
		rng.seed = 17041+index*887
		var cell: Vector2i = cells[(index*193+cells.size()/3)%cells.size()]
		var route: Array[Vector2] = [(Vector2(cell)+Vector2(.5,.5))/GRID]
		var previous := cell
		for step in range(44):
			var candidates: Array[Vector2i] = []
			for offset in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
				if solid.has(cell+offset) and cell+offset != previous: candidates.append(cell+offset)
			if candidates.is_empty(): break
			previous = cell
			cell = candidates[rng.randi_range(0,candidates.size()-1)]
			route.append((Vector2(cell)+Vector2(.5,.5))/GRID)
		for reverse_index in range(route.size()-2,0,-1): route.append(route[reverse_index])
		result.append(route)
	if cached.size() >= 64: cached.clear()
	cached[texture] = result
	return result
static func sample(route: Array, seconds: float, index: int) -> Dictionary:
	if route.size() < 2: return {"point":route[0] if not route.is_empty() else Vector2(.5,.5),"angle":0.0}
	var cursor := seconds*(1.7+index*.13)+index*9.3
	var step := int(floor(cursor))%route.size()
	var fraction := fposmod(cursor,1.0)
	var from: Vector2 = route[step]
	var to: Vector2 = route[(step+1)%route.size()]
	var previous_direction: Vector2 = from-Vector2(route[(step-1+route.size())%route.size()])
	var direction := to-from
	var angle := lerp_angle(previous_direction.angle(),direction.angle(),smoothstep(0.0,.35,fraction))-PI/2
	return {"point":from.lerp(to,fraction),"angle":angle}

func body_anchor(texture: Texture2D, preferred: Vector2) -> Vector2:
	var candidates := routes(texture)
	var closest := Vector2(-1,-1)
	var distance := INF
	for route in candidates:
		for point in route:
			var candidate_distance: float = point.distance_squared_to(preferred)
			if candidate_distance < distance:
				distance = candidate_distance
				closest = point
	return closest
