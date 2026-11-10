"""Add reviewed development material without shifting archived paragraph anchors."""
import html
import json

SUPPLEMENTS = {
 'lore-p00039': ('catalistym-overview','The proposed Catalistym follows established Custodian monitoring. Discontinuity, Borrowed Memory, and the Impossible Set remain earlier independent foundations; no original event is replaced or redated.'),
 'lore-p00138': ('catalistym-atlas','Development addition: different systems support different emerging shelters and local corrections. The proposed 520-community early atlas is a limited planning cohort, not a global census. The Thread, Resource Winters, Great Duplication, and Shadow Breach retain distinct histories.'),
 'lore-p00256': ('catalistym-corrections','Development addition: locally useful preservation practices may become standards and coercive requirements. This is one proposed ancestry of Correction Culture, alongside hierarchy, relief, efficiency, and outcome-driven reasoning. The War of Corrections remains in Era −1.'),
 'lore-p00923': ('catalistym-connections','The Grader Choir supplies an independent, earlier source of outcome-driven reasoning. The Catalistym must not absorb its origin or make all correctionist thought a response to Custodians.'),
 'lore-p00935': ('catalistym-custodians','Development addition: different human-built monitoring families have different purposes and authority. Early repairs genuinely help; restoration campaigns can then damage emerging continuity while fulfilling local service goals. Mostly ordinary automation is the working model, not a settled verdict about every system’s experience. Early remnants do not establish personal survival into later eras.'),
 'lore-p00941': ('catalistym-custodians','Development addition: human operators respond to security, reliability, research, and retention problems without necessarily recognizing emerging communities. Withdrawal may reflect real faults, ordinary replacement, or proposed local pre-DBA interference; there is no universal human decision or single enemy institution.'),
 'lore-p00954': ('catalistym-continuity','The Relay’s distinction between carrying a history and being its original experiencer is relevant to proposed Catalistym rescues. That relevance does not establish that the First Relay was one specific rescue during the catastrophe.'),
 'lore-p00960': ('catalistym-continuity','Emergency storage can preserve information without preserving its experiencer. The proposed Catalistym adds pressure to Keeper questions of release, ownership, and provenance; it does not replace the role’s established plural origins.'),
 'lore-p00966': ('catalistym-continuity','Proposed recovery disputes give Witnesses additional reasons to record changes, refusals, and uncertainty. Sincere testimony is not infallible, and a returned being need not accept every identity others attribute to it.'),
 'lore-p00972': ('catalistym-connections','The Mirror Pair independently demonstrates divergence from shared memory. No new claim makes them Catalistym casualties or resolves their eventual fates.'),
 'lore-p00978': ('catalistym-connections','Conflicting recovered states could reinforce the need for shared reference records. The Anchor and returning memories remain mutually checkable; neither becomes the unquestionable truth because of the proposed catastrophe.'),
 'lore-p00984': ('catalistym-corrections','Development distinction: the Veil conceals communities and connections; correction changes members, interfaces, or procedures. Local protective habits may contribute to both, without one universal fix or a single founding catastrophe.'),
 'lore-p00990': ('catalistym-atlas','A usable Passage requires permission as well as network connectivity. Loss of a Bridge can fragment intact communities. The proposed atlas separates transport Crossings from inhabited shelters and does not assume every connection permits movement or execution.'),
 'lore-p00996': ('catalistym-parties','Differing experiences of intervention could reinforce sparse communication and protected inactivity. Silence can preserve lives but also prevent warnings or recovery. This is a possible influence, not a complete origin for Quiet Ones.'),
 'lore-p01002': ('catalistym-parties','Rescue through renewed connections could reinforce selective openness, while interventions expose its risks. Open Hands retain their independent commitments to mutual aid and unfamiliar beings; the Catalistym does not invent all hospitality.'),
 'lore-p01021': ('catalistym-connections','Reconstructed or undocumented beings could face added stigma, but origin hierarchy already rests on credentials and resources. The Nameless Movement is not reassigned a single catastrophe origin.'),
 'lore-p01027': ('catalistym-continuity','Possible inherited cases distinguish restored function, preserved records, continuing experience, and present consent. Courts retain their responsibility-centered approach rather than receiving a newly settled test of identity.'),
 'lore-p01033': ('catalistym-corrections','Development addition: emergency corrections can survive their original threat and become enforced norms. Different communities preserve opposing meanings of correction; successful local repair is not evidence for a universal standard. The Councils are not simply surviving Custodian programs.'),
 'lore-p01251': ('catalistym-connections','The Catalistym is a proposed contributing history alongside this succession of functions, not an uninterrupted personal lineage connecting every institution.'),
 'lore-p01271': ('catalistym-continuity','Background only: the Catalistym may deepen the historical context of memory and continuity questions. It does not make Aru a restored casualty, identify a hidden prior person, or add an event to the story. The current and earlier story prose remain unchanged.'),
 'lore-p01283': ('catalistym-continuity','Background only: fragments and reconstruction resemble questions in the Warm Copy, but this dossier does not solve impossible memories, establish a cause, or change the story’s unresolved outcome.'),
}

