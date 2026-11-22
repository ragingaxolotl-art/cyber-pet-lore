class_name ConditionOriginalMotifs
extends Control
## Hand-authored motion for distinct location illnesses. No gameplay state changes.
const HANDLED := ["signal_churn","trademark_001","trademark_064","trademark_073","trademark_050","trademark_063","buffer_bloat","signal_sprain","mental_fatigue","echo_fright","trademark_006","trademark_008","trademark_011","trademark_016","trademark_020","trademark_021","trademark_023","trademark_032","trademark_054","trademark_059","trademark_055","trademark_061","trademark_079","trademark_096","trademark_100"]
var reviewed_art = preload("res://scripts/game/condition_rework_art.gd").new()
var signal_visuals = preload("res://scripts/game/condition_signal_visuals.gd").new()
var body_merge = preload("res://scripts/game/condition_body_merge.gd").new()
var tide_waves = preload("res://scripts/game/condition_tide_waves.gd").new()
var shelter_visitors = preload("res://scripts/game/condition_shelter_visitors.gd").new()
var mental_storm = preload("res://scripts/game/condition_mental_storm.gd").new()
var motifs: Array[Dictionary] = []
var attachments: Array[Dictionary] = []
var history := ConditionFrameHistory.new()
var seconds := 0.0
var still := false
var pet_rect := Rect2()
var delayed := {}
var live_texture: Texture2D
var flip := false
var scale_factor := 1.0
var bounds := Rect2()
var debt_steps: Array[Dictionary] = []
var debt_identity := ""
var debt_last_feet := Vector2.ZERO
var debt_last_time := -1.0
var debt_active := false
var debt_stride := 0.0
var debt_foot := 0
var current_identity := ""
var current_time := 0.0
func _init() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
func prepare(pet: PetAnimation, character_id: String, time: float, reduced_motion: bool, stage_bounds: Rect2) -> void:
	if not debt_active or reduced_motion:
		debt_steps.clear()
		debt_last_time = -1.0
		debt_stride = 0.0
	debt_active = false
	current_identity = character_id
	current_time = time
	motifs.clear()
	attachments.clear()
	seconds = 1.6 if reduced_motion else time
	still = reduced_motion
	pet_rect = Rect2(pet.position,pet.size)
	bounds = stage_bounds
	live_texture = pet.texture
	flip = pet.flip_h
	scale_factor = maxf(.25,minf(pet.size.x,pet.size.y)/192.0)
	signal_visuals.prepare(pet,seconds,still,bounds)
	mental_storm.prepare(signal_visuals.body,scale_factor,seconds,still,bounds)
	history.record(pet,time,character_id)
	delayed = history.at(time if reduced_motion else time-2.0)
	queue_redraw()
func add_kind(id: String, severity: float) -> bool:
	if id not in HANDLED: return false
	if id == "trademark_063":
		debt_active = true
		_record_distance()
	motifs.append({"id":id,"severity":severity})
	return true
func add_attachment(kind: String, origin: Vector2, index: int = 0, rotation: float = 0.0) -> void:
	attachments.append({"kind":kind,"origin":origin,"index":index,"rotation":rotation})
