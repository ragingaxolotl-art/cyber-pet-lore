// Author-selected visuals remain separate from quoted source lore.
export function renderProfileMedia(parent,media=[]){
 for(const item of media){
  const section=document.createElement('section');section.className='profile-media';
  const heading=document.createElement('h2');heading.textContent=item.title;
  const status=document.createElement('p');status.className='status-pill';status.textContent=item.status;
  const figure=document.createElement('figure');figure.className='location-art';
  const picture=document.createElement('img');picture.src=item.src;picture.alt=item.alt;picture.width=item.width;picture.height=item.height;picture.loading='lazy';picture.style.cssText='max-width:480px;width:100%;height:auto;image-rendering:pixelated;background:#14111c';
  const caption=document.createElement('figcaption');caption.textContent=item.caption;figure.append(picture,caption);
  const pause=document.createElement('button');pause.type='button';pause.textContent='Pause animation';let playing=true;
  pause.onclick=()=>{playing=!playing;picture.src=playing?item.src:item.poster;pause.textContent=playing?'Pause animation':'Play animation';};
  const links=document.createElement('div');links.className='source-links';
  for(const entry of item.links){const link=document.createElement('a');link.textContent=entry.label;link.href=entry.href;links.append(link);}
  section.append(heading,status,figure);if(item.animated!==false)section.append(pause);section.append(links);parent.append(section);
 }
}
