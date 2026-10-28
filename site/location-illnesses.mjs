// Supplemental gameplay descriptions stay outside source paragraphs and their saved anchors.
export function renderLocationIllnesses(parent,illnesses=[]){
 parent.replaceChildren();parent.hidden=!illnesses.length;
 for(const illness of illnesses){
  const section=document.createElement('section');section.className='location-illness';
  const heading=document.createElement('h2');heading.textContent='Trademark illness: '+illness.name;
  const description=document.createElement('p');description.textContent=illness.description;
  const visual=document.createElement('p');visual.textContent='Appearance: '+illness.visual.replace('Godot draws three translucent copies of the current pet frame','Three translucent echoes of the pet appear').replaceAll('PixelLab ','');
  const care=document.createElement('p');care.textContent='Care: '+illness.treatment;
  const link=document.createElement('a');link.href=illness.href;link.textContent='View '+illness.name+' in the illness guide →';
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Story connection & possible future';
  const hook=document.createElement('p');hook.textContent=illness.story_hook;
  const status=document.createElement('p');status.className='small-note';status.textContent=illness.status;
  details.append(summary,hook);section.append(heading,description,visual,care,link,status,details);parent.append(section);
 }
}
