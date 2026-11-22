extends SceneTree
const Fixture = preload("res://tests/test_pet.gd")
const Motion = preload("res://scripts/game/condition_followup_motion.gd")
var checks := 0
var failures := 0
var viewport: SubViewport
var pet: PetAnimation
var effect := ConditionEffects.new()
var appearance := DirtAppearance.new()
func _initialize() -> void: call_deferred("run")
func check(ok: bool, message: String) -> void:
	checks += 1
	if not ok: failures += 1; push_error(message)
func state_for(id: String, severity: int = 2) -> PetState:
	var state := Fixture.create("anonymous-six-"+id)
	if id.is_empty(): return state
	var kind := ConditionKinds.get_kind(id)
	var care = ConditionPresentation.care(state,kind.family)
	match kind.family:
		"injury": care.activate(state.stats,"walking",severity)
		"stress": care.activate(state.stats,state.skills,severity)
		_: care.activate(state.stats,severity)
	care.specific_kind = id
	return state
func capture(state, time: float, still: bool = false, body_only: bool = false) -> Image:
	appearance.apply(pet,100,state,still,time)
	effect.refresh(state,pet,"idle",false,Rect2(0,0,320,270),still,time)
	effect.visible = not body_only
	await process_frame
	await RenderingServer.frame_post_draw
	return viewport.get_texture().get_image()
func changed(a: Image, b: Image, region: Rect2i = Rect2i(0,0,320,270)) -> int:
	var count := 0
	for y in range(region.position.y,region.end.y):
		for x in range(region.position.x,region.end.x):
			if a.get_pixel(x,y) != b.get_pixel(x,y): count += 1
	return count
