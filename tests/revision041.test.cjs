'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../source/sessions.js'),C=require('../source/content.js'),Store=require('../source/storage.js');
const cards=[{id:'1',pos:'verb',examples:Array.from({length:10},(_,i)=>({id:'e'+i,register:i<5?'informal':'colleague',scenarioId:i<5?'informal-01':'colleague-01',jp:'日本語'+i,it:'test'+i,en:'test'+i}))},{id:'2',pos:'noun',examples:Array.from({length:10},(_,i)=>({id:'f'+i,register:'informal',scenarioId:'informal-01'}))}];
test('example shuffle is separate from card shuffle and deterministic',()=>{const opts={deckId:'d',cards,shuffle:false,shuffleExamples:true,exampleSeed:1987,seed:20,count:2};const a=S.buildSession(opts),b=S.buildSession(opts);assert.deepEqual(a.orderedCardIds,['1','2']);assert.deepEqual(a.exampleOrders,b.exampleOrders);assert.equal(a.exampleOrders['1'].length,10);assert.notDeepEqual(a.exampleOrders['1'],cards[0].examples.map(e=>e.id));assert.equal(a.exampleShuffleSeed,1987);});
test('example order persists in exported sessions and restores with new extra examples',()=>{const a=S.buildSession({deckId:'d',cards,shuffleExamples:true,exampleSeed:17});a.exampleOffsets['1']=3;const copy=JSON.parse(JSON.stringify(a));const extra={...cards[0],examples:[...cards[0].examples,{id:'new-example',register:'informal',scenarioId:'informal-01'}]};const filtered=C.examplesFor(extra,copy.filters,copy.exampleOrders['1']);assert.deepEqual(filtered.slice(0,10).map(x=>x.id),copy.exampleOrders['1']);assert.equal(filtered.at(-1).id,'new-example');assert.equal(copy.exampleOffsets['1'],3);});
test('shuffle respects register and scenario filters and does not add other examples',()=>{const a=S.buildSession({deckId:'d',cards,filters:{register:'informal',scenario:'informal-01'},shuffleExamples:true,exampleSeed:44});assert.equal(a.exampleOrders['1'].length,5);assert.ok(a.exampleOrders['1'].every(id=>Number(id.slice(1))<5));assert.equal(C.examplesFor(cards[0],a.filters,a.exampleOrders['1']).length,5);});
test('no example shuffle retains normal scenario order',()=>{const a=S.buildSession({deckId:'d',cards,shuffleExamples:false});assert.deepEqual(a.exampleOrders,{});assert.deepEqual(C.examplesFor(cards[0],a.filters).map(x=>x.id),cards[0].examples.map(x=>x.id));});
test('meaning plays are distinct from completed exposures and survive JSON roundtrips',()=>{const p=S.normalizeProgress({meaningPlays:4,exposures:2,partial:1});assert.equal(p.meaningPlays,4);assert.equal(p.exposures,2);const d=Store.emptyStudy();d.deckStates.d={cards:{'1':p}};const back=Store.normalizeStudy(JSON.parse(JSON.stringify(d)));assert.equal(back.deckStates.d.cards['1'].meaningPlays,4);});
test('study merge conserves larger meaning count without duplicating repeated backups',()=>{
 const a=Store.emptyStudy(),b=Store.emptyStudy();
 a.deckStates.d={cards:{'1':{meaningPlays:5,exposures:2}}};
 b.deckStates.d={cards:{'1':{meaningPlays:8,exposures:3}}};
 const first=Store.mergeStudy(a,b).study;
 const repeated=Store.mergeStudy(first,b).study;
 assert.equal(first.deckStates.d.cards['1'].meaningPlays,8);
 assert.equal(repeated.deckStates.d.cards['1'].meaningPlays,8);
});
test('new context sentences are unique and do not reproduce any legacy Japanese sentence',()=>{
 const deck=require('../decks/n4-core.json'),newTexts=deck.cards.flatMap(c=>c.examples.map(e=>e.jp));
 const originals=new Set(deck.cards.flatMap(c=>c.legacyExamples.map(e=>e.jp)));
 assert.equal(newTexts.length,2250);assert.equal(new Set(newTexts).size,2250);
 assert.equal(newTexts.filter(x=>originals.has(x)).length,0);
 assert(deck.cards.every(c=>new Set(c.examples.map(e=>e.grammarForm)).size>=12));
});

test('English tense in dated adjective examples agrees with Japanese past forms',()=>{
 const deck=require('../decks/n4-core.json');
 for(const card of deck.cards.filter(c=>c.pos==='i'||c.pos==='na')){
  for(const example of card.examples){
   if(!/\u6628\u65e5|\u5148\u9031/.test(example.jp))continue;
   assert.doesNotMatch(example.en,/\b(is|are|am)\b/i,`${card.jp} ${example.id}: ${example.en}`);
  }
 }
});
