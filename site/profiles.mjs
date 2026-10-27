const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const link=(text,href)=>{const n=node('a',text);n.href=href;return n;};
export function renderContinuityNotes(parent,notes=[]){
 parent.replaceChildren();parent.hidden=!notes.length;if(!notes.length)return;parent.className='continuity-review';parent.append(node('h2','Continuity and source notes'));
 for(const note of notes){const section=node('article');section.append(node('h3',note.title),node('p',note.text));const sources=node('div');sources.className='connection-chips';for(const source of note.sources||[])sources.append(link(source.title,source.href));section.append(sources);parent.append(section);}
}
export function renderProfile(parent,profile){
 if(!profile)return;
 const card=node('aside');card.className='character-infobox';card.setAttribute('aria-label','Character profile');card.append(node('h2','Profile'));
 const list=node('dl');for(const [label,value] of [['Record type',profile.type],['Recorded eras',profile.recordedEras.length?profile.recordedEras.map(e=>'Era '+e).join(', '):'Not securely dated'],['Formation',profile.origin],['Archive allocation',profile.archiveSizeKiB.toLocaleString()+' KiB']])list.append(node('dt',label),node('dd',value));card.append(list,node('small',profile.sizeLabel));parent.append(card);
}
export function renderLifeTimeline(parent,profile){
 if(!profile)return;const section=node('section');section.className='character-timeline';section.append(node('h2','Life and role through the eras'),node('p',profile.note));
 if(!profile.timeline.length)section.append(node('p','The sources do not establish a dated life sequence for this profile.'));
 for(const era of profile.timeline){section.append(node('h3','Era '+String(era.era).replace('-','−')));for(const record of era.records){const group=node('article');group.append(node('h4',record.title+' · '+record.status));for(const stage of record.stages){const entry=node('section');entry.className='life-stage';entry.append(node('h5',stage.label),node('p',stage.text),link('Read source passage →',stage.href));group.append(entry);}section.append(group);}}
 for(const record of profile.undated)section.append(link(record.title+' — individual passage not dated',record.href));parent.append(section);
}
