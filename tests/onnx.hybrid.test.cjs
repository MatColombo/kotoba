'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {OnnxStudyAudio,normalizeSettings,spokenText}=require('../source/onnx-tts.js');
const Core=require('../source/engine.js');
const say=(text,lang,type='word',rate=1)=>({kind:'say',lang,text,type,settings:{rate,pitch:1,volume:.8}});
const create=(plans,settings={})=>{
 const device=[];let canceled=0;
 const fallback={speak:async(e,callback)=>{device.push(e);callback?.(e);return 'done';},cancel:()=>canceled++};
 const audio=new OnnxStudyAudio({fallback});
 audio.configure({enabled:true,strategy:'ready',settings:normalizeSettings(settings)});
 audio.bindSession({sessionId:'sess',deckId:'n5',cards:plans.map((_,i)=>({id:i})),index:0,getPlan:i=>({plan:plans[i]||[]})});
 return {audio,device,get canceled(){return canceled;}};
};

test('migrates old ONNX profiles without changing language engines',()=>{
 const profiles=normalizeSettings({ja:{voice:'male_01'},it:{temperature:.45},en:{engine:'device',formLabelRate:.65}});
 assert.equal(profiles.ja.engine,'onnx');assert.equal(profiles.it.engine,'onnx');
 assert.equal(profiles.en.engine,'device');assert.equal(profiles.en.formLabelRate,.65);
 assert.equal(profiles.it.formLabelRate,.8);assert.equal(profiles.ja.formRate,.9);
 assert.equal(normalizeSettings({it:{engine:'unsafe'}}).it.engine,'onnx');
});

test('short grammar announcements become readable and well-punctuated sentences',()=>{
 const p=normalizeSettings();
 assert.equal(spokenText('it','Forma te','formLabel',p.it),'Adesso ascolta la forma te.');
 assert.equal(spokenText('it','Forma nai, negativa','formLabel',p.it),'Adesso ascolta la forma nai, negativa.');
 assert.equal(spokenText('en','Te form','formLabel',p.en),'Now listen to the te form.');
 assert.equal(spokenText('it','incontrare; vedersi','meaning',p.it),'In italiano significa incontrare oppure vedersi.');
});

test('hybrid ready mode pre-generates Japanese only and skips Italian audio work',async()=>{
 const jp=say('学校','ja-JP','word'), it=say('scuola','it-IT','meaning');
 const x=create([[jp,it,jp]],{it:{engine:'device'}});
 const generated=[];x.audio.generateEvent=async(e)=>{generated.push(e.lang);return {samples:new Float32Array(240),sampleRate:24000};};
 await x.audio.prepareCard(0);
 assert.deepEqual(generated,['ja-JP']);
 assert.equal(x.audio.percent(0),100);
 assert.equal(x.audio.cache.entries.size,1);
 let began=0;const status=await x.audio.speak(it,()=>began++);
 assert.equal(status,'done');assert.equal(began,1);
 assert.deepEqual(x.device.map(d=>d.text),['In italiano significa scuola.']);
 assert.equal(x.device[0].settings.rate,1);
 assert.deepEqual(generated,['ja-JP']);
});

test('Italian-device-only cards report ready immediately and never spin up a Worker',async()=>{
 const it=say('Buongiorno!','it-IT','exampleNative');
 const x=create([[it]],{it:{engine:'device'}});
 await x.audio.prepareCard(0);
 assert.equal(x.audio.percent(0),100);
 assert.equal(x.audio.client,null);
 assert.equal(x.audio.cache.entries.size,0);
 assert.equal(await x.audio.speak(it),'done');
 assert.equal(x.device[0].text,'Buongiorno!');
});

test('device grammar labels have slower playback, are contextualized, and preserve voice override',async()=>{
 const ev=say('Forma nai, negativa','it-IT','formLabel',1.3);
 const x=create([[ev]],{it:{engine:'device',formLabelRate:.7}});
 let started=0;await x.audio.speak(ev,()=>started++);
 assert.equal(started,1);
 assert.equal(x.device[0].text,'Adesso ascolta la forma nai, negativa.');
 assert.equal(Number(x.device[0].settings.rate.toFixed(2)),.91);
 assert.equal(ev.text,'Forma nai, negativa');assert.equal(ev.settings.rate,1.3);
});

test('Japanese conjugation playback is slowed independently of labels and does not regenerate PCM',async()=>{
 const ev=say('決めて','ja-JP','form',1.2);
 const x=create([[ev]],{ja:{formRate:.75}});
 const adjusted=x.audio.playbackEvent(ev);
 assert.ok(Math.abs(adjusted.settings.rate-.9)<1e-9);
 assert.equal(x.audio.eventKey(ev),x.audio.eventKey({...ev,settings:{...ev.settings,rate:.8}}));
 assert.equal(ev.settings.rate,1.2);
});

test('hybrid preloading synthesizes only ONNX utterances across future cards',async()=>{
 const plans=Array.from({length:3},(_,i)=>[say('日本語'+i,'ja-JP'),say('italiano '+i,'it-IT')]);
 const x=create(plans,{it:{engine:'device'}});const rendered=[];
 x.audio.generateEvent=async(e,i)=>{rendered.push([e.lang,i]);return {samples:new Float32Array(48),sampleRate:24000};};
 await x.audio.prepareCard(0);
 x.audio.scheduleFuture();await x.audio.waitCard(1);await x.audio.waitCard(2);
 assert.deepEqual(rendered,[["ja-JP",0],["ja-JP",1],["ja-JP",2]]);
 assert.equal(x.audio.percent(1),100);assert.equal(x.audio.percent(2),100);
 assert.equal(x.device.length,0);
});

test('Native Web Speech adapter receives the adjusted utterance playback rate',async()=>{
 const utterances=[];
 class Utterance{constructor(text){this.text=text;}}
 const synthesizer={speak(u){utterances.push(u);queueMicrotask(()=>u.onend?.());},resume(){},cancel(){}};
 const sp=new Core.SpeechAdapter(synthesizer,Utterance,lang=>({name:'local',lang}));
 const a=new OnnxStudyAudio({fallback:sp});a.configure({enabled:true,settings:normalizeSettings({it:{engine:'device',formLabelRate:.8}})});
 assert.equal(await a.speak(say('Forma te','it-IT','formLabel',1.2)),'done');
 assert.equal(utterances.length,1);assert.equal(utterances[0].text,'Adesso ascolta la forma te.');
 assert.equal(utterances[0].rate,.96);assert.equal(utterances[0].lang,'it-IT');
});

test('hybrid UI, preparation text and offline service worker revision are present',()=>{
 const base=path.join(__dirname,'..');const html=fs.readFileSync(path.join(base,'source/template.html'),'utf8');
 const app=fs.readFileSync(path.join(base,'source/app.js'),'utf8');
 const preparer=fs.readFileSync(path.join(base,'tools/prepare_kotoba_onnx.py'),'utf8');
 const sw=fs.readFileSync(path.join(base,'service-worker.js'),'utf8');
 assert.ok(html.includes('id="onnx-hybrid-preset"'));
 assert.ok(app.includes("state.ttsParams.it.engine='device'"));
 assert.ok(app.includes('formLabelRate'));
 assert.ok(app.includes('formRate'));
 assert.ok(preparer.includes("'Adesso ascolta la '"));
 assert.ok(sw.includes('v046-hybrid-form-label'));
});
