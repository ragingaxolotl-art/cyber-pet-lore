extends RefCounted
## Visual-only symptoms 6, 7 and 11. Timings never change illness recovery.
const ART := "res://assets/care/signal-symptoms-2026-11-20/"
const PACKETS := ["packet_tile", "packet_chip", "packet_stack"]
const BUBBLE_PERIOD := 3.2
const PACKET_PERIOD := 3.8
const WAVE_PERIOD := 3.0
var textures: Dictionary = {}
var body_bounds_cache: Dictionary = {}
var body := Rect2()
var bounds := Rect2()
var center := Vector2.ZERO
var scale_factor := 1.0
var seconds := 0.0
var still := false
var show_emote := true

func prepare(pet: PetAnimation, time: float, reduced_motion: bool, stage_bounds: Rect2) -> void:
	seconds = time
	still = reduced_motion
	bounds = stage_bounds
	scale_factor = maxf(.25, minf(pet.size.x, pet.size.y) / 192.0)
	var key := pet.texture.get_instance_id()
	if not body_bounds_cache.has(key):
		var pixels := pet.texture.get_image()
		var used := Rect2(pixels.get_used_rect())
		used.position /= Vector2(pixels.get_size())
		used.size /= Vector2(pixels.get_size())
		if body_bounds_cache.size() >= 128: body_bounds_cache.clear()
		body_bounds_cache[key] = used
	var relative: Rect2 = body_bounds_cache[key]
	if pet.flip_h: relative.position.x = 1.0 - relative.end.x
	body = Rect2(pet.position + relative.position * pet.size, relative.size * pet.size)
	center = body.get_center()

func texture(name: String) -> Texture2D:
	if not textures.has(name):
		var source: Texture2D = load(ART + name + ".png")
		var trimmed := AtlasTexture.new()
		trimmed.atlas = source
		trimmed.region = Rect2(source.get_image().get_used_rect())
		textures[name] = trimmed
	return textures[name]

func bubble_layout(severity: float) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var count := 3 + int(severity)
	var rise := minf(body.size.y * .72, maxf(0, center.y - bounds.position.y - 14 * scale_factor))
	for index in range(count):
		# Uneven launch times and separate torso origins avoid a single vertical column.
		var offset := fposmod(index * .6180339, 1.0)
		var phase := fposmod(.23 + offset, 1.0) if still else fposmod(seconds / BUBBLE_PERIOD + offset, 1.0)
		var travel := minf(phase / .80, 1.0)
		var sway := sin(travel * PI * 1.5 + index * 1.7) * 12 * scale_factor * travel
		var launch := center + Vector2(sin(index * 2.399963) * body.size.x * .28, sin(index * 1.9) * body.size.y * .05)
		var point := launch + Vector2(sway, -rise * travel)
		var width := (16.0 + index % 3 * 4) * scale_factor
		result.append({"center": point, "width": width, "phase": phase, "pop": maxf(0, (phase - .80) / .20), "alpha": minf(1, phase / .06)})
	return result

func packet_layout(severity: float) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var count := 6 + int(severity) * 2
	for index in range(count):
		var phase := (index % 4 + 1.0) / 5.0 if still else fposmod(seconds / PACKET_PERIOD + float(index) / count, 1.0)
		var angle := index * TAU / count - PI / 2
		var direction := Vector2.from_angle(angle)
		var reach := minf(body.size.x * .80, body.size.y * .80)
		var point := center + direction * reach * phase
		var width := (20.0 + index % 3 * 3) * scale_factor
		var alpha := smoothstep(0, .08, phase) * (1.0 - smoothstep(.72, 1, phase))
		result.append({"asset": PACKETS[index % PACKETS.size()], "center": point, "width": width, "rotation": angle * .18, "alpha": alpha, "phase": phase})
	return result

func wave_layout(severity: float) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var available := minf(minf(center.x - bounds.position.x, bounds.end.x - center.x), minf(center.y - bounds.position.y, bounds.end.y - center.y))
	var reach := maxf(0, minf(maxf(body.size.x, body.size.y) * .85, available - 2))
	for index in range(2 + int(severity)):
		var count := 2 + int(severity)
		var phase := (index + .5) / count if still else fposmod(seconds / WAVE_PERIOD + float(index) / count, 1.0)
		var radius := reach * phase
		var alpha := smoothstep(0, .12, phase) * (1.0 - smoothstep(.55, 1, phase)) * .88
		result.append({"radius": radius, "alpha": alpha})
	return result

func draw_bubbles(canvas: CanvasItem, severity: float) -> void:
	var bubble := ConditionPresentation.animated_texture("queasy_bubbles", seconds, still)
	for item in bubble_layout(severity):
		if item.phase < .80:
			canvas.draw_texture_rect(bubble, Rect2(item.center - Vector2.ONE * item.width * .5, Vector2.ONE * item.width), false, Color(1, 1, 1, item.alpha))
		else:
			# The reused bubble opens into six brief rim fragments at its top endpoint.
			var radius: float = item.width * (.35 + item.pop * .35)
			var color := Color(.68, 1, .85, (1.0 - item.pop) * .9)
			for fragment in range(6):
				var direction := Vector2.from_angle(fragment * TAU / 6)
				canvas.draw_line(item.center + direction * radius, item.center + direction * (radius + 3 * scale_factor), color, maxf(1, scale_factor))

func draw_packets(canvas: CanvasItem, severity: float) -> void:
	for item in packet_layout(severity):
		var art := texture(item.asset)
		var size := Vector2(item.width, item.width * art.get_height() / art.get_width())
		var point: Vector2 = item.center.clamp(bounds.position + size * .5, bounds.end - size * .5)
		canvas.draw_set_transform(point, item.rotation)
		canvas.draw_texture_rect(art, Rect2(-size * .5, size), false, Color(1, 1, 1, item.alpha))
	canvas.draw_set_transform(Vector2.ZERO)

func draw_signal_emote(canvas: CanvasItem, severity: float) -> void:
	var arc := texture("radio_wave_half")
	for item in wave_layout(severity):
		for side in [-1, 1]:
			# One left-half sprite; mirror the same source for the right half.
			canvas.draw_set_transform(center, 0, Vector2(-side, 1))
			# Leave an open gap above/below the pet so these read as radio arcs, not a shield ring.
			canvas.draw_texture_rect(arc, Rect2(-item.radius, -item.radius * .78, item.radius * .50, item.radius * 1.56), false, Color(1, 1, 1, item.alpha))
	canvas.draw_set_transform(Vector2.ZERO)
	if show_emote:
		var size := Vector2.ONE * 58 * scale_factor
		var position := Vector2(center.x - size.x * .5, body.position.y - size.y + 5 * scale_factor)
		position = position.clamp(bounds.position, (bounds.end - size).max(bounds.position))
		canvas.draw_texture_rect(texture("signal_tower_emote_v2"), Rect2(position, size), false)
