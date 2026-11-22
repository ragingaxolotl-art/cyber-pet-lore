class_name ConditionCauses
extends RefCounted
## Fictional cause labels share their family's treatment, penalties and recovery.
const FOOD := {"Carbs":"carb_bloat","Protein":"protein_knot","Fats":"oil_churn","Vitamins":"vitamin_fizz","Water":"water_wobble"}
const NAMES := {"carb_bloat":"Carb Bloat","protein_knot":"Protein Knot","oil_churn":"Oil Churn","vitamin_fizz":"Vitamin Fizz","water_wobble":"Water Wobble","overfull":"Overfull Belly","travel_queasy":"Travel Queasiness","overwhelmed":"Crowd Frazzle","spooked":"Echo Fright","lonely":"Separation Static","chroma_drain":"Chroma Drain","signal_flicker":"Signal Flicker","mite_bite":"Static Mite Ambush","echo_strike":"Echo Wisp Strike","crystal_snare":"Crystal Crawler Pinch"}
const FAMILIES := {"digestive":["carb_bloat","protein_knot","oil_churn","vitamin_fizz","water_wobble","overfull","travel_queasy"],"stress":["overwhelmed","spooked","lonely","chroma_drain","signal_flicker"],"injury":["mite_bite","echo_strike","crystal_snare"]}
const EMOTES := {"carb_bloat":"drooling","protein_knot":"speechless","oil_churn":"sweat","vitamin_fizz":"dizzy","water_wobble":"dizzy","overfull":"speechless","travel_queasy":"dizzy","overwhelmed":"frustrated","spooked":"question","lonely":"brokenheart","chroma_drain":"down","signal_flicker":"dizzy","mite_bite":"angry","echo_strike":"speechless","crystal_snare":"crying"}
# Explicit encounter sites. These use the existing injury roll, not extra rolls.
const ENCOUNTERS := {"atlas_016":"mite_bite","atlas_095":"echo_strike","atlas_037":"crystal_snare"}
const BLINK_SECONDS := 2.4

static func valid(origin: Variant, family: String) -> bool:
	if not origin is Dictionary: return false
	if origin.is_empty(): return true
	if origin.size() != 2 or origin.get("cause") not in FAMILIES.get(family,[]): return false
	var source = origin.get("source")
	return source is String and source.length() <= 160 and (source.is_empty() or source in FoodCatalog.NUTRIENTS or ParasiteCare.valid_location(source))

static func origin(condition) -> Dictionary:
	return condition.origin if condition is DigestiveCare or condition is StressCare or condition is InjuryCare else {}

static func label(condition, fallback: String) -> String:
	return NAMES.get(origin(condition).get("cause",""),fallback)

static func location_context(id: String) -> Dictionary:
	var location := LocationVisualPolicy.location_for(id)
	if location.is_empty():
		for candidate in LocationVisualPolicy.atlas().values():
			if candidate.id == id or LocationVisualPolicy.settings_id(candidate) == id:
				location = candidate
				break
	var profile := SceneryProfiles.for_rendering(id)
	var tags: Array = profile.get("tags",[])
	if BackgroundSettings.overrides.has(id): tags = BackgroundSettings.overrides[id].get("tags",tags)
	var corruption := LocationVisualPolicy.severity(location) if not location.is_empty() else 0
	var stress := "signal_flicker" if corruption >= 4 else ("chroma_drain" if corruption == 3 else ("spooked" if "Uncanny" in tags or "Nocturnal" in tags else "overwhelmed" if "Busy" in tags else ""))
	return {"stress":stress,"injury":ENCOUNTERS.get(location.get("id",""),""),"digestive":"travel_queasy"}

static func explanation(condition) -> String:
	var details := origin(condition)
	if details.is_empty(): return ""
	var cause: String = details.cause
	var source: String = details.source
	if cause in FOOD.values(): return "Cause: several substantial meals dominated by %s. Vary the next meals and wait until hungry; digestion medicine treats this condition." % source
	if cause == "overfull": return "Cause: prolonged very high Fullness. Wait until hungry; vary portions or use digestion medicine."
	if cause == "lonely": return "Cause: the teacher-enabled absence rule. Calm care, rest or stress medicine helps."
	var place := source
	var source_location := LocationVisualPolicy.location_for(source)
	for location in LocationVisualPolicy.atlas().values():
		if location.id == source or LocationVisualPolicy.settings_id(location) == source or source_location.get("id","") == location.id:
			place = location.name
			break
	if place.is_empty(): place = "a location encounter"
	if cause in FAMILIES.injury: return "Encounter: %s at %s. Injury medicine treats the wound; the effect clears when the injury does." % [NAMES[cause],place]
	if cause == "travel_queasy": return "Cause: a stomach-risk encounter at %s. Rest during care or use digestion medicine." % place
	return "Cause: %s at %s. Calm care, rest or stress medicine helps; leaving alone does not instantly cure it." % ["corrupted signals" if cause in ["chroma_drain","signal_flicker"] else "unsettling surroundings" if cause == "spooked" else "busy surroundings",place]

static func visual(state, reduced_motion: bool, seconds: float) -> Vector2:
	if state == null or not state.stress_care.active(): return Vector2(0,1)
	var cause: String = state.stress_care.origin.get("cause","")
	var strength: float = clampf(state.stress_care.severity/3.0,0,1)
	if cause == "chroma_drain": return Vector2(.35+.6*strength,1)
	if cause == "signal_flicker":
		# Slow smooth character-only blink; never hide the pet or flash the screen.
		var depth := .18+.22*strength
		return Vector2(.2,1-depth*.5 if reduced_motion else 1-depth*(.5-.5*cos(TAU*seconds/BLINK_SECONDS)))
	return Vector2(0,1)
