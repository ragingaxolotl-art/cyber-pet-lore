"""Attach supplemental art without changing source text or paragraph IDs."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
records=json.loads((root/'sources/story-illustrations.json').read_text())
for reading_id in {x['readingId'] for x in records}:
 path=root/'site/content'/f'{reading_id}.json'
 data=json.loads(path.read_text()); blocks={b['id']:b for b in data['blocks']}
 for b in blocks.values(): b.pop('illustrations',None)
 for art in records:
  if art['readingId']!=reading_id: continue
  assert (root/'site'/art['src']).is_file(),art['src']
  blocks[art['blockId']].setdefault('illustrations',[]).append(art)
 path.write_text(json.dumps(data,ensure_ascii=False))