func run() -> void:
	SettingsCheck.load_all()
	for severity in [1,2,3]:
		var period: float = [16.0,12.0,10.0][severity-1]
		check(Motion.season(severity,0,false).x==0 and Motion.season(severity,period*.26,false).x==1 and Motion.season(severity,period*.51,false).x==2 and Motion.season(severity,period*.76,false).x==3,"Four seasons occur in the deliberately wrong order")
		var hold: float = [1.25,2.0,3.0][severity-1]
		check(is_equal_approx(Motion.reflection_time(hold*.7,severity,false),0),"Reflection holds a real previous pose")
		check(is_equal_approx(Motion.reflection_time(hold+.71,severity,false),hold+.71),"Reflection catches up fully after its hold")
	check(Motion.slip(3,0,true).x>Motion.slip(1,0,true).x,"Severe slip leans farther")
	check(Motion.slip(3,0,true).y>Motion.slip(1,0,true).y,"Severe slip squashes farther")
	check(Motion.mismatch(3,0,true).x>Motion.mismatch(1,0,true).x,"Mixed weather spreads across more body")
	if DisplayServer.get_name()=="headless": quit(1); return
	viewport = SubViewport.new()
	viewport.size = Vector2i(320,270)
	viewport.transparent_bg = true
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(viewport)
	var character := CharacterPackage.new()
	character.load_config("res://assets/pets/demo/config.json")
	pet = PetAnimation.new()
	pet.set_character(character)
	pet.texture = character.animations["idle"].textures[0]
	pet.position = Vector2(60,50)
	pet.size = Vector2(160,160)
	pet.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	pet.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	pet.playing = false
	pet.set_process(false)
	viewport.add_child(pet)
	viewport.add_child(effect)
	var source_texture := pet.texture
	var original_pixels := pet.texture.get_image().get_data()
	var healthy := state_for("")
	var clean := await capture(healthy,0)
	var anchored_position := pet.position
	var anchored_size := pet.size
	var anchored_action := pet.action
	for id in Motion.IDS:
		var state := state_for(id)
		var active := await capture(state,2.4)
		check(changed(clean,active)>80,"Visible disease presentation: "+id)
		var later := await capture(state,.7)
		check(changed(active,later)>10 or id=="trademark_064","Presentation animates: "+id)
		var frozen := await capture(state,1,true)
		var frozen_later := await capture(state,90,true)
		check(frozen.get_data()==frozen_later.get_data(),"Reduced motion stays fixed: "+id)
		var mild := await capture(state_for(id,1),2.4,true)
		var severe := await capture(state_for(id,3),2.4,true)
		check(changed(mild,severe)>30,"Severity changes actual rendered pixels: "+id)
		var body := await capture(state,2.4,false,true)
		check(changed(clean,body)>100,"Body symptoms deform/tint the pet, including the upright reflection: "+id)
		var restored := await capture(healthy,10)
		check(restored.get_data()==clean.get_data(),"Cure restores every pixel: "+id)
		check(pet.texture.get_image().get_data()==original_pixels,"Source artwork untouched: "+id)
		check(pet.position==anchored_position and pet.size==anchored_size and pet.action==anchored_action,"Gameplay position, size and action unchanged: "+id)
		pet.flip_h = true
		var flipped := await capture(state,2.4)
		check(flipped.get_used_rect().size != Vector2i.ZERO,"Facing left keeps the disease visible: "+id)
		pet.flip_h = false
	# Body changes and attached discharge must follow the same limb when facing reverses.
	for id in ["trademark_055","trademark_065","trademark_096"]:
		var state := state_for(id)
		pet.flip_h = false
		var right := await capture(state,2.4,false,true)
		pet.flip_h = true
		var left := await capture(state,2.4,false,true)
		var difference := 0
		for y in range(270):
			for x in range(280):
				if (Vector4(right.get_pixel(x,y).r,right.get_pixel(x,y).g,right.get_pixel(x,y).b,right.get_pixel(x,y).a)-Vector4(left.get_pixel(279-x,y).r,left.get_pixel(279-x,y).g,left.get_pixel(279-x,y).b,left.get_pixel(279-x,y).a)).length()>.04: difference += 1
		check(difference<80,"Facing mirrors body symptoms onto the same source limbs: "+id)
		pet.flip_h = false
	# Capture the full repeated motion at a non-boundary time and its next cycle.
	for pair in [["trademark_050",12.0],["trademark_055",6.0],["trademark_064",5.0],["trademark_065",4.0],["trademark_066",12.0],["trademark_096",6.0]]:
		var state := state_for(pair[0])
		var a := await capture(state,.8)
		var b := await capture(state,.8+pair[1])
		check(changed(a,b)<=5,"Loop closes without a pose jump: "+pair[0])
	# A different live frame must not change a held reflection, then must appear after catch-up.
	var reflection := state_for("trademark_064")
	var red := Image.create(64,64,false,Image.FORMAT_RGBA8)
	red.fill(Color.RED)
	var blue := Image.create(64,64,false,Image.FORMAT_RGBA8)
	blue.fill(Color.BLUE)
	pet.texture = ImageTexture.create_from_image(red)
	var first := await capture(reflection,0)
	pet.texture = ImageTexture.create_from_image(blue)
	var held := await capture(reflection,1)
	check(effect.original_motifs.history.at(effect.original_motifs.followup_art.last_reflection_time).texture.get_image().get_pixel(0,0)==Color.RED,"Held reflection uses the actual earlier red frame while the live pet is blue")
	check(held.get_pixel(140,130).a>.55 and held.get_pixel(140,130).a<.70,"The upright version is translucent")
	check(held.get_pixel(140,235).a>.99 and held.get_pixel(140,235).r>.99 and held.get_pixel(140,235).g<.01,"The held lower reflection keeps solid original red pixels")
	var caught := await capture(reflection,2.8)
	check(effect.original_motifs.history.at(effect.original_motifs.followup_art.last_reflection_time).texture==pet.texture,"Catch-up reaches the current blue frame")
	check(changed(held,caught,Rect2i(70,220,140,45))>100,"Catch-up visibly changes the reflected pixels")
	check(caught.get_pixel(140,235).a>.99 and caught.get_pixel(140,235).b>.99,"The lower image remains solid after catching up")
	pet.texture = source_texture
	# Conditions from distinct families combine without replacing each other's uniforms.
	var combined := state_for("trademark_055")
	combined.infection_care.activate(combined.stats,2)
	combined.infection_care.specific_kind = "trademark_065"
	combined.digestive_care.activate(combined.stats,2)
	combined.digestive_care.specific_kind = "trademark_096"
	combined.stress_care.activate(combined.stats,combined.skills,2)
	combined.stress_care.specific_kind = "trademark_064"
	await capture(combined,2.8)
	check(appearance.material.get_shader_parameter("follow_slip").x>0 and appearance.material.get_shader_parameter("follow_storm").x==2 and appearance.material.get_shader_parameter("follow_mismatch").x>0,"Three independent body effects coexist")
	var restored := await capture(healthy,10)
	check(restored.get_data()==clean.get_data(),"Combined cure leaves no body or reflection residue")
	# Atlas padding cannot sample a neighboring yellow frame during deformation.
	var pixels := Image.create(128,64,false,Image.FORMAT_RGBA8)
	pixels.fill(Color.YELLOW)
	pixels.fill_rect(Rect2i(64,0,64,64),Color.TRANSPARENT)
	pixels.fill_rect(Rect2i(80,16,32,32),Color.BLUE)
	var atlas := AtlasTexture.new()
	atlas.atlas = ImageTexture.create_from_image(pixels)
	atlas.region = Rect2(64,0,64,64)
	pet.texture = atlas
	for id in ["trademark_055","trademark_065","trademark_096"]:
		var rendered := await capture(state_for(id),2.4,false,true)
		var yellow := 0
		var visible := 0
		for y in range(270):
			for x in range(320):
				var color := rendered.get_pixel(x,y)
				if color.a>.5:
					visible += 1
					if color.r>.85 and color.g>.85 and color.b<.2: yellow += 1
		check(yellow==0 and visible>100,"Atlas frame boundaries stay isolated: "+id)
	viewport.queue_free()
	await process_frame
	print("RESULT: %d six-disease checks, %d failures"%[checks,failures])
	quit(1 if failures else 0)
