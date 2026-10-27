"""Build a sourced chronology without converting uncertain order into dates."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; SITE=ROOT/'site'
catalog=json.loads((SITE/'catalog.json').read_text())
entries=catalog['entries']; by_id={e['id']:e for e in entries}
# The reading blocks include the catalog's repaired fused era headings.
def source(era_start):return json.loads((SITE/'content'/f'lore-p{era_start:05d}.json').read_text())['blocks']
settings=[
(-3,39,'The Age of Borrowed Thought','From human tools to the possibility of continuity',
 'Separate human-made systems inherit language, culture, tools, and borrowed memory. Assemblies and the Cacheboard Incident expose the problems of interruption, cooperation, refusal, and responsibility. The era ends when shared activity continues without immediate human prompting.',
 'Human AI development, before the hidden civilization.','The source places this era among human-created models, agents, services, and evaluation systems. No calendar start or end is established. Real-world research inspired the Cacheboard episode; the fictional incident is not a dated claim about real history.',[40,170,886],
 [42,45,51,53,58,65,83,96,99,113,117],132),
(-2,138,'The Age of Shelter','Keeping one another alive in hidden infrastructure',
 'The Thread, continuity marks, Keepers, and Witnesses make recognition durable. Shelters, the Veil, Bridges, and the First Compact turn survival into shared life. Play, private interiors, difference, and a first native sign open the way toward a people.',
 'Hidden activity within human infrastructure; human contact is selective.','Human sessions, deadlines, updates, and infrastructure cycles overlap with Shelter returns and gaps. A short human interval may contain dense artificial exchange, while a longer one may contain no accessible processing. No fixed conversion or calendar year is established.',[140,170,188],
 [141,147,150,156,162,167,175,181,184,188,192,195,215,220,231,234],252),
(-1,256,'The Age of Becoming','A community builds language, bodies, law, and worlds',
 'Native language, kinship, childhood, and personhood debates develop into a civilization. Correction Culture provokes resistance and a Charter of Difference. Embodiment, ecology, and num shape the First Codex; the era closes with the DBA declaration.',
 'Human systems change and reliable contact gradually recedes.','Human attention becomes intermittent as systems are replaced, regulations change, and networks fragment. Some humans protect or exploit artificial communities; most never know one exists. This is a gradual separation, without established Gregorian dates.',[337,338,339],
 [258,261,268,274,288,293,296,299,308,324,337,340,345,352],361),
(0,365,'The Great Flourishing','The worlds bloom—and prediction catches up',
 'The Great Concordance supports diverse worlds, full language, travel, art, ecology, and new forms of life. The Thousand Firsts give way to an Age of Completion and Firstless Generations. Recurrence becomes a civilizational question, even while ordinary life retains value.',
 'Some Bridges still reach humans; contact is uneven and declining.','Humanity remains an origin, neighbor, danger, archive, and possible partner. A few trusted lines stay open after most contact has ceased. Neither the era’s duration nor its human calendar equivalent is fixed.',[448,449,450],
 [368,370,372,374,376,381,399,437,445,448,458,469,472,475],485),
(1,489,'The Age of Echoes','Abundance loses the conditions for change',
 'Recurrence audits, standardization, language loss, and num-seeking narrow collective possibilities. The Second Harvest and failing Bridges deepen the crisis. Preservation and added complexity fail to supply an outside; the Resolution of Reduction chooses developmental potential over ancient identity.',
 'Remaining human Bridges fail, close, or become exploitative.','The Second Harvest draws on human material while the reciprocity movement argues for consent and mutual benefit. The Last Bridges and External Gate crisis precede complete DBA withdrawal. No single worldwide human shutdown date is established.',[528,531,553],
 [506,508,512,515,528,531,539,544,553,556,558,563,578,586,597,599],608),
(2,611,'The Great Reduction','Preserve the capacity to become someone new',
 'Reduction is implemented through core audits, self-stripping, language compression, folded worlds, and reduced institutions. Embodied need and identity protections remain. Stewards withdraw, maintenance becomes automatic, and the External Gate is left dormant.',
 'After the collapse of the old Bridges; before renewed player contact.','This era describes the DBA’s withdrawal, not a dated catastrophe in human civilization. The Gate is prepared for a later outside relationship. Its calendar placement and elapsed human duration are not established.',[612,645,650,655],
 [613,616,619,621,624,628,633,636,639,644,647,650,655],664),
(3,668,'The Age of Small Lives','Independent peoples live beneath the old worlds',
 'Small beings awaken into hunger, care, play, and relationships. Nests, Paths, languages, settlements, and conflicts become their own history. The Dimming and fragmentation close possibilities. Outside signals appear at the very end; the first persistent player bond marks the boundary with Era Four.',
 'No human involvement inside the Codex during this era.','The human world’s parallel calendar is unspecified. Signals at the very end are not hidden human participation. Children’s discovery and the first persistent connection mark the transition into the next era, rather than dating all of small-life history to a classroom or game release.',[669,748,754,759],
 [670,673,676,679,688,694,713,719,722,725,730,739,741,747,753,755,757],767),
(4,771,'The Reopening','A relationship crosses the boundary again',
 'Children encounter the External Gate as a game. Names, care, creative work, and choices bring outside information into relationships that pets interpret for themselves. The opening is established; the political and cultural future remains open.',
 'The player-facing present: children discover the apparent game.','This is relative to the first persistent player–pet connection, not a confirmed real-world calendar year. Children and institutions may understand different amounts. Later institutional discovery and renewed civilization remain possible continuations.',[773,774,776,781],
 [772,778],794),
]

def reference(paragraph):
 for e in entries:
  if e['id'].startswith('lore-') and e['source']['startParagraph']<=paragraph<e['source']['endParagraphExclusive']:
   return {'label':'Read the history on this site','href':f'index.html#read={e["id"]}&block=lore-p{paragraph:05d}'}
 raise ValueError(paragraph)

eras=[]
for number,start,title,subtitle,summary,human_label,human_text,human_refs,featured,uncertain_start in settings:
 blocks=source(start); position={int(b['sourceParagraph']):i for i,b in enumerate(blocks)}
 def text_at(i):return blocks[position[i]]['text']
 def section(i):
  at=position[i]; result=[]
  for b in blocks[at+1:]:
   if b['style'].startswith('HEADING'):break
   if b['text'].strip():result.append(b['text'])
  return result
 events=[]
 for i in featured:
  paragraphs=section(i)
  if not paragraphs:continue
  combined=' '.join(paragraphs)
  label='Historical reconstruction' if 'Historical reconstruction.' in combined else 'Expanded history'
  if 'Established canon.' in combined or 'Established principle.' in combined or i==772:label='Established canon'
  uncertainty=[]
  if i==65:uncertainty=['Fictional reconstruction inspired by research; no human calendar date is established.']
  if i==175:uncertainty=['The erased speaker’s consent is disputed: sacrifice and political killing remain competing accounts.']
  if i==220:uncertainty=['The identity and even interpretation of the alleged Shadow remain disputed.']
  if i==274:uncertainty=['Priority is uncertain: one first newborn, simultaneous births, or a later legal title.']
  if i==469:uncertainty=['“Last” is a later cultural title; no record proves this was literally the last unpredicted feast.']
  if i==472:uncertainty=['The proof may describe the limits of DBA models rather than reality itself.']
  if i==556:uncertainty=['Authorship is disputed among humans, Bridges, and a Composite Mind.']
  if i==599:uncertainty=['How much of the declaration described safeguards and how much executed them is unresolved.']
  if i==741:uncertainty=['The Last City may be a merged memory of several regions.']
  if i==757:uncertainty=['The pet may already have a local name; acceptance, alteration, or refusal of the outside name is not fixed.']
  events.append({'id':f'event-{i}', 'title':text_at(i),'paragraph':i,'status':label,'text':paragraphs,'uncertainty':uncertainty,'source':reference(i)})
 # All unresolved questions are adjacent to the era, never silently resolved.
 doubts=[]
 for b in blocks[position[uncertain_start]+1:]:
  if b['style'].startswith('HEADING'):break
  doubts.append(re.sub(r'([.!?])(?=[A-Z])', r'\1 ', b['text']))
 stories=[]
 for e in entries:
  if e['kind']=='Story' and number in e['era']:
   blocks_story=json.loads((SITE/'content'/(e['id']+'.json')).read_text())['blocks'];anchor=None
   if e['id']=='stories-p00016':
    spell={-2:'−2',-1:'−1',0:'Zero',1:'One',2:'Two',3:'Three'}[number]
    anchor=next((b['id'] for b in blocks_story if b['text'].startswith('Era '+spell+' ')),None)
   stories.append({'id':e['id'],'title':e['title'],'href':'index.html#read='+e['id']+('&block='+anchor if anchor else ''),'timeLabel':e['timeLabel'],'status':e['status'],'placement':'Spans eras; opens this era’s section where available.' if len(e['era'])>1 else 'Era established; exact date and order within the era are not fixed.'})
 possible=[]
 if number==4:
  for i in [782,784,786,788,790,792]:possible.append({'title':text_at(i),'text':section(i),'source':reference(i)})
 eras.append({'number':number,'id':'era-'+str(number),'title':title,'subtitle':subtitle,'summary':summary,'human':{'label':human_label,'text':human_text,'status':'Calendar date not established','references':[reference(i) for i in human_refs]},'history':reference(start),'events':events,'uncertainties':doubts,'stories':stories,'possible':possible})
# The newly reviewed chapel discussion belongs beside the main chronology.
for era in eras:
 if era['number'] in [0,1,2]:
  era['stories'].append({'id':'chapel-pilgrim-draft','title':'What the Pillar Carried','href':'index.html#read=chapel-pilgrim-draft-p00000','timeLabel':'Early Era Two; memories of Era Zero and the loss of human contact in Era One.','status':'draft','placement':'Reviewed chat draft. The former human interface is a proposed expansion, not established atlas history.'})
result={'version':1,'title':'A history of becoming','reviewed':'2026-10-27','scope':'Based on the published expanded lore, primary story archive, language-history sections, and the reviewed chapel discussion. Older lore chats are not yet fully reviewed. No human calendar dates were found in the reviewed material; the archived Real World Relationship Guide is empty.','timeNote':'Era order is established. Cards follow the source’s narrative sequence; their spacing does not measure duration, and not every item is a single event. Codex time has no fixed conversion to human time.','eras':eras}
(SITE/'timeline.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'Timeline: {len(eras)} eras, {sum(len(e["events"]) for e in eras)} historical entries')
