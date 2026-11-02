/* Kotoba Drive ONNX study audio. Session-scoped PCM cache, one Web Worker/model at a time.
 * No audio is persisted in IndexedDB/Cache API; model HTTP caching is independent.
 * UMD for testability under node:test.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.KotobaOnnx=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LANGS=['ja','it','en'];
const LOCALE={ 'ja-JP':'ja','it-IT':'it','en-US':'en' };
const DEFAULTS=Object.freeze({
 ja:{voice:'female_03',engine:'onnx',formLabelRate:.8,formRate:.9,temperature:.3,lsdSteps:4,maxFrames:200,framesAfterEos:0,pauseMs:250,startSilenceMs:200,endSilenceMs:180,contextMeaning:false,itSeparator:'oppure'},
 it:{voice:'alba_it',engine:'onnx',formLabelRate:.8,formRate:1,temperature:.3,lsdSteps:4,maxFrames:200,framesAfterEos:0,pauseMs:250,startSilenceMs:200,endSilenceMs:180,contextMeaning:true,itSeparator:'oppure'},
 en:{voice:'alba',engine:'onnx',formLabelRate:.8,formRate:1,temperature:.3,lsdSteps:4,maxFrames:200,framesAfterEos:2,pauseMs:250,startSilenceMs:200,endSilenceMs:180,contextMeaning:true,itSeparator:'oppure'}
});
const LIMITS={formLabelRate:[0.5,1.2],formRate:[0.5,1.2],temperature:[0,1.5],lsdSteps:[1,8],maxFrames:[50,600],framesAfterEos:[0,5],pauseMs:[0,1500],startSilenceMs:[0,1500],endSilenceMs:[0,1500]};
const bound=(x,min,max,d)=>{const n=Number(x);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):d;};
function normalizeSettings(raw={}){
 const settings={};for(const lang of LANGS){const base=DEFAULTS[lang],src=raw[lang]||{};settings[lang]={...base};
  for(const [key,[low,high]] of Object.entries(LIMITS))settings[lang][key]=bound(src[key],low,high,base[key]);
  settings[lang].voice=typeof src.voice==='string'&&src.voice?src.voice:base.voice;
  settings[lang].engine=src.engine==='device'?'device':'onnx';
  settings[lang].contextMeaning=src.contextMeaning===undefined?base.contextMeaning:!!src.contextMeaning;
  settings[lang].itSeparator=['comma','dash','oppure'].includes(src.itSeparator)?src.itSeparator:base.itSeparator;
 }return settings;
}
function spokenText(lang,original,type,cfg){
 let text=String(original||'').trim();
 // A grammatical label is particularly vulnerable to clipping/hallucinations in
 // short ONNX utterances. Give it a complete, clear sentence in either engine.
 if(type==='formLabel'){
  const lower=text.charAt(0).toLowerCase()+text.slice(1).replace(/[.!?]+$/g,'');
  text=lang==='it'?'Adesso ascolta la '+lower+'.':
       lang==='en'?'Now listen to the '+lower+'.':text;
 }
 if(lang==='it'){
  const separators={comma:', ',dash:' - ',oppure:' oppure '};
  text=text.replace(/\s*;\s*/g,separators[cfg.itSeparator]||separators.oppure);
  if(type==='meaning'&&cfg.contextMeaning)text='In italiano significa '+text.replace(/[.!?]+$/g,'')+'.';
 }else if(lang==='en'&&type==='meaning'&&cfg.contextMeaning)text='In English, it means '+text.replace(/[.!?]+$/g,'')+'.';
 return text.replace(/\s+/g,' ').trim();
}
function wavBlob(samples,rate){
 const out=new ArrayBuffer(44+samples.length*2),view=new DataView(out);
 const chars=(off,str)=>{for(let i=0;i<str.length;i++)view.setUint8(off+i,str.charCodeAt(i));};
 chars(0,'RIFF');view.setUint32(4,36+samples.length*2,true);chars(8,'WAVE');chars(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);
 view.setUint16(34,16,true);chars(36,'data');view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){const v=Math.max(-1,Math.min(1,samples[i]));view.setInt16(44+2*i,v<0?Math.round(32768*v):Math.round(32767*v),true);}
 return new Blob([out],{type:'audio/wav'});
}
function keyFor(lang,voice,text,cfg){
 return JSON.stringify([lang,voice,text,cfg.temperature,cfg.lsdSteps,cfg.maxFrames,
   cfg.framesAfterEos,cfg.pauseMs,cfg.startSilenceMs,cfg.endSilenceMs]);
}
const uniqueEvents=plan=>{const seen=new Set(),items=[];for(const e of plan||[]){if(e.kind!=='say'||!String(e.text||'').trim())continue;const k=e.lang+'\u0000'+e.text+'\u0000'+e.type;if(!seen.has(k)){seen.add(k);items.push(e);}}return items;};
function orderedEvents(plan,groupLanguages){const unique=uniqueEvents(plan);if(!groupLanguages)return unique;
 const order=[];for(const event of unique){if(!order.includes(event.lang))order.push(event.lang);}
 return unique.sort((a,b)=>order.indexOf(a.lang)-order.indexOf(b.lang));
}
class SessionAudioCache{
 constructor(normalMiB=76,preloadMiB=144){this.normalLimit=normalMiB*1048576;this.preloadLimit=preloadMiB*1048576;this.reset();}
 reset(){this.entries=new Map();this.references=new Map();this.bytes=0;this.extended=false;}
 get(key){return this.entries.get(key)||null;}
 insert(key,value,index){if(!this.entries.has(key)){this.entries.set(key,value);this.bytes+=value.samples.byteLength;}this.reference(index,key);}
 reference(index,key){if(!this.references.has(index))this.references.set(index,new Set());this.references.get(index).add(key);}
 retain(positions){const wanted=new Set(positions);
  for(const index of this.references.keys())if(!wanted.has(index))this.references.delete(index);
  const remaining=new Set();for(const keys of this.references.values())for(const key of keys)remaining.add(key);
  for(const [key,v] of this.entries)if(!remaining.has(key)){this.entries.delete(key);this.bytes-=v.samples.byteLength;}
 }
 canAdd(bytes){return this.bytes+bytes<=(this.extended?this.preloadLimit:this.normalLimit);}
 get limit(){return this.extended?this.preloadLimit:this.normalLimit;}
}
class WorkerClient{
 constructor({workerPath='./tts-worker.js',onProgress=()=>{},onStatus=()=>{}}={}){
  this.path=workerPath;this.onProgress=onProgress;this.onStatus=onStatus;
  this.worker=null;this.lang=null;this.manifest=null;this.ready=null;this.requestId=0;this.jobs=new Map();this.disposed=false;
 }
 start(){
  if(this.worker)return;
  const w=new Worker(this.path);this.worker=w;
  w.onmessage=({data:m})=>{
   if(m.type==='status')this.onStatus(m.message);
   if(m.type==='progress')this.onProgress(m);
   if(m.type==='ready'){if(this.ready){this.ready.resolve(m);this.ready=null;}}
   if(m.type==='audio'){const p=this.jobs.get(m.requestId);if(p){this.jobs.delete(m.requestId);p.resolve(m);}}
   if(m.type==='error'){
    const e=new Error('Pocket TTS ONNX: '+m.message);this.onStatus(e.message);
    if(this.ready){this.ready.reject(e);this.ready=null;}
    if(m.requestId!==null&&m.requestId!==undefined){const p=this.jobs.get(m.requestId);if(p){this.jobs.delete(m.requestId);p.reject(e);}}
    else for(const p of this.jobs.values())p.reject(e);
   }
  };
  w.onerror=e=>{const err=new Error('ONNX Web Worker: '+(e.message||'errore'));
    if(this.ready){this.ready.reject(err);this.ready=null;}for(const p of this.jobs.values())p.reject(err);this.jobs.clear();this.close();this.onStatus(err.message);
  };
 }
 async load(lang,manifest){
  this.start();if(this.lang===lang)return;
  if(this.ready)throw Error('Caricamento ONNX sovrapposto');
  this.lang=null;this.manifest=manifest;
  const ready=new Promise((resolve,reject)=>{this.ready={resolve,reject};});
  this.worker.postMessage({type:'load',language:lang,manifest,voiceId:manifest.languages[lang]?.defaultVoice});
  await ready;this.lang=lang;
 }
 async synthesize(lang,segments,voiceId,options){
  if(this.lang!==lang)throw Error('Modello ONNX non pronto per '+lang);
  const id=++this.requestId;
  const pending=new Promise((resolve,reject)=>this.jobs.set(id,{resolve,reject}));
  this.worker.postMessage({type:'generate',requestId:id,language:lang,voiceId,manifest:this.manifest,segments,
   options:{...options,englishFramesAfterEos:options.framesAfterEos,seed:options.seed||1234}});
  return pending;
 }
 close(){if(this.worker){this.worker.terminate();this.worker=null;}this.lang=null;
   if(this.ready){this.ready.reject(new Error('Worker annullato'));this.ready=null;}
   for(const p of this.jobs.values())p.reject(new Error('Worker annullato'));this.jobs.clear();
 }
}
class OnnxStudyAudio{
 constructor({fallback,workerPath='./tts-worker.js',manifestUrl='./onnx/manifest.json',onProgress=()=>{},onStatus=()=>{}}={}){
  if(!fallback)throw Error('Richiesto fallback speechSynthesis');this.fallback=fallback;
  this.onProgress=onProgress;this.onStatus=onStatus;this.workerPath=workerPath;this.manifestUrl=manifestUrl;
  this.settings=normalizeSettings();this.strategy='ready';this.enabled=false;
  this.client=null;this.cache=new SessionAudioCache();this.tokenIndex=null;this.manifest=null;
  this.tokenShards=new Map();this.deckId=null;this.sessionId=null;this.cards=[];this.getPlan=null;this.index=0;
  this.queue=[];this.queued=new Map();this.processing=false;this.epoch=1;this.playToken=0;this.taskOrder=0;this.audioContext=null;
  this.currentPlayback=null;this.preparePercent=new Map();this.preloadUntil=0;this.preloadTarget=-1;this.preloadTimer=null;
 }
 configure({enabled,strategy,settings}={}){
  const newSettings=normalizeSettings(settings||this.settings);
  const changed=JSON.stringify(newSettings)!==JSON.stringify(this.settings);
  if(changed)this.clearTasks(true);
  this.settings=newSettings;
  if(enabled!==undefined)this.enabled=!!enabled;
  if(['ready','live'].includes(strategy))this.strategy=strategy;
  this.onProgress({type:'configuration',percent:0});
 }
 active(){return this.enabled;}
 // The device engine speaks in real time. It is intentionally excluded from
 // both ONNX pre-generation and the session PCM cache.
 needsOnnx(event){
  const lang=LOCALE[event?.lang]||'ja';
  return this.enabled&&this.settings[lang].engine!=='device';
 }
 onnxEventsFor(index,grouped=false){
  return orderedEvents(this.getPlan?.(index)?.plan,grouped).filter(e=>this.needsOnnx(e));
 }
 playbackEvent(event,device=false){
  const lang=LOCALE[event.lang]||'ja',cfg=this.settings[lang];
  const settings={rate:1,pitch:1,volume:1,...event.settings};
  if(event.type==='formLabel'){
   settings.rate=bound((Number(settings.rate)||1)*cfg.formLabelRate,.1,10,1);
  }else if(event.type==='form'){
   settings.rate=bound((Number(settings.rate)||1)*cfg.formRate,.1,10,1);
  }
  return {...event,settings,...(device?{text:spokenText(lang,event.text,event.type,cfg)}:{})};
 }
 async loadManifest(){
  if(this.manifest)return this.manifest;
  const response=await fetch(this.manifestUrl);if(!response.ok)throw Error(`ONNX manifest HTTP ${response.status}. Esegui prepare_kotoba_onnx.py.`);
  const manifest=await response.json();if(!manifest.languages?.ja||!manifest.languages?.it||!manifest.languages?.en)throw Error('Manifest JA/IT/EN incompleto');
  this.manifest=manifest;return manifest;
 }
 async loadTokenShard(url,deckId){
  if(!url)throw Error('Shard non disponibile');
  if(this.tokenShards.has(url)){
   const cached=this.tokenShards.get(url);this.tokenShards.delete(url);this.tokenShards.set(url,cached);return cached;
  }
  const response=await fetch(url);if(!response.ok)throw Error(`Token HTTP ${response.status}: ${url}`);
  const doc=await response.json();if(doc.deckId!==deckId)throw Error('Token deckId non corrisponde');
  this.tokenShards.set(url,doc);
  while(this.tokenShards.size>6)this.tokenShards.delete(this.tokenShards.keys().next().value);
  return doc;
 }
 async loadTokens(deckId,cardId){
  const info=this.manifest?.tokenIndexes?.[deckId];
  if(!info)throw Error(`Deck ${deckId} non pretokenizzato per ONNX. Usa Web Speech o rigenera gli asset.`);
  const url=info.shards?.[String(cardId)];
  if(!url)throw Error(`Card ${cardId} non presente nel token index`);
  return this.loadTokenShard(url,deckId);
 }

