from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1]
for folder in sorted(Path('/private/tmp/era-zero-semantic-choir-masters').glob('0*')):
 for wav in sorted(folder.glob('*.wav')):
  dst=root/'site/songs/voices-v2'/folder.name/(wav.stem+'.m4a')
  subprocess.run(['/usr/bin/afconvert','-f','m4af','-d','aac','-b','192000',str(wav),str(dst)],check=True)
 print('Encoded '+folder.name,flush=True)
