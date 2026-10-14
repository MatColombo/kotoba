/* Phase 3 study sessions: pure, deterministic, independent of DOM and audio. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KotobaSessions=api;})(typeof globalThis==='object'?globalThis:this,function(){'use strict';
const uid=()=>`session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
const timestamp=()=>new Date().toISOString();
const validStatuses=['created','in-progress','completed','archived'];
const freshProgress=()=>({exposures:0,partial:0,seen:0,hard:0,known:false,favorite:false,meaningPlays:0,firstSeen:null,lastSeen:null,knownChangedAt:null,exampleCounts:{},listenedMs:0,creditedRuns:[]});
function normalizeProgress(p){return {...freshProgress(),...(p||{}),exposures:Math.max(0,Number(p?.exposures)||0),partial:Math.max(0,Number(p?.partial)||0),meaningPlays:Math.max(0,Number(p?.meaningPlays)||0),exampleCounts:{...(p?.exampleCounts||{})},creditedRuns:Array.isArray(p?.creditedRuns)?p.creditedRuns.slice(-150):[]}}
function exposure(p){return Math.max(0,Number(p?.exposures)||0)}
/* Tied exposure counts receive the same lower-rank percentile; bands never overlap.
 * E.g. 60 zero-exposure cards all receive percentile 0, rather than being split.
 */
