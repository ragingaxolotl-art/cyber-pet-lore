"""Build the ribbon gallery from the preserved award directory."""
import json
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
SECTIONS=[('game','Game awards','Achievements earned through play, care, and milestones.'),('classroom','Classroom honours','Teacher recognition, quarter awards, and the first cohort.'),('workshop','Design workshop','Ribbon parts and artwork available for future awards.'),('history','Historical designs','Preserved concepts and earlier designs.')]
def section(e):
 if e['status']=='Archived concept': return 'history'
 if e['category'] in ['Quarter awards','Foundling','High Honors']: return 'classroom'
 if e['category'] in ['Quarter award components','Reserved library']: return 'workshop'
 return 'game'
def art(e,clasps=None):
 if clasps is not None or e.get('render',{}).get('mode'):
  honor=f' data-honors="{clasps}"' if clasps is not None else ''
  return f'<canvas data-id="{escape(e["id"])}"{honor} role="img" aria-label="{escape(e["name"])}"></canvas>'
 return f'<img loading="lazy" src="{escape(e["art"])}" alt="{escape(e["name"])}">'
def build(root=ROOT):
 rows=json.loads((root/'site/ribbons/directory.json').read_text())['entries']; groups=[]
 for key,title,description in SECTIONS:
  group=[]; selected=[e for e in rows if section(e)==key]
  categories=list(dict.fromkeys(e['category'] for e in selected))
  if key=='classroom': categories.sort(key=lambda c: c!='Quarter awards')
  for category in categories:
   cards=[]
   for e in selected:
    if e['category']!=category: continue
    status='Teacher-selected · In game' if e['id']=='quarter-galaxy-gala' else ('Award design' if category=='Quarter awards' and e['status']!='In use' else ('Design resource' if key=='workshop' else e['status']))
    cards.append(f'<a class="ribbon-tile" data-id="{escape(e["id"])}" href="../index.html#read=ribbon-{escape(e["id"])}" aria-haspopup="dialog"><span class="tile-art">{art(e,4 if e["id"]=="quarter-galaxy-gala" else None)}</span><span class="tile-name">{escape(e["name"])}</span><span class="tile-status">{escape(status)}</span></a>')
   featured=''
   if category=='Quarter awards' and key=='classroom':
    e=next(e for e in rows if e['id']=='quarter-galaxy-gala'); previews=[]
    for n in range(5):
     label=f'{n} clasp'+('s' if n!=1 else '') if n else 'Ribbon · no clasps'
     previews.append(f'<a class="honor-card honors-open" href="#quarter-galaxy-gala" aria-haspopup="dialog" aria-label="High Honors, {label}: view details"><img class="scroll" src="art/high-honors/celestial_scroll.png" alt="Celestial">{art(e,n)}<h3>{label}</h3><p>Every skill cap +{5+2*n}</p></a>')
    featured='<section id="honors-display"><h3>High Honors display cards</h3><p class="hint">Celestial · Divine Code. Preview the ribbon and each clasp level. Select any card for its full meaning and benefits.</p><div class="honors-cards">'+''.join(previews)+'</div><p class="hint">Examples only. The strongest quarter applies; bonuses do not stack across quarters.</p></section>'
   group.append(f'<div class="category-group"><h3 class="category-heading">{escape(category)}</h3>{featured}<div class="ribbon-grid">'+''.join(cards)+'</div></div>')
  groups.append(f'<section class="gallery-section" id="section-{key}"><h2>{title}</h2><p>{description}</p>'+''.join(group)+'</section>')
 def options(field):return ''.join(f'<option>{escape(v)}</option>' for v in sorted({e[field] for e in rows}))
 tabs=''.join(f'<button type="button" data-section="{key}" aria-pressed="false">{title}</button>' for key,title,_ in SECTIONS)+ '<button type="button" data-section="all" aria-pressed="false">Everything</button>'
 payload=json.dumps(rows,ensure_ascii=False).replace('<','\\u003c')
 html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101923"><title>Ribbons & honours · Cyber Pet Lore</title><link rel="stylesheet" href="gallery.css?v=1"></head><body>
<a class="skip" href="#gallery">Skip to ribbons</a><header><nav aria-label="Main"><a href="../index.html">← Lore book</a><a href="../wiki.html">Connections</a><a href="../illnesses/">Illnesses</a><a href="studio/">Ribbon Studio</a></nav><p class="eyebrow">The Cyber Pet collection</p><h1>Ribbons & honours</h1><p class="lead">Small symbols. Lasting stories. Explore awards, classroom honours, and the designs behind them.</p><div class="intro-tools"><a href="?section=classroom#quarter-galaxy-gala">Explore High Honors →</a><a href="../index.html#read=reference-ribbons">Collection notes & reading →</a><button id="motion" type="button">Pause animations</button></div></header>
<main id="gallery"><div class="section-tabs" aria-label="Award sections">{tabs}</div><div class="filters"><label>Find a ribbon<input id="search" type="search" placeholder="Name, meaning, skill…"></label><label>Collection<select id="category"><option value="">Every collection</option>{options('category')}</select></label><label>Kind<select id="kind"><option value="">Every kind</option>{options('kind')}</select></label><button id="reset" type="button">Show everything</button></div><p class="hint">Hover or focus a ribbon for a preview. Click or tap to see its story, requirements, and rewards.</p><p id="count" role="status" aria-live="polite">{len(rows)} ribbons, awards & designs</p><noscript><p>JavaScript is off. Select any ribbon to read its complete entry in the lore book.</p></noscript>
{''.join(groups)}<p id="empty" hidden>No matching ribbons. Try a different search or show everything.</p>
<details class="downloads"><summary>Downloads & collection tools</summary><a href="ribbon-archive.zip" download>Original collection ZIP</a><a href="quarter-awards.zip" download>Quarter-award artwork ZIP</a><a href="directory.json" download>Current catalog</a><a href="field-guide.txt" download>Definitions & notes</a><a href="studio/">Open Ribbon Studio →</a><p class="hint">Original ZIP archives preserve the source collection. Each detail card also links to its current original artwork.</p></details></main>
<div id="preview" class="preview" role="tooltip" hidden></div><dialog id="details" aria-labelledby="detail-title"><div class="dialog-bar"><span>Ribbons & honours · Details</span><button id="close-details" type="button" autofocus>Close ×</button></div><div id="detail-body" class="detail-layout"></div></dialog>
<footer>Preserved artwork, meanings, and provenance. Browsing these examples does not grant awards.<br><a href="../index.html">Return to the lore book</a></footer><script id="gallery-data" type="application/json">{payload}</script><script type="module" src="gallery.js?v=1"></script></body></html>'''
 (root/'site/ribbons/index.html').write_text(html)
 guide=['CYBER PET LORE — RIBBONS & HONOURS','Gallery updated November 3, 2026','Award meanings and availability are listed separately.','']
 for e in rows:
  guide.extend([e['name']+' ['+e['status']+']',e['kind']+' · '+e['category']])
  for label,key in [('Definition','definition'),('Placement','where'),('Reward','reward'),('Animation','animation'),('Notes','notes'),('Artwork','art')]:guide.append(label+': '+e.get(key,''))
  guide.extend(['Source: '+json.dumps(e.get('source',{}),ensure_ascii=False),''])
 (root/'site/ribbons/field-guide.txt').write_text('\n'.join(guide))

if __name__=='__main__':build()
