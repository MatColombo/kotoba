// Version-scoped cache for GitHub Pages static app. IndexedDB study data is not cached here.
const CACHE_PREFIX='kotoba-drive-';
const CACHE_NAME='kotoba-drive-2026-10-14-v040-release';
const APP_FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./voice-sandbox.html','./decks/catalog.json','./decks/n4-core.json','./decks/scenarios.json','./bridge.mp3'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 const pathname=new URL(request.url).pathname;
 if(pathname.includes('/decks/')){
  // Network first permits catalog refreshes; installed decks themselves live in IndexedDB.
  event.respondWith(fetch(request).then(response=>{if(response.ok){const cloned=response.clone();caches.open(CACHE_NAME).then(c=>c.put(request,cloned));}return response;}).catch(()=>caches.match(request)));
 }else if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{if(response.ok){const cloned=response.clone();caches.open(CACHE_NAME).then(c=>c.put(request,cloned));}return response;}).catch(()=>caches.match(request).then(response=>response||caches.match('./index.html'))));
 }else{
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const cloned=response.clone();caches.open(CACHE_NAME).then(c=>c.put(request,cloned));}return response;})));
 }
});
