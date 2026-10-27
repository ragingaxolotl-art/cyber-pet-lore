import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const html=read('site/songs/index.html'),songs=JSON.parse(html.match(/<script id="song-data" type="application\/json">(.*?)<\/script>/s)[1]),wiki=JSON.parse(read('site/wiki.json'));
test('each song has exact origin lore and existing labeled artwork',()=>{
 assert.equal(songs.length,4);
 for(const song of songs){const place=song.location;assert.ok(wiki.topics.some(t=>t.id===place.topicId));assert.ok(wiki.topics.some(t=>t.id===place.artTopicId));assert.ok(place.images.length);
 for(const image of place.images){assert.ok(fs.existsSync(new URL('site/'+image.src,root)));assert.ok(read('site/images/locations/location-files.csv').includes(image.src));}
 }
 const room=songs.find(s=>s.folder==='04_room_to_restore').location;assert.equal(room.name,'Listening Alcove');assert.notEqual(room.topicId,room.artTopicId);assert.match(room.note,/no separate alcove image/);
});
