extends RefCounted
## Body-linked artwork for the eight reviewed effects. Uses the current pet frame.
const Motion = preload("res://scripts/game/condition_rework_motion.gd")

func draw_effect(canvas: CanvasItem, id: String, severity: float, body: Rect2, pet_rect: Rect2, texture: Texture2D, flip: bool, bounds: Rect2, seconds: float, still: bool, scale: float) -> void:
	match id:
		"trademark_020": _signals(canvas,body,severity,seconds,still,scale)
		"trademark_032": _doors(canvas,body,bounds,severity,seconds,still,scale)
		"trademark_054": _moons(canvas,body,severity,seconds,still,scale)
		"trademark_059": _dawn(canvas,body,severity,seconds,still,scale)
		"trademark_073": _gravity(canvas,body,severity,seconds,still,scale)
		"trademark_100": _beacons(canvas,body,pet_rect,texture,flip,bounds,severity,seconds,still)
		# Shear and Mapfold alter the actual body entirely in the shared pet shader.

func _signals(canvas: CanvasItem, body: Rect2, severity: float, seconds: float, still: bool, scale: float) -> void:
	var origin := body.position+body.size*Vector2(.5,.58)
	for pulse in Motion.signals(severity,seconds,still):
		if pulse.phase > .70 and not still: continue
		var direction := Vector2.from_angle(pulse.angle)
		var center: Vector2 = origin+direction*body.size*.76*pulse.travel
		var hot: bool = pulse.phase >= .40
		var ink := Color(1,.43,.16) if hot else Color(.46,1,.93)
		canvas.draw_circle(center,6*scale,Color(ink,.24))
		canvas.draw_circle(center,3.5*scale,ink)
		var tail: Vector2 = direction*(1 if hot else -1)*12*scale
		canvas.draw_line(center,center+tail,Color(ink,.65),3*scale)

func _doors(canvas: CanvasItem, body: Rect2, bounds: Rect2, severity: float, _seconds: float, _still: bool, scale: float) -> void:
	var layout := Motion.door_layout(body,bounds,scale,severity)
	for side in [-1,1]:
		var rect: Rect2 = layout.left if side < 0 else layout.right
		var color := Color(.52,.92,1) if side < 0 else Color(.97,.65,1)
		canvas.draw_rect(rect,Color(.05,.08,.19,.95))
		canvas.draw_rect(rect,color,false,maxf(2,3*scale))
		var hinge := rect.position if side < 0 else Vector2(rect.end.x,rect.position.y)
		var panel := PackedVector2Array([hinge,hinge+Vector2(-side*rect.size.x*.32,rect.size.y*.09),hinge+Vector2(-side*rect.size.x*.32,rect.size.y*.91),hinge+Vector2(0,rect.size.y)])
		canvas.draw_colored_polygon(panel,Color(color,.37))
		canvas.draw_line(Vector2(rect.position.x-3*scale,rect.end.y),rect.end+Vector2(3*scale,0),color,2*scale)

func _moons(canvas: CanvasItem, body: Rect2, severity: float, seconds: float, still: bool, scale: float) -> void:
	var droop := Motion.moons(severity,seconds,still)
	for index in range(3):
		var center := Vector2(body.position.x+body.size.x*(.16+index*.34),body.position.y-17*scale)
		var radius := (13+severity*2)*scale
		var points := PackedVector2Array()
		# A real crescent polygon: no opaque background-colored disk over the pet.
		for step in range(25):
			var angle := -PI*.5+step/24.0*PI
			points.append(center+Vector2(cos(angle)*radius,sin(angle)*radius))
		for step in range(24,-1,-1):
			var angle := -PI*.5+step/24.0*PI
			points.append(center+Vector2(cos(angle)*radius*(.12+droop[index]),sin(angle)*radius))
		canvas.draw_colored_polygon(points,Color(.80,.78,1,.90))
		var landing := Vector2(center.x,body.position.y+body.size.y*(.20+droop[index]*.4))
		canvas.draw_line(center+Vector2(radius*.35,radius),landing,Color(.80,.78,1,.18+droop[index]),scale)
		canvas.draw_circle(landing,2*scale,Color(.92,.87,1,.65))

