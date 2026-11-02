// Version-scoped cache for GitHub Pages static app. IndexedDB study data is not cached here.
const CACHE_PREFIX='kotoba-drive-';
const CACHE_NAME='kotoba-drive-2026-11-02-v046-hybrid-form-label';
const APP_FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./voice-sandbox.html','./decks/catalog.json','./decks/n4-core.json','./decks/scenarios.json','./bridge.mp3','./tts-worker.js'];
// The two complete decks (about 33 MiB together) are downloaded only on demand.
// Once installed, their offline source of truth is IndexedDB, not a second Cache API copy.
const LARGE_DECK_PATHS=['/decks/n4-final-kotoba-drive.json','/decks/n5-final-kotoba-drive.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 const pathname=new URL(request.url).pathname;
 // ONNX weights/voice embeddings/token shards are never duplicated in Cache API.
 // Models use the browser's normal HTTP cache; PCM lives only in memory for the active session.
 // Keep the service-worker offline app shell but avoid consuming storage quota on iOS.
 if(pathname.includes('/onnx/') || pathname.endsWith('.onnx') || pathname.endsWith('.f32')){
  event.respondWith(fetch(request));return;
 }
 if(pathname.includes('/decks/')){
  // These large deck files are not cached twice (Cache API + IndexedDB).
  if(LARGE_DECK_PATHS.some(path=>pathname.endsWith(path))){event.respondWith(fetch(request));return}
  // Network first permits catalog refreshes; installed decks themselves live in IndexedDB.
  event.respondWith(fetch(request).then(response=>{if(response.ok){const cloned=response.clone();caches.open(CACHE_NAME).then(c=>c.put(request,cloned));}return response;}).catch(()=>caches.match(request)));
 }else if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{if(response.ok){const cloned=response.clone();caches.open(CACHE_NAME).then(c=>c.put(request,cloned));}return response;}).catch(()=>caches.match(request).then(response=>response||caches.match('./index.html'))));
 }else{
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const cloned=response.clone();caches.open(CACHE_NAME).then(c=>c.put(request,cloned));}return response;})));
 }
});
