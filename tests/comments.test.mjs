import test from 'node:test';
import assert from 'node:assert/strict';
// The client only touches the DOM when mounting; import allows transport tests.
import {commentsApi,COMMENTS_URL} from '../site/comments.mjs';
test('submissions carry privacy choice without cookies or private inbox token',async()=>{
 let sent;const body={thread:'story',visibility:'private',body:'Private message'};
 await commentsApi('',{method:'POST',body,request:async(url,options)=>{sent={url,...options};return new Response('{"received":true}',{status:201});}});
 assert.equal(sent.url,COMMENTS_URL);assert.equal(sent.headers.Authorization,undefined);assert.equal(sent.cache,'no-store');assert.equal(sent.redirect,'error');assert.deepEqual(JSON.parse(sent.body),body);
});
test('inbox auth is explicit and service errors preserve useful messages',async()=>{
 await commentsApi('/inbox',{token:'test-token',request:async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer test-token');return new Response('{"items":[]}');}});
 await assert.rejects(commentsApi('',{request:async()=>new Response('{"error":"Please wait"}',{status:429})}),/Please wait/);
 await assert.rejects(commentsApi('',{request:async()=>{throw Error('offline');}}),/Check your connection/);
 await assert.rejects(commentsApi('',{request:async()=>new Response('bad')}),/unreadable/);
});
