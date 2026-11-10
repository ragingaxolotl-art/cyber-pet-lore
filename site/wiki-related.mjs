// Shared for every topic, including concepts without a standalone dossier.
export function renderConnectedTerms(parent,topic,{document=globalThis.document}={}){
 const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const connections=new Map();for(const c of [...(topic.relatedTerms||[]),...(topic.register?.connections||[])]){const key=c.topicId+'|'+c.source.href;if(c.topicId!==topic.id&&!connections.has(key))connections.set(key,c);}
 const section=node('section',undefined,'wiki-connected-terms'),details=node('details'),summary=node('summary','Connected terms & unexplained lore · '+connections.size);
 details.append(summary,node('p','Topics named in a shared source passage. A connection does not by itself establish identity, causation, or that two people met.','small-note'));
 for(const c of connections.values()){const card=node('article',undefined,'connection-card'),term=node('a',c.title),source=node('a','See the shared passage →');term.href='wiki.html#'+c.topicId;source.href=c.source.href;card.append(term,source);details.append(card);}
 if(!connections.size)details.append(node('p','No shared-passage connections are indexed yet. See Mentioned in for available readings.'));
 section.append(details);parent.append(section);return details;
}