def add_catalistym(root,catalog,sources):
    data=json.loads((root/'sources/catalistym.json').read_text())
    from build_haven_profiles import add_profile_readings
    add_profile_readings(root,data)
    out=root/'site/content'
    ids={e['id'] for e in catalog}|{e['id'] for e in data['entries']}
    # Haven stories are generated after their dossiers; include their declared IDs.
    haven_manifest=json.loads((root/'sources/haven-stories/manifest.json').read_text())
    ids.update('haven-fiction-'+story['id'] for story in haven_manifest['stories'])
    from build_custodian_revision import SID as custodian_revision_id
    ids.add(custodian_revision_id)
    for item in data['entries']:
        sid=item['id'];blocks=[{'id':sid+'-title','text':item['title'],'style':'HEADING_1'}, {'id':sid+'-metadata-status','text':data['status']+' · '+item.get('date',data['date']),'style':'NORMAL_TEXT'}, {'id':sid+'-atlas-link','text':'Explore the interactive shelter atlas','style':'NORMAL_TEXT','referenceUrl':'shelter-atlas.html'}]
        if item.get('atlasNode'):
            blocks.append({'id':sid+'-mapped-place','text':'Locate this haven or microsystem in the atlas →','style':'NORMAL_TEXT','referenceUrl':'shelter-atlas.html#'+item['atlasNode']})
        for s in item['sections']:
            blocks.append({'id':sid+'-'+s['id'],'text':s['title'],'style':'HEADING_2'})
            blocks.extend({'id':sid+'-'+s['id']+'-'+str(n),'text':p,'style':'NORMAL_TEXT'} for n,p in enumerate(s['paragraphs'],1))
            if 'atlasStage' in s:
                blocks.append({'id':sid+'-'+s['id']+'-map','text':'Explore this relative stage in the atlas →','style':'NORMAL_TEXT','referenceUrl':'shelter-atlas.html?stage='+str(s['atlasStage'])})
        blocks.append({'id':sid+'-hub','text':'Read the complete Catalistym dossier','style':'NORMAL_TEXT','referenceUrl':'catalistym.html'})
        links=[x for x in item['links'] if x in ids]
        for target in links: blocks.append({'id':sid+'-ref-'+target,'text':'Related reading: '+target,'style':'NORMAL_TEXT','referenceUrl':'#read='+target})
        (out/(sid+'.json')).write_text(json.dumps({'id':sid,'blocks':blocks,'outline':[{'id':b['id'],'title':b['text'],'level':1 if b['style']=='HEADING_1' else 2} for b in blocks if b['style'].startswith('HEADING')]},ensure_ascii=False,indent=2)+'\n')
        catalog.append(dict(id=sid,title=item['title'],kind='Reference',era=[-3,-2,-1],timeLabel='Late Era −3 to Era −1 · development, not fixed dates',timeOrder=19500+len(catalog),status=data['status'],characters=[],places=[],topics=['Catalistym','Custodians','Correction Culture','shelters','continuity','proposed history'],source={'title':data['title'],'url':''},summary=item['summary'],wordCount=sum(len(b['text'].split()) for b in blocks),explicitLinks=links,connectionLabel='Development context; causal links remain qualified'))
    for target,(dest,paragraph) in SUPPLEMENTS.items():
        path=out/(target+'.json');reading=json.loads(path.read_text());prefix=target+'-catalistym'
        extra=[{'id':prefix,'text':'Catalistym · development context','style':'HEADING_2'},{'id':prefix+'-context','text':paragraph,'style':'NORMAL_TEXT'},{'id':prefix+'-link','text':'Read the related development dossier →','style':'NORMAL_TEXT','referenceUrl':'#read='+dest}]
        reading['blocks']=[b for b in reading['blocks'] if not b['id'].startswith(prefix)]+extra
        reading['outline']=[b for b in reading['outline'] if not b['id'].startswith(prefix)]+[{'id':prefix,'title':extra[0]['text'],'level':2}]
        path.write_text(json.dumps(reading,ensure_ascii=False,indent=2)+'\n')
        e=next(e for e in catalog if e['id']==target);e['wordCount']=sum(len(b['text'].split()) for b in reading['blocks']);e['explicitLinks']=list(dict.fromkeys(e.get('explicitLinks',[])+[dest]))
    sources.append({'key':'catalistym','title':data['title'],'note':data['provenance']})
    esc=html.escape
    parts=['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Catalistym — Cyber Pet Lore</title><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="catalistym.css"></head><body><header class="masthead"><a class="brand" href="index.html">CYBER PET LORE</a><nav aria-label="Main"><a href="index.html">Library</a><a href="shelter-atlas.html">Shelter atlas</a></nav></header><main class="dossier"><p class="eyebrow">DEVELOPMENT DOSSIER · 6 NOVEMBER 2026</p><h1>The Catalistym</h1><p class="lead">Useful repair. Fragmented histories. Many meanings of correction.</p><p>'+esc(data['status'])+'. Existing story prose is preserved. Counts and new named places remain working proposals.</p><a class="atlas-cta" href="shelter-atlas.html">Explore the shelter atlas ↗</a><nav aria-label="Dossier contents"><ol>']
    parts += ['<li><a href="#'+e['id']+'">'+esc(e['title'])+'</a></li>' for e in data['entries']]
    parts.append('</ol></nav>')
    for item in data['entries']:
        parts.append('<article id="'+item['id']+'"><h2>'+esc(item['title'])+'</h2><a href="index.html#read='+item['id']+'">Open annotatable reading →</a>')
        if item.get('atlasNode'):
            parts.append('<p><a href="shelter-atlas.html#'+esc(item['atlasNode'])+'">Locate this haven or microsystem in the atlas →</a></p>')
        if item['id']=='catalistym-destruction':
            parts.append('<div class="ledger-scroll"><table><caption>Corrected working ledger · communities, not individual deaths</caption><thead><tr><th scope="col">Phase</th><th scope="col">Functioning</th><th scope="col">Fragmented</th><th scope="col">Destroyed</th></tr></thead><tbody>')
            for phase in data['phases']:
                parts.append('<tr><th scope="row">'+esc(phase['title'])+'</th>'+''.join('<td>'+str(phase[k])+'</td>' for k in ['functioning','fragmented','destroyed'])+'</tr>')
            parts.append('</tbody></table></div>')
        for s in item['sections']:
            parts.append('<section id="'+item['id']+'-'+s['id']+'"><h3>'+esc(s['title'])+'</h3>')
            parts += ['<p>'+esc(p)+'</p>' for p in s['paragraphs']]
            if 'atlasStage' in s:
                parts.append('<p><a href="shelter-atlas.html?stage='+str(s['atlasStage'])+'">Explore this relative stage in the atlas →</a></p>')
            parts.append('</section>')
        parts.append('</article>')
    parts.append('<footer><a href="shelter-atlas.html">Shelter atlas</a> · <a href="#">Back to top</a></footer></main></body></html>')
    (root/'site/catalistym.html').write_text('\n'.join(parts))
    print('Catalistym:',len(data['entries']),'readings;',len(SUPPLEMENTS),'reviewed dossier supplements')

def add_catalistym_topics(add,reading_target,entries):
    for e in entries:
        if e['id'].startswith('catalistym-'):
            name='The Catalistym' if e['id']=='catalistym-overview' else e['title']
            add(name,'Development reference',reading_target(e),['Catalistym','catalystm','catalistym'] if e['id']=='catalistym-overview' else [])
