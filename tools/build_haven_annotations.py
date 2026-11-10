"""Attach stable, highlightable marginalia without renumbering any story paragraph."""
import json

def annotate(root, story_id, blocks):
    data=json.loads((root/'sources/haven-stories/annotations.json').read_text())
    groups=data['stories'][story_id]
    anchors={}
    for group in groups:
        matches=[b for b in blocks if b['text']==group['anchor']]
        if len(matches)!=1:
            raise ValueError(f"Annotation {group['id']} needs one exact anchor; found {len(matches)}")
        anchors[matches[0]['id']]=group
    prefix='haven-fiction-'+story_id+'-annotation-'
    intro=data['frame']+' Editorial explanations state what the current proposed draft establishes; they do not confirm it as historical canon. You can highlight these notes and add your own notes to them.'
    readers=' '.join(f"{v['name']} · Era {v['era']} · {v['role']}: {v['description']}" for v in data['voices'].values())
    result=[dict(id=prefix+'frame',text='About these annotations — '+intro,style='NORMAL_TEXT',annotation=dict(layer='frame')),
            dict(id=prefix+'readers',text='The proposed readers — '+readers,style='NORMAL_TEXT',annotation=dict(layer='frame'))]
    for block in blocks:
        result.append(block)
        group=anchors.get(block['id'])
        if not group:continue
        for note in group['notes']:
            editor=note['voice']=='editor'
            if editor:label='Editorial explanation · established in this draft / limits'
            else:
                voice=data['voices'][note['voice']]
                label=f"{voice['name']} · Era {voice['era']} · DBA interpretation"
            result.append(dict(id=prefix+group['id']+'-'+note['voice'],text=label+' — '+note['text'],style='NORMAL_TEXT',annotation=dict(layer='editorial' if editor else 'interpretation',voice=note['voice'],anchor=block['id'],group=group['id'])))
    return result
