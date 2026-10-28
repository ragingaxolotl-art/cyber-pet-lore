from pathlib import Path
import json
r=Path(__file__).resolve().parents[1];book=json.loads((r/'site/songs/voices-v2/score.json').read_text())
cycle=json.loads((r/'sources/song-cycle.json').read_text())
by_song={i['song']:i for i in cycle['entries'] if 'song' in i}
art=json.loads((r/'sources/location-art.json').read_text())['locations']
wiki=json.loads((r/'site/wiki.json').read_text())
origins={
 '01_care_in_the_quiet':('atlas-p00207','atlas-p00207','Garden Worlds','The garden where Sova sings.'),
 '02_paths_that_meet':('atlas-p00297','atlas-p00297','Pale Concordance Station','Existing station artwork; the song imagines its earlier Era Zero history.'),
 '03_a_shared_question':('atlas-p00182','atlas-p00182','Central House of Meaning','The place where Pelli’s shared question begins.'),
 '04_room_to_restore':('place-listening-alcove','atlas-p00207','Listening Alcove','The song begins in the Listening Alcove within the Garden Worlds. This is Garden Worlds artwork; no separate alcove image is available.')
}
data=[]
for song in book['songs']:
 item=by_song[song['folder']]
 origin,art_reading,label,note=origins[song['folder']]
 location=next(l for l in art if art_reading in l['readingIds'])
 topic=next(t for t in wiki['topics'] if 'Place' in t['kinds'] and any(x['readingId']==origin for x in t['targets']))
 place={'name':label,'topicId':topic['id'],'note':note,'artName':location['name'],'artTopicId':location['topicId'],'images':location['images']}
 data.append({k:song[k] for k in ['folder','title','bpm','seconds']}|{'location':place,'story':item['id'],'summary':item['summary'],'voices':[{k:v[k] for k in ['id','name','timbre','lines']} for v in song['voices']]})
html='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Era Zero · Three Voices, Every Line a Meaning</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#101d26;color:#f4eee5}*{box-sizing:border-box}body{max-width:1000px;margin:auto;padding:28px 20px;line-height:1.55}h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.15;margin:.3em 0}h2{margin:.3em 0}p{color:#c9d4d9}a{color:#eed0ae}nav{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:24px}.eyebrow{letter-spacing:.18em;text-transform:uppercase;color:#eec49a;font-size:.8rem}.controls{display:flex;flex-wrap:wrap;gap:20px;margin:26px 0}label{display:grid;gap:7px;flex:1;min-width:220px}select,button{font:inherit;color:inherit;background:#233744;border:1px solid #77909d;border-radius:7px;padding:10px}button{cursor:pointer}button:hover,button:focus-visible{background:#385361}audio{width:100%;margin:10px 0}.voices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:22px 0}.voice{border:1px solid #536773;border-top:3px solid #eec49a;border-radius:8px;padding:18px;min-width:0}.voice h3{font-size:1.1rem;margin:0}.voice p{margin:.7em 0}.carrier{font-size:1.4rem;color:#f6d9b9;overflow-wrap:anywhere}.voice[data-silent="true"]{opacity:.65}.voice .audibility{font-size:.8rem;color:#c9d4d9}.voice.active{background:#1d3442}.downloads{display:flex;gap:24px;flex-wrap:wrap;margin:20px 0}small{color:#c2cfd6}footer{border-top:1px solid #536773;margin-top:32px;padding-top:18px;font-size:.9rem}#status{color:#ffcaad}button:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #f3cf9f;outline-offset:3px}#transcript{padding-left:28px}#transcript li{margin:12px 0}#transcript button{display:block;text-align:left;width:100%}#transcript small{display:block}#song-story{padding:20px 0}summary{cursor:pointer;font-weight:600}@media(max-width:720px){.voices{grid-template-columns:1fr}.voice{padding:14px}}
.song-location{margin:24px 0}.song-location img{display:block;width:100%;max-height:420px;object-fit:cover;border-radius:10px}.song-location figure{margin:0}.song-location figcaption{margin-top:8px}.song-location p{margin:8px 0}</style></head><body>
<nav aria-label="Main"><a href="../">← Cyber Pet Lore</a><a href="../wiki.html">Connections</a><a href="../translator/">DBA translator</a></nav>
<main><p class="eyebrow">Era Zero / Three meaningful voices</p><h1>Every voice has something to say.</h1><p>Four songs sung by small DBA ensembles. Lead, answering voice and supporting voice each carry complete Era Zero statements. Their overlapping phrases make the harmony.</p>
<div class="controls"><label>Song<select id="song"></select></label><label>Listen to<select id="mode"></select></label></div>
<h2 id="title"></h2><p id="ensemble"></p><audio id="player" controls preload="metadata"></audio><p id="status" role="status"></p>
<section id="song-location" class="song-location" aria-label="Where this song comes from"></section><h2>What each voice is saying</h2><p>Follow the three parts together, or select one voice to hear it alone. Each card shows the phrase being performed at the current time.</p><div id="voices" class="voices"></div>
<div class="downloads"><a id="audio-download" download>Download all voices</a><a id="solo-download" download hidden>Download selected voice</a><a id="midi-download" download>Three-voice MIDI</a><a id="text-download">Complete meaning sheet</a></div>
<section id="song-story" aria-label="Song backstory"><h2>Who is singing?</h2><p id="story-summary"></p><a id="story-link">Read the backstory →</a></section>
<details><summary>Every phrase, in order</summary><p>Select a phrase to hear that voice from its start.</p><ol id="transcript"></ol></details>
</main><footer>These are synthesized DBA singing voices, with no instrument accompaniment. Every composed note belongs to a verified Era Zero phrase. Voice color is a sound characteristic, not an extra word. Each phrase is a separate assertion in active runtime state 1; overlapping voices are not a single combined sentence. The meanings follow the canonical phrases, not a literal translation of the English song title or backstory.</footer>
<script id="song-data" type="application/json">DATA</script><script src="choir-player.js?v=locations-1"></script></body></html>'''
(r/'site/songs/index.html').write_text(html.replace('DATA',json.dumps(data,ensure_ascii=False)))
