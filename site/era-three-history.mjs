const element=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
export function renderRealHistory(parent,data){
 const section=element('section');section.className='human-clock';section.id='real-world-history';
 section.append(element('h3','The human-world timeline · 1950–2026'),element('p',`${data.entries.length} real-world milestones, with sources and connections to Cyberpath. Expand an entry to read it. Fictional events follow below with no assigned calendar dates.`));
 const full=element('a','Read the complete annotated timeline in the lore book →');full.href='index.html#read=reference-era-three-history';section.append(full);
 section.append(element('p','Reviewed '+data.reviewed+'. Dates may identify a publication or disclosure rather than the underlying incident. Month-only and year-only dates do not establish precise order within those periods.'));
 const list=element('ol');list.className='event-list';
 for(const event of data.entries){
  const item=element('li'),details=element('details');details.id='real-'+event.id;
  details.append(element('summary',event.date+' — '+event.title),element('p','REAL WORLD · '+event.category+'. '+event.fact),element('p','STORY CONNECTION · Editorial interpretation. '+event.connection),element('p','EVIDENCE LIMIT · '+event.limit));
  const links=element('div');links.className='source-links';
  for(const source of event.sources){const a=element('a',source.label+' ↗');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
  const lore=element('a','Connected lore passage →');lore.href='index.html#read=lore-p00039&block=lore-p'+String(event.paragraph).padStart(5,'0');links.append(lore);details.append(links);item.append(details);list.append(item);
 }
 section.append(list);parent.append(section);
}
