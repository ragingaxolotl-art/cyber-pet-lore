extends RefCounted
## Solid remembered visitors enter and leave through separate temporary doorways.
## Presentation only: these guests never become roster pets or gameplay actors.
const STOPS := [Vector2(-.72,.26),Vector2(.72,.26),Vector2(-.38,.73),Vector2(.38,.73),Vector2(.78,-.32)]
var artwork = preload("res://scripts/game/condition_echo_variants.gd").new()

func settings(severity: float) -> Dictionary:
	var stage := clampi(int(severity),1,3)
	return {"count":[1,3,5][stage-1],"linger":[4.0,8.0,14.0][stage-1]}

func layout(body: Rect2, bounds: Rect2, scale: float, severity: float, seconds: float, still: bool) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var config := settings(severity)
	var duration: float = config.linger+5.0
	var size := Vector2(56,62)*scale
	var margin := size*.70
	var entry := body.get_center()+Vector2(0,body.size.y*.18)
	entry = entry.clamp(bounds.position+margin,bounds.end-margin)
	var exit_point := Vector2(body.end.x+size.x*.8,body.end.y+size.y*.30)
	exit_point = exit_point.clamp(bounds.position+margin,bounds.end-margin)
	if exit_point.distance_to(entry)<size.x: exit_point.x = bounds.position.x+margin.x
	for index in range(config.count):
		var elapsed: float = 2.0+config.linger*.5 if still else fposmod(seconds+index*duration/config.count,duration)
		if elapsed >= config.linger+4.0: continue
		var stop: Vector2 = body.get_center()+STOPS[index]*body.size
		stop = stop.clamp(bounds.position+margin,bounds.end-margin)
		var center := entry
		var reveal := 0.0
		var door := 0
		var opening := 0.0
		var phase := "enter"
		if elapsed < 2.0:
			opening = smoothstep(0,.4,elapsed)*(1.0-smoothstep(1.7,2.0,elapsed))
			reveal = smoothstep(.4,1.15,elapsed)
			center = entry.lerp(stop,smoothstep(1.15,2.0,elapsed))
		elif elapsed < 2.0+config.linger:
			phase = "linger"
			center = stop
			reveal = 1.0
			if not still: center += Vector2(sin(seconds*.8+index)*2,sin(seconds*1.2+index)*1.5)*scale
		else:
			phase = "exit"
			door = 1
			var leaving: float = elapsed-2.0-config.linger
			opening = smoothstep(0,.3,leaving)*(1.0-smoothstep(1.65,2.0,leaving))
			center = stop.lerp(exit_point,smoothstep(0,.9,leaving))
			reveal = 1.0-smoothstep(.9,1.65,leaving)
		result.append({"center":center,"size":size,"reveal":reveal,"phase":phase,"door":door,"opening":opening,"entry":entry,"exit":exit_point,"visitor":index%2,"alpha":1.0})
	return result

func draw_visitors(canvas: CanvasItem, body: Rect2, bounds: Rect2, scale: float, severity: float, seconds: float, still: bool) -> void:
	var guests := layout(body,bounds,scale,severity,seconds,still)
	# Shared entry spawns on the pet. The exit is a separate door beside the pet.
	for door in [0,1]:
		var opening := .95 if still else 0.0
		for guest in guests:
			if guest.door == door: opening = maxf(opening,guest.opening)
		if opening > 0:
			var center: Vector2 = guests[0].entry if door == 0 else guests[0].exit
			_draw_door(canvas,center,Vector2(65,77)*scale,opening,door)
	for guest in guests:
		if guest.reveal <= 0: continue
		var texture: Texture2D = artwork.visitor(guest.visitor)
		var source_size := Vector2(texture.get_size())
		var size: Vector2 = source_size/maxf(source_size.x,source_size.y)*guest.size.y
		var rect := Rect2(guest.center-size*.5,size)
		# Wipe through the doorway instead of making the visitor transparent.
		var source := Rect2(Vector2.ZERO,source_size)
		source.size.x *= guest.reveal
		rect.size.x *= guest.reveal
		canvas.draw_texture_rect_region(texture,rect,source,Color.WHITE)

func _draw_door(canvas: CanvasItem, center: Vector2, size: Vector2, opening: float, side: int) -> void:
	var rect := Rect2(center-size*.5,size)
	var ink := Color(.38,.94,.94) if side == 0 else Color(1,.73,.39)
	canvas.draw_rect(rect,Color(.06,.09,.18))
	canvas.draw_rect(rect,ink,false,2.0)
	# A hinged panel narrows as the doorway opens; the threshold stays readable.
	var panel := rect.grow(-3)
	panel.size.x *= 1.0-opening*.94
	canvas.draw_rect(panel,Color(.20,.31,.43))
	canvas.draw_line(Vector2(rect.position.x-3,rect.end.y),rect.end+Vector2(3,0),ink,3.0)