func _dawn(canvas: CanvasItem, body: Rect2, severity: float, seconds: float, still: bool, scale: float) -> void:
	var event := Motion.dawn(severity,seconds,still)
	var y: float = body.position.y+body.size.y*event.level
	if event.light > .01:
		canvas.draw_line(Vector2(body.position.x-5*scale,y),Vector2(body.end.x+5*scale,y),Color(1,.77,.32,event.light*.7),2*scale)
	# When the stalled light breaks, pieces of its boundary rise as separate rays.
	var release: float = .3 if still else event.breaking
	if release <= 0 or release >= 1: return
	for index in range(4+Motion.stage(severity)*2):
		var spread := float(index)/(3+Motion.stage(severity)*2)
		var point := Vector2(lerpf(body.position.x,body.end.x,spread),y-release*body.size.y*(.6+.3*sin(index*2.1)))
		point.x += sin(index*2.4)*release*12*scale
		canvas.draw_line(point,point+Vector2(0,7+index%3*3)*scale,Color(1,.79,.36,sin(release*PI)),2*scale)

func _gravity(canvas: CanvasItem, body: Rect2, severity: float, seconds: float, still: bool, scale: float) -> void:
	var pulls := Motion.gravity(severity,seconds,still)
	for index in range(4):
		var direction: Vector2 = [Vector2.LEFT,Vector2.RIGHT,Vector2.UP,Vector2.DOWN][index]
		var point: Vector2 = body.get_center()+direction*body.size*.5*(1+pulls[index])
		var tangent: Vector2 = direction.orthogonal()
		canvas.draw_polyline(PackedVector2Array([point-direction*5*scale+tangent*4*scale,point,point-direction*5*scale-tangent*4*scale]),Color(.85,.69,1,.75),2*scale)

func _beacons(canvas: CanvasItem, body: Rect2, pet_rect: Rect2, texture: Texture2D, flip: bool, bounds: Rect2, severity: float, seconds: float, still: bool) -> void:
	var phase := Motion.cycle(seconds,6.0,still,.5)
	var count := Motion.beacon_count(severity)
	var side := 1.0 if bounds.end.x-body.end.x >= body.position.x-bounds.position.x else -1.0
	var previous := body.get_center()+Vector2(side*body.size.x*.28,0)
	var width := body.size.x*.42
	var available := bounds.end.x-previous.x-5 if side > 0 else previous.x-bounds.position.x-5
	width = minf(width,available/1.8)
	for index in range(count):
		var reveal := 1.0 if still else smoothstep(.03+index*.09,.17+index*.09,phase)*(1.0-smoothstep(.80,1.0,phase))
		var size := pet_rect.size/pet_rect.size.x*width
		var center := previous+Vector2(side*width*.85,-width*.13)
		var near := center-Vector2(side*width*.45,0)
		var beam := PackedVector2Array([previous,near-Vector2(0,size.y*.55),near+Vector2(0,size.y*.55)])
		canvas.draw_colored_polygon(beam,Color(1,.88,.44,reveal*.30))
		canvas.draw_line(previous,near-Vector2(0,size.y*.55),Color(1,.92,.60,reveal*.60),1.5)
		canvas.draw_set_transform(center,0,Vector2(-1 if flip else 1,1))
		canvas.draw_texture_rect(texture,Rect2(-size*.5,size),false,Color(1,1,1,reveal))
		canvas.draw_set_transform(Vector2.ZERO)
		canvas.draw_circle(previous,maxf(1.0,width*.07),Color(1,.94,.67,reveal))
		previous = center+Vector2(side*width*.24,0)
		width *= .48
