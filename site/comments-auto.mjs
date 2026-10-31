import {mountComments} from './comments.mjs';
// Dynamic library and Connections pages mount their own stable reading IDs.
const base=new URL('./',import.meta.url),path=decodeURIComponent(location.pathname.slice(base.pathname.length));
if(!['index.html','','wiki.html','comments-inbox.html'].includes(path)&&!document.querySelector('.lore-comments')){
 const main=document.querySelector('main');
 if(main){const section=document.createElement('section');main.append(section);mountComments(section,{id:'page:'+path,title:document.querySelector('h1')?.textContent?.trim().slice(0,240)||document.title.slice(0,240)});}
}
