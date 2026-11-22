class_name ConditionKinds
extends RefCounted
## Named variants retain their family treatment and saved identity.
static var catalog: Dictionary = {}
static var random_draw: Callable = randf
static func data() -> Dictionary:
	if catalog.is_empty(): catalog = JSON.parse_string(FileAccess.get_file_as_string("res://config/condition_kinds.json"))
	return catalog
static func get_kind(id: String) -> Dictionary:
	return data().kinds.get(id,{})
static func choose(family: String) -> String:
	var pool: Array = data().pools.get(family,[])
	return str(pool[clampi(int(float(random_draw.call())*pool.size()),0,pool.size()-1)]) if not pool.is_empty() else ""
static func valid_saved(value: Variant, family: String) -> bool:
	return value is String and (value.is_empty() or get_kind(value).get("family","") == family)
