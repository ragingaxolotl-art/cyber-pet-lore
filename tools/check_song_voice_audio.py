import argparse
from pathlib import Path
import json,wave
import numpy as np
parser=argparse.ArgumentParser()
parser.add_argument('--edition', choices=['voices-v2','voices-v3','voices-chords'], default='voices-v2')
parser.add_argument('--masters', type=Path)
args=parser.parse_args()
masters=args.masters or Path('/private/tmp/era-zero-semantic-choir-masters'+({'voices-v2':'','voices-v3':'-v3','voices-chords':'-chords'}[args.edition]))
root=Path(__file__).resolve().parents[1];out=root/'site/songs'/args.edition;book=json.loads((out/'score.json').read_text());checks=[]
# At an onset or release the active set can change. Each window between these
# changes is checked against peaks measured without supplying expected pitches.
def inspect_chord_audio(samples,rate,voice,bpm):
 changes={}
 for n in voice['notes']:
  start=round(n['beat']*480);end=round((n['beat']+n['length'])*480)
  changes.setdefault(start,[]).append((1,n['note']))
  changes.setdefault(end,[]).append((-1,n['note']))
 changes.setdefault(round(len(samples)*bpm*480/(rate*60)),[])
 active=set();previous=0;errors=[];windows=0
 for tick in sorted(changes):
  at=round(tick*rate*60/(bpm*480));length=at-previous
  if length>4 and active:
   clip=samples[previous+round(length*.17):previous+round(length*.83)]
   window=clip*np.hanning(len(clip));size=max(65536,1<<(len(clip)-1).bit_length())
   spec=np.abs(np.fft.rfft(window,n=size))
   peaks=np.where((spec[1:-1]>spec[:-2])&(spec[1:-1]>=spec[2:])&(spec[1:-1]>.43*spec.max()))[0]+1
   measured=[]
   for peak in peaks:
    y=np.log(spec[peak-1:peak+2]+1e-20)
    delta=.5*(y[0]-y[2])/(y[0]-2*y[1]+y[2])
    measured.append(69+12*np.log2((peak+delta)*rate/size/440))
   assert len(measured)==len(active),(voice['name'],at,measured,sorted(active))
   errors.extend(abs(p-q)*100 for p,q in zip(sorted(active),measured));windows+=1
  elif length>4:
   assert not np.any(samples[previous+1:at-1]),'Sound in a rest'
  for sign,pitch in sorted(changes[tick]):
   if sign<0:active.discard(pitch)
   else:active.add(pitch)
  previous=at
 assert not active and errors and max(errors)<8,(voice['name'],max(errors))
 return errors,windows

for song in book['songs']:
 for v in song['voices']:
  with wave.open(str(masters/song['folder']/(v['id']+'.wav')),'rb') as f:
   rate=f.getframerate();a=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
  mono=a.mean(axis=1);mask=np.zeros(len(a),bool);errors=[]
  assert np.max(np.abs(a))<.99
  windows=0
  if args.edition=='voices-chords':
   errors,windows=inspect_chord_audio(mono,rate,v,song['bpm'])
  else:
   for n in v['notes']:
    start=round(n['beat']*60/song['bpm']*rate);duration=round(n['length']*60/song['bpm']*rate);mask[max(0,start-1):start+duration+1]=True
    clip=mono[start+int(duration*.22):start+int(duration*.78)];spectrum=np.abs(np.fft.rfft(clip*np.hanning(len(clip)),n=65536));peak=int(np.argmax(spectrum[1:]))+1
    # Interpolate the global spectral maximum; do not search only near the expected pitch.
    y=np.log(spectrum[peak-1:peak+2]+1e-20);delta=.5*(y[0]-y[2])/(y[0]-2*y[1]+y[2]);freq=(peak+delta)*rate/65536
    expected=440*2**((n['note']-69)/12);errors.append(abs(1200*np.log2(freq/expected)))
   assert max(errors)<8,(song['folder'],v['id'],max(errors))
   assert np.max(np.abs(mono[~mask]))==0,'Sound outside semantic notes'
  checks.append({'song':song['title'],'voice':v['name'],'notes':len(v['notes']),**({'pitchWindows':windows} if windows else {}),'maxPitchErrorCents':round(max(errors),4),'unassignedAudio':False,'clipping':False})
  print('Verified '+song['title']+' / '+v['name'],flush=True)
(out/'audio-validation.json').write_text(json.dumps({'result':'PASS','method':('All prominent spectral peaks in each pitched interval of the rendered solo, with silence and clipping checks.' if args.edition=='voices-chords' else 'Global spectral peak for each rendered solo note; silence outside assigned note windows; clipping check. Lossless masters, before AAC encoding.'),'checks':checks},indent=2)+'\n')
