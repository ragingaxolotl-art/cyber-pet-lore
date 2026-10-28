// Public editorial links preserve the text offsets used by personal highlights.
export function editorialSegments(text, marks = []) {
 const spans = marks.map(mark => ({...mark, start: text.indexOf(mark.quote)}))
  .filter(mark => mark.quote && mark.start >= 0).sort((a,b) => a.start-b.start || b.quote.length-a.quote.length);
 const parts=[];let end=0;
 for(const span of spans){if(span.start<end)continue;
  if(span.start>end)parts.push({text:text.slice(end,span.start)});
  parts.push({text:span.quote,href:span.href,title:span.title});end=span.start+span.quote.length;
 }
 if(end<text.length)parts.push({text:text.slice(end)});
 return parts;
}
export function appendEditorialHighlights(element, text, marks, appendPlain) {
 for(const part of editorialSegments(text, marks)){
  if(!part.href){appendPlain(element,part.text);continue;}
  const link=document.createElement('a');link.className='lore-identification';link.href=part.href;link.title=part.title;link.textContent=part.text;element.append(link);
 }
}
