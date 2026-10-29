class_name ConditionPresentation
extends RefCounted
## Stable cosmetic variants over existing saved conditions; no new illness rolls.
const ART := "res://assets/care/pixellab-2026-10-28/"
const ORIGINAL_ART := "res://assets/care/illness-originals/"
const LEGACY_ART := "res://assets/care/pixellab-2026-10-23/"
const ORDER := ["digestive","infection","parasites","chronic","injury","fatigue","stress"]
const TITLES := {"glitch_fever":"Glitch Fever", "infection_crystal_rash":"Crystal Bloom", "parasite_moss_crown":"Mosswire", "parasite_spore_fan":"Sporefan", "static_mites":"Static Mites", "bitrot_patch":"Bitrot", "phase_drift":"Phase Drift", "stress_tangle":"Stress", "injury_bruise":"Injury", "fatigue_droplets":"Fatigue", "queasy_bubbles":"Digestive discomfort"}
static var textures: Dictionary = {}

static func care(state, key: String):
	return state.get(("parasite" if key == "parasites" else key)+"_care")

static func variant(state, key: String) -> String:
	var condition = care(state,key)
	if condition.active() and not condition.specific_kind.is_empty():
		return str(ConditionKinds.get_kind(condition.specific_kind).get("asset","bitrot_patch"))
	var seed_value := ("condition-art-v1/"+str(state.character_id)+"/"+key).sha256_text().left(8).hex_to_int()
	match key:
		"infection": return ["infection_crystal_rash","glitch_fever"][seed_value%2]
		"parasites":
			if state.parasite_care.parasite_type == "plant_basic": return "parasite_moss_crown"
			return ["parasite_spore_fan","static_mites"][seed_value%2]
		"chronic": return "bitrot_patch"
		"stress": return "phase_drift"
		"injury": return "injury_bruise"
		"fatigue": return "fatigue_droplets"
		_: return "queasy_bubbles"

static func stage(severity: float) -> String:
	if severity <= 0: return "Healthy"
	if severity <= 1: return "Mild"
	if severity <= 2: return "Moderate"
	return "Severe"

static func texture(id: String) -> Texture2D:
	if id.is_empty(): return null
	if not textures.has(id):
		var directory := ORIGINAL_ART if ResourceLoader.exists(ORIGINAL_ART+id+".png") else (ART if ResourceLoader.exists(ART+id+".png") else LEGACY_ART)
		textures[id] = load(directory+id+".png")
	return textures[id]

static func entries(state) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for key in ORDER:
		var condition = care(state,key)
		if not condition.active(): continue
		var id := variant(state,key)
		var support := ""
		if condition.severity > 2:
			match key:
				"infection": support = "fever_heat"
				"parasites": support = "stress_tangle" if id == "static_mites" else "fatigue_droplets"
				"chronic": support = "fatigue_droplets"
				"stress": support = "confused_swirl"
		elif key == "infection" and id == "glitch_fever" and condition.severity > 1:
			support = "confused_swirl"
		elif key == "stress" and condition.severity > 1:
			support = "stress_tangle"
		if key == "fatigue" and condition.mental() and condition.severity > 1:
			support = "confused_swirl" if condition.severity > 2 else "stress_tangle"
		result.append({"key":key,"asset":id,"name":str(ConditionKinds.get_kind(condition.specific_kind).name) if not condition.specific_kind.is_empty() else (condition.label() if key == "fatigue" else ConditionCauses.label(condition,TITLES[id])),"stage":stage(condition.severity),"severity":float(condition.severity),"support":support,"emote":ConditionCauses.EMOTES.get(ConditionCauses.origin(condition).get("cause",""),"")})
	return result

static func snapshot(state) -> Dictionary:
	var result := {}
	for key in ORDER:
		var condition = care(state,key)
		result[key] = float(condition.severity) if condition.active() else 0.0
	return result

static func record_saved_treatment(state, before: Dictionary) -> void:
	# Called ONLY after a successful save; failed transactions never acknowledge care.
	var after := snapshot(state)
	for key in ORDER:
		if after[key] < before.get(key,0.0):
			state.condition_visual_feedback[key] = {"until":Time.get_ticks_msec()+4000,"bandaged":key == "injury"}

static func feedback(state, key: String) -> Dictionary:
	var item: Dictionary = state.condition_visual_feedback.get(key,{})
	return item if item.get("until",0) > Time.get_ticks_msec() else {}

static func headline(state) -> String:
	var labels: Array[String] = []
	for entry in entries(state):
		var recovering := not feedback(state,entry.key).is_empty()
		labels.append("%s (%s) · %s%s" % [entry.name,String(entry.key).capitalize(),entry.stage," · treatment helped" if recovering else ""])
	return "\n".join(labels)

static var animation_sheets: Dictionary = {}
static func animated_texture(id: String, seconds: float, reduced_motion: bool) -> Texture2D:
	if id == "static_mite_single" and not reduced_motion:
		if not animation_sheets.has(id): animation_sheets[id] = load(ORIGINAL_ART+"static_mite_walk.png")
		var gait := AtlasTexture.new()
		gait.atlas = animation_sheets[id]
		gait.region = Rect2((int(maxf(0,seconds)*8.0)%8)*64,0,64,64)
		return gait
	var original_sizes := {"pumpwire_leech_v2":Vector2(96,64),"memory_reedling_v2":Vector2(96,128),"coral_polyp_branch":Vector2(128,128)}
	if original_sizes.has(id) and not reduced_motion:
		if not animation_sheets.has(id): animation_sheets[id] = load(ORIGINAL_ART+id+"-loop.png")
		var frame := AtlasTexture.new()
		frame.atlas = animation_sheets[id]
		var dimensions: Vector2 = original_sizes[id]
		frame.region = Rect2(Vector2((int(maxf(0,seconds)*6.0)%8)*dimensions.x,0),dimensions)
		return frame
	var path := ART+"animations/"+id+".png"
	if reduced_motion or not ResourceLoader.exists(path): return texture(id)
	if not animation_sheets.has(id): animation_sheets[id] = load(path)
	var sheet: Texture2D = animation_sheets[id]
	var count := maxi(1,sheet.get_width()/128)
	var frame := int(maxf(0,seconds)*6.0)%count
	var result := AtlasTexture.new()
	result.atlas = sheet
	result.region = Rect2(frame*128,0,128,128)
	return result
