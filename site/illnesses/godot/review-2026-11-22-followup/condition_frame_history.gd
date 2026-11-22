class_name ConditionFrameHistory
extends RefCounted
## A bounded history of real character frames, not generated substitute poses.
var samples: Array[Dictionary] = []
var identity := ""
func record(pet: PetAnimation, seconds: float, character_id: String) -> void:
	if character_id != identity or (not samples.is_empty() and seconds < float(samples[-1].time)):
		samples.clear()
		identity = character_id
	if not samples.is_empty() and seconds-float(samples[-1].time) < 1.0/15.0: return
	samples.append({"time":seconds,"texture":pet.texture,"rect":Rect2(pet.position,pet.size),"flip":pet.flip_h})
	while samples.size() > 76: samples.pop_front()
func at(seconds: float) -> Dictionary:
	if samples.is_empty(): return {}
	for index in range(samples.size()-1,-1,-1):
		if float(samples[index].time) <= seconds: return samples[index]
	return samples[0]