func _draw() -> void:
	for attachment in attachments:
		if attachment.kind == "reed":
			draw_set_transform(attachment.origin,attachment.get("rotation",0.0))
			var local := attachment.duplicate()
			local.origin = Vector2.ZERO
			_draw_attachment(local)
			draw_set_transform(Vector2.ZERO)
		else:
			_draw_attachment(attachment)
	for motif in motifs:
		if motif.id in preload("res://scripts/game/condition_rework_motion.gd").IDS:
			reviewed_art.draw_effect(self,motif.id,motif.severity,signal_visuals.body,pet_rect,live_texture,flip,bounds,seconds,still,scale_factor)
			continue
		match motif.id:
			"trademark_001": _reply_fragments(motif.severity)
			"trademark_064": _deferred_reflection(motif.severity)
			"trademark_050": _broken_seasons(motif.severity)
			"trademark_063": _distance_debt(motif.severity)
			"signal_churn": signal_visuals.draw_bubbles(self,motif.severity)
			"buffer_bloat": signal_visuals.draw_packets(self,motif.severity)
			"signal_sprain": signal_visuals.draw_signal_emote(self,motif.severity)
			"mental_fatigue": mental_storm.draw_storm(self,motif.severity)
			"echo_fright": _inward_alarm(motif.severity)
			"trademark_006": _civic_voices(motif.severity)
			"trademark_008": shelter_visitors.draw_visitors(self,signal_visuals.body,bounds,scale_factor,motif.severity,seconds,still)
			"trademark_011": _warm_impression(motif.severity)
			"trademark_016": _district_snare(motif.severity)
			"trademark_021": body_merge.draw_parts(self,live_texture,signal_visuals.body,motif.severity,seconds,still,flip)
			"trademark_023": tide_waves.draw_water(self,signal_visuals.body,bounds,scale_factor,motif.severity,seconds)
			"trademark_055": _stepwell_grip(motif.severity)
			"trademark_096": _split_seasons(motif.severity)



func _reply_fragments(severity: float) -> void:
	# Each broken message leaves, waits, and returns; it disappears before restart.
	var origin := pet_rect.position+pet_rect.size*Vector2(.5,.34)
	for index in range(3+int(severity)):
		var phase := fposmod(seconds/6.0+index*.19,1.0)
		var distance := smoothstep(0.0,.32,phase)*(1.0-smoothstep(.62,.93,phase))
		var angle := -PI*.82+index*.39
		var center := origin+Vector2.from_angle(angle)*distance*pet_rect.size.x*.65
		var fade := smoothstep(0.0,.08,phase)*(1.0-smoothstep(.90,1.0,phase))
		var color := Color(.55,.94,.83,fade*.8)
		var w := (14.0+index%3*4)*scale_factor
		var h := 9.0*scale_factor
		var points := PackedVector2Array([Vector2(-w*.5,-h*.5),Vector2(w*.5,-h*.5),Vector2(w*.5,h*.12)])
		for point_index in range(points.size()): points[point_index] += center
		draw_polyline(points,color,2.0*scale_factor)
		draw_line(center+Vector2(-w*.5,-h*.15),center+Vector2(-w*.5,h*.5),color,scale_factor)
		draw_line(center+Vector2(-w*.5,h*.5),center+Vector2(-w*.18,h*.5),color,scale_factor)
		# Returning fragments have lost one of their text strokes.
		for row in range(1 if phase > .62 else 2):
			draw_line(center+Vector2(-w*.25,-h*.2+row*3*scale_factor),center+Vector2(w*.24,-h*.2+row*3*scale_factor),color*.8,scale_factor)
func _deferred_reflection(severity: float) -> void:
	if delayed.is_empty() or delayed.texture == null: return
	var old: Rect2 = delayed.rect
	var size := Vector2(old.size.x,old.size.y*.38)
	var origin := Vector2(old.position.x,pet_rect.end.y-12*scale_factor)
	origin.y = minf(origin.y,bounds.end.y-size.y)
	# Positive draw rectangles plus an explicit transform also work on Compatibility.
	var reflection_scale := Vector2(-1.0 if delayed.flip else 1.0,-.38)
	var reflection_origin := origin+Vector2(old.size.x if delayed.flip else 0.0,size.y)
	draw_set_transform(reflection_origin,0,reflection_scale)
	draw_texture_rect(delayed.texture,Rect2(Vector2.ZERO,old.size),false,Color(.48,.75,.88,.28+severity*.04))
	draw_set_transform(Vector2.ZERO)
	# Quiet surface ripples belong only to the reflection, never to the live pet.
	for index in range(3):
		var y := origin.y+size.y*(.25+index*.24)
		var sway := 0.0 if still else sin(seconds*.8+index)*3*scale_factor
		draw_line(Vector2(origin.x+size.x*.16+sway,y),Vector2(origin.x+size.x*.84+sway,y),Color(.59,.87,1,.22),scale_factor)
