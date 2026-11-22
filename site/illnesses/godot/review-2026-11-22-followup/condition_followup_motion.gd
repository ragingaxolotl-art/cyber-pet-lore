extends RefCounted
## Presentation settings for the six follow-up diseases. No care or save changes.
const IDS := ["trademark_050","trademark_055","trademark_064","trademark_065","trademark_066","trademark_096"]

static func stage(severity: float) -> int:
	return clampi(int(severity),1,3)

static func season(severity: float, seconds: float, still: bool) -> Vector4:
	var s := stage(severity)
	var duration: float = [4.0,3.0,2.5][s-1]
	var time := duration*.50 if still else fposmod(seconds,duration*4)
	var phase := fposmod(time/duration,1.0)
	var envelope := smoothstep(0,.20,phase)*(1-smoothstep(.78,1,phase))
	# Sprout -> frost -> autumn -> dry summer: deliberately out of order.
	return Vector4(floor(time/duration),phase,envelope,[.38,.65,.92][s-1])

static func slip(severity: float, seconds: float, still: bool) -> Vector4:
	var s := stage(severity)
	var period: float = [8.0,6.0,4.0][s-1]
	var phase := .36 if still else fposmod(seconds/period,1.0)
	var loss := smoothstep(.12,.30,phase)*(1-smoothstep(.52,.82,phase))
	# lean (radians), squash, foot displacement, cycle phase
	return Vector4((.12+s*.065)*loss,(.02+s*.06)*loss,(.06+s*.055)*loss,phase)

static func reflection_time(seconds: float, severity: float, still: bool) -> float:
	if still: return seconds
	var hold: float = [1.25,2.0,3.0][stage(severity)-1]
	var period: float = [4.0,5.0,6.0][stage(severity)-1]
	var elapsed := fposmod(seconds,period)
	var lag := elapsed if elapsed<hold else hold*(1-smoothstep(hold,hold+.70,elapsed))
	return seconds-lag

static func storm_phase(severity: float, seconds: float, still: bool) -> float:
	return .80 if still else fposmod(seconds/[6.0,4.0,3.0][stage(severity)-1],1.0)

static func storm_target(index: int) -> Vector2:
	return [Vector2(.50,.06),Vector2(.08,.58),Vector2(.88,.82)][index%3]

static func scar_center(index: int) -> Vector2:
	return [Vector2(.28,.43),Vector2(.69,.66),Vector2(.35,.83),Vector2(.72,.33),Vector2(.49,.57)][index%5]

static func scar_radius(severity: float) -> float:
	return [.13,.18,.23][stage(severity)-1]

static func mismatch(severity: float, seconds: float, still: bool) -> Vector3:
	var s := stage(severity)
	var phase := .32 if still else fposmod(seconds/6.0,1.0)
	return Vector3([.42,.69,.94][s-1],.5+.5*sin(phase*TAU),(.055+s*.035)*(.65+.35*sin(phase*TAU)))

static func apply(material: ShaderMaterial, levels: Dictionary, seconds: float, still: bool) -> bool:
	material.set_shader_parameter("follow_season",season(levels.trademark_050,seconds,still) if levels.has("trademark_050") else Vector4.ZERO)
	var footing := slip(levels.trademark_055,seconds,still) if levels.has("trademark_055") else Vector4.ZERO
	material.set_shader_parameter("follow_slip",footing)
	var storm: float = levels.get("trademark_065",0)
	material.set_shader_parameter("follow_storm",Vector2(storm,storm_phase(storm,seconds,still)))
	material.set_shader_parameter("follow_scar",levels.get("trademark_066",0))
	material.set_shader_parameter("follow_clock",2.4 if still else fposmod(seconds,12.0))
	var weather := mismatch(levels.trademark_096,seconds,still) if levels.has("trademark_096") else Vector3.ZERO
	material.set_shader_parameter("follow_mismatch",weather)
	return footing.x>0 or storm>0 or weather.x>0
