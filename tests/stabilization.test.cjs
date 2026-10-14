'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Store=require('../source/storage.js');
const Engine=require('../source/engine.js');
const Content=require('../source/content.js');
const deck=require('../decks/n4-core.json');
const copy=globalThis.structuredClone;
const baseDeck=()=>({schemaVersion:1,deckId:'unit-deck',revision:1,title:'Unit',languages:['ja','it','en'],cards:[{id:'c1',jp:'決める',kana:'きめる',pos:'verb',meaning:{it:'decidere',en:'to decide'},forms:[{label:'ます形',jp:'決めます'}],examples:[{id:'ex1',jp:'今日決めます。',kana:'きょうきめます。',it:'Decido oggi.',en:'I decide today.'}]}],stories:[],scenarios:[]});

// Synchronous fake IndexedDB transactions with copy-on-write and rollback. This
// checks the application's transactional *intent*, not a real browser implementation.
function fakeIDB(){
 const names=['decks','study','sessions','sequences','meta'];
 const data=new Map(names.map(n=>[n,new Map()]));
 let failAt=null;
 const snapshot=()=>JSON.stringify([...data].map(([name,store])=>[name,[...store]]));
 const db={transaction(stores,mode){
   const draft=new Map([...data].map(([name,items])=>[name,new Map([...items].map(([k,v])=>[k,copy(v)]))]));
   let aborted=false;
   const tx={oncomplete:null,onabort:null,onerror:null,objectStore(name){
     if(!stores.includes(name))throw Error('Store not in transaction');
     const map=draft.get(name);
     return {put(record){if(failAt===`${name}.put`)throw Error('QuotaExceededError simulated');map.set(record.deckId||record.id,copy(record));},clear(){map.clear()},delete(key){map.delete(key)},get(key){return {onsuccess:null,onerror:null,result:map.get(key)}}};
   },abort(){aborted=true;queueMicrotask(()=>tx.onabort?.())}};
   queueMicrotask(()=>{if(aborted)return;data.clear();for(const [n,m] of draft)data.set(n,m);tx.oncomplete?.()});
   return tx;
 }};
 return {database:new Store.Database(db),data,snapshot,fail:(v)=>{failAt=v}};
}

test('replaceAll stores a recoverable safety backup atomically with replacement',async()=>{
 const x=fakeIDB(),old=Store.emptyStudy(),fresh=Store.emptyStudy();
 old.settings.lang='it';fresh.settings.lang='en';
 await x.database.replaceAll({decks:[baseDeck()],study:fresh,backup:{format:'kotoba-backup',schemaVersion:1,decks:[baseDeck()],study:old}});
 assert.equal(x.data.get('decks').size,1);
 assert.equal(x.data.get('study').get('main').data.settings.lang,'en');
 assert.equal(x.data.get('meta').get('pre-import-backup').data.study.settings.lang,'it');
});

test('interrupted replacement rolls back every store, including safety backup',async()=>{
 const x=fakeIDB();await x.database.saveBundle({study:Store.emptyStudy(),sessions:[],sequenceLibrary:null});
 const baseline=x.snapshot();x.fail('study.put');
 await assert.rejects(x.database.replaceAll({decks:[baseDeck()],study:Store.emptyStudy(),backup:{format:'kotoba-backup'}}),/QuotaExceededError/);
 assert.equal(x.snapshot(),baseline);
});

test('importing study clears obsolete sequence record while preserving backup',async()=>{
 const x=fakeIDB(),before=Store.emptyStudy(),after=Store.emptyStudy();
 await x.database.saveBundle({study:before,sessions:[],sequenceLibrary:{sequences:[{sequenceId:'old'}]}});
 await x.database.saveBundle({study:after,sessions:[],sequenceLibrary:null,backup:{format:'kotoba-backup',study:before,decks:[]}});
 assert.equal(x.data.get('sequences').size,0);
 assert.equal(x.data.get('meta').get('pre-import-backup').data.study.schemaVersion,1);
});

test('invalid imported deck objects report errors instead of throwing',()=>{
 const d=baseDeck();d.stories=[{id:'s1',cardIds:['c1'],segments:{}}];
 assert.doesNotThrow(()=>Store.normalizeDeck(d));
 assert.ok(Store.normalizeDeck(d).errors.some(s=>s.includes('segments')));
 const g=baseDeck();g.storyGroups=[null];
 assert.doesNotThrow(()=>Store.normalizeDeck(g));
 assert.ok(Store.normalizeDeck(g).errors.length);
 const e=baseDeck();e.scenarios=[{id:'market'}];e.cards[0].examples=[null];
 assert.doesNotThrow(()=>Store.normalizeDeck(e));
 assert.ok(Store.normalizeDeck(e).errors.length);
});