func _broken_seasons(severity: float) -> void:
	var center := pet_rect.position+pet_rect.size*Vector2(.83,.66)
	var cycle := seconds/3.0
	var phase := fposmod(cycle,1.0)
	var season: int = [0,2,1,3][int(floor(cycle))%4]
	var alpha := smoothstep(0.0,.15,phase)*(1.0-smoothstep(.78,1.0,phase))
	var k := scale_factor*(.8+severity*.1)
	var sway := sin(phase*TAU)*3*k
	center += Vector2(sway,-phase*6*k)
	match season:
		0: # A seed opens into a paired sprout.
			draw_line(center+Vector2(0,9*k),center-Vector2(0,9*k*phase),Color(.34,.72,.36,alpha),2*k)
			var leaf_color := Color(.55,.84,.27,alpha)
			draw_colored_polygon(PackedVector2Array([center,center+Vector2(-11,-9)*k,center+Vector2(-10,-2)*k]),leaf_color)
			draw_colored_polygon(PackedVector2Array([center,center+Vector2(12,-13)*k,center+Vector2(10,-4)*k]),leaf_color)
		1: # A dry husk sheds three seed grains.
			draw_line(center+Vector2(0,10*k),center-Vector2(0,11*k),Color(.72,.56,.29,alpha),2*k)
			for index in range(4):
				var tip := center+Vector2((1 if index%2 else -1)*6,-10+index*4)*k
				draw_line(center+Vector2(0,index*3-9)*k,tip,Color(.91,.72,.40,alpha),3*k)
			for index in range(3): draw_circle(center+Vector2((index-1)*8*phase,phase*15+index*2)*k,1.5*k,Color(.91,.72,.40,alpha))
		2: # One lobed autumn leaf tumbles through a full continuous turn.
			draw_set_transform(center,seconds*.8)
			var leaf := PackedVector2Array([Vector2(0,-14),Vector2(4,-7),Vector2(10,-10),Vector2(8,-3),Vector2(14,0),Vector2(4,5),Vector2(0,10),Vector2(-4,5),Vector2(-14,0),Vector2(-8,-3),Vector2(-10,-10),Vector2(-4,-7)])
			for i in range(leaf.size()): leaf[i] *= k
			draw_colored_polygon(leaf,Color(.91,.43,.17,alpha))
			draw_line(Vector2(0,-9)*k,Vector2(0,14)*k,Color(.52,.21,.13,alpha),k)
			draw_set_transform(Vector2.ZERO)
		3: # Frost branches melt into a droplet.
			var radius := 12*k*(1-phase*.65)
			for branch in range(6):
				var direction := Vector2.from_angle(branch*TAU/6)
				draw_line(center,center+direction*radius,Color(.69,.88,1,alpha),1.5*k)
				for side in [-1,1]: draw_line(center+direction*radius*.55,center+direction*radius*.55+direction.rotated(side*.8)*radius*.3,Color(.69,.88,1,alpha),k)
			draw_circle(center+Vector2(0,phase*14*k),2*k*phase,Color(.35,.76,.96,alpha))
