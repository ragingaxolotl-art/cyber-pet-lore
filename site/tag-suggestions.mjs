// The bank is derived from saved tags, so it follows existing backups and imports.
export function tagBank(state){
 const tags=new Map();
 for(const record of Object.values(state.readings||{}))for(const tag of [...(record.tags||[]),...(record.highlights||[]).flatMap(h=>h.tags||[])]){
  const clean=tag.trim(),key=clean.toLocaleLowerCase();if(clean&&!tags.has(key))tags.set(key,clean);
 }
 return [...tags.values()].sort((a,b)=>a.localeCompare(b));
}
export function tagToken(value,caret=value.length){
 const start=caret<=0?0:value.lastIndexOf(',',caret-1)+1,next=value.indexOf(',',caret),end=next<0?value.length:next;
 return {start,end,query:value.slice(start,caret).trim(),used:value.slice(0,start).concat(value.slice(end)).split(',').map(t=>t.trim().toLocaleLowerCase()).filter(Boolean)};
}
export function matchingTags(bank,value,caret=value.length){const token=tagToken(value,caret);return bank.filter(tag=>tag.toLocaleLowerCase().startsWith(token.query.toLocaleLowerCase())&&!token.used.includes(tag.toLocaleLowerCase())).slice(0,12);}
export function insertTag(value,caret,tag){const {start,end}=tagToken(value,caret),prefix=value.slice(0,start)+(start?' ':''),suffix=value.slice(end);return {value:prefix+tag+(suffix||', '),caret:(prefix+tag+(suffix?',':', ')).length};}
let nextId=0;
export function attachTagSuggestions(input,getState){
 if(!document.getElementById('tag-suggestions-css')){const css=document.createElement('link');css.id='tag-suggestions-css';css.rel='stylesheet';css.href=new URL('tag-suggestions.css',import.meta.url);document.head.append(css);}
 const wrapper=document.createElement('span');wrapper.className='tag-combobox';input.replaceWith(wrapper);wrapper.append(input);
 const list=document.createElement('span');list.className='tag-options';list.id='saved-tags-'+(++nextId);list.setAttribute('role','listbox');list.setAttribute('aria-label','Previously used tags');list.hidden=true;wrapper.append(list);
 input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');input.setAttribute('autocomplete','off');
 let bank=[],matches=[],active=-1;
 function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
 function choose(tag){const result=insertTag(input.value,input.selectionStart??input.value.length,tag);input.value=result.value;input.focus();input.setSelectionRange(result.caret,result.caret);input.dispatchEvent(new Event('input',{bubbles:true}));close();}
 function render(){matches=matchingTags(bank,input.value,input.selectionStart??input.value.length);list.replaceChildren();active=-1;
  if(!matches.length){close();return;}
  matches.forEach((tag,i)=>{const option=document.createElement('span');option.id=list.id+'-'+i;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.textContent=tag;option.addEventListener('pointerdown',event=>event.preventDefault());option.addEventListener('click',()=>choose(tag));list.append(option);});
  list.hidden=false;input.setAttribute('aria-expanded','true');input.removeAttribute('aria-activedescendant');
 }
 function highlight(index){active=index;[...list.children].forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));input.setAttribute('aria-activedescendant',list.children[active].id);list.children[active].scrollIntoView({block:'nearest'});}
 input.addEventListener('focus',()=>{bank=tagBank(getState());render();});
 input.addEventListener('input',render);input.addEventListener('click',render);
 input.addEventListener('blur',close);
 input.addEventListener('keydown',event=>{
  if(event.key==='Escape'){close();event.preventDefault();event.stopPropagation();}
  else if(event.key==='ArrowDown'||event.key==='ArrowUp'){if(list.hidden)render();if(!matches.length)return;event.preventDefault();highlight(active<0?(event.key==='ArrowDown'?0:matches.length-1):(active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length);}
  else if(event.key==='Enter'&&!list.hidden&&active>=0){event.preventDefault();choose(matches[active]);}
  else if(event.key==='Tab')close();
 });
 input.addEventListener('keyup',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key))render();});
}
