extends RefCounted
## Body-attached leaves, discharge, abrasion grains and a genuine delayed reflection.
const Motion = preload("res://scripts/game/condition_followup_motion.gd")
var reflection_regions := {}
var last_reflection_time := 0.0

func draw_effect(canvas: CanvasItem, id: String, severity: float, body: Rect2, bounds: Rect2, seconds: float, still: bool, scale: float, history: ConditionFrameHistory, real_time: float, flip: bool) -> void:
	match id:
		"trademark_050": _seasons(canvas,body,severity,seconds,still,scale)
		"trademark_055": _slip(canvas,body,severity,seconds,still,scale,flip)
		"trademark_064": _reflection(canvas,body,bounds,severity,history,real_time,still,scale)
		"trademark_065": _storm(canvas,body,severity,seconds,still,scale,flip)
		"trademark_066": _scars(canvas,body,severity,seconds,still,scale,flip)
		"trademark_096": _mismatch(canvas,body,severity,seconds,still,scale,flip)

func _leaf(canvas: CanvasItem, center: Vector2, size: float, angle: float, color: Color) -> void:
	canvas.draw_set_transform(center,angle)
	canvas.draw_colored_polygon(PackedVector2Array([Vector2(-size,0),Vector2(-size*.4,-size*.55),Vector2(size,0),Vector2(size*.25,size*.50)]),color)
	canvas.draw_line(Vector2(-size,0),Vector2(size*.7,0),color.darkened(.35),maxf(1,size*.12))
	canvas.draw_set_transform(Vector2.ZERO)

func _seasons(canvas: CanvasItem, body: Rect2, severity: float, seconds: float, still: bool, scale: float) -> void:
	var event := Motion.season(severity,seconds,still)
	var count := 2+Motion.stage(severity)
	for index in range(count):
		# Stems begin at the body edge and grow into the air; no floating season badge.
		var side := -1.0 if index%2==0 else 1.0
		var base := body.position+body.size*Vector2(.22 if side<0 else .78,.35+float(index%3)*.20)
		var tip := base+Vector2(side*(17+severity*4),-15-index%2*7)*scale*event.z
		var green := Color(.36,.86,.26,event.z)
		var cold := Color(.72,.94,1,event.z)
		var dry := Color(.72,.44,.18,event.z)
		var ink := green if event.x<.5 else cold if event.x<1.5 else dry
		canvas.draw_line(base,tip,ink,2.5*scale)
		if event.x<1.5:
			_leaf(canvas,tip,(7+severity)*scale,side*.55,ink)
			_leaf(canvas,base.lerp(tip,.55),(5+severity)*scale,-side*.8,ink)
			if event.x>.5:
				for ray in range(3):
					var delta := Vector2.from_angle(ray*PI/3)*7*scale
					canvas.draw_line(tip-delta,tip+delta,Color(.92,.99,1,event.z),1.5*scale)
		elif event.x<2.5:
			var fall := smoothstep(.15,.85,event.y)
			var position := tip+Vector2(side*fall*20,fall*fall*45)*scale
			_leaf(canvas,position,(8+severity)*scale,event.y*TAU+index,Color(1,.47,.16,event.z))
		else:
			for grain in range(3):
				var fall := fposmod(event.y+grain*.24,1.0)
				canvas.draw_rect(Rect2(tip+Vector2(side*fall*14,fall*fall*30)*scale,Vector2(2,3)*scale),Color(.91,.70,.34,sin(fall*PI)*event.z))

func _slip(canvas: CanvasItem, body: Rect2, severity: float, seconds: float, still: bool, scale: float, flip: bool) -> void:
	var event := Motion.slip(severity,seconds,still)
	var direction := -1.0 if flip else 1.0
	var base := Vector2(body.get_center().x+direction*body.size.x*.23,body.end.y+2*scale)
	canvas.draw_line(base-Vector2(20,0)*scale,base+Vector2(24,0)*scale,Color(.28,.67,.80,.40),3*scale)
	var foot := base+Vector2(direction*event.z*body.size.x,0)
	canvas.draw_line(base,foot,Color(.66,.94,1,.9),3*scale)
	var release := clampf((event.w-.22)/.46,0,1)
	var alpha := sin(release*PI)
	if still: release = .44; alpha = .9
	for index in range(3+Motion.stage(severity)*2):
		var delta := Vector2(direction*(8+index*5)*release,-(18+index%3*9)*sin(release*PI)+release*release*12)*scale
		canvas.draw_circle(foot+delta,(1.5+index%2)*scale,Color(.55,.9,1,alpha*.9))

