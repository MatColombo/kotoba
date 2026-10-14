'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const old=require('./fixtures/deck-phase3.json'),deck=require('../decks/n4-core.json');
const Content=require('../source/content.js'),Store=require('../source/storage.js'),Sessions=require('../source/sessions.js');
test('phase4 deck keeps 75 permanent card IDs and 750 old example IDs',()=>{
 assert.deepEqual(deck.cards.map(c=>String(c.id)),old.cards.map(c=>String(c.id)));
 for(let i=0;i<75;i++)assert.deepEqual(deck.cards[i].legacyExamples,old.cards[i].examples);
});
test('phase4 2250 contextual examples 30 for each card, 10 per register',()=>{
 assert.equal(deck.cards.length,75);assert.equal(deck.cards.reduce((n,c)=>n+c.examples.length,0),2250);assert.equal(Content.validateContextDeck(deck).length,0);
});
test('all contextual examples have stable IDs, complete text, correct scenario and review status',()=>{
 const scen=new Map(deck.scenarios.map(s=>[s.id,s]));const ids=new Set();
 for(const c of deck.cards)for(const e of c.examples){assert(!ids.has(e.id));ids.add(e.id);assert.equal(e.cardId,String(c.id));assert.equal(e.register,scen.get(e.scenarioId).register);assert(e.jp.length&&e.kana.length&&e.it.length&&e.en.length);assert(!/[\u4e00-\u9fff]/.test(e.kana));assert.equal(e.reviewStatus,'draft-contextual-framing')}
});
test('catalog specifies four revision; all 30 scenarios have unique IDs',()=>{
 assert.equal(deck.revision,4);assert.equal(require('../decks/catalog.json').decks[0].revision,4);
 assert.equal(deck.scenarios.length,30);assert.equal(new Set(deck.scenarios.map(s=>s.id)).size,30);
 assert.deepEqual(deck.scenarios.reduce((a,s)=>(a[s.register]=(a[s.register]||0)+1,a),{}),{informal:10,colleague:10,superior:10});
});
test('selected register + scenario returns the expected example or none',()=>{
 const c=deck.cards[0];assert.equal(Content.examplesFor(c,{register:'informal'}).length,10);
 assert.equal(Content.examplesFor(c,{register:'colleague'}).length,10);
 assert.equal(Content.examplesFor(c,{register:'superior',scenario:'superior-03'}).length,1);
 assert.equal(Content.examplesFor(c,{register:'informal',scenario:'superior-03'}).length,0);
 assert.equal(Content.examplesFor(c,{register:'legacy'}).length,10);
});
test('unfiltered practice alternates three registers at each ordinal scenario',()=>{
 const c=deck.cards[0];assert.deepEqual(Content.examplesFor(c).slice(0,6).map(x=>x.register),['informal','colleague','superior','informal','colleague','superior']);
});
test('groups comprise seven groups of ten and one of five, no duplicates',()=>{
 assert.deepEqual(deck.storyGroups.map(g=>g.cardIds.length),[10,10,10,10,10,10,10,5]);
 assert.equal(new Set(deck.storyGroups.flatMap(g=>g.cardIds)).size,75);
 assert.equal(deck.stories.length,8);assert.equal(deck.stories.reduce((n,s)=>n+s.segments.length,0),38);
});
test('each story has all its target cards represented in at least one segment',()=>{
 for(const st of deck.stories){const ids=new Set(st.segments.flatMap(s=>s.cardIds));assert(st.segments.length>=4);assert(st.cardIds.every(x=>ids.has(x)));assert.equal(st.groupId,deck.storyGroups.find(g=>g.storyId===st.id).id)}
});
test('legacy deck to phase4 deck is additive with all 750 old examples preserved',()=>{
 const diff=Store.compareDeck(old,deck);assert.equal(diff.kind,'additive');assert.equal(diff.exampleRemoved.length,0);assert.equal(diff.exampleAdded.length,2250);
 const st=Store.emptyStudy();st.deckStates[deck.deckId]={cards:{'1':{exposures:4,known:true,exampleCounts:{'1:ex:1':3}}}};
 st.sessions=[{id:'persisted',deckId:deck.deckId,orderedCardIds:['1','2','3']}];const repaired=Store.reconcileStudy(st,deck.deckId,{...diff,nextCardIds:deck.cards.map(x=>String(x.id))});
 assert.equal(repaired.deckStates[deck.deckId].cards['1'].exposures,4);assert.deepEqual(repaired.sessions[0].orderedCardIds,['1','2','3']);
});
test('form grammatical data and language master settings never duplicated inside content',()=>{
 for(const c of deck.cards){assert(c.forms.length>0);assert(!c.audioMasters);for(const e of c.examples){assert(!e.rate&&!e.pitch&&!e.volume&&!e.voiceId)}}
});
test('session group/story filters restrict cards to ten or five',()=>{
 const g=deck.storyGroups[0],st=deck.stories[7];
 assert.equal(Sessions.filterCards(deck.cards,{}, {groupId:g.id}).length,10);
 assert.equal(Sessions.filterCards(deck.cards,{}, {storyId:st.id}).length,5);
 assert.equal(Sessions.filterCards(deck.cards,{}, {register:'colleague',scenario:'colleague-01'}).length,75);
 assert.equal(Sessions.filterCards(deck.cards,{}, {register:'legacy'}).length,75);
});
test('new deck passes validation without affecting imported decks',()=>{
 const result=Store.normalizeDeck(deck);assert.deepEqual(result.errors,[]);
 const x=structuredClone(deck);x.deckId='alternate-phase4';assert.equal(Store.normalizeDeck(x).errors.length,0);
});
