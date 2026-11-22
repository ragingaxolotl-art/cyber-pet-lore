extends RefCounted
## Broad rolling water ribbons repeat with a delayed second crest.
const PERIOD := 4.0
func span(body: Rect2, bounds: Rect2) -> Vector2:
	return Vector2(maxf(bounds.position.x+3,body.get_center().x-body.size.x*.88),minf(bounds.end.x-3,body.get_center().x+body.size.x*.88))

func wave(body: Rect2, bounds: Rect2, scale: float, severity: float, seconds: float, repeat: int) -> PackedVector2Array:
	var points := PackedVector2Array()
	var edges := span(body,bounds)
	var left := edges.x
	var right := edges.y
	var amplitude := (18+severity*7)*scale
	var baseline := body.end.y-12*scale+repeat*9*scale
	var phase := seconds*TAU/PERIOD-repeat*1.25
	for index in range(81):
		var fraction := index/80.0
		var y := baseline+sin(fraction*TAU*1.65-phase)*amplitude
		points.append(Vector2(lerpf(left,right,fraction),clampf(y,bounds.position.y+3,bounds.end.y-16*scale)))
	return points

func draw_water(canvas: CanvasItem, body: Rect2, bounds: Rect2, scale: float, severity: float, seconds: float) -> void:
	for repeat in [1,0]:
		var points := wave(body,bounds,scale,severity,seconds,repeat)
		var ribbon := points.duplicate()
		for index in range(points.size()-1,-1,-1): ribbon.append(points[index]+Vector2(0,12*scale))
		canvas.draw_colored_polygon(ribbon,Color(.08,.44,.73,.30 if repeat else .54))
		canvas.draw_polyline(points,Color(.29,.79,.98,.55 if repeat else .95),maxf(2,3*scale))
		for index in range(4,points.size()-4,10):
			var point := points[index]
			canvas.draw_line(point-Vector2(2,2)*scale,point+Vector2(3,-2)*scale,Color(.87,.99,1,.8),2*scale)
