// Artwork sits outside source paragraphs so annotation anchors remain unchanged.
export function renderLocationArt(parent,images=[]){
 parent.replaceChildren();parent.hidden=!images.length;
 for(const image of images){
  const figure=document.createElement('figure');figure.className='location-art';
  const link=document.createElement('a');link.href=image.src;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label','Open full-size artwork: '+image.caption);
  const picture=document.createElement('img');picture.src=image.src;picture.alt=image.alt;picture.width=image.width;picture.height=image.height;picture.loading='lazy';picture.decoding='async';
  link.append(picture);const caption=document.createElement('figcaption');caption.textContent=image.caption+' · Project artwork · Open image for full size';
  figure.append(link,caption);
  if(image.flavorText){const flavor=document.createElement('p');flavor.className='location-flavor';flavor.textContent=image.flavorText;figure.append(flavor);}
  if(image.explanation){const explanation=document.createElement('p');explanation.textContent=image.explanation;figure.append(explanation);}
  if(image.contextLinks?.length){const links=document.createElement('p');for(const [index,item] of image.contextLinks.entries()){if(index){const separator=document.createElement('span');separator.textContent=' · ';links.append(separator);}const a=document.createElement('a');a.href=item.href;a.textContent=item.label;links.append(a);}figure.append(links);}
  parent.append(figure);
 }
}
