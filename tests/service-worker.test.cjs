'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {Request,Response,URL}=globalThis;
const origin='https://example.org/kotoba-drive/';
const canonical=x=>new URL(typeof x==='string'?x:x.url,origin).href;
function mockWorker(){
 const listeners={},storage=new Map(),results={};let online=true;
 const caches={open:async name=>{
   if(!storage.has(name))storage.set(name,new Map());
   const data=storage.get(name);
   return {addAll:async files=>{for(const f of files)data.set(canonical(f),new Response('cached '+f))},put:async(req,res)=>data.set(canonical(req),res),match:async req=>data.get(canonical(req))};
 },keys:async()=>[...storage.keys()],delete:async name=>storage.delete(name),match:async req=>{
   for(const data of storage.values())if(data.has(canonical(req)))return data.get(canonical(req));return undefined;
 }};
 const self={location:{origin:'https://example.org'},addEventListener:(k,handler)=>listeners[k]=handler,skipWaiting:async()=>{},clients:{claim:async()=>{}}};
 const context=vm.createContext({self,caches,URL,Request,Response,fetch:async req=>{
   if(!online)throw Error('OFFLINE');return new Response('fresh '+canonical(req),{status:200});
 },console});
 vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'..','service-worker.js'),'utf8'),context);
 const emit=(name,properties={})=>new Promise(async(resolve,reject)=>{
   let work;
   const event={...properties,waitUntil:p=>work=p,respondWith:p=>work=p};
   try{listeners[name](event);resolve(await work)}catch(e){reject(e)}
 });
 return {emit,caches,storage,setOnline:x=>online=x,results};
}
test('offline navigation and installed deck are answered by the versioned precache',async()=>{
 const sw=mockWorker();await sw.emit('install');await sw.emit('activate');sw.setOnline(false);
 const deck=await sw.emit('fetch',{request:new Request(origin+'decks/n4-core.json')});
 assert.equal((await deck.text()).includes('cached'),true);
 const navigate=await sw.emit('fetch',{request:{url:origin+'deep/link',method:'GET',mode:'navigate'}});
 assert.equal((await navigate.text()),'cached ./index.html');
});
test('activation deletes old versioned caches without deleting unrelated application caches',async()=>{
 const sw=mockWorker();await sw.caches.open('kotoba-drive-old-cache');await sw.caches.open('unrelated-app-cache');
 await sw.emit('install');await sw.emit('activate');
 const keys=await sw.caches.keys();
 assert.ok(!keys.includes('kotoba-drive-old-cache'));assert.ok(keys.includes('unrelated-app-cache'));assert.ok(keys.some(x=>x.startsWith('kotoba-drive-2026-10-14-v041')));
});
test('service worker does not intercept POST or cross-origin traffic',async()=>{
 const sw=mockWorker();await sw.emit('install');await sw.emit('activate');
 assert.equal(await sw.emit('fetch',{request:new Request(origin+'api',{method:'POST'})}),undefined);
 assert.equal(await sw.emit('fetch',{request:new Request('https://other.example/data')}),undefined);
});
