import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderLocationArt} from '../site/location-art.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const manifest=read('../sources/location-art.json'),wiki=read('../site/wiki.json'),catalog=read('../site/catalog.json');
const topics=new Map(wiki.topics.map(t=>[t.id,t])),entries=new Map(catalog.entries.map(e=>[e.id,e]));
test('all location pictures resolve to the exact place topic and atlas readings',()=>{
 assert.equal(manifest.locations.length,65);assert.equal(manifest.locations.reduce((n,l)=>n+l.images.length,0),66);
 for(const loc of manifest.locations){const topic=topics.get(loc.topicId);assert.ok(topic?.kinds.includes('Place'));assert.equal(topic.images.length,loc.images.length);
  for(const id of loc.readingIds){assert.equal(entries.get(id)?.kind,'Locations');assert.deepEqual(wiki.readingImages[id],topic.images);assert.ok(topic.targets.some(t=>t.readingId===id));}
  for(const image of loc.images){assert.ok(/^images\/locations\/atlas_\d+-[a-z0-9-]+\.webp$/.test(image.src));assert.ok(image.alt.includes(loc.name));assert.ok(image.width>0&&image.height>0);assert.match(image.sourceSha256,/^[a-f0-9]{64}$/);const b=fs.readFileSync(new URL('../site/'+image.src,import.meta.url));assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,12).toString(),'WEBP');}
 }
});
test('Garden Worlds, chapel views and unmapped places keep distinct artwork',()=>{
 const garden=manifest.locations.find(l=>l.atlasId===15);assert.equal(garden.topicId,'topic-ba373502c637');assert.equal(garden.images[0].sourceAsset,'assets/backgrounds/atlas_expansion/garden_worlds/composite.png');
 const chapel=manifest.locations.find(l=>l.name.includes('Maintenance Chapel'));assert.equal(chapel.images.length,2);assert.notEqual(chapel.images[0].view,chapel.images[1].view);
 assert.ok(!wiki.readingImages['place-listening-alcove']);assert.ok(!topics.get('topic-bb3330db42db').images);
});
test('artwork renderer provides full-size links and removes previous place images',()=>{
 class E{constructor(tag){this.tag=tag;this.children=[];}replaceChildren(...v){this.children=v;}append(...v){this.children.push(...v);}setAttribute(k,v){this[k]=v;}}
 const previous=globalThis.document;globalThis.document={createElement:tag=>new E(tag)};
 try{const parent=new E('section'),images=manifest.locations.find(l=>l.atlasId===15).images;renderLocationArt(parent,images);assert.equal(parent.hidden,false);const figure=parent.children[0],a=figure.children[0],img=a.children[0];assert.equal(a.href,images[0].src);assert.equal(a.target,'_blank');assert.equal(img.alt,images[0].alt);assert.equal(img.width,images[0].width);renderLocationArt(parent,[]);assert.equal(parent.hidden,true);assert.equal(parent.children.length,0);}finally{globalThis.document=previous;}
});
