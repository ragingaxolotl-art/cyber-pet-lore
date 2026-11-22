export const normalize=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replaceAll('−','-');
export function queryTerms(query){return normalize(query).trim().split(/\s+/).filter(Boolean);}
export function matchText(text,terms){text=normalize(text);return terms.every(t=>text.includes(t));}
export function matchDocument(doc,{query='',kind='',era='',status=''}={}){return (!kind||doc.kind===kind)&&(!era||doc.era?.includes(Number(era)))&&(!status||normalize(doc.status).includes(status))&&matchText([doc.title,doc.text,doc.status].join(' '),queryTerms(query));}
export function snippet(text,query,length=230){const terms=queryTerms(query),normalized=normalize(text),pos=Math.min(...terms.map(t=>normalized.indexOf(t)).filter(i=>i>=0));const start=Number.isFinite(pos)?Math.max(0,pos-60):0;return (start?'…':'')+text.slice(start,start+length)+(start+length<text.length?'…':'');}
export function rank(doc,query){const title=normalize(doc.title),q=normalize(query).trim();return title===q?100:title.startsWith(q)?70:title.includes(q)?50:queryTerms(query).every(t=>title.includes(t))?35:10;}
