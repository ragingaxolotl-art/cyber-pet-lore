class_name ConditionMedicines
extends RefCounted
## Rank real configured medicine effects; never infer treatment from an item's name.
const BASE_NAMES := {"vita_patch":"Lightweave","field_bandage":"Wrapwheel","emergency_medkit":"Helpbox","antiseptic_wipes":"Sweepfold","broad_spectrum_antibiotics":"Beadpress","immune_serum":"Dewbell","detox_antidote":"Siftstone","antiseptic_pack":"Washwing","rapid_painkillers":"Easekey","red_heart":"Threadshell"}

static func catalog(state) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var patch: Dictionary = state.digestive_care.tuning.medicine.duplicate(true)
	patch.treats = ["infection","digestive","parasites"]
	_append(result,"vita_patch",patch,state.digestive_care.patches,"patch")
	for family in ["injury","infection","parasites","chronic","stress","medicines"]:
		var owner = state.medicine_supplies if family == "medicines" else ConditionPresentation.care(state,family)
		for id in owner.tuning.supplies:
			var item: Dictionary = owner.tuning.supplies[id].duplicate(true)
			if family == "injury": item.treats = ["injury","chronic"] if id == "emergency_medkit" else ["injury"]
			elif family == "infection": item.treats = ["infection"]
			elif family == "chronic": item.treats = ["injury","chronic"]
			_append(result,id,item,owner.supplies[id],family)
	return result

static func _append(result: Array[Dictionary], id: String, item: Dictionary, owned: int, family: String) -> void:
	item.id = id
	item.label = item.get("label",BASE_NAMES.get(id,id))
	item.owned = owned
	item.family = family
	result.append(item)

static func doses_to_clear(severity: float, item: Dictionary) -> int:
	if severity <= 0: return 0
	if item.get("instant_cure",false): return 1
	var power := float(item.get("treatment_power",0))
	# Every model clamps surviving severity to >=1. Sub-one doses cannot cure it.
	if not is_finite(power) or power < 1: return 0
	var left := severity
	for dose in range(1,100):
		left -= power
		if left <= 0: return dose
		left = maxf(1,left)
	return 0

static func recommendations(state, key: String) -> Dictionary:
	var condition = ConditionPresentation.care(state,key)
	if not condition.active(): return {}
	var candidates: Array[Dictionary] = []
	for item in catalog(state):
		if key not in item.get("treats",[]): continue
		# Avoid recommending drawback potions even when the affected condition is absent.
		if not item.get("worsens",[]).is_empty(): continue
		var doses := doses_to_clear(condition.severity,item)
		if doses == 0: continue
		item.doses = doses
		item.total_price = int(item.price)*doses
		item.missing = maxi(0,doses-int(item.owned))
		item.purchase_price = int(item.price)*int(item.missing)
		candidates.append(item)
	if candidates.is_empty(): return {}
	candidates.sort_custom(func(a: Dictionary,b: Dictionary):
		if a.total_price != b.total_price: return a.total_price < b.total_price
		if a.doses != b.doses: return a.doses < b.doses
		return String(a.id) < String(b.id))
	var one_dose := {}
	for item in candidates:
		if item.doses == 1:
			one_dose = item
			break
	var in_bag := {}
	for item in candidates:
		if item.missing == 0 and (in_bag.is_empty() or item.doses < in_bag.doses): in_bag = item
	return {"course":candidates[0],"one_dose":one_dose,"in_bag":in_bag}

static func describe(item: Dictionary) -> String:
	return "%s ×%d · %d silver total · own %d · buy %d (%d silver)" % [item.label,item.doses,item.total_price,item.owned,item.missing,item.purchase_price]

static func guidance(state) -> String:
	var lines: Array[String] = []
	for entry in ConditionPresentation.entries(state):
		var advice := recommendations(state,entry.key)
		var header := "%s (%s) · %s" % [entry.name,String(entry.key).capitalize(),entry.stage]
		if advice.is_empty():
			lines.append(header+"\nNo configured medicine course can fully clear this condition.")
			continue
		var line := header+"\nIts treatment family also covers this named variant, including trademark conditions."
		var reason := ConditionCauses.explanation(ConditionPresentation.care(state,entry.key))
		if not reason.is_empty(): line += "\n"+reason
		if not advice.in_bag.is_empty(): line += "\nAlready in your bag: "+describe(advice.in_bag)
		line += "\nLowest-price full course: "+describe(advice.course)
		if not advice.one_dose.is_empty() and advice.one_dose.id != advice.course.id:
			line += "\nOne-dose cure: "+describe(advice.one_dose)
		elif advice.course.doses > 1:
			line += "\nNo one-dose cure at this severity; use doses one at a time and recheck."
		else: line += "\nOne dose clears the current severity."
		if advice.course.purchase_price > state.inventory.gold: line += "\nMore silver needed for the full course."
		lines.append(line)
	if lines.is_empty(): return "No active conditions; no cure needed."
	return "Recommended game medicines\nPrices compare repeated doses of one medicine; no drawback potions recommended. Recommendations do not buy or use items. A medicine may help multiple conditions; recheck after each dose.\n\n"+"\n\n".join(lines)
