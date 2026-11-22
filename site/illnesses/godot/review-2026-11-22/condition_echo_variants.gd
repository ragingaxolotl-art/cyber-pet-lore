extends RefCounted
## Echo Fright's fleeting visitors and Reply Echo's scatter/snap share no save state.
var visitors: Array[Texture2D] = []
const WARM := [Color(2.4,.90,.25),Color(2.6,.55,.35),Color(2.2,.75,.18)]

func visitor(index: int) -> Texture2D:
	if visitors.is_empty():
		# Existing public/default project art only; no student roster or save is read.
		var source: Texture2D = load("res://assets/pets/blue_cap/frame_0.png")
		var cap := AtlasTexture.new()
		cap.atlas = source
		cap.region = Rect2(source.get_image().get_used_rect())
		visitors.append(cap)
		var meep := AtlasTexture.new()
		meep.atlas = load("res://assets/care/meep/compact-atlas.png")
		meep.region = Rect2(0,0,52,56)
		visitors.append(meep)
	return visitors[posmod(index,visitors.size())]

func fright(pet: PetAnimation, severity: float, seconds: float, still: bool, alpha: float) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var duration := 4.8 if severity <= 1 else 3.6 if severity <= 2 else 3.0
	for index in range(3):
		var elapsed := seconds + index * duration / 3.0
		var phase := (index+.5)/3.0 if still else fposmod(elapsed/duration,1.0)
		var direction := Vector2.from_angle(-PI*.5 + index*TAU/3)
		var center := pet.position+pet.size*.5+direction*phase*pet.size*.32
		var size := pet.size*(1.0+phase*.32)
		var tint: Color = WARM[index]
		tint.a = alpha*.50*sin(phase*PI)
		var echo := {"rect":Rect2(center-size*.5,size),"tint":tint,"alpha":tint.a}
		# A readable quarter-second glimpse, once per departing copy, never a strobe.
		if not still and phase*duration >= duration*.48 and phase*duration < duration*.48+.28:
			var other := visitor(index+int(floor(elapsed/duration)))
			var aspect := Vector2(other.get_width(),other.get_height())
			size = aspect/maxf(aspect.x,aspect.y)*maxf(pet.size.x,pet.size.y)*.85
			echo.rect = Rect2(center-size*.5,size)
			echo.texture = other
			tint.a = alpha*.70
			echo.tint = tint
		result.append(echo)
	return result

static func event(seconds: float, severity: float, still: bool) -> Dictionary:
	if still: return {"active":false,"travel":0.0,"visibility":1.0}
	var interval := 10.0 if severity <= 1 else 6.0 if severity <= 2 else 3.8
	var elapsed := fposmod(seconds,interval)-1.4
	if elapsed < 0 or elapsed >= 1.15: return {"active":false,"travel":0.0,"visibility":1.0}
	# Depart for .85 seconds, then return in .18 seconds, followed by a short merge.
	var travel := sin(minf(elapsed/.85,1.0)*PI*.5)
	if elapsed > .85: travel = pow(1.0-clampf((elapsed-.85)/.18,0,1),2)
	var visibility := smoothstep(1.03,1.15,elapsed)
	return {"active":true,"travel":travel,"visibility":visibility}

func reply(pet: PetAnimation, severity: float, seconds: float, still: bool, alpha: float) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var origin := pet.position+pet.size*.5
	for index in range(3):
		var phase := (index+.5)/3.0 if still else fposmod(seconds/4.0+index/3.0,1.0)
		var direction := Vector2.from_angle(index*TAU/3-.6)
		var center := origin+direction*pet.size*phase*.40
		var size := pet.size*(1.0+phase*.25)
		result.append({"rect":Rect2(center-size*.5,size),"alpha":alpha*.25*sin(phase*PI)})
	var burst := event(seconds,severity,still)
	if burst.active:
		for index in range(6):
			var direction := Vector2.from_angle(index*TAU/6-.4)
			var center: Vector2 = origin+direction*pet.size*burst.travel*.50
			var size: Vector2 = pet.size*(1.0-burst.travel*.12)
			result.append({"rect":Rect2(center-size*.5,size),"alpha":alpha*.66*(1.0-burst.visibility)})
	return result