test('imported study rejects duplicate sessions and hostile sequence IDs',()=>{
 const doc=Store.emptyStudy(),session={id:'same-id',deckId:'unit-deck',orderedCardIds:['c1']};
 doc.sessions=[session,copy(session)];assert.throws(()=>Store.normalizeStudy(doc),/Sessione/);
 doc.sessions=[];doc.sequences={sequences:[{sequenceId:'unsafe-"',groups:[]}]};
 assert.throws(()=>Store.normalizeStudy(doc),/Sequenza/);
 doc.sequences={sequences:[{sequenceId:'valid',groups:[{id:'g',items:[{id:'el'},{id:'el'}]}]}]};
 assert.throws(()=>Store.normalizeStudy(doc),/Elemento/);
 // Sparse older sequence records remain importable.
 doc.sequences={sequences:[{sequenceId:'valid',groups:[{id:'g'}]}]};
 assert.deepEqual(Store.normalizeStudy(doc).sequences,doc.sequences);
});

test('no session completes after TTS reports unavailable, error, or timeout',async()=>{
 for(const response of ['unavailable','error','timeout']){
  let completed=0,fault='',sayResults=[];
  const player=new Engine.PlaybackController({speech:{cancel(){},speak:async()=>response},onComplete:()=>completed++,onFailure:r=>fault=r,onSpeechResult:(e,r)=>sayResults.push(r)});
  player.start([{kind:'say',text:'決める'},{kind:'cardComplete'}]);
  for(let i=0;i<6;i++)await Promise.resolve();
  assert.equal(completed,0);assert.equal(fault,response);assert.equal(player.status,'failed');
  assert.deepEqual(sayResults,[response]);
 }
});

test('SpeechAdapter emits start only on actual utterance start and cancels a timed-out voice',async()=>{
 let callback,watchdog,cancels=0,created;
 const scheduler={setTimeout:fn=>{watchdog=fn;return 1},clearTimeout() {}};
 const adapter=new Engine.SpeechAdapter({speak:u=>{created=u},resume(){},cancel(){cancels++}},class{constructor(text){this.text=text}},()=>null,()=>{},scheduler);
 const starts=[];const promise=adapter.speak({text:'決める',lang:'ja-JP',settings:{rate:0.8,pitch:1.1,volume:0.9}},step=>starts.push(step.text));
 assert.equal(starts.length,0);created.onstart();assert.deepEqual(starts,['決める']);
 callback=created.onend;watchdog();
 assert.equal(await promise,'timeout');assert.equal(cancels,1);
 callback();assert.equal(starts.length,1);
});

test('all 75 cards produce deterministic bounded compilations in both native languages',()=>{
 const seq=Engine.makeDefault('jp-native');let counts=0;
 for(const card of deck.cards)for(const nativeLanguage of ['it','en']){
  const options={nativeLanguage,exampleCount:10,pauseBetweenElementsMs:400,announceForms:true,audioMasters:Engine.audioMasters()};
  const compiled=Engine.compileSequence(card,seq,options);
  assert.equal(JSON.stringify(compiled),JSON.stringify(Engine.compileSequence(card,seq,options)));
  assert.ok(compiled.sayCount>0);
  assert.equal(compiled.plan.at(-1).kind,'cardComplete');
  assert.ok(compiled.plan.length<1000);
  for(const evt of compiled.plan.filter(e=>e.kind==='say')){
    assert.ok(evt.text.trim());assert.ok(['ja-JP','it-IT','en-US'].includes(evt.lang));
    for(const field of ['rate','pitch','volume'])assert.ok(Number.isFinite(evt.settings[field]));
  }
  counts+=compiled.sayCount;
 }
 assert.ok(counts>2000);
});

test('static PWA build references every precached file and keeps paths relative',()=>{
 const root=path.join(__dirname,'..');
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const match=sw.match(/const APP_FILES=(\[[^;]+\]);/);
 assert.ok(match);const paths=Function(`return ${match[1]}`)();
 for(const asset of paths)assert.ok(fs.existsSync(path.join(root,asset.replace(/^\.\//,'')||'index.html')),`missing ${asset}`);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
 assert.ok(manifest.start_url.startsWith('./'));assert.ok(manifest.scope.startsWith('./'));
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes('KotobaCore'));assert.ok(html.includes('KotobaSessions'));
});

test('structural contextual content contains required registers and linked stories (not linguistic certification)',()=>{
 assert.equal(Content.validateContextDeck(deck).length,0);
 assert.equal(deck.cards.length,75);assert.equal(deck.scenarios.length,30);assert.equal(deck.stories.length,8);
 assert.equal(deck.cards.reduce((n,c)=>n+c.examples.length,0),2250);
 assert.equal(deck.cards.reduce((n,c)=>n+(c.legacyExamples?.length||0),0),750);
 assert.equal(new Set(deck.cards.map(c=>c.id)).size,75);
 assert.equal(deck.stories.flatMap(s=>s.cardIds).length,75);
});