func _reflection(canvas: CanvasItem, body: Rect2, bounds: Rect2, severity: float, history: ConditionFrameHistory, time: float, still: bool, scale: float) -> void:
	last_reflection_time = Motion.reflection_time(time,severity,still)
	var sample := history.at(last_reflection_time)
	if sample.is_empty() or sample.texture==null: return
	var texture: Texture2D = sample.texture
	var key := texture.get_instance_id()
	if not reflection_regions.has(key):
		if reflection_regions.size()>128: reflection_regions.clear()
		reflection_regions[key] = Rect2(texture.get_image().get_used_rect())
	var region: Rect2 = reflection_regions[key]
	if region.size.x<=0 or region.size.y<=0: return
	var height := minf(body.size.y*(.50+severity*.075),bounds.size.y*.34)
	var top := minf(body.end.y+6*scale,bounds.end.y-height-3*scale)
	var width := body.size.x*(.95+severity*.025)
	var rect := Rect2(Vector2(body.get_center().x-width*.5,top),Vector2(width,height))
	# Use a vertical flip of the actual retained frame, cropped to its visible pixels.
	canvas.draw_set_transform(Vector2(rect.position.x+(width if sample.flip else 0.0),rect.end.y),0,Vector2(-1 if sample.flip else 1,-1))
	canvas.draw_texture_rect_region(texture,Rect2(Vector2.ZERO,rect.size),region,Color(.66,.88,1,.66+severity*.08))
	canvas.draw_set_transform(Vector2.ZERO)
	canvas.draw_line(Vector2(rect.position.x-5*scale,top),Vector2(rect.end.x+5*scale,top),Color(.55,.86,1,.62),2*scale)
	# The surface lines move only during the short catch-up, not while a pose is held.
	var lag := maxf(0,time-last_reflection_time)
	for row in range(2):
		var y := top+height*(.30+row*.4)
		var shift := 0.0 if still else sin(last_reflection_time*TAU)*2*scale
		canvas.draw_line(Vector2(rect.position.x+width*.12+shift,y),Vector2(rect.end.x-width*.12+shift,y),Color(.62,.88,1,.14+minf(lag,3)*.05),scale)

func _storm(canvas: CanvasItem, body: Rect2, severity: float, seconds: float, still: bool, scale: float, flip: bool) -> void:
	var phase := Motion.storm_phase(severity,seconds,still)
	var discharge := smoothstep(.64,.74,phase)*(1-smoothstep(.84,.98,phase))
	if discharge<=0: return
	for index in range(Motion.stage(severity)):
		var relative := Motion.storm_target(index)
		if flip: relative.x = 1-relative.x
		var origin := body.position+body.size*relative
		var direction := (relative-Vector2(.5,.58)).normalized()
		var reach := (22+severity*6)*scale*discharge
		var points := PackedVector2Array([origin,origin+direction*reach*.30+direction.orthogonal()*5*scale,origin+direction*reach*.60-direction.orthogonal()*4*scale,origin+direction*reach])
		canvas.draw_polyline(points,Color(.27,.63,1,.32*discharge),7*scale)
		canvas.draw_polyline(points,Color(.79,.93,1,discharge),2.5*scale)
		canvas.draw_line(points[1],points[1]+direction.rotated(.8)*reach*.35,Color(.60,.83,1,discharge),2*scale)
		canvas.draw_circle(origin,4*scale,Color(.89,.97,1,discharge*.8))

func _scars(canvas: CanvasItem, body: Rect2, severity: float, seconds: float, still: bool, scale: float, flip: bool) -> void:
	var clock := 2.4 if still else fposmod(seconds,12)
	for index in range(1+Motion.stage(severity)):
		var center := Motion.scar_center(index)
		if flip: center.x=1-center.x
		var origin := body.position+body.size*center
		for grain in range(3):
			var phase := fposmod(clock/4.0+index*.21+grain*.31,1.0)
			var direction := -1.0 if index%2==0 else 1.0
			var point := origin+Vector2(direction*Motion.scar_radius(severity)*body.size.x,body.size.y*.08)
			point += Vector2(direction*phase*18,phase*phase*36)*scale
			canvas.draw_set_transform(point,phase*TAU)
			canvas.draw_colored_polygon(PackedVector2Array([Vector2(-2,-2)*scale,Vector2(3,-1)*scale,Vector2(1,3)*scale]),Color(.91,.69,.40,sin(phase*PI)*.9))
			canvas.draw_set_transform(Vector2.ZERO)

func _mismatch(canvas: CanvasItem, body: Rect2, severity: float, seconds: float, still: bool, scale: float, flip: bool) -> void:
	var clock := 2.4 if still else fposmod(seconds,6)
	var cold_side := 1.0 if flip else -1.0
	for index in range(2+Motion.stage(severity)):
		var phase := fposmod(clock/3+index*.23,1.0)
		var origin := body.position+body.size*Vector2(.5,.35+index*.10)
		var point := origin+Vector2(sin(phase*TAU+index)*9,-phase*40)*scale
		var alpha := sin(phase*PI)*.62
		# Local translucent steam curls rise along the hot/cold boundary.
		canvas.draw_arc(point,(3+phase*7)*scale,-PI*.7,PI*.6,12,Color(.94,.97,1,alpha),2*scale)
	for index in range(Motion.stage(severity)+1):
		var point := body.get_center()+Vector2(cold_side*body.size.x*.28,(index-1)*body.size.y*.18)
		for ray in range(3):
			var delta := Vector2.from_angle(ray*PI/3)*(5+severity)*scale
			canvas.draw_line(point-delta,point+delta,Color(.83,.97,1,.8),1.5*scale)
		var phase := fposmod(clock/6+index*.3,1.0)
		var hot := body.get_center()+Vector2(-cold_side*body.size.x*.32,body.size.y*.1+phase*body.size.y*.4)
		_leaf(canvas,hot,(5+severity)*scale,phase*TAU,Color(.93,.47,.17,sin(phase*PI)*.9))
