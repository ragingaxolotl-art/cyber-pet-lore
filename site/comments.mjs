export const COMMENTS_URL='https://cyber-pet-classroom-settings.ragingaxolotl.chatgpt.site/lore-comments';
const home=new URL('index.html',import.meta.url);
const drafts=new Map();
export async function commentsApi(path='',{method='GET',body,token='',request=fetch}={}){
 let response;try{response=await request(COMMENTS_URL+path,{method,cache:'no-store',redirect:'error',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});}catch{throw Error('Could not reach comments. Check your connection and try again.');}
 let data;try{data=await response.json();}catch{throw Error('The comment service returned an unreadable response. Please retry.');}
 if(!response.ok)throw Error(data.error||'Comments could not be loaded.');return data;
}
export function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
export function loadCommentsStyle(){if(document.querySelector('link[data-lore-comments]'))return;const css=node('link');css.rel='stylesheet';css.href=new URL('comments.css',import.meta.url);css.dataset.loreComments='';document.head.append(css);}
export function mountComments(root,{id,title}){
 loadCommentsStyle();root.replaceChildren();root.classList.add('lore-comments');root.setAttribute('aria-label','Comments and private feedback');
 const heading=node('h2','Leave a comment'),intro=node('p','Join the discussion or send feedback privately to the author.'),form=node('form');
 const modeLabel=node('label','Who can read this?'),mode=node('select');mode.name='visibility';for(const [value,label] of [['public','Public comment'],['private','Private feedback to the author']]){const option=node('option',label);option.value=value;mode.append(option);}modeLabel.append(mode);
 const explanation=node('p');explanation.className='comment-help';
 const nameLabel=node('label','Name or nickname (optional)'),name=node('input');name.maxLength=60;name.autocomplete='nickname';nameLabel.append(name);
 const messageLabel=node('label','Your message'),message=node('textarea');message.rows=5;message.maxLength=5000;message.required=true;messageLabel.append(message);
 const trapLabel=node('label','Website (leave empty)'),trap=node('input');trap.name='website';trap.tabIndex=-1;trap.autocomplete='off';trapLabel.append(trap);trapLabel.hidden=true;
 const replyInfo=node('p'),cancelReply=node('button','Cancel reply');cancelReply.type='button';const replyBar=node('div');replyBar.append(replyInfo,cancelReply);replyBar.hidden=true;
 const submit=node('button','Submit public comment');submit.type='submit';const status=node('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 let draft=drafts.get(id)||{name:'',body:'',visibility:'public',parentId:null,requestId:crypto.randomUUID()};drafts.set(id,draft);
 name.value=draft.name;message.value=draft.body;mode.value=draft.visibility;
 const remember=()=>{draft={name:name.value,body:message.value,visibility:mode.value,parentId:draft.parentId,requestId:crypto.randomUUID()};drafts.set(id,draft);};
 const updateMode=()=>{const priv=mode.value==='private';explanation.textContent=priv?'Sent to the author’s private inbox. It will never appear in the public comments.':'Visible to everyone after the author approves it. Use a nickname if you prefer.';submit.textContent=priv?'Send private feedback':'Submit public comment';if(priv)draft.parentId=null;replyBar.hidden=!draft.parentId;replyInfo.textContent=draft.parentId?'Replying to comment #'+draft.parentId:'';};
 name.oninput=remember;message.oninput=remember;mode.onchange=()=>{remember();updateMode();};cancelReply.onclick=()=>{draft.parentId=null;remember();updateMode();};updateMode();
 form.append(modeLabel,explanation,nameLabel,replyBar,messageLabel,trapLabel,submit,status);
 const listHeading=node('h3','Public discussion'),list=node('div'),listStatus=node('p'),refresh=node('button','Refresh comments'),more=node('button','Load more comments');more.hidden=true;let after=null,loading=false;
 async function load(append=false){if(loading)return;loading=true;refresh.disabled=true;more.disabled=true;listStatus.textContent='Loading comments…';try{const result=await commentsApi('?thread='+encodeURIComponent(id)+(append&&after?'&after='+after:''));if(!append)list.replaceChildren();for(const item of result.items){const card=node('article');card.className='comment-card';card.id='comment-'+item.id;const meta=node('p',(item.name||'Reader')+' · '+new Date(item.created_at*1000).toLocaleDateString()+' · #'+item.id);meta.className='comment-meta';const body=node('p',item.body);body.className='comment-body';card.append(meta);if(item.parent_id)card.append(node('p','Reply to comment #'+item.parent_id));card.append(body);const reply=node('button','Reply');reply.onclick=()=>{draft.parentId=item.id;mode.value='public';remember();updateMode();message.focus();};card.append(reply);list.append(card);}after=result.nextAfter;more.hidden=!after;listStatus.textContent=list.children.length?'':'No public comments yet. Start the conversation.';}catch(error){listStatus.textContent=error.message;}finally{loading=false;refresh.disabled=false;more.disabled=false;}}
 refresh.onclick=()=>load();more.onclick=()=>load(true);
 form.onsubmit=async event=>{event.preventDefault();if(!message.value.trim()){status.textContent='Write a message before submitting.';message.focus();return;}const payload={thread:id,title,...draft,website:trap.value};const controls=[submit,mode,name,message,cancelReply];controls.forEach(el=>el.disabled=true);status.textContent='Sending…';try{await commentsApi('',{method:'POST',body:payload});message.value='';draft={...draft,body:'',parentId:null,requestId:crypto.randomUUID()};drafts.set(id,draft);updateMode();status.textContent=payload.visibility==='private'?'Private feedback sent to the author. Thank you.':'Comment received. It will appear here after the author approves it.';}catch(error){status.textContent=error.message+' Your message is still in the form.';}finally{controls.forEach(el=>el.disabled=false);}};
 const owner=node('a','Owner inbox');owner.href=new URL('comments-inbox.html',home).href;const footer=node('p');footer.className='comment-help';footer.append(owner);
 root.append(heading,intro,form,listHeading,refresh,listStatus,list,more,footer);void load();
}
