import {appendWiki} from './wiki-links.mjs?v=profiles-1';
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const link=(text,href)=>{const e=node('a',text);e.href=href;return e;};
export function renderBiography(parent,topic){
 const b=topic.biography;if(!b)return;
 const article=node('article',undefined,'person-article');article.setAttribute('aria-label',topic.title+' biography');
 if(b.status)article.append(node('p',b.status,'status-pill'));
 const lead=node('p',undefined,'person-lead');appendWiki(lead,b.summary,{exclude:topic.id});article.append(lead);
 if(b.portrait){const f=node('figure',undefined,'person-portrait');const img=node('img');Object.assign(img,{src:b.portrait.src,alt:b.portrait.alt,width:192,height:192});f.append(img,node('figcaption',b.portrait.caption));article.append(f);}
 const toc=node('nav',undefined,'person-outline');toc.setAttribute('aria-label','In this biography');
 b.sections.forEach((s,i)=>toc.append(link(s.title,'#'+topic.id+'--section-'+i)));if(b.places.length)toc.append(link('Places in this life','#'+topic.id+'--places'));article.append(toc);
 b.sections.forEach((s,i)=>{const section=node('section',undefined,'person-section');section.id=topic.id+'--section-'+i;section.append(node('h2',s.title));for(const text of s.text.split('\n\n')){const p=node('p');appendWiki(p,text,{exclude:topic.id});section.append(p);}
 const refs=node('details',undefined,'person-evidence');refs.append(node('summary','Sources for this section'));
 for(const source of s.sources){const p=node('p');p.append(link(source.title+' · '+source.blockId,source.href),node('small',' · '+source.status));refs.append(p);}section.append(refs);article.append(section);});
 if(b.interpretation){const section=node('section',undefined,'person-interpretation');section.append(node('h2','Reading the character'),node('span','Interpretation','status-pill'));const p=node('p');appendWiki(p,b.interpretation,{exclude:topic.id});section.append(p);article.append(section);}
 if(b.places.length){const places=node('section',undefined,'person-places');places.id=topic.id+'--places';places.append(node('h2','Places in this life'));for(const place of b.places){const card=node('article',undefined,'person-place');if(place.image){const a=link('',place.href),img=node('img');Object.assign(img,{src:place.image.src,alt:place.image.alt,loading:'lazy',width:160,height:100});a.append(img);card.append(a);}const copy=node('div');copy.append(link(place.name,place.href),node('p',place.relationship));card.append(copy);places.append(card);}article.append(places);}
 const sources=node('details',undefined,'person-source-archive');sources.append(node('summary','Source archive and original passages'));const list=node('ul');for(const source of b.bibliography){const li=node('li');li.append(link(source.title,source.href),node('small',' · '+source.status));list.append(li);}sources.append(list);
 for(const section of topic.article?.sections||[]){const group=node('details');group.append(node('summary',section.title+' · '+section.status));for(const p of section.paragraphs){group.append(node('blockquote',p.text),link('Read in context →',p.href));}sources.append(group);}article.append(sources);parent.append(article);
}