func _record_distance() -> void:
	var feet := pet_rect.position+pet_rect.size*Vector2(.5,.85)
	var elapsed := current_time-debt_last_time
	var travel := feet-debt_last_feet
	# Layout jumps, changed pets and resumed clocks are not footsteps.
	if still or debt_identity != current_identity or debt_last_time < 0 or elapsed < 0 or elapsed > .5 or travel.length() > pet_rect.size.x*.75:
		debt_steps.clear()
		debt_stride = 0.0
	else:
		var stride := 14.0*scale_factor
		var distance := travel.length()
		var next := stride-debt_stride
		while distance > .001 and next <= distance:
			var point := debt_last_feet+travel*(next/distance)
			debt_steps.append({"point":point,"born":current_time,"side":-1.0 if debt_foot%2 == 0 else 1.0,"angle":travel.angle()+PI*.5})
			debt_foot += 1
			next += stride
		debt_stride = fposmod(debt_stride+distance,stride)
		while debt_steps.size() > 24: debt_steps.pop_front()
		for index in range(debt_steps.size()-1,-1,-1):
			if current_time-float(debt_steps[index].born) >= 3.8: debt_steps.remove_at(index)
	debt_identity = current_identity
	debt_last_feet = feet
	debt_last_time = current_time
func _distance_debt(severity: float) -> void:
	var feet := pet_rect.position+pet_rect.size*Vector2(.5,.85)
	# Remain at the actual walked position, then arrive late at the living feet.
	for step in debt_steps:
		var age := current_time-float(step.born)
		var catch_up := smoothstep(1.2,3.8,age)
		var point: Vector2 = step.point.lerp(feet,catch_up)
		point += Vector2(step.side*5*scale_factor,0)
		var alpha := smoothstep(0.0,.15,age)*(1.0-smoothstep(3.1,3.8,age))
		draw_set_transform(point,step.angle)
		draw_rect(Rect2(-2.5*scale_factor,-4*scale_factor,5*scale_factor,8*scale_factor),Color(.80,.69,.48,alpha*(.4+severity*.05)))
		draw_circle(Vector2(0,-7)*scale_factor,2.5*scale_factor,Color(.87,.78,.57,alpha*.65))
		draw_set_transform(Vector2.ZERO)
	if still:
		# A quiet broken distance ruler identifies the illness without moving trails.
		for index in range(3):
			var point := feet+Vector2((index-1)*10,9)*scale_factor
			draw_line(point,point+Vector2(6,0)*scale_factor,Color(.87,.78,.57,.6),scale_factor)
			draw_line(point,point+Vector2(0,4)*scale_factor,Color(.87,.78,.57,.6),scale_factor)

func _unfinished_thought(severity: float) -> void:
	# A three-part idea tries to assemble; its final tile slowly sags away.
	var origin := pet_rect.position+pet_rect.size*Vector2(.50,.18)
	var k := scale_factor
	var phase := fposmod(seconds/7.0,1.0)
	var fade := smoothstep(0.0,.15,phase)*(1.0-smoothstep(.84,1.0,phase))
	for i in range(3):
		var drop := smoothstep(.30+i*.10,.80,phase)*(i+1)*5*k
		var point := origin+Vector2((i-1)*11*k,-13*k+drop)
		var alpha := fade*(1.0-drop/(30*k))
		draw_rect(Rect2(point-Vector2(4,4)*k,Vector2(8,8)*k),Color(.68,.78,.91,alpha*.75),false,k)
		if i < 2:
			draw_line(point+Vector2(4,0)*k,point+Vector2(7,0)*k,Color(.68,.78,.91,alpha*.5),k)
		else:
			draw_line(point+Vector2(-2,-2)*k,point+Vector2(2,2)*k,Color(.95,.81,.55,alpha*.7),k)
	# One small thought dot remains when the attempted idea collapses.
	draw_circle(origin, (1.4+severity*.15)*k,Color(.68,.78,.91,.5))
func _inward_alarm(severity: float) -> void:
	# Angular sound fronts approach from alternating sides, then break at a quiet shield.
	var center := pet_rect.get_center()
	var k := scale_factor
	for side in [-1,1]:
		for i in range(2):
			var phase := fposmod(seconds/4.8+i*.45+(0.25 if side == 1 else 0.0),1.0)
			var radius := lerpf(.77,.47,phase)*pet_rect.size.x
			var height := lerpf(18,6,phase)*k
			var point := center+Vector2(side*radius,-12*k)
			var alpha := smoothstep(0.0,.16,phase)*(1.0-smoothstep(.68,1.0,phase))
			var wave := PackedVector2Array([point+Vector2(side*6*k,-height),point,point+Vector2(side*6*k,height)])
			draw_polyline(wave,Color(.72,.64,.91,alpha*(.45+severity*.08)),1.5*k)