 bindSession({sessionId,deckId,cards,getPlan,index=0}){
  const changed=this.sessionId!==null&&this.sessionId!==sessionId;
  if(changed)this.clearTasks(true);
  this.sessionId=sessionId;this.deckId=deckId;this.cards=cards||[];this.getPlan=getPlan;this.index=index;
  if(changed){this.tokenIndex=null;this.tokenShards.clear();this.manifest=null;}
  this.onProgress({type:'session',percent:0});
  if(this.enabled&&this.strategy==='live')this.openCard(index);
 }
 clearTasks(hard=false){
  this.epoch++;for(const task of this.queued.values())task.reject(new Error('Preparazione annullata'));this.queue=[];this.queued.clear();this.cache.reset();this.preparePercent.clear();
  this.preloadUntil=0;this.preloadTarget=-1;if(this.preloadTimer)clearTimeout(this.preloadTimer);this.preloadTimer=null;
  if(hard&&this.client){this.client.close();this.client=null;this.processing=false;}
 }
 dispose(){this.cancel();this.clearTasks(true);if(this.audioContext)this.audioContext.close?.().catch(()=>{});this.audioContext=null;}
 configurePlayback({mode}={}){if(mode)this.strategy=mode;}
 openCard(index){this.index=index;if(!this.enabled||!this.getPlan)return;
  const keep=this.preloadUntil>Date.now()
   ?Array.from(this.cache.references.keys()).filter(k=>k>=index-1).concat([index,index+1,index+2])
   :[index-1,index,index+1,index+2];
  this.cache.retain(keep);
  if(this.preloadUntil<=Date.now()){
   const relevant=new Set(keep);
   const discarded=[];
   this.queue=this.queue.filter(task=>{
    if([...task.refs].some(ref=>relevant.has(ref)))return true;
    discarded.push(task);return false;
   });
   for(const task of discarded)if(this.queued.get(task.key)===task){
    this.queued.delete(task.key);task.reject(new Error('Card fuori finestra audio'));
   }
  }
  this.onProgress({type:'card',index,percent:this.percent(index)});
  if(this.strategy==='live')this.scheduleCard(index,false,0);
 }
 percent(index){const events=this.onnxEventsFor(index);
  if(!events.length)return 100;
  let complete=0;for(const event of events){const k=this.eventKey(event);if(k&&this.cache.get(k))complete++;}
  return Math.round(100*complete/events.length);
 }
 eventKey(event){const lang=LOCALE[event.lang]||'ja',cfg=this.settings[lang];return keyFor(lang,cfg.voice,spokenText(lang,event.text,event.type,cfg),cfg);}
 prepareCard(index){
  if(!this.enabled)return Promise.resolve();
  const events=this.onnxEventsFor(index);
  this.scheduleCard(index,true,0);
  return Promise.all(events.map(e=>this.getPart(index,e,0,{enqueue:false}))).then(()=>{});
 }
 scheduleCard(index,grouped=false,priority=4){
  if(!this.enabled||index<0||index>=this.cards.length||!this.getPlan)return;
  const events=this.onnxEventsFor(index,grouped);
  // Scheduling is fire-and-forget, but every rejected promise must be observed.
  for(const event of events)this.requestPart(index,event,priority).catch(()=>{});
 }
 scheduleFuture(){if(!this.enabled||this.strategy!=='ready')return;
  for(const idx of [this.index+1,this.index+2])this.scheduleCard(idx,true,6+(idx-this.index));
 }
 async preload(minutes=10){
  if(!this.enabled)throw Error('Abilita ONNX prima del precaricamento');
  this.preloadUntil=Date.now()+Math.max(1,minutes)*60000;this.preloadTarget=this.index-1;
  this.cache.extended=true;
  const epoch=this.epoch;
  while(this.preloadUntil>Date.now()&&epoch===this.epoch&&this.preloadTarget<this.cards.length-1){
   if(this.cache.bytes>=this.cache.preloadLimit*.92){this.onStatus('Precaricamento fermato: limite memoria PCM raggiunto');break;}
   this.preloadTarget++;
   const idx=this.preloadTarget;
   this.scheduleCard(idx,true,12);
   await this.waitCard(idx).catch(()=>{});
   if(this.percent(idx)!==100){this.onStatus('Precaricamento sospeso: card non completa o buffer saturo');break;}
   this.onProgress({type:'preload',index:idx,count:idx-this.index,secondsRemaining:Math.ceil((this.preloadUntil-Date.now())/1000)});
  }
  this.preloadUntil=0;this.onProgress({type:'preloadEnd',index:this.preloadTarget});
 }
 stopPreload(){
  this.preloadUntil=0;
  const removed=this.queue.filter(q=>q.priority>=12);
  this.queue=this.queue.filter(q=>q.priority<12);
  for(const task of removed){
   if(this.queued.get(task.key)===task){this.queued.delete(task.key);task.reject(new Error('Precaricamento fermato'));}
  }
  this.onProgress({type:'preloadEnd',index:this.preloadTarget});
 }
 waitCard(index){const events=this.onnxEventsFor(index);
  return Promise.all(events.map(e=>this.getPart(index,e,12,{enqueue:false})));
 }
 requestPart(index,event,priority=0){
  const key=this.eventKey(event),cached=this.cache.get(key);
  if(cached){this.cache.reference(index,key);return Promise.resolve(cached);}
  const pending=this.queued.get(key);
  if(pending){pending.refs.add(index);pending.priority=Math.min(pending.priority,priority);this.queue.sort((a,b)=>a.priority-b.priority||a.order-b.order);return pending.promise;}
  let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});
  const task={key,index,refs:new Set([index]),event,priority,order:++this.taskOrder,resolve,reject,promise,epoch:this.epoch};
  this.queued.set(key,task);this.queue.push(task);this.queue.sort((a,b)=>a.priority-b.priority||a.order-b.order);
  this.pump().catch(e=>this.onStatus(e.message));return promise;
 }
 getPart(index,event,priority=0,{enqueue=true}={}){const key=this.eventKey(event),found=this.cache.get(key);
  if(found){this.cache.reference(index,key);return Promise.resolve(found);}
  if(this.queued.has(key))return this.queued.get(key).promise;
  return enqueue?this.requestPart(index,event,priority):Promise.reject(new Error('Utterance non in coda'));
 }
 async pump(){
  if(this.processing)return;this.processing=true;
  const epoch=this.epoch;
  try{while(this.queue.length&&epoch===this.epoch){const task=this.queue.shift();if(task.epoch!==this.epoch){task.reject(Error('Sessione cambiata'));continue;}
    try{const value=await this.generateEvent(task.event,task.index);
     if(task.epoch!==this.epoch){task.reject(Error('Sessione cambiata'));continue;}
     if(this.cache.canAdd(value.samples.byteLength)||task.index===this.index){
      for(const idx of task.refs)this.cache.insert(task.key,value,idx);
     }else this.onStatus('Buffer audio al limite; precaricamento sospeso');
     task.resolve(value);
    }catch(err){task.reject(err);this.onStatus('ONNX: '+err.message);}
    finally{if(this.queued.get(task.key)===task)this.queued.delete(task.key);this.onProgress({type:'card',index:task.index,percent:this.percent(task.index)});}
   }}finally{if(epoch===this.epoch)this.processing=false;}
 }
 async generateEvent(event,index){
  const lang=LOCALE[event.lang]||'ja',cfg=this.settings[lang];
  const text=spokenText(lang,event.text,event.type,cfg);
  await this.loadManifest();const shard=await this.loadTokens(this.deckId,this.cards[index]?.id);
  let entry=shard.tokens?.[lang]?.[text];
  if(!entry){
   const story=this.manifest?.tokenIndexes?.[this.deckId]?.stories;
   if(story){const sd=await this.loadTokenShard(story,this.deckId);entry=sd.tokens?.[lang]?.[text];}
  }
  if(!entry)throw Error(`Testo non pretokenizzato (${lang}): ${text.slice(0,85)}`);
  if(!this.client)this.client=new WorkerClient({workerPath:this.workerPath,onProgress:m=>this.onProgress({type:'frame',...m}),onStatus:this.onStatus});
  await this.client.load(lang,this.manifest);
  const options={temperature:cfg.temperature,lsdSteps:cfg.lsdSteps,maxFrames:Math.round(cfg.maxFrames),framesAfterEos:Math.round(cfg.framesAfterEos),
   pauseMs:Math.round(cfg.pauseMs),startSilenceMs:Math.round(cfg.startSilenceMs),endSilenceMs:Math.round(cfg.endSilenceMs),seed:1234};
  const result=await this.client.synthesize(lang,entry,cfg.voice,options);
  const samples=result.samples instanceof Float32Array?result.samples:new Float32Array(result.samples);
  return {samples,sampleRate:result.sampleRate,report:result.reports,generationSeconds:result.generationSeconds};
 }
 unlockPlayback(){
  if(typeof AudioContext==='undefined'&&typeof webkitAudioContext==='undefined')return;
  if(!this.audioContext){const Ctor=globalThis.AudioContext||globalThis.webkitAudioContext;this.audioContext=new Ctor();}
  this.audioContext.resume().catch(()=>{});
 }
 cancel(){this.playToken++;const p=this.currentPlayback;if(p)p.cancel();this.currentPlayback=null;this.fallback.cancel();}
 speak(event,onStarted=()=>{}){
  if(!this.needsOnnx(event)){
   // Native speechSynthesis on iPhone/Safari: no token fetch, model switch or PCM.
   // Keep the original event for progress/accounting callbacks.
   return this.fallback.speak(this.playbackEvent(event,true),()=>onStarted(event));
  }
  const index=this.index,playId=++this.playToken;
  return new Promise(resolve=>{
   let finished=false;let stopSound=null;
   const finish=status=>{if(finished)return;finished=true;if(this.currentPlayback?.id===playId)this.currentPlayback=null;resolve(status);};
   this.currentPlayback={id:playId,cancel:()=>{if(stopSound)stopSound();finish('canceled');}};
   (async()=>{
    let audio;
    try{audio=await this.getPart(index,event,0);}catch(e){
     // For imported/custom decks without a token dictionary, prefer explicit fallback
     // to avoid silently dropping a study utterance.
     if(finished)return;
     this.onStatus('ONNX non disponibile, uso voce sistema: '+e.message);
     const result=await this.fallback.speak(this.playbackEvent(event,true),()=>onStarted(event));finish(result);return;
    }
    if(finished)return;
    try{
     const context=this.audioContext;
     if(!context)throw Error('AudioContext non avviato: tocca Play per sbloccare audio iOS');
     await context.resume();
     if(finished)return;
     const buffer=context.createBuffer(1,audio.samples.length,audio.sampleRate);
     buffer.copyToChannel(audio.samples,0);
     const src=context.createBufferSource();src.buffer=buffer;
     src.playbackRate.value=bound(this.playbackEvent(event).settings?.rate,.1,10,1);
     const gain=context.createGain();gain.gain.value=bound(event.settings?.volume,0,1,1);
     src.connect(gain).connect(context.destination);
     stopSound=()=>{src.onended=null;try{src.stop();}catch(e){}};
     src.onended=()=>finish('done');src.start();onStarted(event);
    }catch(e){this.onStatus('Audio ONNX: '+e.message);finish('error');}
   })();
  });
 }
}
return {LANGS,DEFAULTS,LIMITS,normalizeSettings,spokenText,uniqueEvents,orderedEvents,SessionAudioCache,WorkerClient,OnnxStudyAudio,wavBlob};
});
