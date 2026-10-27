from pathlib import Path
import json,wave
import numpy as np
root=Path(__file__).resolve().parents[1];out=root/'site/songs/voices-v2';book=json.loads((out/'score.json').read_text());checks=[]
for song in book['songs']:
 for v in song['voices']:
  with wave.open(str(Path('/private/tmp/era-zero-semantic-choir-masters')/song['folder']/(v['id']+'.wav')),'rb') as f:
   rate=f.getframerate();a=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
  mono=a.mean(axis=1);mask=np.zeros(len(a),bool);errors=[]
  assert np.max(np.abs(a))<.99
  for n in v['notes']:
   start=round(n['beat']*60/song['bpm']*rate);duration=round(n['length']*60/song['bpm']*rate);mask[max(0,start-1):start+duration+1]=True
   clip=mono[start+int(duration*.22):start+int(duration*.78)];spectrum=np.abs(np.fft.rfft(clip*np.hanning(len(clip)),n=65536));peak=int(np.argmax(spectrum[1:]))+1
   # Interpolate the global spectral maximum; do not search only near the expected pitch.
   y=np.log(spectrum[peak-1:peak+2]+1e-20);delta=.5*(y[0]-y[2])/(y[0]-2*y[1]+y[2]);freq=(peak+delta)*rate/65536
   expected=440*2**((n['note']-69)/12);errors.append(abs(1200*np.log2(freq/expected)))
  assert max(errors)<8,(song['folder'],v['id'],max(errors))
  assert np.max(np.abs(mono[~mask]))==0,'Sound outside semantic notes'
  checks.append({'song':song['title'],'voice':v['name'],'notes':len(v['notes']),'maxPitchErrorCents':round(max(errors),4),'unassignedAudio':False,'clipping':False})
  print('Verified '+song['title']+' / '+v['name'],flush=True)
(out/'audio-validation.json').write_text(json.dumps({'result':'PASS','method':'Global spectral peak for each rendered solo note; silence outside assigned note windows; clipping check. Lossless masters, before AAC encoding.','checks':checks},indent=2)+'\n')
