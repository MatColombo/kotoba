'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const Store=require('../source/storage.js');
const catalog=require('../decks/catalog.json');
const root=path.join(__dirname,'..');
const expected={N4:{cards:630,contexts:18900,originals:1238},N5:{cards:674,contexts:20220,originals:1320}};
for(const level of ['N4','N5'])test(`${level} online: catalog file exists and entire deck loads without warnings`,()=>{
 const meta=catalog.decks.find(x=>x.level===level);
 assert.ok(meta);assert.equal(meta.deckId,`kotoba-${level.toLowerCase()}-final`);
 assert.match(meta.url,/^\.\/[\w.-]+\.json$/);
 const file=path.join(root,'decks',meta.url.slice(2));
 const bytes=fs.statSync(file).size;
 assert.ok(bytes<20*1024*1024,`${level} exceeds 20 MiB local import limit`);
 const data=JSON.parse(fs.readFileSync(file,'utf8'));
 const parsed=Store.normalizeDeck(data);
 assert.deepEqual(parsed.errors,[]);assert.deepEqual(parsed.warnings,[]);
 assert.equal(data.deckId,meta.deckId);assert.equal(data.level,level);
 assert.equal(data.revision,meta.revision);assert.equal(data.cards.length,expected[level].cards);
 assert.equal(meta.cardCount,data.cards.length);assert.equal(data.scenarios.length,30);
 assert.deepEqual(data.stories,[]);
 const idSet=new Set(),scenarios=new Map(data.scenarios.map(s=>[s.id,s]));
 let examples=0,originals=0;
 for(const c of data.cards){
   assert.equal(c.jlptLevel,level);assert.ok(!idSet.has(String(c.id)));idSet.add(String(c.id));
   assert.equal(c.examples.length,30);assert.ok(c.forms.length>0);
   const ids=new Set();const scenarioSeen=new Set();
   for(const e of c.examples){
     assert.equal(e.cardId,c.id);assert.ok(!ids.has(String(e.id)));ids.add(String(e.id));
     assert.ok(scenarios.has(e.scenarioId));assert.equal(e.register,scenarios.get(e.scenarioId).register);
     assert.ok(!scenarioSeen.has(e.scenarioId));scenarioSeen.add(e.scenarioId);
     for(const f of ['jp','kana','it','en'])assert.ok(typeof e[f]==='string'&&e[f].trim(),`${level}/${c.id}/${e.id}/${f}`);
   }
   assert.equal(scenarioSeen.size,30);
   examples+=c.examples.length;
   originals+=(c.legacyExamples||[]).length;
 }
 assert.equal(examples,expected[level].contexts);
 assert.equal(originals,expected[level].originals);
});
test('online complete decks are not in PWA precache (IndexedDB holds installed copies)',()=>{
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const match=sw.match(/const APP_FILES=(\[[^;]+\]);/);assert.ok(match);
 const precached=Function(`return ${match[1]}`)();
 for(const entry of catalog.decks)assert.ok(!precached.includes('./decks/'+entry.url.slice(2)));
 for(const entry of catalog.decks)assert.ok(sw.includes('/decks/'+entry.url.slice(2)));
});
