const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../source/engine.js');
const word = {id:7,jp:'決める',kana:'きめる',meaning:{it:'decidere',en:'to decide'},forms:[{label:'て形',jp:'決めて'},{label:'ます形',jp:'決めます'}],examples:[{jp:'今日決めます。',it:'Decido oggi.',en:'I decide today.'},{jp:'一緒に決めよう。',it:'Decidiamo insieme.',en:"Let's decide together."}]};
const masters = {'ja-JP':{rate:.9,pitch:1,volume:1},'it-IT':{rate:1,pitch:1,volume:.8},'en-US':{rate:1.1,pitch:1,volume:.85}};
const base = (groups, overrides={}) => C.normalizeSequence({name:'test',direction:'jp-native',groups},'jp-native');
const compile=(seq,extra={})=>C.compileSequence(word,seq,{nativeLanguage:'it',exampleCount:2,formCount:'all',pauseBetweenElementsMs:400,announceForms:true,formName:(n)=>n==='て形'?'Forma te':'Forma masu',audioMasters:masters,...extra});
const get = (p,k) => p.plan.filter(x=>x.kind===k);
const simpleEl = (type,extra={})=>({id:`el-${type}`,type,...extra});
const simpleG=(name,items,extra={})=>({id:`g-${name}`,name,items,...extra});
test('nested repeats: word×2, meaning×1, group×3; item pause is honored inside group',()=>{
 const sequence=base([simpleG('main',[simpleEl('word',{repeat:2,pauseBetweenRepeatsMs:300,pauseAfterElementMs:100}),simpleEl('meaning')],{repeat:3,pauseBetweenGroupRepeatsMs:700,pauseAfterGroupMs:1200})]);
 const p=compile(sequence);assert.deepEqual(get(p,'say').map(x=>x.type),['word','word','meaning','word','word','meaning','word','word','meaning']);
 const kinds=p.plan.map(x=>x.kind==='say'?x.type:x.kind);
 assert.equal(p.chapters.length,1); assert.equal(kinds.at(-1),'cardComplete');
 const p300=get(p,'pause').filter(x=>x.ms===300); assert.equal(p300.length,3);
 const p500=get(p,'pause').filter(x=>x.ms===500); assert.equal(p500.length,3);
 const p1100=get(p,'pause').filter(x=>x.ms===1100); assert.equal(p1100.length,2);
 assert.equal(get(p,'pause').at(-1).ms,500); // after word, no trailing group silence
 assert.ok(!p.plan.slice(-2).some(x=>x.kind==='pause'));
});
test('chapter boundary puts combined gap before next chapter marker; jumps do not inherit previous pause',()=>{
 const seq=base([simpleG('a',[simpleEl('word')],{pauseAfterGroupMs:2000}),simpleG('b',[simpleEl('meaning')])]);
 const p=compile(seq), bIndex=p.chapters[1].startEventIndex;
 assert.equal(p.plan[bIndex].kind,'chapterStart');
 assert.equal(p.plan[bIndex+1].kind,'say');
 assert.equal(p.plan[bIndex-1].kind,'pause');
 assert.equal(p.plan[bIndex-1].ms,2400);
 assert.equal(p.plan.at(-1).kind,'cardComplete');
 assert.deepEqual(C.NavigationController.move(p.chapters,0,1),{deltaCard:0,chapterIndex:1});
 assert.deepEqual(C.NavigationController.move(p.chapters,1,1),{deltaCard:1,chapterIndex:0});
 assert.deepEqual(C.NavigationController.move(p.chapters,0,-1),{deltaCard:-1,chapterIndex:-1});
});
test('no last-card tail silence, extra item pause before next chapter, zero-value pause allowed',()=>{
 const seq=base([simpleG('a',[simpleEl('word',{pauseAfterElementMs:1200})]),simpleG('b',[simpleEl('meaning',{repeat:2,pauseBetweenRepeatsMs:0,pauseAfterElementMs:8000})],{pauseAfterGroupMs:5000})]);
 const p=compile(seq);assert.equal(get(p,'pause')[0].ms,1600);
 assert.deepEqual(get(p,'say').map(s=>s.text),['決める','decidere','decidere']);
 assert.equal(get(p,'pause').length,1); assert.equal(p.plan.at(-1).kind,'cardComplete');
});
test('examples pair JP/native for each example, not all JP then all translations',()=>{
 const seq=base([simpleG('examples',[simpleEl('exampleJP'),simpleEl('exampleNative')])]);
 const p=compile(seq);assert.deepEqual(get(p,'say').map(s=>s.type),['exampleJP','exampleNative','exampleJP','exampleNative']);
 assert.deepEqual(get(p,'say').map(s=>s.exIndex),[0,0,1,1]);
 assert.equal(compile(seq,{exampleCount:0}).chapters.length,0);
});
test('forms announce before spoken form and use different language masters',()=>{
 const seq=base([simpleG('forms',[simpleEl('forms')])]);const p=compile(seq);
 assert.deepEqual(get(p,'say').map(s=>s.type),['formLabel','form','formLabel','form']);
 assert.deepEqual(get(p,'say').map(s=>s.lang),['it-IT','ja-JP','it-IT','ja-JP']);
 assert.equal(get(p,'say')[0].settings.volume,.8);assert.equal(get(p,'say')[1].settings.rate,.9);
});
test('master→group→item applies independent rate/pitch/volume and validates zeros',()=>{
 const group={id:'g',audioOverrides:{rate:.7,volume:.5}};
 const item={id:'e',audioOverrides:{pitch:1.2,volume:0}};
 const result=C.resolveSpeechSettings('ja-JP',[group],item,masters);
 assert.deepEqual([result.rate,result.pitch,result.volume],[.7,1.2,0]);
 assert.deepEqual(result.sources,{rate:'group:g',pitch:'element:e',volume:'element:e'});
 const mixed=C.resolveSpeechSettings('en-US',[group],{id:'e2'},masters);
 assert.deepEqual([mixed.rate,mixed.pitch,mixed.volume],[.7,1,.5]);
 const bad=C.resolveSpeechSettings('ja-JP',[],{audioOverrides:{rate:100,pitch:-10,volume:5}},masters);
 assert.deepEqual([bad.rate,bad.pitch,bad.volume],[10,0,1]);
});
test('when group is disabled or contains only disabled items, it is not a chapter',()=>{
 const seq=base([simpleG('off',[simpleEl('word')],{enabled:false}),simpleG('silent',[simpleEl('meaning',{enabled:false})]),simpleG('on',[simpleEl('word')])]);
 const p=compile(seq);assert.equal(p.chapters.length,1);assert.equal(p.chapters[0].title,'on');
});
test('sequence repository migrates old v0.3 settings, preserves IDs and supports create/clone/remove/active',()=>{
 const legacy={'jp-native':{groups:[{id:'old-g',name:'Old',repeat:2,after:2,items:[{id:'old-e',type:'word',repeat:2,after:.75}]}]},'native-jp':{groups:[simpleG('native',[simpleEl('meaning')])]}};
 const r=new C.SequenceRepository(null,legacy);const a=r.active('jp-native');
 assert.equal(a.groups[0].id,'old-g'); assert.equal(a.groups[0].pauseAfterGroupMs,2000);assert.equal(a.groups[0].items[0].pauseAfterElementMs,750);
 const clone=r.duplicate('jp-native',a.sequenceId);assert.notEqual(clone.groups[0].id,'old-g');assert.equal(r.active('jp-native').sequenceId,clone.sequenceId);
 assert.equal(r.remove('jp-native',clone.sequenceId),true);assert.equal(r.list('jp-native').length,1);assert.equal(r.remove('jp-native',a.sequenceId),false);
 const restored=new C.SequenceRepository(r.serialize());assert.equal(restored.active('jp-native').sequenceId,a.sequenceId);
});
test('speech adapter passes per-event voice settings and safely ignores late callbacks',async()=>{
 const utterances=[];class Utterance{constructor(t){this.text=t}}
 const synth={speak:u=>utterances.push(u),cancel(){},resume(){}};
 const sp=new C.SpeechAdapter(synth,Utterance,()=>({name:'Kyoko'}));
 const p1=sp.speak({text:'決める',lang:'ja-JP',settings:{rate:.7,pitch:1.2,volume:.4}});
 assert.deepEqual([utterances[0].rate,utterances[0].pitch,utterances[0].volume],[.7,1.2,.4]);assert.equal(utterances[0].voice.name,'Kyoko');
 sp.cancel();assert.equal(await p1,'canceled');
 const p2=sp.speak({text:'Second',lang:'en-US',settings:{rate:1.1,pitch:1,volume:.8}});
 utterances[0].onend(); // stale old callback must not resolve or clear new pending
 assert.equal(sp.pending !== null,true);
 utterances[1].onend();assert.equal(await p2,'done');
});
test('playback pauses during a delay, resumes at same event, and stops without stray events',async()=>{
 const timers=new Map();let now=0,tid=0;
 const scheduler={setTimeout(fn,ms){const id=++tid;timers.set(id,{when:now+ms,fn});return id},clearTimeout(id){timers.delete(id)},advance(ms){now+=ms;for(const [id,t] of [...timers])if(t.when<=now){timers.delete(id);t.fn()}}};
 const spoken=[],events=[];let completed=0;
 const player=new C.PlaybackController({speech:{cancel(){},speak(e){spoken.push(e.text);return Promise.resolve('done')}},scheduler,onEvent:e=>events.push(e.kind),onComplete:()=>completed++});
 const plan=[{kind:'say',text:'A'},{kind:'pause',ms:1000},{kind:'say',text:'B'}];
 player.start(plan);await Promise.resolve();await Promise.resolve();
 assert.deepEqual(spoken,['A']);player.pause();scheduler.advance(6000);await Promise.resolve();assert.deepEqual(spoken,['A']);
 player.resume();await Promise.resolve();scheduler.advance(1000);await Promise.resolve();await Promise.resolve();
 assert.deepEqual(spoken,['A','B']);assert.equal(completed,1);
 player.start(plan);await Promise.resolve();await Promise.resolve();player.stop();scheduler.advance(5000);await Promise.resolve();assert.equal(completed,1);
});
test('media action handlers are registered via the adapter and can be simulated independently',()=>{
 const handlers={};const events=[];const api={setActionHandler:(name,fn)=>handlers[name]=fn};
 const adapter=new C.MediaSessionAdapter(api,(name)=>events.push(name));
 let navigations=0;assert.equal(adapter.install({nexttrack:()=>navigations++}),true);handlers.nexttrack();
 assert.equal(navigations,1);assert.deepEqual(events,['nexttrack']);
});
test('default inherited repeat pause survives serialization and reload (null is not zero)',()=>{
 const repo=new C.SequenceRepository(); const item=repo.active('jp-native').groups[0].items[0];
 assert.equal(item.pauseBetweenRepeatsMs,null);
 const after=new C.SequenceRepository(repo.serialize());
 assert.equal(after.active('jp-native').groups[0].items[0].pauseBetweenRepeatsMs,null);
});
test('pause/resume preserves the remaining portion of a pending silence',async()=>{
 const timers=new Map();let now=0,id=0;
 const clock={now:()=>now,setTimeout(fn,ms){timers.set(++id,{due:now+ms,fn});return id},clearTimeout(i){timers.delete(i)},advance(ms){now+=ms;for(const [i,v] of [...timers])if(v.due<=now){timers.delete(i);v.fn()}}};
 const say=[];const p=new C.PlaybackController({speech:{cancel(){},speak:e=>{say.push(e.text);return Promise.resolve()}},scheduler:clock});
 p.start([{kind:'pause',ms:1000},{kind:'say',text:'done'}]);
 clock.advance(650);p.pause();assert.equal(p.pausedPauseRemainingMs,350);
 clock.advance(5000);p.resume();clock.advance(340);await Promise.resolve();assert.deepEqual(say,[]);
 clock.advance(10);await Promise.resolve();await Promise.resolve();assert.deepEqual(say,['done']);
});
