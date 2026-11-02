'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {normalizeSettings,spokenText,orderedEvents,uniqueEvents,SessionAudioCache,OnnxStudyAudio}=require('../source/onnx-tts.js');

function say(text,lang,type='exampleJP') {return {kind:'say',text,lang,type,settings:{rate:1.3,volume:.9}};}
function makeAdapter(plans){
  const audio=new OnnxStudyAudio({fallback:{speak:async()=> 'done',cancel(){}}});
  const cfg=normalizeSettings();audio.configure({enabled:true,strategy:'ready',settings:cfg});
  const cards=plans.map((_,id)=>({id:String(id)}));
  audio.bindSession({sessionId:'session-A',deckId:'n5',cards,index:0,getPlan:i=>({plan:plans[i]||[]})});
  return audio;
}
test('settings are independent across languages, including segment and EOS timing',()=>{
 const cfg=normalizeSettings({ja:{temperature:.6,pauseMs:710,framesAfterEos:1},it:{itSeparator:'dash',contextMeaning:false},en:{framesAfterEos:3}});
 assert.equal(cfg.ja.temperature,.6);assert.equal(cfg.ja.pauseMs,710);
 assert.equal(cfg.it.temperature,.3);assert.equal(cfg.it.itSeparator,'dash');assert.equal(cfg.it.contextMeaning,false);
 assert.equal(cfg.en.framesAfterEos,3);assert.equal(cfg.it.framesAfterEos,0);
 assert.equal(cfg.ja.voice,'female_03');assert.equal(cfg.it.voice,'alba_it');assert.equal(cfg.en.voice,'alba');
});
test('Italian meaning semicolon substitution does not create a standalone utterance',()=>{
 for(const [separator,expected] of [['oppure','In italiano significa incontrare oppure vedersi.'],['comma','In italiano significa incontrare, vedersi.'],['dash','In italiano significa incontrare - vedersi.']]){
  const got=spokenText('it','incontrare; vedersi','meaning',{itSeparator:separator,contextMeaning:true});
  assert.equal(got,expected);assert.equal(got.includes(';'),false);
 }
});
test('only enabled sequence utterances are synthesized, never skipped examples',()=>{
 const selected=[say('今日','ja-JP','word'),say('today','en-US','meaning'),say('Esempio 1','ja-JP'),say('Example 1','en-US'),say('Esempio 2','ja-JP'),say('Example 2','en-US')];
 const plan=[{kind:'pause',ms:200},...selected,{...selected[0]},{kind:'cardComplete'}];
 const got=uniqueEvents(plan);assert.equal(got.length,6);
 assert.ok(got.every(e=>!e.text.includes('Example 3')));
 const grouped=orderedEvents(plan,true);
 assert.deepEqual(grouped.map(e=>e.lang),['ja-JP','ja-JP','ja-JP','en-US','en-US','en-US']);
});
test('session cache keeps current, previous, two subsequent cards then clears on new session',async()=>{
 const a=makeAdapter(Array.from({length:7},(_,i)=>[say('card-'+i,'ja-JP','word')]));
 const generated=[];
 a.generateEvent=async(e,i)=>{generated.push(i);return {samples:new Float32Array(96),sampleRate:24000}};
 await a.prepareCard(0);assert.equal(a.percent(0),100);
 a.scheduleFuture();await a.waitCard(1);await a.waitCard(2);
 assert.deepEqual(generated.sort(),[0,1,2]);assert.equal(a.cache.references.size,3);
 a.openCard(2);assert.deepEqual([...a.cache.references.keys()].sort(),[1,2]);
 await a.prepareCard(3);a.openCard(3);assert.deepEqual([...a.cache.references.keys()].sort(),[2,3]);
 // Resume same session retains the cache.
 a.bindSession({sessionId:'session-A',deckId:'n5',cards:a.cards,index:3,getPlan:a.getPlan});assert.equal(a.cache.entries.size,2);
 // Switching session resets cache and model worker.
 a.bindSession({sessionId:'session-B',deckId:'n5',cards:a.cards,index:0,getPlan:a.getPlan});assert.equal(a.cache.entries.size,0);assert.equal(a.cache.bytes,0);
});
test('10-minute preloading is cancellable and has an extended, bounded cache',async()=>{
 const a=makeAdapter(Array.from({length:5},(_,i)=>[say('phrase-'+i,'ja-JP','word')]));
 a.generateEvent=async()=>{await new Promise(r=>setTimeout(r,15));return {samples:new Float32Array(40),sampleRate:24000}};
 const pre=a.preload(10);await new Promise(r=>setTimeout(r,2));a.stopPreload();
 await Promise.race([pre,new Promise((_,reject)=>setTimeout(()=>reject(Error('Preloader stuck')),900))]);
 assert.equal(a.preloadUntil,0);assert.equal(a.cache.extended,true);
 assert.ok(a.cache.bytes <= a.cache.preloadLimit);
});
test('UI, worker and indexed-deck compatibility hooks are present in full Kotoba source',()=>{
 const root=path.join(__dirname,'..');
 const html=fs.readFileSync(path.join(root,'source','template.html'),'utf8');
 const app=fs.readFileSync(path.join(root,'source','app.js'),'utf8');
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const worker=fs.readFileSync(path.join(root,'tts-worker.js'),'utf8');
 for(const id of ['onnx-enabled','onnx-strategy','onnx-preload','onnx-preload-stop','onnx-readiness','onnx-language-params'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(app.includes('playbackController.start(result.plan,start)'));
 assert.ok(app.includes('data-onnx-copy'));
 assert.ok(app.includes('state.audioMasters'));
 assert.ok(sw.includes("pathname.includes('/onnx/')"));
 assert.ok(worker.includes("onnxruntime-web@"));
});

test('post-synthesis master/sequence playback rate affects PCM playback, not synthesis cache key',async()=>{
 const e=say('こんにちは','ja-JP','word');
 const a=makeAdapter([[e]]);
 let generated=0;let observedRate=null;let observedVolume=null;
 a.generateEvent=async()=>{generated++;return {samples:new Float32Array(240),sampleRate:24000}};
 await a.prepareCard(0);
 a.audioContext={
  async resume(){},
  createBuffer(_ch,count,_sr){return {copyToChannel(a){assert.equal(a.length,count);}}},
  createGain(){return {gain:{value:1},connect(){observedVolume=this.gain.value;}}},
  createBufferSource(){return {playbackRate:{value:1},connect(g){return g;},start(){observedRate=this.playbackRate.value;queueMicrotask(()=>this.onended?.());},stop(){}}},
 };
 assert.equal(await a.speak({...e,settings:{rate:1.5,volume:.7}}),'done');
 assert.equal(observedRate,1.5);assert.equal(observedVolume,.7);
 assert.equal(await a.speak({...e,settings:{rate:.8,volume:1}}),'done');
 assert.equal(observedRate,.8);assert.equal(generated,1);
});
