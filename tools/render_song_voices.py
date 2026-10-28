"""Synthesize DBA vocal timbres. Every pitched event comes from score.json."""
from pathlib import Path
import json, math, struct, wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'site/songs/voices-v2'
MASTERS=Path('/private/tmp/era-zero-semantic-choir-masters')
RATE=32000
book=json.loads((OUT/'score.json').read_text())
MASTERS.mkdir(exist_ok=True)
def track(events):
 def vlq(n):
  a=[n&127];n>>=7
  while n:a.insert(0,(n&127)|128);n>>=7
  return bytes(a)
 result=b'';previous=0
 for tick,priority,data in sorted(events,key=lambda e:(e[0],e[1])):
  result+=vlq(tick-previous)+data;previous=tick
 result+=b'\x00\xff\x2f\x00'
 return b'MTrk'+struct.pack('>I',len(result))+result

def midi(path,voices,bpm):
 tracks=[track([(0,0,b'\xff\x51\x03'+round(60000000/bpm).to_bytes(3,'big'))])]
 for channel,v in enumerate(voices):
  name=v['name'].encode();events=[(0,0,b'\xff\x03'+bytes([len(name)])+name),(0,0,bytes([0xc0+channel,53]))]
  for n in v['notes']:
   events.extend([(round(n['beat']*480),2,bytes([0x90+channel,n['note'],84])),(round((n['beat']+n['length'])*480),1,bytes([0x80+channel,n['note'],0]))])
  tracks.append(track(events))
 path.write_bytes(b'MThd'+struct.pack('>IHHH',6,1,len(tracks),480)+b''.join(tracks))

def vocal(note,duration,voice):
 # Pure harmonic source with vowel-like spectral shaping, no separate pitched ornament.
 t=np.arange(round(duration*RATE))/RATE
 frequency=440*2**((note-69)/12)
 formants={'rounded':[(420,150),(1050,230),(2300,360)],'bright':[(620,180),(1750,240),(2800,380)],'resonant':[(320,140),(850,200),(2100,340)]}[voice]
 y=np.zeros(len(t));weight_sum=0
 for harmonic in range(1,13):
  f=frequency*harmonic
  if f>=RATE/2:continue
  weight=(1 if harmonic==1 else .22/harmonic)+sum(.20*math.exp(-.5*((f-center)/width)**2)/harmonic for center,width in formants)
  y+=weight*np.sin(2*np.pi*f*t);weight_sum+=weight
 y/=weight_sum
 attack=np.minimum(t/.022,1);release=np.minimum(np.maximum(duration-t,0)/.028,1)
 # A little amplitude variation makes a held voice breathe without adding notes.
 envelope=attack*release*(.94+.06*np.cos(2*np.pi*3.4*t))
 return (y*envelope*.32).astype(np.float32)

def wav(path,arr):
 with wave.open(str(path),'wb') as f:
  f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(np.round(arr*32767).astype('<i2').tobytes())

results=[]
for song in book['songs']:
 folder=OUT/song['folder'];folder.mkdir(exist_ok=True)
 master=MASTERS/song['folder'];master.mkdir(exist_ok=True)
 arrays=[]
 for voice in song['voices']:
  a=np.zeros((math.ceil(song['seconds']*RATE),2),np.float32)
  for note in voice['notes']:
   start=round(note['beat']*60/song['bpm']*RATE)
   sample=vocal(note['note'],note['length']*60/song['bpm'],voice['timbre'])
   end=min(len(a),start+len(sample));sample=sample[:end-start]
   angle=(voice['pan']+1)*np.pi/4
   a[start:end,0]+=sample*np.cos(angle);a[start:end,1]+=sample*np.sin(angle)
  arrays.append(a)
 mix=sum(arrays);gain=.86/float(np.max(np.abs(mix)))
 wav(master/'song.wav',mix*gain)
 for v,a in zip(song['voices'],arrays):
  # Same gain as ensemble so isolated voices retain their intended balance.
  wav(master/(v['id']+'.wav'),a*gain)
  midi(folder/(v['id']+'.mid'),[v],song['bpm'])
 midi(folder/'arrangement.mid',song['voices'],song['bpm'])
 lines=[song['title'],'Three meaningful DBA voices; every voice uses canonical assertions in runtime state 1.','Simultaneous lines are independent statements. English titles and the backstory are not extra translated lyrics.','']
 for v in song['voices']:
  lines+=['VOICE: '+v['name']]
  for l in v['lines']:lines.append(f"{l['start']:.3f}–{l['end']:.3f}s | {l['carrier']} | {l['gloss']} [{l['target']}]\n{l['definition']}")
  lines.append('')
 (folder/'meanings.txt').write_text('\n'.join(lines)+'\n')
 results.append({'song':song['title'],'seconds':song['seconds'],'voices':3,'statements':36,'musicalNotes':sum(len(v['notes']) for v in song['voices']),'peak':float(np.max(np.abs(mix*gain)))})
 print('Rendered '+song['title'],flush=True)
(OUT/'render-report.json').write_text(json.dumps(results,indent=2)+'\n')
print('Lossless masters: '+str(MASTERS))