func _civic_voices(severity: float) -> void:
	# Three independent civic voices cross a common staff without synchronizing.
	var origin := pet_rect.position+pet_rect.size*Vector2(.5,.23)
	var k := scale_factor
	for voice in range(3):
		var points := PackedVector2Array()
		for i in range(33):
			var x := (i-16)*2.0*k
			var envelope := sin(i/32.0*PI)
			var y := sin(i*.40+seconds*(1.0+voice*.37)+voice*2)*(3+severity)*k*envelope
			points.append(origin+Vector2(x,y+(voice-1)*7*k))
		draw_polyline(points,Color(.50+voice*.16,.81-voice*.12,.88,.65),k)
func _warm_impression(severity: float) -> void:
	if live_texture == null: return
	# Narrow warm contact prints peel from different body strips, not whole ghosts.
	var image_size := Vector2(live_texture.get_size())
	for index in range(3):
		var phase := fposmod(seconds/6.0+index*.27,1.0)
		var alpha := smoothstep(0.0,.16,phase)*(1.0-smoothstep(.65,1.0,phase))*.30
		var source := Rect2(Vector2(image_size.x*(.22+index*.19),image_size.y*.2),image_size*Vector2(.13,.62))
		var target := Rect2(pet_rect.position+pet_rect.size*Vector2(.22+index*.19,.2),pet_rect.size*Vector2(.13,.62))
		target.position += Vector2((index-1)*phase*(12+severity*3),-sin(phase*PI)*8)*scale_factor
		if flip:
			target.position.x = pet_rect.end.x-(target.position.x-pet_rect.position.x)-target.size.x
			draw_set_transform(Vector2(target.end.x,target.position.y),0,Vector2(-1,1))
			target.position = Vector2.ZERO
		draw_texture_rect_region(live_texture,target,source,Color(1,.63,.34,alpha))
		draw_set_transform(Vector2.ZERO)
func _district_snare(severity: float) -> void:
	# Different district polygons latch together at mismatched lower-body seams.
	var center := pet_rect.position+pet_rect.size*Vector2(.5,.74)
	var k := scale_factor
	for index in range(3):
		var sides := index+3
		var stretch := sin(seconds*.8+index*2)*(3+severity)*k
		var points := PackedVector2Array()
		for corner in range(sides+1):
			var point := Vector2.from_angle(corner*TAU/sides-PI*.5)*12*k
			point.x *= 1.0+stretch/(25*k)
			points.append(center+Vector2((index-1)*18*k,stretch)+point)
		draw_polyline(points,Color(.89,.64+index*.08,.49,.68),1.5*k)
		draw_rect(Rect2(points[1]-Vector2(2,2)*k,Vector2(4,4)*k),Color(1,.9,.67,.9))
func _stepwell_grip(severity: float) -> void:
	# A wet step slides out beneath a dry remembered tread and sheds water.
	var k := scale_factor
	var base := pet_rect.position+pet_rect.size*Vector2(.48,.87)
	var phase := fposmod(seconds/5.0,1.0)
	var slip := sin(phase*PI)*16*k
	for step in range(3):
		var point := base+Vector2((step-1)*18,step*5)*k
		draw_polyline(PackedVector2Array([point-Vector2(8,0)*k,point+Vector2(8,0)*k,point+Vector2(8,5)*k]),Color(.77,.65,.46,.6),2*k)
		if step == 1:
			point.x += slip
			draw_line(point-Vector2(8,2)*k,point+Vector2(8,-2)*k,Color(.43,.84,.94,.8),2*k)
			for drop in range(3):
				var fall := fposmod(phase+drop*.25,1.0)
				var pos := point+Vector2((drop-1)*5*k,fall*fall*15*k)
				draw_circle(pos,(1+severity*.2)*k,Color(.48,.83,.93,sin(fall*PI)*.7))