function percentileMap(cards,progress){const counts=cards.map(c=>exposure(progress[String(c.id)]));const distinct=[...new Set(counts)].sort((a,b)=>a-b);const below=new Map(distinct.map(v=>[v,counts.filter(x=>x<v).length]));const n=counts.length||1;return new Map(cards.map((c,i)=>[String(c.id),100*below.get(counts[i])/n]));}
function bucket(percentile){return Math.min(3,Math.floor(Math.min(99.9999,Math.max(0,percentile))/25));}
function filterCards(cards,progress={},filters={}){
 const percentiles=percentileMap(cards,progress);
 return cards.filter(card=>{
  const p=normalizeProgress(progress[String(card.id)]),f=filters,examples=card.examples||[];
  if(f.category&&f.category!=='all'&&card.pos!==f.category)return false;
  if(f.known==='exclude'&&p.known)return false;
  if(f.known==='only'&&!p.known)return false;
  if(f.favorite==='only'&&!p.favorite)return false;
  if(f.exposure==='unseen'&&exposure(p)!==0)return false;
  if(f.exposure==='low'&&bucket(percentiles.get(String(card.id)))!==0)return false;
  if(f.exposure==='high'&&bucket(percentiles.get(String(card.id)))!==3)return false;
  if(/^q[1-4]$/.test(f.exposure||'')&&bucket(percentiles.get(String(card.id)))!==Number(f.exposure[1])-1)return false;
  if(f.register&&f.register!=='all'&&!(f.register==='legacy'?(card.legacyExamples||[]).length:examples.some(e=>e.register===f.register)))return false;
  if(f.scenario&&f.scenario!=='all'&&!examples.some(e=>String(e.scenarioId)===String(f.scenario)))return false;
  if(f.groupId&&f.groupId!=='all'&&card.storyGroupId!==f.groupId)return false;
  if(f.storyId&&f.storyId!=='all'&&!(card.storyIds||[]).includes(f.storyId))return false;
  return true;
 });
}
function pseudo(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function shuffleIds(ids,seed){const a=[...ids],random=pseudo(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function orderCards(cards,doShuffle,seed){const ids=cards.map(c=>String(c.id));return doShuffle?shuffleIds(ids,seed):ids;}
function hashId(id){let h=2166136261;for(const code of String(id)){h=Math.imul(h^code.charCodeAt(0),16777619);}return h>>>0;}
// Generate explicit per-card permutations once. Store only example IDs, never text.
function shuffledExampleOrders(cards,filters,seed){const orders={};for(const c of cards){const source=filters.register==='legacy'?(c.legacyExamples||[]):(c.examples||[]);
 const eligible=source.filter(e=>(!filters.register||filters.register==='all'||filters.register==='legacy'||e.register===filters.register)&&(!filters.scenario||filters.scenario==='all'||e.scenarioId===filters.scenario));
 if(eligible.length)orders[String(c.id)]=shuffleIds(eligible.map(e=>String(e.id)),(seed^hashId(c.id))>>>0);
 }return orders;}

function buildSession({deckId,cards,progress={},filters={},count=20,shuffle=true,seed=(Math.random()*2**32)>>>0,shuffleExamples=false,exampleSeed=((Math.random()*2**32)>>>0),name='',sequenceId='',language='it',direction='jp-native',id=uid(),now=timestamp()}={}){
 if(!deckId||!Array.isArray(cards))throw Error('Deck non valido');
 const eligible=filterCards(cards,progress,filters),desired=Math.max(1,Math.floor(Number(count)||20));
 const allOrdered=orderCards(eligible,!!shuffle,seed>>>0),orderedCardIds=allOrdered.slice(0,desired);
 if(!orderedCardIds.length)throw Error('Nessuna carta corrisponde ai filtri');
 return {id,name:name||`Sessione ${new Date(now).toLocaleDateString('it-IT')}`,deckId,orderedCardIds,filters:structuredClone(filters),requestedCount:desired,shuffleEnabled:!!shuffle,shuffleSeed:seed>>>0,exampleShuffleEnabled:!!shuffleExamples,exampleShuffleSeed:exampleSeed>>>0,exampleOrders:shuffleExamples?shuffledExampleOrders(eligible,filters,exampleSeed>>>0):{},exampleOffsets:{},sequenceId,language:language==='en'?'en':'it',direction:direction==='native-jp'?'native-jp':'jp-native',status:'created',currentCardIndex:0,currentChapterIndex:0,createdAt:now,updatedAt:now,completedAt:null};
}
function resolveSession(session,cards){const map=new Map(cards.map(c=>[String(c.id),c]));return {cards:session.orderedCardIds.map(id=>map.get(String(id))).filter(Boolean),missingIds:session.orderedCardIds.filter(id=>!map.has(String(id)))};}
function checkpoint(session,{cardIndex,chapterIndex,status}={}){const out={...session,updatedAt:timestamp()};if(cardIndex!==undefined)out.currentCardIndex=Math.max(0,Math.floor(cardIndex));if(chapterIndex!==undefined)out.currentChapterIndex=Math.max(0,Math.floor(chapterIndex));if(status!==undefined){if(!validStatuses.includes(status))throw Error('Stato sessione non valido');out.status=status;if(status==='completed'&&!out.completedAt)out.completedAt=out.updatedAt;}return out;}
function grade(progress,run,{complete=false,exampleIds=[],durationMs=0,at=timestamp()}={}){
 const p=normalizeProgress(progress);if(!run?.id||p.creditedRuns.includes(run.id))return p;
 p.creditedRuns=[...p.creditedRuns,run.id].slice(-150);
 if(complete){p.exposures++;p.seen++;}else p.partial++;
 if(!p.firstSeen)p.firstSeen=at;p.lastSeen=at;
 p.listenedMs+=(Math.max(0,Number(durationMs)||0));
 if(complete)for(const id of new Set(exampleIds))p.exampleCounts[id]=(p.exampleCounts[id]||0)+1;
 return p;
}
function mark(progress,field,value,at=timestamp()){
 if(!['favorite','known'].includes(field))throw Error('Flag non supportato');const p=normalizeProgress(progress);p[field]=!!value;p.updatedAt=at;if(field==='known')p.knownChangedAt=at;return p;
}
function dashboard(cards,progress={},sessions=[]){const counts=cards.map(c=>exposure(progress[String(c.id)])),total=cards.length,heard=counts.filter(x=>x>0).length;
 return {total,heard,unheard:total-heard,coverage:total?heard/total*100:0,exposures:counts.reduce((a,b)=>a+b,0),known:cards.filter(c=>!!progress[String(c.id)]?.known).length,favorites:cards.filter(c=>!!progress[String(c.id)]?.favorite).length,completedSessions:sessions.filter(s=>s.status==='completed').length,distribution:[0,1,2,3,4,5,10].map((n,i,list)=>({label:i===0?'0':i===list.length-1?'10+':`${n}-${list[i+1]-1}`,count:counts.filter(v=>i===0?v===0:i===list.length-1?v>=n:v>=n&&v<list[i+1]).length}))};}
return {freshProgress,normalizeProgress,exposure,percentileMap,bucket,filterCards,orderCards,shuffledExampleOrders,buildSession,resolveSession,checkpoint,grade,mark,dashboard};
});
