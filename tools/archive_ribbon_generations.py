"""Preserve every PixelLab candidate and finishing result, including rejects."""
from pathlib import Path
import hashlib,json,re,zipfile
ROOT=Path(__file__).resolve().parents[1]
STUDIO=ROOT/'site/ribbons/studio'
manifest=json.loads((ROOT/'sources/ribbon-expansion-jobs.json').read_text())
repairs=json.loads((ROOT/'sources/ribbon-expansion/repairs.json').read_text())
files=[]
for job in manifest['jobs']:
 text='\n'.join(c.get('text','') for c in job['result']['content'])
 count=int(re.search(r'candidates: (\d+)',text)[1])
 stem=re.sub('[^a-z0-9]+','-',job['name'].lower())
 for i in range(count):
  p=STUDIO/f'parts/expansion/{stem}-{i+1}.png'
  assert p.exists(),f'Missing original candidate: {p}'
  files.append({'file':str(p.relative_to(STUDIO)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'job_id':re.search(r'job_id: ([\w-]+)',text)[1],'candidate':i})
for repair in repairs:
 p=STUDIO/f'parts/expansion/{repair["stem"]}-finished.png'
 assert p.exists(),f'Missing finishing output: {p}'
 files.append({'file':str(p.relative_to(STUDIO)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'drawing_id':repair['drawingId']})
for p in sorted((STUDIO/'parts/previous-generations').glob('*.png')):
 files.append({'file':str(p.relative_to(STUDIO)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'prior_generation':True})
inventory={'generated_batches':len(manifest['jobs']),'original_candidates':sum('candidate' in x for x in files),'finishing_outputs':len(repairs),'prior_generation_images':sum(x.get('prior_generation',False) for x in files),'files':files}
index=ROOT/'sources/ribbon-expansion/archive-inventory.json';index.write_text(json.dumps(inventory,indent=2)+'\n')
destination=STUDIO/'downloads';destination.mkdir(exist_ok=True)
archive=destination/'pixellab-generation-archive.zip'
# Include the original cabinet, recovered art, all generated PNGs, recipes,
# selections and receipts. ZIP timestamps are fixed for reproducible builds.
paths=list((STUDIO/'parts').rglob('*.png'))+[STUDIO/p for p in ('catalog.json','material-selections.json','generation-record.json','README.md')]
paths+=list((ROOT/'sources/ribbon-expansion').rglob('*.json'))+list((ROOT/'sources/ribbon-expansion').rglob('*.md'))+[ROOT/'sources/ribbon-expansion-jobs.json']
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(paths):
  name=str(p.relative_to(ROOT))
  info=zipfile.ZipInfo(name,date_time=(2026,11,3,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
  z.writestr(info,p.read_bytes())
 with_text='All PixelLab candidates are retained, including candidates excluded from the cabinet. Source PNGs are unchanged. Finishing outputs are separate files. See sources/ribbon-expansion/archive-inventory.json for hashes and job IDs.\n'
 info=zipfile.ZipInfo('ARCHIVE-README.txt',date_time=(2026,11,3,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,with_text)
print({k:v for k,v in inventory.items() if k!='files'},'archive_bytes',archive.stat().st_size)
