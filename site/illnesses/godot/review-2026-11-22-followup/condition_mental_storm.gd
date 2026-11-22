extends RefCounted
## One continuous six-second orbit, with local soft lightning pulses.
const PERIOD := 6.0
var cloud: AtlasTexture
var body := Rect2()
var bounds := Rect2()
var scale_factor := 1.0
var seconds := 0.0
var still := false

func prepare(body_rect: Rect2, scale: float, time: float, reduced_motion: bool, stage_bounds: Rect2) -> void:
	body = body_rect
	bounds = stage_bounds
	scale_factor = scale
	seconds = time
	still = reduced_motion

func layout(severity: float) -> Dictionary:
	# No modulo/frame-reset animation: position and velocity agree through a full turn.
	var angle := .7 if still else seconds * TAU / PERIOD
	var orbit_center := Vector2(body.get_center().x, body.position.y - 12 * scale_factor)
	# Keep the larger cloud overhead; a tight orbit preserves the seamless swirl.
	var offset := Vector2.ZERO if still else Vector2(cos(angle) * body.size.x * .06, sin(angle) * 4 * scale_factor)
	var point := orbit_center + offset
	var width := (82 + severity * 8) * scale_factor
	var size := Vector2(width, width * .68)
	point = point.clamp(bounds.position + size * .5, bounds.end - size * .5)
	var flash := .45 if still else pow(.5 + .5 * cos(angle * 2), 6)
	return {"center":point,"size":size,"angle":sin(angle)*.12,"flash":flash,"orbit_center":orbit_center}

func draw_storm(canvas: CanvasItem, severity: float) -> void:
	if cloud == null:
		var source: Texture2D = load("res://assets/care/mental-storm-2026-11-22/storm_cloud.png")
		cloud = AtlasTexture.new()
		cloud.atlas = source
		cloud.region = Rect2(source.get_image().get_used_rect())
	var item := layout(severity)
	canvas.draw_set_transform(item.center,item.angle)
	canvas.draw_texture_rect(cloud,Rect2(-item.size*.5,item.size),false,Color(1,1,1,.87+item.flash*.13))
	# Local lightning brightens smoothly; neither the pet nor background flashes.
	for side in [-1,1]:
		var origin := Vector2(side * item.size.x * .18,item.size.y*.12)
		var bolt := PackedVector2Array([origin,origin+Vector2(-3,6)*scale_factor,origin+Vector2(2,6)*scale_factor,origin+Vector2(-2,13)*scale_factor])
		canvas.draw_polyline(bolt,Color(1,.96,.60,.25+item.flash*.70),maxf(1,2*scale_factor))
	canvas.draw_set_transform(Vector2.ZERO)