func _split_seasons(severity: float) -> void:
	# Adjacent cold and hot room tiles exchange incompatible weather across a wall.
	var k := scale_factor
	var center := pet_rect.position+pet_rect.size*Vector2(.5,.65)
	draw_line(center-Vector2(0,16*k),center+Vector2(0,16*k),Color(.85,.79,.67,.7),2*k)
	for side in [-1,1]:
		var origin := center+Vector2(side*14*k,0)
		var ink := Color(.45,.81,1,.7) if side < 0 else Color(1,.67,.28,.7)
		draw_rect(Rect2(origin-Vector2(11,15)*k,Vector2(22,30)*k),Color(ink, .12))
		for i in range(3):
			var phase := fposmod(seconds/4.0+i*.3,1.0)
			var point := origin+Vector2((i-1)*5*k,(phase-.5)*22*k*side)
			var alpha := sin(phase*PI)*.8
			if side < 0:
				for ray in range(3):
					var line := Vector2.from_angle(ray*PI/3)*3*k
					draw_line(point-line,point+line,Color(ink,alpha),k)
			else:
				draw_circle(point,(2+severity*.15)*k,Color(ink,alpha))
func _draw_attachment(attachment: Dictionary) -> void:
	var origin: Vector2 = attachment.origin
	var k := scale_factor
	var index: int = attachment.index
	match attachment.kind:
		"reed":
			# Beads climb each hollow stalk, then split into tiny memory fragments.
			for stalk in range(3):
				var phase := fposmod(seconds/5.4+stalk*.29,1.0)
				var base := origin+Vector2((stalk-1)*8,-7)*k
				var tip := base+Vector2((stalk-1)*3,-(31+stalk*4))*k
				if phase < .62:
					var point := base.lerp(tip,phase/.62)
					draw_circle(point,1.7*k,Color(.74,.98,.71,.85))
				else:
					var age := (phase-.62)/.38
					for piece in range(2):
						var point := tip+Vector2((piece*2-1)*age*12,-age*16)*k
						var alpha := (1-age)*.8
						draw_rect(Rect2(point,Vector2(3,2)*k),Color(.75,.98,.72,alpha))
		"coral":
			# Angular grains detach, turn fully, and fade before the next emission.
			for grain in range(3):
				var phase := fposmod(seconds/5.0+index*.19+grain*.31,1.0)
				var angle := -PI*.85+grain*.9
				var point := origin+Vector2.from_angle(angle)*phase*24*k+Vector2(0,phase*phase*15*k)
				var alpha := sin(phase*PI)*.65
				draw_set_transform(point,seconds*.7+index+grain)
				draw_colored_polygon(PackedVector2Array([Vector2(-2,1)*k,Vector2(0,-3)*k,Vector2(3,2)*k]),Color(.95,.71,.77,alpha))
				draw_set_transform(Vector2.ZERO)
		"spark":
			# Local discharge has an envelope, not a screen flash or whole-body blink.
			var phase := fposmod(seconds/4.4+index*.27,1.0)
			var envelope := sin(clampf(phase/.42,0,1)*PI)
			if phase < .42:
				var direction := Vector2.from_angle(-PI*.8+index*1.6)
				var end := origin+direction*(5+phase*24)*k
				var middle := origin.lerp(end,.5)+direction.orthogonal()*3*k
				draw_polyline(PackedVector2Array([origin,middle,end]),Color(.78,.91,1,envelope*.8),k)
				draw_circle(origin,2.5*k,Color(.73,.85,1,envelope*.55))
