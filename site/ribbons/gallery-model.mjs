export const sections = [
 ['game','Game awards','Achievements earned through play, care, and milestones.'],
 ['classroom','Classroom honours','Teacher recognition, quarter awards, and the first cohort.'],
 ['workshop','Design workshop','Ribbon parts and artwork available for future awards.'],
 ['history','Historical designs','Preserved concepts and earlier designs.']
];
export function sectionFor(entry) {
 if(entry.status==='Archived concept') return 'history';
 if(['Quarter awards','Foundling','High Honors'].includes(entry.category)) return 'classroom';
 if(['Quarter award components','Reserved library'].includes(entry.category)) return 'workshop';
 return 'game';
}
export function matches(entry, {section='all', query='', category='', kind=''}={}) {
 const words=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const text=[entry.name,entry.category,entry.kind,entry.definition,entry.where,entry.reward,entry.notes,entry.status,entry.recognition].join(' ').toLocaleLowerCase();
 return (section==='all'||sectionFor(entry)===section)&&(!category||entry.category===category)&&(!kind||entry.kind===kind)&&words.every(word=>text.includes(word));
}
export function statusLabel(entry) {
 if(entry.id==='quarter-galaxy-gala') return 'Teacher-selected · In game';
 if(sectionFor(entry)==='history') return 'Archived concept';
 if(entry.category==='Quarter awards') return entry.status==='In use'?'Teacher-selected · In game':'Award design';
 if(sectionFor(entry)==='workshop') return 'Design resource';
 return entry.status;
}
export const highHonorsBonus = clasps => 5 + Math.min(4,Math.max(0,Number(clasps)||0))*2;
