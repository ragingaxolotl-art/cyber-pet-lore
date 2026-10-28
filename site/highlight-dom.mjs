import {highlightIntervals} from './records.mjs';

// Decorate text nodes in place: existing anchors and their full hit areas survive,
// even when a selection starts or ends in the middle of a linked name.
export function paintHighlights(element,block,highlights,onOpen=()=>{}){
 for(const mark of element.querySelectorAll('mark[data-highlight]'))mark.replaceWith(...mark.childNodes);
 element.normalize();
 const text=element.textContent,intervals=highlightIntervals(text,block,highlights);
 const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),nodes=[];
 let current,offset=0;
 while((current=walker.nextNode())){nodes.push({node:current,start:offset,end:offset+current.length});offset+=current.length;}
 const ranges=[];offset=0;
 for(const part of intervals){ranges.push({...part,start:offset,end:offset+part.text.length});offset+=part.text.length;}
 for(const {node,start,end} of nodes){
  if(!ranges.some(p=>p.id&&p.start<end&&p.end>start))continue;
  const fragment=document.createDocumentFragment();
  for(const part of ranges){const from=Math.max(start,part.start),to=Math.min(end,part.end);if(to<=from)continue;
   const value=text.slice(from,to);
   if(!part.id){fragment.append(document.createTextNode(value));continue;}
   const mark=document.createElement('mark');mark.textContent=value;mark.dataset.highlight=part.id;mark.dataset.color=part.color;
   mark.title=highlights.find(h=>h.id===part.id)?.note||'Highlighted passage';
   mark.addEventListener('click',event=>{if(!mark.closest('a')&&!event.target.closest('a'))onOpen(part.id);});fragment.append(mark);
  }
  node.replaceWith(fragment);
 }
}
