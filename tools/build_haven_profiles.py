"""Compile explicitly authored, partial microsystem profiles into inspectable summaries."""
import json
from statistics import mean


def philosophy_candidates(axes):
    values={key:row['mean'] for key,row in axes.items()}
    rules=[
        ('Restoration','preservation',lambda v:v<=-1,'Preservation leans toward retaining existing arrangements.'),
        ('Adaptation','preservation',lambda v:v>=1,'Preservation leans toward reorganizing arrangements.'),
        ('Agreement / standardization','correction',lambda v:v>=1,'Correction leans toward aligning differences.'),
        ('Difference / accommodation','correction',lambda v:v<=-1,'Correction leans toward leaving differences unresolved.'),
        ('Joining / mutual continuity','boundaries',lambda v:v>=1,'Boundaries favor combining functions; this does not establish a single identity.'),
        ('Boundary protection','boundaries',lambda v:v<=-1,'Boundaries favor keeping functions separate.'),
        ('Witness / unfinished continuity','uncertainty',lambda v:v<=-1,'Uncertainty favors retaining multiple possibilities.'),
        ('Restraint','initiative',lambda v:v<=-1,'Initiative favors waiting for a request or trigger.'),
        ('Reciprocity / hospitality','allocation',lambda v:v>=1,'Allocation extends toward unfamiliar arrivals.')]
    return [dict(name=name,reason=reason,axis=key) for name,key,check,reason in rules if values.get(key) is not None and check(values[key])]


def compile_profiles(root):
    data=json.loads((root/'sources/haven-profiles.json').read_text())
    axes=data['capacities']+data['tendencies']
    for profile in data['profiles']:
        for snap in profile['snapshots']:
            summary={}
            for axis in axes:
                vals=[r['axes'][axis['id']]['value'] for r in snap['records'] if r['axes'][axis['id']]['value'] is not None]
                summary[axis['id']]=dict(mean=round(mean(vals),1) if vals else None,minimum=min(vals) if vals else None,maximum=max(vals) if vals else None,known=len(vals),sampleSize=len(snap['records']))
            snap['summary']=summary
            snap['candidates']=philosophy_candidates(summary)
    return data


def add_profile_readings(root,data):
    profiles=compile_profiles(root)
    entries={e['id']:e for e in data['entries']}
    axes=profiles['capacities']+profiles['tendencies']
    for profile in profiles['profiles']:
        item=entries[profile['dossier']]
        item['links']=list(dict.fromkeys(item['links']+['catalistym-profile-method']))
        for snap in profile['snapshots']:
            paragraphs=['Proposed system-level sample, not a census of people. Two selected existing microsystems; equal weight per known axis; unknown values excluded. Range indicates disagreement within this tiny sample, not within the entire haven.']
            for axis in axes:
                row=snap['summary'][axis['id']]
                if row['mean'] is None:text=axis['label']+': unknown / unavailable (no known ratings).'
                else:text=axis['label']+': '+str(row['mean'])+(' / 5' if axis in profiles['capacities'] else ' on −2 to +2')+'; sample range '+str(row['minimum'])+' to '+str(row['maximum'])+'; '+str(row['known'])+' known of '+str(row['sampleSize'])+' sampled.'
                paragraphs.append(text)
            paragraphs.extend(['Collective practice: '+snap['practice'],'Internal tension / alternate explanation: '+snap['tension'],'Possible philosophical affinities: '+('; '.join(c['name']+' — '+c['reason'] for c in snap['candidates']) or 'No current inference.')+' These are transparent authoring prompts, not diagnosed beliefs or a causal proof.',snap['interpretation']])
            for record in snap['records']:
                paragraphs.append('Microsystem '+record['node']+' · '+record['role']+' · '+record['evidence']+' · '+record['reliability']+'. '+record['support'])
                for axis in axes:
                    score=record['axes'][axis['id']]
                    paragraphs.append(axis['label']+' '+('unknown' if score['value'] is None else str(score['value']))+': '+score['reason'])
            item['sections'].append(dict(id='profile-'+str(snap['stage']),title=snap['label']+' · profile at stage '+str(snap['stage']),paragraphs=paragraphs,atlasStage=snap['stage']))
    for item in data['entries']:
        node=item.get('atlasNode')
        for profile in profiles['profiles']:
            if node and any(r['node']==node for r in profile['snapshots'][0]['records']):
                item['links']=list(dict.fromkeys(item['links']+[profile['dossier'],'catalistym-profile-method']))
                item['sections'].append(dict(id='profile-context',title='System-level rating context',paragraphs=['This microsystem is one of two selected components in the associated haven profile. The haven dossier records its stage-specific ratings, reasons, reliability, and support dependencies. The component is not automatically an individual person, and its scores do not establish sentience.']))
