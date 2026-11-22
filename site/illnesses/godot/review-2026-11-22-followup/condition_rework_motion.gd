extends RefCounted
## Shared presentation clocks keep the body shader and nearby artwork in step.
## Stage values are mild / moderate / severe; none change gameplay recovery.
const IDS := ["trademark_020","trademark_032","trademark_054","trademark_059","trademark_061","trademark_073","trademark_079","trademark_100"]

static func stage(severity: float) -> int:
	return clampi(int(severity),1,3)

static func cycle(seconds: float, period: float, still: bool, resting: float = .5) -> float:
	return resting if still else fposmod(seconds/period,1.0)

static func pull(seconds: float, period: float, still: bool) -> float:
	var phase := cycle(seconds,period,still)
	return smoothstep(.04,.32,phase)*(1.0-smoothstep(.65,.96,phase))

static func signals(severity: float, seconds: float, still: bool) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var count := stage(severity)
	for index in range(count):
		var phase := .77-(count-1-index)*.22 if still else fposmod(seconds/6.0+float(index)/count,1.0)
		var travel := smoothstep(.02,.37,phase) if phase < .40 else 1.0-smoothstep(.40,.67,phase)
		var impact := (phase-.67)/.30 if phase >= .67 and phase <= .97 else -1.0
		result.append({"phase":phase,"travel":travel,"impact":impact,"angle":-PI*.5+(index-(count-1)*.5)*.9})
	return result

static func moons(severity: float, seconds: float, still: bool) -> Vector3:
	var values := Vector3()
	for index in range(3):
		var angle := (2.0 if still else seconds)*TAU/8.0+index*TAU/3.0
		values[index] = (.14+.055*stage(severity))*(.5+.5*sin(angle))
	return values

static func dawn(severity: float, seconds: float, still: bool) -> Dictionary:
	var hold: float = [2.0,4.0,7.0][stage(severity)-1]
	var elapsed := 2.0+hold*.5 if still else fposmod(seconds,hold+5.0)
	var rise := smoothstep(0,2,elapsed)
	var breaking := clampf((elapsed-2.0-hold)/2.0,0,1)
	return {"level":lerpf(1.05,.50,rise),"light":rise*(1.0-smoothstep(0,1,breaking)),"breaking":breaking,"hold":hold,"period":hold+5.0}

static func gravity(severity: float, seconds: float, still: bool) -> Vector4:
	var values := Vector4()
	for index in range(4):
		var angle := (1.7 if still else seconds)*TAU/8.0+index*PI*.5
		values[index] = (.18+.13*stage(severity))*(.45+.55*(.5+.5*sin(angle)))
	return values

static func folds(severity: float, seconds: float, still: bool) -> Vector2:
	return Vector2((.18+.14*stage(severity))*pull(seconds,8.0,still),2+stage(severity)*2)

static func beacon_count(severity: float) -> int:
	return stage(severity)+1


static func door_walk(severity: float, seconds: float, still: bool) -> Dictionary:
	var period: float = [8.0,6.0,4.0][stage(severity)-1]
	var phase := .48 if still else fposmod(seconds/period,1.0)
	return {"period":period,"phase":phase,"stride":0.0 if still else phase*TAU*6.0}

static func door_layout(body: Rect2, bounds: Rect2, scale: float, severity: float) -> Dictionary:
	var size := Vector2((28+severity*3)*scale,body.size.y*1.12)
	var left := body.get_center()-Vector2(body.size.x*.80,0)
	var right := body.get_center()+Vector2(body.size.x*.80,0)
	left = left.clamp(bounds.position+size*.5,bounds.end-size*.5)
	right = right.clamp(bounds.position+size*.5,bounds.end-size*.5)
	return {"left":Rect2(left-size*.5,size),"right":Rect2(right-size*.5,size),"mouths":Vector2(left.x+size.x*.5-2*scale,right.x-size.x*.5+2*scale)}
