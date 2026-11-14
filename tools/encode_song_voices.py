import argparse
from pathlib import Path
import subprocess
parser=argparse.ArgumentParser()
parser.add_argument('--edition', choices=['voices-v2','voices-v3','voices-chords'], default='voices-v2')
parser.add_argument('--masters', type=Path)
args=parser.parse_args()
masters=args.masters or Path('/private/tmp/era-zero-semantic-choir-masters'+({'voices-v2':'','voices-v3':'-v3','voices-chords':'-chords'}[args.edition]))
root=Path(__file__).resolve().parents[1]
for folder in sorted(masters.glob('0*')):
 for wav in sorted(folder.glob('*.wav')):
  dst=root/'site/songs'/args.edition/folder.name/(wav.stem+'.m4a')
  subprocess.run(['/usr/bin/afconvert','-f','m4af','-d','aac','-b','192000',str(wav),str(dst)],check=True)
 print('Encoded '+folder.name,flush=True)
