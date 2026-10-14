(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const Core=window.KotobaCore;
 const textSafe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const POS={verb:{it:'VERBO · 動詞',en:'VERB · 動詞'},noun:{it:'SOSTANTIVO · 名詞',en:'NOUN · 名詞'},na:{it:'AGGETTIVO な',en:'な ADJECTIVE'},i:{it:'AGGETTIVO い',en:'い ADJECTIVE'}};
 const TYPES={word:{it:'Parola giapponese',en:'Japanese word'},meaning:{it:'Significato',en:'Meaning'},forms:{it:'Coniugazioni (con etichetta)',en:'Grammar forms (with label)'},exampleJP:{it:'Esempio giapponese',en:'Japanese example'},exampleNative:{it:'Traduzione esempio',en:'Example translation'}};
 const TYPE_KEYS=Object.keys(TYPES);
 const keyStorage='kotoba-drive-v04-alpha1';
 const Store=window.KotobaStore;
 const Sessions=window.KotobaSessions;
 const Content=window.KotobaContent;
 let detailRegister="all",detailScenario="all",storyAudioRun=0,selectedStoryId="";
 let db=null,deckRepo=null,studyRepo=null,sessionRepo=null,sequenceStore=null,studyDoc=Store.emptyStudy(),activeDeckId='',activeDeck=null,saveQueue=Promise.resolve(),lastSaveError=null;
 let installedDecks=[],catalog=[],pendingImport=null,pendingStudyImport=null;
 let currentRun=null,runPauseStart=null;
 let selectedCreateDeck=null;
 const uid=()=>`k${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
 const num=(n,min,max,fallback=min)=>{const v=Number(n);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback};
 const item=(type,repeat=1)=>Core.normalizeItem({id:uid(),type,repeat,enabled:true});
 const group=(name,items,repeat=1,after=0)=>Core.normalizeGroup({id:uid(),name,repeat,pauseAfterGroupMs:Math.round(after*1000),pauseBetweenGroupRepeatsMs:Math.round(after*1000),items});
 const defaults={lang:'it',direction:'jp-native',category:'all',size:20,exampleCount:1,formCount:'all',globalGap:.4,announceForms:true,wheel:true,wake:true,progress:{},exampleCycle:{},audioMasters:Core.audioMasters()};
 let stored={};try{stored=JSON.parse(localStorage.getItem(keyStorage)||'{}')||{}}catch(e){}
 // One-time non-destructive migration: read the previous settings without overwriting them.
 if(!Object.keys(stored).length){try{const previous=JSON.parse(localStorage.getItem('kotoba-drive-v2')||'{}');if(previous&&typeof previous==='object')stored=previous}catch(e){}}
 if(!Object.keys(stored).length){try{const old=JSON.parse(localStorage.getItem('kotoba-drive-demo-v1')||'{}');if(old&&typeof old==='object'){for(const key of ['lang','direction','category','size','wheel','progress','exampleCycle'])if(old[key]!==undefined)stored[key]=old[key]}}catch(e){}}
 const state={...defaults,...stored,sessionId:null,playing:false,paused:false,completed:false,view:'study',drawerOpen:false,chapterIndex:0,activePlan:null,drawerTab:'settings',deck:[],index:0,answerShown:false,revealed:{answer:false,forms:false,exampleJP:false,exampleNative:false},visibleExampleIndex:null,previewId:0,voices:[],phase:'',libraryFilter:'all',search:'',chosenWordId:1,hardwareCount:0,events:[]};
 if(state.lang!=='en')state.lang='it';if(!['jp-native','native-jp'].includes(state.direction))state.direction='jp-native';
 if(!['all','verb','noun','na','i'].includes(state.category))state.category='all';
 state.size=num(state.size,5,15000,20);state.exampleCount=num(state.exampleCount,0,10,1);
 state.formCount=(state.formCount==='all'||['1','2','3','4','5','6'].includes(String(state.formCount)))?String(state.formCount):'all';
 state.globalGap=num(state.globalGap,0,12,.4);state.announceForms=state.announceForms!==false;state.wheel=state.wheel!==false;state.wake=state.wake!==false;
 let sequenceRepo=new Core.SequenceRepository(stored.sequenceLibrary,stored.sequences);
 state.audioMasters=Core.audioMasters(state.audioMasters);
 if(!state.progress||typeof state.progress!=='object')state.progress={};if(!state.exampleCycle||typeof state.exampleCycle!=='object')state.exampleCycle={};
 const t=(it,en)=>state.lang==='it'?it:en;
 const locale=()=>state.lang==='it'?'it-IT':'en-US';
 const wordById=id=>BANK.find(w=>String(w.id)===String(id));
 const resetReveal=()=>{state.answerShown=false;state.revealed={answer:false,forms:false,exampleJP:false,exampleNative:false};};
 const revealAll=()=>{state.answerShown=true;state.revealed={answer:true,forms:true,exampleJP:true,exampleNative:true};};
 const allRevealed=()=>Object.values(state.revealed).every(Boolean);
 const currentSession=()=>studyDoc.sessions.find(s=>s.id===state.sessionId);
 const sessionById=id=>studyDoc.sessions.find(s=>s.id===id);
 const current=()=>state.deck[Math.min(state.index,Math.max(0,state.deck.length-1))]||BANK[0];
 const selectedSequence=()=>sequenceRepo.active(state.direction);
 const examplesForCard=(w)=>{const session=currentSession();return Content.examplesFor(w,session?.filters||{},session?.exampleShuffleEnabled?session.exampleOrders?.[String(w.id)]:null);};
 const exampleStart=(w)=>{const session=currentSession();return session?.exampleShuffleEnabled?(Number(session.exampleOffsets?.[String(w.id)])||0):(Number(state.exampleCycle[w.id])||0);};
 const selectedExample=(w)=>{const examples=examplesForCard(w);if(!examples.length)return {example:{jp:'',kana:'',it:'',en:''},index:0};const base=state.visibleExampleIndex??(exampleStart(w)%examples.length);return {example:examples[base%examples.length],index:base%examples.length}};
 const settingFields=['lang','direction','category','size','exampleCount','formCount','globalGap','announceForms','wheel','wake','exampleCycle'];
 function snapshotStudy(){
   if(!db||!activeDeckId)return null;
   studyDoc.deckStates[activeDeckId]={...(studyDoc.deckStates[activeDeckId]||{}),lastSeenRevision:activeDeck?.revision||1,cards:structuredClone(state.progress)};
   const settings={...studyDoc.settings};for(const field of settingFields)settings[field]=structuredClone(state[field]);
   settings.activeDeckId=activeDeckId;settings.activeSessionId=state.sessionId||null;settings.exampleCycleByDeck={...(settings.exampleCycleByDeck||{}),[activeDeckId]:structuredClone(state.exampleCycle)};
   studyDoc.settings=settings;studyDoc.activeDeckId=activeDeckId;studyDoc.audioMasters=structuredClone(state.audioMasters);
   studyDoc.sequences=sequenceRepo.serialize();
   if(state.sessionId){const session=studyDoc.sessions.find(x=>x.id===state.sessionId);if(session){session.currentCardIndex=state.index;session.currentChapterIndex=state.chapterIndex;session.updatedAt=new Date().toISOString();session.status=state.completed?'completed':state.playing?'in-progress':session.status||'created';session.activeRun=currentRun?.started?{id:currentRun.id,cardId:currentRun.cardId,startedAt:currentRun.startedAt}:null;}}
   return structuredClone(studyDoc);
 }
 function save(){const snapshot=snapshotStudy();if(!snapshot)return;
   saveQueue=saveQueue.catch(()=>{}).then(async()=>{
     await db.saveBundle({study:snapshot,sessions:snapshot.sessions,sequenceLibrary:snapshot.sequences});
     lastSaveError=null;
   });
   saveQueue.catch(e=>{lastSaveError=e;console.error('Salvataggio IndexedDB fallito:',e);toast('Salvataggio non riuscito: esporta un backup')});
 }
 async function flushSave(){await saveQueue;if(lastSaveError)throw lastSaveError}

 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 let toastTimer,wakeLockHandle=null;
 function toast(msg){const n=$('toast');n.textContent=msg;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),2600)}
 function progressFor(w){if(!state.progress[w.id])state.progress[w.id]=Sessions.freshProgress();return state.progress[w.id]}
 function changeFlag(w,field){state.progress[w.id]=Sessions.mark(progressFor(w),field,!progressFor(w)[field]);save();renderStudy();renderLibrary();renderDetail();renderSessions()}
 function updateStats(){const entries=Object.values(state.progress);const seen=entries.reduce((s,p)=>s+(Number(p.seen)||0),0),hard=entries.reduce((s,p)=>s+(Number(p.hard)||0),0);$('study-stats').textContent=t(`Ripassi completati: ${seen} · Segnate difficili: ${hard}`,`Completed reviews: ${seen} · Marked difficult: ${hard}`)}
 function sessionFiltersFromForm(){return {category:$('create-category').value,known:$('create-known').value,favorite:$('create-favorite').value,exposure:$('create-exposure').value,register:$('create-register').value,scenario:$('create-scenario').value,groupId:$('create-group').value,storyId:$('create-story').value}}
 function syncSessionCreator(){
   const previous=$('create-deck').value||activeDeckId;
   $('create-deck').innerHTML=installedDecks.map(d=>`<option value="${textSafe(d.deckId)}">${textSafe(d.title)} (${d.cards.length})</option>`).join('');
   $('create-deck').value=installedDecks.some(d=>d.deckId===previous)?previous:activeDeckId;
   $('create-language').value=state.lang;$('create-direction').value=state.direction;$('create-shuffle-examples').checked=!!(currentSession()?.exampleShuffleEnabled);
   $('create-size').value=state.size;$('create-example-count').value=state.exampleCount;
   $('create-category').value=state.category;
   renderCreateSequences();updateAvailableOptions();updateEligible();
 }
 function renderCreateSequences(){const select=$('create-sequence'),direction=$('create-direction').value,old=select.value;
   select.innerHTML=sequenceRepo.list(direction).map(q=>`<option value="${textSafe(q.sequenceId)}">${textSafe(q.name)}</option>`).join('');
   select.value=sequenceRepo.list(direction).some(q=>q.sequenceId===old)?old:sequenceRepo.active(direction).sequenceId;
 }
 function updateAvailableOptions(){
   const deck=installedDecks.find(d=>d.deckId===$('create-deck').value)||activeDeck;
   const reg=$('create-register'),sc=$('create-scenario'),oldReg=reg.value,oldSc=sc.value;
   const regs=[...new Set((deck?.scenarios||[]).map(x=>x.register))];if((deck?.cards||[]).some(x=>x.legacyExamples?.length))regs.push('legacy');
   const names={informal:'Informale · amici e famiglia',colleague:'Cortese · colleghi',superior:'Formale · superiori',legacy:'Originali (v0.3)'};
   reg.innerHTML='<option value="all">Tutti</option>'+regs.map(x=>`<option value="${textSafe(x)}">${textSafe(names[x]||x)}</option>`).join('');
   reg.value=regs.includes(oldReg)?oldReg:'all';
   const scenarios=reg.value==='legacy'?[]:Content.availableScenarios(deck,reg.value);
   sc.innerHTML='<option value="all">Tutti</option>'+scenarios.map(x=>`<option value="${textSafe(x.id)}">${textSafe(x.title)}</option>`).join('');
   sc.value=scenarios.some(x=>x.id===oldSc)?oldSc:'all';
   const g=$('create-group'),sg=g.value;const groups=deck?.storyGroups||[];
   g.innerHTML='<option value="all">Tutti i gruppi</option>'+groups.map(x=>`<option value="${textSafe(x.id)}">${textSafe(x.title)} (${x.cardIds.length})</option>`).join('');
   g.value=groups.some(x=>x.id===sg)?sg:'all';
   const st=$('create-story'),oldSt=st.value,stories=Content.storiesFor(deck,g.value);
   st.innerHTML='<option value="all">Nessuna storia specifica</option>'+stories.map(x=>`<option value="${textSafe(x.id)}">${textSafe(x.title)}</option>`).join('');
   st.value=stories.some(x=>x.id===oldSt)?oldSt:'all';
 }

 function updateEligible(){const deck=installedDecks.find(d=>d.deckId===$('create-deck').value)||activeDeck;
   if(!deck)return;
   const progress=studyDoc.deckStates[deck.deckId]?.cards||{};
   const eligible=Sessions.filterCards(deck.cards,progress,sessionFiltersFromForm()).length;
   const count=Math.max(1,Math.floor(Number($('create-size').value)||20));
   $('session-eligible').textContent=`${eligible} carte eleggibili · ${Math.min(eligible,count)} nella nuova sessione`;
   $('create-session').disabled=!eligible;
 }
 function activateSession(session,{recover=false}={}){
   if(state.playing||state.paused)stopLesson();
   const source=installedDecks.find(d=>d.deckId===session.deckId);if(!source)throw Error('Deck mancante: '+session.deckId);
   activeDeck=source;activeDeckId=source.deckId;BANK=source.cards;
   studyDoc.deckStates[activeDeckId]??={cards:{},lastSeenRevision:source.revision};
   state.progress=studyDoc.deckStates[activeDeckId].cards;state.exampleCycle=studyDoc.settings.exampleCycleByDeck?.[activeDeckId]||{};
   const resolved=Sessions.resolveSession(session,BANK);
   if(!resolved.cards.length)throw Error('Nessuna carta ancora disponibile in questa sessione');
   state.sessionId=session.id;state.deck=resolved.cards;
   const originalIndex=Math.max(0,Number(session.currentCardIndex)||0);
   const targetId=session.orderedCardIds[originalIndex];let resolvedIndex=resolved.cards.findIndex(c=>String(c.id)===String(targetId));
   if(resolvedIndex<0){const remainingIds=new Set(resolved.cards.map(c=>String(c.id)));const nextId=session.orderedCardIds.slice(originalIndex).find(id=>remainingIds.has(String(id)));resolvedIndex=nextId!==undefined?resolved.cards.findIndex(c=>String(c.id)===String(nextId)):resolved.cards.length-1;}
   state.index=Math.max(0,resolvedIndex);
   state.chapterIndex=Math.max(0,Number(session.currentChapterIndex)||0);
   state.lang=session.language||'it';state.direction=session.direction||'jp-native';
   if(session.sequenceId)sequenceRepo.select(state.direction,session.sequenceId);
   state.size=Number(session.requestedCount)||resolved.cards.length;state.category=session.filters?.category||'all';state.exampleCount=Math.min(10,Math.max(0,Number(session.exampleCount??state.exampleCount)));$('example-count').value=state.exampleCount;
   state.completed=session.status==='completed';state.paused=false;state.playing=false;state.activePlan=null;resetReveal();state.visibleExampleIndex=null;
   state.phase=recover?'Sessione ripristinata':'Sessione pronta';
   $('language-it').classList.toggle('active',state.lang==='it');$('language-en').classList.toggle('active',state.lang==='en');
   // A created session remains 'created' until audio actually starts.
   session.status=session.status;
   const missing=resolved.missingIds.length;if(missing)toast(`${missing} carte mancanti nel deck: ignorate per questa riproduzione`);
   renderStudy();save();
 }
 function createNewSession(options={}){
   const deck=installedDecks.find(d=>d.deckId===(options.deckId||activeDeckId))||activeDeck;
   const filters=options.filters||{category:state.category,known:'exclude',favorite:'all',exposure:'all',register:'all',scenario:'all'};
   const session=Sessions.buildSession({deckId:deck.deckId,cards:deck.cards,progress:studyDoc.deckStates[deck.deckId]?.cards||{},filters,
    count:options.count??state.size,shuffle:options.shuffle??true,seed:options.seed,shuffleExamples:options.shuffleExamples??false,exampleSeed:options.exampleSeed,sequenceId:options.sequenceId||sequenceRepo.active(options.direction||state.direction).sequenceId,
    language:options.language||state.lang,direction:options.direction||state.direction,name:options.name||''});
   session.exampleCount=Number(options.exampleCount??state.exampleCount);
   studyDoc.sessions.push(session);activateSession(session);renderSessions();return session;
 }
 function newDeck(){return createNewSession()}
 function formName(label,w,lang=state.lang){
   const by={
    'て形':['Forma te','Te form'],'ます形':['Forma masu','Masu form'],'ない形':['Forma nai, negativa','Nai negative form'],'た形':['Forma ta, passata','Ta past form'],
    '可能形':['Forma potenziale','Potential form'],'丁寧形':['Forma cortese','Polite form'],'過去形':['Forma passata','Past form'],'否定形':['Forma negativa','Negative form'],
    '連体形':w.pos==='na'?['Forma na, attributiva','Na attributive form']:['Forma attributiva','Attributive form'],
    '補語形':['Forma ni','Ni form'],'副詞形':['Forma avverbiale','Adverbial form'],'否定過去':['Forma negativa passata','Past negative form'],
    '条件形':['Forma condizionale','Conditional form']
   };
   return (by[label]||[label,label])[lang==='it'?0:1];
 }
 // The same pure compiler powers preview, full playback, and single-element preview.
 function compileSequence(w,sequence=selectedSequence(),opts={}){
   return Core.compileSequence({...w,examples:examplesForCard(w)},sequence,{
     nativeLanguage:state.lang,exampleCount:opts.exampleCount??state.exampleCount,
     formCount:state.formCount,announceForms:state.announceForms,
     pauseBetweenElementsMs:Math.round((opts.globalGap??state.globalGap)*1000),
     startExample:exampleStart(w),audioMasters:state.audioMasters,formName
   });
 }
 function previewPlan(){
   const {plan,sayCount,chapters}=compileSequence(current());
   $('preview-total').textContent=t(`${sayCount} letture · ${chapters.length} capitoli`,`${sayCount} utterances · ${chapters.length} chapters`);
   const visible=plan.filter(s=>['say','pause','chapterStart'].includes(s.kind)).slice(0,58);
   $('sequence-preview').innerHTML=visible.map(s=>s.kind==='pause'?`<span class="preview-chip wait" title="${textSafe(s.description)}">${s.seconds.toLocaleString('it-IT')}s</span>`:s.kind==='chapterStart'?`<span class="preview-chip chapter" title="Capitolo">◈ ${textSafe(s.title)}</span>`:`<span class="preview-chip" title="${textSafe(s.label)}">${textSafe(s.type==='formLabel'?`▣ ${s.label}`:s.type==='exampleJP'||s.type==='exampleNative'?s.label:s.text)}</span>`).join('')+(plan.length>58?`<span class="preview-more">… +${plan.length-58}</span>`:'')||'<span class="small-copy">Nessun elemento attivo.</span>';
 }
 // Readable current card, including the two-way prompt/answer presentation.
 function renderStudy(){
   const w=current(),total=state.deck.length,{example, index:exIndex}=selectedExample(w);const nativeFirst=state.direction==='native-jp';
   $('study-counter').textContent=t(`PAROLA ${Math.min(state.index+1,total)} / ${total}`,`WORD ${Math.min(state.index+1,total)} / ${total}`);
   const ch=state.activePlan?.chapters||compileSequence(w).chapters;const ci=Math.min(state.chapterIndex,Math.max(0,ch.length-1));
   $('chapter-label').textContent=ch.length?t(`CAPITOLO ${ci+1}/${ch.length}: ${ch[ci].title}`,`CHAPTER ${ci+1}/${ch.length}: ${ch[ci].title}`):t('Nessun capitolo attivo','No active chapter');
   $('progress-bar').style.width=(total?((state.index+1)/total*100):0)+'%';
   $('pos-pill').textContent=POS[w.pos][state.lang];
   $('front-label').textContent=nativeFirst?t(`DOMANDA · ${state.lang==='it'?'ITALIANO':'INGLESE'}`,`QUESTION · ENGLISH`):t('DOMANDA · GIAPPONESE','QUESTION · JAPANESE');
   $('answer-label').textContent=nativeFirst?t('SOLUZIONE · GIAPPONESE','ANSWER · JAPANESE'):t(`SOLUZIONE · ${state.lang==='it'?'ITALIANO':'INGLESE'}`,'ANSWER · ENGLISH');
   $('study-front').textContent=nativeFirst?w.meaning[state.lang]:w.jp;
   $('study-front').classList.toggle('native',nativeFirst);
   $('study-front').lang=nativeFirst?state.lang:'ja';
   $('study-front-reading').textContent=nativeFirst?'':w.kana;
   $('study-answer').textContent=(state.revealed.answer||state.answerShown)?(nativeFirst?w.jp:w.meaning[state.lang]):'••••';
   $('study-answer').lang=nativeFirst?'ja':state.lang;
   $('study-answer').classList.toggle('jp',nativeFirst);
   $('study-answer').classList.toggle('masked',!(state.revealed.answer||state.answerShown));
   $('study-answer-reading').textContent=(state.revealed.answer||state.answerShown)&&nativeFirst?w.kana:'';
   $('forms-heading').textContent=t('FORME GRAMMATICALI','GRAMMAR FORMS');
   $('forms-count').textContent=t(`${w.forms.length} forme`,`${w.forms.length} forms`);
   $('study-forms').innerHTML=(state.revealed.forms||state.answerShown)?w.forms.slice(0,3).map(f=>`<span class="form-pill"><span>${textSafe(f.label)}</span>${textSafe(f.jp)}</span>`).join('')+(w.forms.length>3?`<span class="extra-counter">+${w.forms.length-3}</span>`:''):`<span class="muted-placeholder">${t('Visibili dopo la risposta','Shown after the answer')}</span>`;
   $('example-heading').textContent=t(`ESEMPIO ${Math.min(exIndex+1,examplesForCard(w).length)} / ${examplesForCard(w).length}`,`EXAMPLE ${Math.min(exIndex+1,examplesForCard(w).length)} / ${examplesForCard(w).length}`);
   $('study-example-jp').textContent=(state.revealed.exampleJP||state.answerShown)?example.jp:t('Frase nascosta fino alla soluzione','Sentence hidden until the answer');
   $('study-example-kana').textContent=(state.revealed.exampleJP||state.answerShown)?example.kana:'';
   $('study-example-native').textContent=(state.revealed.exampleNative||state.answerShown)?example[state.lang]:'';
   $('btn-play').innerHTML=state.playing?`<span class="control-symbol">Ⅱ</span><span>${t('Pausa','Pause')}</span>`:`<span class="control-symbol">▶</span><span>${state.completed?t('Nuova','New'):state.paused?t('Riprendi','Resume'):t('Avvia audio','Start audio')}</span>`;
   $('repeat-label').textContent=t('Precedente','Previous');$('next-label').textContent=t('Successivo','Next');
   $('btn-reveal').textContent=allRevealed()?t('Nascondi soluzione','Hide answer'):t('Mostra soluzione','Reveal answer');
   $('btn-show-detail').textContent=t('Esempi ↗','Examples ↗');
   const flags=progressFor(w);for(const [kind,name] of [['favorite','favorite'],['known','known']]){const btn=$(`study-${name}`);btn.setAttribute('aria-pressed',String(!!flags[kind]));btn.classList.toggle('active',!!flags[kind]);btn.textContent=kind==='favorite'?(flags[kind]?'★':'☆'):(flags[kind]?t('✓ Noto','✓ Known'):t('Noto','Known'));}
   $('study-meaning-count').textContent=t(`Significato ♫ ${flags.meaningPlays||0}`,`Meaning ♫ ${flags.meaningPlays||0}`);
   scheduleExampleScroll();
   $('playback-status').textContent=state.phase;$('status-dot').classList.toggle('live',state.playing);updateMediaMetadata();updateStats();
 }
 let exampleScrollFrame=0;
 function scheduleExampleScroll(){if(exampleScrollFrame)cancelAnimationFrame(exampleScrollFrame);exampleScrollFrame=requestAnimationFrame(()=>{exampleScrollFrame=0;for(const n of document.querySelectorAll('.example-viewport')){
  const el=n.firstElementChild;if(!el)continue;const signature=[el.textContent,n.clientWidth,n.clientHeight].join('|');if(el.dataset.scrollSignature===signature)continue;el.dataset.scrollSignature=signature;el.classList.remove('scrolling');el.style.removeProperty('--scroll-distance');el.style.removeProperty('--scroll-duration');
  const overflow=el.scrollHeight-n.clientHeight;if(overflow>3){el.style.setProperty('--scroll-distance',`-${Math.ceil(overflow)}px`);el.style.setProperty('--scroll-duration',`${Math.max(18,Math.ceil(overflow/12)*2+6)}s`);el.classList.add('scrolling')}
 }});}
 function renderSessions(){if(!$('saved-sessions')||!activeDeck)return;
   const select=$('create-deck');if(!select.options.length)syncSessionCreator();
   const sessions=studyDoc.sessions.filter(x=>x.deckId===activeDeckId).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
   $('saved-sessions').innerHTML=sessions.map(s=>{const resolved=Sessions.resolveSession(s,BANK),missing=resolved.missingIds.length;
    return `<article class="session-entry"><div><strong>${textSafe(s.name||s.id)}</strong><p class="small-copy">${textSafe(s.status||'created')} · ${s.orderedCardIds.length} carte · ${Math.min((s.currentCardIndex||0)+1,s.orderedCardIds.length)}/${s.orderedCardIds.length} · ${s.shuffleEnabled?'Shuffle carte':'Ordine deck'}${s.exampleShuffleEnabled?' · Shuffle esempi':''}${missing?' · ⚠ '+missing+' mancanti':''}</p></div><div class="deck-buttons"><button class="solid-btn" data-session-resume="${textSafe(s.id)}">${s.status==='completed'?'Rivedi':'Riprendi'}</button><button class="outline-btn" data-session-copy="${textSafe(s.id)}">Duplica</button><button class="outline-btn" data-session-archive="${textSafe(s.id)}">${s.status==='archived'?'Riattiva':'Archivia'}</button><button class="outline-btn" data-session-delete="${textSafe(s.id)}">Elimina</button></div></article>`}).join('')||'<p class="small-copy">Nessuna sessione salvata per questo deck.</p>';
   const stats=Sessions.dashboard(BANK,state.progress,sessions);const metric=(n,label)=>`<div class="session-metric"><strong>${n}</strong><span>${label}</span></div>`;
   $('deck-dashboard').innerHTML=`<div class="metric-grid">${metric(stats.total,'Carte')}${metric(stats.heard,'Ascoltate')}${metric(stats.unheard,'Mai ascoltate')}${metric(stats.coverage.toFixed(1)+'%','Copertura')}${metric(stats.exposures,'Esposizioni')}${metric(stats.known,'Note')}${metric(stats.favorites,'Preferite')}${metric(stats.completedSessions,'Sessioni concluse')}</div><p class="small-copy">La copertura misura gli ascolti, non la conoscenza dichiarata.</p>`;
   const max=Math.max(1,...stats.distribution.map(x=>x.count));
   $('exposure-distribution').innerHTML=stats.distribution.map(b=>`<div class="distribution-row"><span>${b.label}</span><div class="distribution-track"><div style="width:${100*b.count/max}%"></div></div><strong>${b.count}</strong></div>`).join('');
 }
 function renderLanguage(){
   for(const lang of ['it','en']){$('language-'+lang).classList.toggle('active',state.lang===lang);$('language-'+lang).setAttribute('aria-pressed',String(state.lang===lang))}
   document.documentElement.lang=state.lang;renderStudy();renderLibrary();renderDetail();renderSequenceEditor();renderDeckManager();if(state.view==='stories')renderStories();
 }
 function showView(tab){if(state.view==='stories'&&tab!=='stories')stopStory();if(state.view==='library'&&tab!=='library')interruptPreview();state.view=tab;for(const type of ['study','library','diagnostics','decks','sessions','stories'])$('view-'+type).classList.toggle('hidden',tab!==type);$('header-section').textContent=tab==='study'?'STUDIO':tab==='library'?'LESSICO':tab==='decks'?'DECK':tab==='sessions'?'SESSIONI':tab==='stories'?'STORIE':'TEST';if(tab==='library'){renderLibrary();renderDetail()}if(tab==='diagnostics')renderCapabilities();if(tab==='decks')renderDeckManager();if(tab==='sessions')renderSessions();if(tab==='stories')renderStories();$('main-content').scrollTop=0}
 function renderStories(){
   const rows=activeDeck?.stories||[];
   if(!rows.length){$('story-list').innerHTML='<p class="small-copy">Questo deck non contiene storie.</p>';$('story-detail').innerHTML='';return}
   if(!rows.some(x=>x.id===selectedStoryId))selectedStoryId=rows[0].id;
   $('story-list').innerHTML=rows.map(s=>`<button class="word-row ${s.id===selectedStoryId?'active':''}" data-story-open="${textSafe(s.id)}"><strong>${textSafe(s.title)}</strong><small>${s.cardIds.length} vocaboli</small></button>`).join('');
   const story=rows.find(s=>s.id===selectedStoryId);
   $('story-detail').innerHTML=`<div class="story-head"><h2>${textSafe(story.title)}</h2><p>${textSafe(story.description||'')}</p><p class="small-copy">${story.cardIds.map(id=>textSafe(BANK.find(c=>String(c.id)===String(id))?.jp||id)).join(' · ')}</p><button class="solid-btn" id="story-play" type="button">▶ Ascolta storia</button><button class="outline-btn" id="story-stop" type="button">■ Ferma</button></div>${story.segments.map((seg,i)=>`<div class="story-segment"><small>${i+1}. ${textSafe(seg.speaker||'Narratore')}</small><p lang="ja">${textSafe(seg.jp)}</p><p lang="ja" class="ex-kana">${textSafe(seg.kana)}</p><p>${textSafe(seg[state.lang])}</p></div>`).join('')}`;
 }
 async function playStory(){const story=Content.storyById(activeDeck,selectedStoryId);if(!story)return;if(state.playing||state.paused)stopLesson();interruptPreview();const id=++storyAudioRun;
   for(const seg of story.segments){if(id!==storyAudioRun)break;await speak(seg.jp,'ja-JP');if(id!==storyAudioRun)break;await delay(250);if(id!==storyAudioRun)break;await speak(seg[state.lang],locale());if(id!==storyAudioRun)break;await delay(450)}
 }
 function stopStory(){storyAudioRun++;speechAdapter.cancel();}
 function openDrawer(tab='settings'){$('app-drawer').inert=false;$('app-drawer').classList.add('open');$('app-drawer').setAttribute('aria-hidden','false');$('drawer-shade').hidden=false;$('btn-menu').setAttribute('aria-expanded','true');state.drawerOpen=true;switchDrawerTab(tab);$('btn-close-drawer').focus()}
 function closeDrawer(){state.drawerOpen=false;$('app-drawer').classList.remove('open');$('app-drawer').setAttribute('aria-hidden','true');$('app-drawer').inert=true;$('drawer-shade').hidden=true;$('btn-menu').setAttribute('aria-expanded','false');$('btn-menu').focus()}
 function switchDrawerTab(tab){state.drawerTab=tab;for(const v of ['settings','sequence'])$('drawer-'+v).classList.toggle('hidden',v!==tab);document.querySelectorAll('[data-drawer]').forEach(b=>b.classList.toggle('active',b.dataset.drawer===tab));if(tab==='sequence')renderSequenceEditor();$('app-drawer').querySelector('.drawer-content').scrollTop=0}
 function renderLibrary(){const search=state.search.toLowerCase().trim();const rows=BANK.filter(w=>(state.libraryFilter==='all'||w.pos===state.libraryFilter)&&[w.jp,w.kana,w.meaning.it,w.meaning.en].join(' ').toLowerCase().includes(search));
   $('word-list').innerHTML=rows.map(w=>`<button class="word-row ${String(state.chosenWordId)===String(w.id)?'active':''}" type="button" data-word-id="${w.id}"><span><strong lang="ja">${textSafe(w.jp)}</strong><small lang="ja">${textSafe(w.kana)}</small><small class="word-exposure">${t('Significato','Meaning')} ♫ ${progressFor(w).meaningPlays||0} · ${t('Completata','Completed')} ${progressFor(w).exposures||0}</small></span><span class="word-translation">${progressFor(w).favorite?'★ ':''}${progressFor(w).known?'✓ ':''}${textSafe(w.meaning[state.lang])}</span></button>`).join('')||`<p class="small-copy">${t('Nessun risultato','No results')}</p>`;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',state.libraryFilter===b.dataset.filter));
 }
 function renderDetail(){
  const w=wordById(state.chosenWordId)||BANK[0];if(!w)return;
  $('detail-pos').textContent=POS[w.pos][state.lang];$('detail-word').textContent=w.jp;$('detail-reading').textContent=w.kana;$('detail-meaning').textContent=w.meaning[state.lang];$('detail-meaning-count').textContent=t(`Significato ascoltato ${progressFor(w).meaningPlays||0} volte · Card completata ${progressFor(w).exposures||0} volte`,`Meaning played ${progressFor(w).meaningPlays||0} times · Card completed ${progressFor(w).exposures||0} times`);
  for(const kind of ['favorite','known']){const btn=$(`detail-${kind}`),on=!!progressFor(w)[kind];btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));btn.textContent=kind==='favorite'?(on?'★':'☆'):(on?'✓ Noto':'Noto')}
  $('detail-forms').innerHTML=w.forms.map((f,i)=>`<button class="form-chip" data-form-index="${i}" type="button"><small>${textSafe(f.label)} · ${textSafe(formName(f.label,w))}</small><span lang="ja">${textSafe(f.jp)} ♪</span></button>`).join('');
  const regs=[...new Set((activeDeck?.scenarios||[]).map(x=>x.register))],names={informal:'Informale',colleague:'Colleghi',superior:'Superiori',legacy:'Originali (v0.3)'};if(w.legacyExamples?.length)regs.push('legacy');
  $('detail-register').innerHTML='<option value="all">Tutti i registri</option>'+regs.map(x=>`<option value="${textSafe(x)}">${textSafe(names[x]||x)}</option>`).join('');
  $('detail-register').value=regs.includes(detailRegister)?detailRegister:'all';
  const scenarios=$('detail-register').value==='legacy'?[]:Content.availableScenarios(activeDeck,$('detail-register').value);
  $('detail-scenario').innerHTML='<option value="all">Tutti gli scenari</option>'+scenarios.map(x=>`<option value="${textSafe(x.id)}">${textSafe(x.title)}</option>`).join('');
  $('detail-scenario').value=scenarios.some(x=>x.id===detailScenario)?detailScenario:'all';
  const xs=Content.examplesFor(w,{register:detailRegister,scenario:detailScenario});
  $('detail-example-count').textContent=`${xs.length} esempi · letture e traduzioni`;
  $('ex-list').innerHTML=xs.map((ex,i)=>`<div class="ex-row"><div class="ex-line"><span class="ex-id">${String(i+1).padStart(2,'0')}</span><div class="ex-body"><div class="ex-context">${textSafe((activeDeck?.scenarios||[]).find(s=>s.id===ex.scenarioId)?.title||ex.scenarioId||'Esempio')} · ${textSafe(ex.grammarForm||'')}</div><div class="ex-ja" lang="ja">${textSafe(ex.jp)}</div><div class="ex-kana" lang="ja">${textSafe(ex.kana)}</div><div class="ex-native">${textSafe(ex[state.lang])}</div></div><div class="ex-buttons"><button data-voice-ex-jp="${textSafe(ex.id)}" type="button" aria-label="Ascolta esempio giapponese">日</button><button data-voice-ex-native="${textSafe(ex.id)}" type="button" aria-label="Ascolta traduzione">${state.lang.toUpperCase()}</button></div></div></div>`).join('')||'<p class="small-copy">Nessun esempio per questi filtri.</p>';
 }
 // Rendering helpers for the editor. A missing override means "inherit" (zero is valid).
 const audioRanges={rate:{min:.5,max:1.5,step:.05,label:'Velocità',suffix:'×'},pitch:{min:.5,max:1.5,step:.05,label:'Tono',suffix:''},volume:{min:0,max:1,step:.05,label:'Volume',suffix:''}};
 const fmtAudio=(key,value)=>key==='volume'?`${Math.round(value*100)}%`:`${Number(value).toFixed(2)}${key==='rate'?'×':''}`;
 const audioLangForType=type=>['word','exampleJP'].includes(type)?'ja-JP':locale();
 function renderMasterControls(){
   $('audio-masters').innerHTML=[['ja-JP','日本語 · Giapponese'],['it-IT','Italiano'],['en-US','English']].map(([lang,title])=>{
     const vals=state.audioMasters[lang];
     return `<section class="master-language"><header><strong>${textSafe(title)}</strong><button type="button" data-master-preview="${lang}">♪ Prova</button><button type="button" data-master-reset="${lang}">↺ Reset</button></header><div class="audio-controls">${Object.entries(audioRanges).map(([key,c])=>`<label class="audio-control"><span>${c.label}</span><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${vals[key]}" data-master="${lang}:${key}"><output>${fmtAudio(key,vals[key])}</output></label>`).join('')}</div></section>`;
   }).join('');
 }
 function overridesMarkup(owner,scope,id,group=null){
   const o=owner.audioOverrides||{};
   const lang=scope==='item'?audioLangForType(owner.type):'ja-JP';
   const inherited=scope==='item'?Core.resolveSpeechSettings(lang,[group],{id:owner.id},state.audioMasters):Core.resolveSpeechSettings(lang,[],{},state.audioMasters);
   return `<details class="audio-override" data-a-details="${scope}:${textSafe(id)}"><summary>♫ Audio · override gruppo/elemento</summary><div class="audio-controls">${Object.entries(audioRanges).map(([key,c])=>{
     const enabled=Object.prototype.hasOwnProperty.call(o,key);
     const value=enabled?o[key]:inherited[key];
     return `<label class="override-row"><span>${c.label}</span><input type="checkbox" data-a-enabled="${scope}:${textSafe(id)}:${key}" ${enabled?'checked':''} aria-label="Personalizza ${c.label}"><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${value}" data-a-value="${scope}:${textSafe(id)}:${key}" ${enabled?'':'disabled'}><output>${fmtAudio(key,value)}</output></label>`;
   }).join('')}<div class="override-hint">Senza spunta il valore è ereditato; nei gruppi misti il master dipende dalla lingua del parlato.</div></div></details>`;
 }
 function renderSequenceEditor(){
   const editor=$('sequence-editor');
   const openDetails=new Set([...editor.querySelectorAll('details[open][data-a-details]')].map(n=>n.dataset.aDetails));
   $('sequence-direction-title').textContent=state.direction==='jp-native'?t('Giapponese → Italiano','Japanese → English'):t('Italiano → Giapponese','English → Japanese');
   $('sequence-select').innerHTML=sequenceRepo.list(state.direction).map(s=>`<option value="${textSafe(s.sequenceId)}" ${selectedSequence().sequenceId===s.sequenceId?'selected':''}>${textSafe(s.name)}</option>`).join('');
   $('sequence-description').value=selectedSequence().description||'';
   const groups=selectedSequence().groups;
   editor.innerHTML=groups.map((g,gi)=>{
     const id=textSafe(g.id);
     const targets=groups.filter(o=>o.id!==g.id).map(o=>`<option value="${textSafe(o.id)}">${textSafe(o.name)}</option>`).join('');
     return `<section class="sequence-group" data-group-card="${id}">
       <div class="group-toolbar"><input type="checkbox" class="group-enable" data-g-enabled="${id}" aria-label="Abilita capitolo" ${g.enabled!==false?'checked':''}><input class="group-title" maxlength="60" data-g-name="${id}" aria-label="Nome capitolo" value="${textSafe(g.name)}"><button class="micro-btn" data-g-action="up" data-g-id="${id}" ${gi===0?'disabled':''} title="Capitolo su">↑</button><button class="micro-btn" data-g-action="down" data-g-id="${id}" ${gi===groups.length-1?'disabled':''} title="Capitolo giù">↓</button><button class="micro-btn remove" data-g-action="remove" data-g-id="${id}" ${groups.length<=1?'disabled':''} title="Rimuovi capitolo">×</button></div>
       <div class="chapter-mark">CAPITOLO ${gi+1}</div>
       <div class="group-config"><div class="field-mini"><label>Ripetizioni gruppo</label><input class="small-input" data-g-repeat="${id}" type="number" min="1" max="10" value="${g.repeat}"></div><div class="field-mini"><label>Pausa tra cicli gruppo (s)</label><input class="small-input" data-g-between="${id}" type="number" min="0" max="60" step="0.25" value="${g.pauseBetweenGroupRepeatsMs/1000}"></div><div class="field-mini"><label>Pausa extra fine gruppo (s)</label><input class="small-input" data-g-after="${id}" type="number" min="0" max="60" step="0.25" value="${g.pauseAfterGroupMs/1000}"></div></div>
       ${overridesMarkup(g,'group',g.id)}
       ${(g.items||[]).map((el,ei)=>`<div class="sequence-item"><div class="item-top"><input class="mini-toggle" type="checkbox" data-i-enabled="${id}:${textSafe(el.id)}" ${el.enabled!==false?'checked':''} aria-label="Attiva elemento"><select class="small-input item-type" data-i-type="${id}:${textSafe(el.id)}" aria-label="Tipo elemento">${TYPE_KEYS.map(type=>`<option value="${type}" ${el.type===type?'selected':''}>${textSafe(TYPES[type][state.lang])}</option>`).join('')}</select><button class="micro-btn" data-i-action="preview" data-g-id="${id}" data-i-id="${textSafe(el.id)}" title="Ascolta elemento">♪</button></div>
       <div class="item-meta"><div class="field-mini"><label>Ripetizioni elemento</label><input class="small-input" data-i-repeat="${id}:${textSafe(el.id)}" type="number" min="1" max="10" value="${el.repeat}"></div><div class="field-mini"><label>Pausa tra ripetizioni (s)</label><input class="small-input" data-i-between="${id}:${textSafe(el.id)}" type="number" min="0" max="60" step="0.25" placeholder="Globale" value="${el.pauseBetweenRepeatsMs===null?'':el.pauseBetweenRepeatsMs/1000}"></div><div class="field-mini"><label>Pausa extra dopo (s)</label><input class="small-input" data-i-after="${id}:${textSafe(el.id)}" type="number" min="0" max="60" step="0.25" value="${el.pauseAfterElementMs/1000}"></div></div>
       ${overridesMarkup(el,'item',`${g.id}:${el.id}`,g)}
       <div class="item-transfer"><button class="micro-btn" data-i-action="up" data-g-id="${id}" data-i-id="${textSafe(el.id)}" ${ei===0?'disabled':''} title="Elemento su">↑</button><button class="micro-btn" data-i-action="down" data-g-id="${id}" data-i-id="${textSafe(el.id)}" ${ei===g.items.length-1?'disabled':''} title="Elemento giù">↓</button><button class="micro-btn remove" data-i-action="remove" data-g-id="${id}" data-i-id="${textSafe(el.id)}" title="Elimina elemento">×</button>${groups.length>1?`<span>Sposta in</span><select class="small-input" data-i-move="${id}:${textSafe(el.id)}"><option value="">Questo gruppo</option>${targets}</select>`:''}</div></div>`).join('')}
       <div class="new-item-row"><select class="small-input" data-add-select="${id}" aria-label="Tipo nuovo elemento">${TYPE_KEYS.map(type=>`<option value="${type}">${textSafe(TYPES[type][state.lang])}</option>`).join('')}</select><button class="outline-btn" data-g-action="add-item" data-g-id="${id}" type="button">+ Elemento</button></div></section>`;
   }).join('');
   for(const el of editor.querySelectorAll('details[data-a-details]'))if(openDetails.has(el.dataset.aDetails))el.open=true;
   previewPlan();
 }
 function editorChange(){if(state.playing||state.paused)stopLesson(t('Configurazione aggiornata','Audio configuration updated'));interruptPreview();state.chapterIndex=0;state.activePlan=null;save();previewPlan();renderStudy()}
 function interruptPreview(){state.previewId++;previewPlayback.stop()}
 function cancelLesson(){playbackController.stop();state.activePlan=null}
 function setPlaybackState(){if('mediaSession'in navigator)try{navigator.mediaSession.playbackState=state.playing?'playing':'paused'}catch(e){}}
 function updateMediaMetadata(){if(!('mediaSession'in navigator)||!('MediaMetadata'in window))return;const w=current();try{navigator.mediaSession.metadata=new MediaMetadata({title:w.jp+' · '+w.kana,artist:w.meaning[state.lang],album:'Kotoba Drive · '+(activeDeck?.title||'Giapponese')})}catch(e){}}
 function makeLog(source,msg){const stamp=new Date().toLocaleTimeString('it-IT',{hour12:false});state.events.unshift(`${stamp} [${source}] ${msg}`);if(state.events.length>60)state.events.pop();$('event-log').textContent=state.events.join('\n')}
 async function bridgeOn(){if(!state.wheel)return;const player=$('media-bed');try{if(player.paused){await player.play();makeLog('AUDIO','traccia bridge avviata')}updateMediaMetadata()}catch(e){makeLog('ERRORE',`bridge: ${e.name||e.message}`)}}
 function bridgeOff(){const player=$('media-bed');if(!player.paused)player.pause()}
 async function requestWake(){if(!state.wake||!('wakeLock'in navigator)||document.visibilityState!=='visible'||wakeLockHandle)return;try{const newLock=await navigator.wakeLock.request('screen');if(!state.playing){newLock.release().catch(()=>{});return}wakeLockHandle=newLock;newLock.addEventListener('release',()=>{if(wakeLockHandle===newLock)wakeLockHandle=null},{once:true})}catch(e){makeLog('SCHERMO',`Wake Lock non disponibile: ${e.name||e.message}`)}}
 function releaseWake(){if(wakeLockHandle){const lock=wakeLockHandle;wakeLockHandle=null;lock.release().catch(()=>{})}}
 function stopLesson(msg){finalizeRun(false);releaseWake();state.playing=false;state.paused=false;cancelLesson();bridgeOff();setPlaybackState();state.phase=msg||t('Riproduzione fermata','Playback stopped');save();renderStudy()}
 function pauseLesson(){if(!state.playing)return;runPauseStart=Date.now();playbackController.pause();state.playing=false;state.paused=true;releaseWake();bridgeOff();setPlaybackState();state.phase=t('In pausa','Paused');save();renderStudy()}
 function resetSession(){syncSessionCreator();showView('sessions');closeDrawer();toast('Scegli filtri e shuffle prima di creare la sessione')}
 function loadVoices(){if(!('speechSynthesis'in window))return;state.voices=speechSynthesis.getVoices()||[];renderCapabilities()}
 function selectVoice(lang){const prefix=lang.split('-')[0].toLowerCase();const matches=state.voices.filter(v=>v.lang.toLowerCase().startsWith(prefix));return matches.find(v=>v.localService)||matches[0]||null}
 function renderCapabilities(){const tts='speechSynthesis'in window,ms='mediaSession'in navigator;$('cap-tts').textContent=tts?'DISPONIBILE':'NON DISPONIBILE';$('cap-tts').className=tts?'available':'unavailable';$('cap-media').textContent=ms?'API PRESENTE':'NON DISPONIBILE';$('cap-media').className=ms?'available':'unavailable';for(const [id,lang] of [['ja','ja-JP'],['it','it-IT'],['en','en-US']]){const v=selectVoice(lang);$('cap-'+id).textContent=v?`${v.name} (${v.lang})`:tts?'Voce non elencata':'Non disponibile';$('cap-'+id).className=v?'available':'unavailable'}$('hardware-count').textContent=String(state.hardwareCount)}
 const speechAdapter=new Core.SpeechAdapter('speechSynthesis'in window?window.speechSynthesis:null,window.SpeechSynthesisUtterance,selectVoice,msg=>makeLog('TTS',msg));
 function speak(text,lang,settings=null){return speechAdapter.speak({text,lang,settings:settings||Core.resolveSpeechSettings(lang,[],{},state.audioMasters)})}
 function setPhase(msg){state.phase=msg;$('playback-status').textContent=msg}
 function beginRun(cardId,chapterIndex){
   if(currentRun&&String(currentRun.cardId)===String(cardId))return;
   currentRun={id:uid(),cardId:String(cardId),meaningEventIds:new Set(),startedAt:new Date().toISOString(),started: false,heardSay:0,exampleIds:new Set(),chapters:new Set(),skipped:chapterIndex>0,startedMs:Date.now(),pausedMs:0};
 }
 function finalizeRun(complete=false){
   if(!currentRun)return;
   const run=currentRun;currentRun=null;runPauseStart=null;
   if(!run.heardSay&&!run.started)return;
   const p=progressFor({id:run.cardId});
   const all=state.activePlan?.chapters?.length||compileSequence(current()).chapters.length;
   const succeeded=!!complete&&!run.skipped&&run.chapters.size>=all;
   state.progress[run.cardId]=Sessions.grade(p,run,{complete:succeeded,exampleIds:[...run.exampleIds],durationMs:Math.max(0,Date.now()-run.startedMs-run.pausedMs)});
 }
 function onSpeechResult(step,result){
   if(result!=='done'||!currentRun||String(currentRun.cardId)!==String(current().id))return;
   currentRun.started=true;currentRun.heardSay++;
   if(step.type==='meaning'&&!currentRun.meaningEventIds.has(step.eventId)){
     currentRun.meaningEventIds.add(step.eventId);
     const card=current();state.progress[card.id]=Sessions.normalizeProgress(progressFor(card));state.progress[card.id].meaningPlays++;
     save();renderStudy();if(state.view==='library'){renderLibrary();renderDetail();}
   }
   if(step.exIndex!==null&&step.exIndex!==undefined){const e=examplesForCard(current())[step.exIndex];if(e)currentRun.exampleIds.add(String(e.id??`${current().id}:ex:${step.exIndex+1}`))}
   if(currentRun.heardSay===1)save();
 }
 function onPlayEvent(step){
   if(step.kind==='chapterStart'){
     const idx=state.activePlan?.chapters.findIndex(c=>c.id===step.chapterId)??-1;
     if(idx>=0)state.chapterIndex=idx;if(currentRun)currentRun.chapters.add(String(step.chapterId));save();
     renderStudy();return;
   }
   if(step.kind==='pause'){setPhase(t(`Pausa ${step.seconds}s`,`Pause ${step.seconds}s`));return}
   if(step.kind!=='say')return;
   const nativeFirst=state.direction==='native-jp';
   if(step.exIndex!==null&&step.exIndex!==undefined){
     if(state.visibleExampleIndex!==step.exIndex&&!state.answerShown){state.revealed.exampleJP=false;state.revealed.exampleNative=false;}
     state.visibleExampleIndex=step.exIndex;
   }
   if((nativeFirst&&step.type==='word')||(!nativeFirst&&step.type==='meaning'))state.revealed.answer=true;
   if(step.type==='form'||step.type==='formLabel')state.revealed.forms=true;
   if(step.type==='exampleJP')state.revealed.exampleJP=true;
   if(step.type==='exampleNative')state.revealed.exampleNative=true;
   renderStudy();setPhase(t(`In ascolto · ${step.label}`,`Listening · ${step.label}`));
 }
 function finishedCard(){
   if(!state.playing)return;
   const w=current();if(!currentRun?.heardSay){stopLesson('TTS non disponibile: ascolto non conteggiato');return;}finalizeRun(true);if(currentSession()?.exampleShuffleEnabled){const s=currentSession();s.exampleOffsets??={};s.exampleOffsets[String(w.id)]=(exampleStart(w)+state.exampleCount)%Math.max(1,examplesForCard(w).length);}else state.exampleCycle[w.id]=((Number(state.exampleCycle[w.id])||0)+state.exampleCount)%Math.max(1,examplesForCard(w).length);save();
   state.index++;state.chapterIndex=0;save();state.activePlan=null;resetReveal();state.visibleExampleIndex=null;
   if(state.index<state.deck.length){playCardAtChapter(0);return}
   state.playing=false;state.paused=false;state.completed=true;const session=currentSession();if(session){session.status='completed';session.completedAt=new Date().toISOString();}releaseWake();bridgeOff();setPlaybackState();state.index=Math.max(0,state.deck.length-1);revealAll();state.phase=t('Sessione completata','Session complete');renderStudy();save();renderSessions();toast(t('Sessione terminata','Session finished'));
 }
 const playbackController=new Core.PlaybackController({speech:speechAdapter,onEvent:onPlayEvent,onSpeechResult,
   onSpeechStart:()=>{if(currentRun&&!currentRun.started){currentRun.started=true;save();}},
   onFailure:status=>{makeLog('TTS',`Interruzione riproduzione: ${status}`);stopLesson(`Audio interrotto (${status}). Ripeti la carta.`)},
   onComplete:finishedCard});
 const previewPlayback=new Core.PlaybackController({speech:speechAdapter,onEvent:s=>{if(s.kind==='say')makeLog('ANTEPRIMA',`${s.lang}: ${s.label}`)}});
 function playCardAtChapter(chapterIndex=0,preserveReveal=false){
   const result=compileSequence(current());
   if(!result.chapters.length||!result.sayCount){state.playing=false;state.paused=false;toast(t('Nessun elemento audio attivo','No enabled audio element'));renderStudy();return false}
   state.activePlan=result;state.chapterIndex=Math.max(0,Math.min(result.chapters.length-1,chapterIndex));
   beginRun(current().id,state.chapterIndex);if(currentRun)currentRun.meaningEventIds=new Set();const session=currentSession();if(session&&session.status==='created')session.status='in-progress';
   state.playing=true;state.paused=false;state.completed=false;if(!preserveReveal){resetReveal();state.visibleExampleIndex=null;}
   const start=result.chapters[state.chapterIndex].startEventIndex;
   playbackController.start(result.plan,start);setPlaybackState();renderStudy();return true;
 }
 function startLesson(){
   if(state.playing){pauseLesson();return}
   if(state.completed||state.index>=state.deck.length||!state.deck.length)newDeck();
   interruptPreview();
   if(state.paused&&state.activePlan&&playbackController.status==='paused'){
     state.playing=true;state.paused=false;if(currentRun&&runPauseStart){currentRun.pausedMs+=Date.now()-runPauseStart;runPauseStart=null}playbackController.resume();
   } else if(!playCardAtChapter(state.chapterIndex)){openDrawer('sequence');return}
   setPlaybackState();if(state.wheel)bridgeOn();requestWake();renderStudy();
 }
 function navigateChapter(direction){
   const result=state.activePlan||compileSequence(current());
   if(!result.chapters.length){toast(t('Nessun capitolo disponibile','No chapter available'));return}
   const moved=Core.NavigationController.move(result.chapters,state.chapterIndex,direction);
   const wasPlaying=state.playing;
   if(currentRun){currentRun.skipped=true;if(moved.deltaCard!==0)finalizeRun(false)}
   playbackController.stop();state.activePlan=null;if(direction>0)revealAll();
   if(moved.deltaCard!==0){
     const next=state.index+moved.deltaCard;
     if(next<0){state.chapterIndex=0;state.phase=t('Prima carta della sessione','First card of session');renderStudy();if(wasPlaying)playCardAtChapter(0);return}
     if(next>=state.deck.length){state.completed=true;state.playing=false;state.paused=false;releaseWake();bridgeOff();setPlaybackState();state.phase=t('Sessione conclusa con salto','Session ended by skipping');const session=currentSession();if(session){session.status='completed';session.completedAt=new Date().toISOString();}save();renderStudy();return}
     state.index=next;resetReveal();state.visibleExampleIndex=null;const adjacent=compileSequence(current());
     state.chapterIndex=moved.deltaCard<0?Math.max(0,adjacent.chapters.length-1):0;
   }else state.chapterIndex=moved.chapterIndex;
   state.phase=t('Capitolo selezionato','Chapter selected');save();state.playing=false;state.paused=!wasPlaying;
   renderStudy();if(wasPlaying)playCardAtChapter(state.chapterIndex,moved.deltaCard===0);
 }
 function moveExample(direction){const w=current(),length=examplesForCard(w).length;if(!length)return;state.visibleExampleIndex=null;
   const session=currentSession();if(session?.exampleShuffleEnabled){session.exampleOffsets??={};session.exampleOffsets[String(w.id)]=(exampleStart(w)+direction+length)%length;}
   else state.exampleCycle[w.id]=((Number(state.exampleCycle[w.id])||0)+direction+length)%length;
   if(!state.answerShown){state.revealed.exampleJP=false;state.revealed.exampleNative=false;}save();renderStudy();}

 async function manualSpeech(text,lang){if(state.playing||state.paused)stopLesson(t('Pausa per ascolto singolo','Stopped for single playback'));interruptPreview();await speak(text,lang)}
 function previewSingle(g,el){
   if(state.playing||state.paused)stopLesson();interruptPreview();
   const seq=Core.normalizeSequence({direction:state.direction,groups:[{...g,repeat:1,pauseAfterGroupMs:0,pauseBetweenGroupRepeatsMs:0,items:[{...el,enabled:true,repeat:1,pauseAfterElementMs:0,pauseBetweenRepeatsMs:0}]}]},state.direction);
   const result=compileSequence(current(),seq,{exampleCount:1});if(result.sayCount)previewPlayback.start(result.plan);
 }
 async function playTen(){const w=wordById(state.chosenWordId);if(!w)return;const examples=Content.examplesFor(w,{register:detailRegister,scenario:detailScenario}).slice(0,10);if(state.playing||state.paused)stopLesson();interruptPreview();const token=state.previewId;$('btn-play-10').textContent=t('■ Ferma','■ Stop');for(let i=0;i<examples.length;i++){if(token!==state.previewId)break;await speak(examples[i].jp,'ja-JP');if(token!==state.previewId)break;await delay(200);if(token!==state.previewId)break;await speak(examples[i][state.lang],locale());if(token!==state.previewId)break;await delay(350)}$('btn-play-10').textContent=t('▶ Ascolta fino a 10','▶ Play up to 10')}
 function setupMediaSession(){
   const adapter=new Core.MediaSessionAdapter(navigator.mediaSession,(action,info)=>{if(action.startsWith('unsupported:'))makeLog('MEDIA',`${action} non supportata`);else{state.hardwareCount++;renderCapabilities();makeLog('MEDIA',`${action} ricevuto`)}});
   if(!adapter.install({
     play:()=>{if(state.view==='diagnostics')bridgeOn();else if(!state.playing)startLesson()},
     pause:()=>{if(state.view==='diagnostics')bridgeOff();else pauseLesson()},
     stop:()=>{if(state.view==='diagnostics')bridgeOff();else stopLesson()},
     nexttrack:()=>{if(state.view!=='diagnostics')navigateChapter(1)},
     previoustrack:()=>{if(state.view!=='diagnostics')navigateChapter(-1)},
     seekforward:e=>{makeLog('MEDIA',`+${e.seekOffset??'?'}s`);if(state.view!=='diagnostics')navigateChapter(1)},
     seekbackward:e=>{makeLog('MEDIA',`-${e.seekOffset??'?'}s`);if(state.view!=='diagnostics')navigateChapter(-1)}
   })){makeLog('MEDIA','API non disponibile');return}
   updateMediaMetadata();setPlaybackState();
 }
 function updateSettingElement(id,value){$(id).value=String(value)}
 function initializeSettings(){
   $('session-size').innerHTML=[5,10,20,25,40,60,75,100,200,500].filter(x=>x<=BANK.length||x===5).map(x=>`<option value="${x}">${x}</option>`).join('');
   for(const [id,value] of [['study-category',state.category],['session-size',state.size],['study-direction',state.direction],['example-count',state.exampleCount],['form-count',state.formCount],['global-gap',state.globalGap]])updateSettingElement(id,value);
   $('announce-forms').checked=state.announceForms;$('wheel-enabled').checked=state.wheel;$('wake-enabled').checked=state.wake;renderMasterControls();
 }
 // ----- Phase 2: local-first deck and study manager -----
 function deckInfo(deck){return `${deck.title} · ${deck.cards.length} carte · rev. ${deck.revision}`}
 async function loadInstalled(){installedDecks=await deckRepo.list();installedDecks.sort((a,b)=>a.title.localeCompare(b.title));if(activeDeckId&&$('create-deck'))syncSessionCreator()}
 function renderDeckManager(){
   if(!$('deck-list'))return;
   $('deck-list').innerHTML=installedDecks.map(d=>`<article class="deck-entry"><div><strong>${textSafe(d.title)}</strong><div class="small-copy">${textSafe(d.deckId)} · ${d.cards.length} carte · rev. ${d.revision} · ${textSafe(d.level||'—')}</div><p class="small-copy">${textSafe(d.description||'')}</p></div><div class="deck-buttons"><button class="outline-btn" data-deck-open="${textSafe(d.deckId)}" ${activeDeckId===d.deckId?'disabled':''}>${activeDeckId===d.deckId?'In uso':'Apri deck'}</button><button class="outline-btn" data-deck-export="${textSafe(d.deckId)}">JSON</button><button class="outline-btn" data-deck-remove="${textSafe(d.deckId)}" ${installedDecks.length===1?'disabled':''}>Rimuovi</button></div></article>`).join('')||'<p>Nessun deck installato.</p>';
   $('active-deck-info').textContent=activeDeck?deckInfo(activeDeck):'—';
   $('catalog-list').innerHTML=catalog.map(c=>{const installed=installedDecks.find(d=>d.deckId===c.deckId);return `<article class="deck-entry"><div><strong>${textSafe(c.title)}</strong><div class="small-copy">${textSafe(c.level||'—')} · ${Number(c.cardCount)||'?'} carte · revisione ${Number(c.revision)||'?'}</div><p class="small-copy">${textSafe(c.description||'')}</p></div><button class="solid-btn" data-catalog-install="${textSafe(c.deckId)}">${installed?'Controlla aggiornamenti':'Installa'}</button></article>`}).join('')||'<p class="small-copy">Catalogo non caricato (rimangono disponibili i deck installati).</p>';
   $('library-deck-title').textContent=activeDeck?.title||'Vocabolario';$('library-deck-count').textContent=`${BANK.length} parole · ${BANK.reduce((n,w)=>n+(w.examples?.length||0),0)} esempi`;
 }
 async function refreshCatalog(){
   try{const response=await fetch('./decks/catalog.json',{cache:'no-cache'});if(!response.ok)throw Error('Catalogo non disponibile');const data=await response.json();if(data.schemaVersion!==1||!Array.isArray(data.decks))throw Error('Catalogo non valido');catalog=data.decks.filter(x=>Store.normalizeDeck&&typeof x.deckId==='string'&&typeof x.url==='string');}
   catch(e){console.warn(e);catalog=[];}
   renderDeckManager();
 }
 function safetyBackup(){return {format:'kotoba-backup',schemaVersion:1,study:structuredClone(studyDoc),decks:structuredClone(installedDecks),savedAt:new Date().toISOString()}}
 function downloadJSON(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
 async function switchDeck(id){if(id===activeDeckId)return;const next=await deckRepo.get(id);if(!next)throw Error('Deck non trovato');if(state.playing||state.paused)stopLesson();await flushSave();
   activeDeckId=id;activeDeck=next;BANK=next.cards;
   studyDoc.deckStates[id]??={lastSeenRevision:next.revision,cards:{}};
   state.progress=studyDoc.deckStates[id].cards;state.exampleCycle=studyDoc.settings.exampleCycleByDeck?.[id]||{};
   state.chosenWordId=String(BANK[0].id);state.size=Math.max(5,Math.min(state.size,BANK.length));initializeSettings();syncSessionCreator();restoreSessionOrCreate();save();renderLanguage();renderSessions();renderDeckManager();toast(`Deck attivo: ${next.title}`);
 }
 function restoreSessionOrCreate(){
   const preferred=studyDoc.settings.activeSessionId;
   const options=studyDoc.sessions.filter(x=>x.deckId===activeDeckId&&!['archived','completed'].includes(x.status));
   const saved=options.find(x=>x.id===preferred)||options.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0];
   if(saved){try{if(saved.activeRun){const w=saved.activeRun;studyDoc.deckStates[activeDeckId]??={cards:{}};
     const p=studyDoc.deckStates[activeDeckId].cards[w.cardId];studyDoc.deckStates[activeDeckId].cards[w.cardId]=Sessions.grade(p,w,{complete:false});saved.activeRun=null;}
     activateSession(saved,{recover:true});return;}catch(e){console.warn('Session restore',e)}}
   try{createNewSession({shuffle:true})}catch(e){state.sessionId=null;state.deck=BANK.slice(0,1);state.index=0;state.phase=e.message;renderStudy()}
 }
 async function installDeck(raw,options={}){
   const checked=Store.normalizeDeck(raw);if(checked.errors.length)throw Error(checked.errors.slice(0,7).join('\n'));
   const next=checked.deck,previous=await deckRepo.get(next.deckId),diff=Store.compareDeck(previous,next);
   if(previous&&next.revision<previous.revision&&!options.allowDowngrade)throw Error('La revisione importata è più vecchia di quella installata.');
   if(!options.approved){pendingImport={deck:next,diff};renderImportPreview();return;}
   await flushSave();
   const proposed=structuredClone(studyDoc);
   const mappings=options.mapping||{};
   const reconciled=Store.reconcileStudy(proposed,next.deckId,{...diff,nextCardIds:next.cards.map(x=>String(x.id))},{mode:options.mode||'retain',mapping:mappings});
   reconciled.deckStates[next.deckId]??={cards:{},lastSeenRevision:next.revision};
   reconciled.deckStates[next.deckId].lastSeenRevision=next.revision;
   await db.applyDeckUpdate(next,reconciled,reconciled.sessions,reconciled.sequences,previous?safetyBackup():null);
   studyDoc=reconciled;await loadInstalled();pendingImport=null;$('deck-import-preview').hidden=true;
   if(activeDeckId===next.deckId||!activeDeckId){activeDeck=next;activeDeckId=next.deckId;BANK=next.cards;state.progress=studyDoc.deckStates[next.deckId].cards;
     state.deck=state.deck.map(w=>BANK.find(c=>String(c.id)===String(mappings[String(w.id)]||w.id))).filter(Boolean);if(!state.deck.length)newDeck();state.index=Math.min(state.index,state.deck.length-1);state.chosenWordId=String(BANK[0].id);renderLanguage();}
   renderDeckManager();save();toast(`Deck ${next.title} installato`);
 }
 function renderImportPreview(){const pending=pendingImport;if(!pending)return;const {deck,diff}=pending;$('deck-import-preview').hidden=false;
   $('deck-import-report').textContent=`${deckInfo(deck)}\nCompatibilità: ${diff.kind}\n+${diff.added.length} carte · ${diff.modified.length} modificate · -${diff.removed.length} rimosse · +${diff.exampleAdded.length} esempi · ${diff.exampleModified.length} esempi modificati · -${diff.exampleRemoved.length} esempi rimossi`;
   $('deck-removed-items').textContent=diff.removed.length?'ID rimossi: '+diff.removed.join(', '):'Nessun riferimento carta rimosso';
   $('deck-mapping').value='';$('deck-conflict-mode').value='retain';$('deck-import-preview').scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 async function fetchDeckRecord(entry){const url=new URL(entry.url,new URL('./decks/catalog.json',location.href));if(url.origin!==location.origin)throw Error('Deck esterno non permesso nel catalogo');const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw Error('File deck non disponibile');return response.json()}
 async function exportStudy(){const doc=snapshotStudy();await flushSave();downloadJSON('kotoba-study.json',{...doc,exportedAt:new Date().toISOString()})}
 async function exportBackup(){const doc=snapshotStudy();await flushSave();downloadJSON('kotoba-backup-completo.json',{format:'kotoba-backup',schemaVersion:1,study:doc,decks:await deckRepo.list()})}
 function prepareStudyImport(incoming){
   const parsed=Store.normalizeStudy(incoming);const local=snapshotStudy();const merged=Store.mergeStudy(local,parsed);const missingDecks=Object.keys(parsed.deckStates).filter(id=>!installedDecks.some(d=>d.deckId===id));
   pendingStudyImport={parsed,merged};pendingImport=null;$('deck-import-preview').hidden=true;
   $('study-import-preview').hidden=false;
   $('study-import-report').textContent=`Deck referenziati: ${Object.keys(parsed.deckStates).length}\nDeck mancanti: ${missingDecks.join(', ')||'nessuno'}\nSessioni: ${parsed.sessions.length}\nSequenze: ${parsed.sequences?.sequences?.length||'presenti se disponibili'}\nConflitti fusione:\n${merged.conflicts.join('\n')||'nessuno'}\nFusione: contatori al massimo, flag dalla data più recente, impostazioni e sequenze locali.`;
   $('study-import-preview').scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 async function commitStudyImport(){if(!pendingStudyImport)return;
   const mode=$('study-import-mode').value,doc=mode==='replace'?pendingStudyImport.parsed:pendingStudyImport.merged.study;
   if(!confirm(mode==='replace'?'Sostituire completamente study.json? Conserva prima una copia.':'Confermare fusione senza sommare i contatori?'))return;
   await flushSave();await db.saveBundle({study:doc,sessions:doc.sessions,sequenceLibrary:doc.sequences,backup:safetyBackup()});location.reload();
 }
 async function importBackup(payload){if(payload.format==='kotoba-backup'){
   if(!Array.isArray(payload.decks))throw Error('Backup completo senza decks');
   const checked=payload.decks.map(d=>Store.normalizeDeck(d));if(checked.some(d=>d.errors.length))throw Error('Deck nel backup non valido: '+checked.flatMap(d=>d.errors).slice(0,5).join('; '));
   const incoming=Store.normalizeStudy(payload.study);const ids=checked.map(d=>d.deck.deckId);if(new Set(ids).size!==ids.length)throw Error('ID deck duplicato nel backup');if(!confirm(`Backup: ${checked.length} deck, ${incoming.sessions.length} sessioni. Sostituire i dati locali?`))return;
   await flushSave();await db.replaceAll({decks:checked.map(x=>x.deck),study:incoming,backup:safetyBackup()});location.reload();return;
  }
  if(payload.deckId||Array.isArray(payload)){await installDeck(payload);return}
  if(payload.schemaVersion===1&&payload.deckStates){prepareStudyImport(payload);return}
  throw Error('JSON non riconosciuto: atteso deck, study o backup completo.');
 }
 async function boot(){
   db=await Store.Database.open();deckRepo=new Store.DeckRepository(db);studyRepo=new Store.StudyRepository(db);sessionRepo=new Store.SessionRepository(db);sequenceStore=new Store.SequenceRepository(db);
   const existing=await studyRepo.get();
   if(existing){studyDoc=Store.normalizeStudy(existing)}
   else{
     studyDoc=Store.emptyStudy();const hasLegacy=Object.keys(stored).length>0;
     if(hasLegacy){await db.put('meta',{id:'legacy-backup',data:structuredClone(stored),savedAt:new Date().toISOString()});
       for(const field of settingFields)if(stored[field]!==undefined)studyDoc.settings[field]=structuredClone(stored[field]);
       studyDoc.audioMasters=Core.audioMasters(stored.audioMasters);
       studyDoc.sequences=stored.sequenceLibrary||null;
       if(stored.progress)studyDoc.deckStates['jlpt-n4-core']={cards:structuredClone(stored.progress),lastSeenRevision:1};
       studyDoc.settings.exampleCycleByDeck={'jlpt-n4-core':structuredClone(stored.exampleCycle||{})};
     }
   }
   await loadInstalled();
   try{const response=await fetch('./decks/n4-core.json');if(!response.ok)throw Error('Deck statico non disponibile');const checked=Store.normalizeDeck(await response.json());if(checked.errors.length)throw Error(checked.errors.join('; '));const builtIn=checked.deck;const installed=installedDecks.find(x=>x.deckId===builtIn.deckId);
     if(!installed){await deckRepo.save(builtIn);await loadInstalled()}
     else if((installed.revision||0)<builtIn.revision){const diff=Store.compareDeck(installed,builtIn);
       // Stable card and example IDs: install compatible editorial revisions transactionally.
       // Keep an on-device backup because all contextual example texts changed in revision 5 and were corrected in revision 6.
       if(['additive','editorial'].includes(diff.kind)&&!diff.removed.length&&!diff.exampleRemoved.length){
         const backup=safetyBackup();const reconciled=Store.reconcileStudy(studyDoc,builtIn.deckId,{...diff,nextCardIds:builtIn.cards.map(c=>String(c.id))});
         reconciled.deckStates[builtIn.deckId]??={cards:{}};
         reconciled.deckStates[builtIn.deckId].lastSeenRevision=builtIn.revision;
         await db.applyDeckUpdate(builtIn,reconciled,reconciled.sessions,reconciled.sequences,backup);
         studyDoc=reconciled;await loadInstalled();
         makeLog('DECK',`Deck aggiornato rev. ${installed.revision}→${builtIn.revision}; ${diff.exampleModified.length} frasi corrette; backup pre-importazione conservato`);
       }else makeLog('DECK',`Revisione ${builtIn.revision} disponibile: confronta manualmente da Deck e backup (${diff.kind})`);
     }
   }catch(error){if(!installedDecks.length)throw error;makeLog('DECK','Aggiornamento statico non disponibile: '+error.message)}
   
   const preferred=studyDoc.settings.activeDeckId||studyDoc.activeDeckId;
   activeDeck=installedDecks.find(d=>d.deckId===preferred)||installedDecks[0];activeDeckId=activeDeck.deckId;BANK=activeDeck.cards;
   studyDoc.deckStates[activeDeckId]??={cards:{},lastSeenRevision:activeDeck.revision};
   Object.assign(state,studyDoc.settings);state.audioMasters=Core.audioMasters(studyDoc.audioMasters);state.progress=studyDoc.deckStates[activeDeckId].cards;
   sequenceRepo=new Core.SequenceRepository(studyDoc.sequences||undefined,existing?undefined:stored.sequences);
   state.exampleCycle=studyDoc.settings.exampleCycleByDeck?.[activeDeckId]||state.exampleCycle||{};
   state.lang=state.lang==='en'?'en':'it';state.size=Math.max(5,Math.min(BANK.length,Number(state.size)||20));state.chosenWordId=String(BANK[0].id);
   initializeSettings();syncSessionCreator();restoreSessionOrCreate();renderLanguage();renderSessions();setupMediaSession();await refreshCatalog();save();
   $('boot-error').hidden=true;makeLog('AVVIO','Kotoba Drive v0.4.1: test reali iPhone ancora richiesti; esempi contestuali in bozza');
 }
 // Deck manager events: all file contents are validated before writing to IndexedDB.
 $('deck-list').addEventListener('click',async e=>{const btn=e.target.closest('button');if(!btn)return;try{
   if(btn.dataset.deckOpen)await switchDeck(btn.dataset.deckOpen);
   if(btn.dataset.deckExport){const d=await deckRepo.get(btn.dataset.deckExport);downloadJSON(`${d.deckId}.json`,d)}
   if(btn.dataset.deckRemove){const id=btn.dataset.deckRemove;if(id===activeDeckId)return toast('Apri un altro deck prima di rimuoverlo');if(!confirm('Rimuovere il deck locale? I progressi e i riferimenti saranno conservati.'))return;await deckRepo.remove(id);await loadInstalled();renderDeckManager()}
  }catch(err){toast(err.message)}});
 $('catalog-list').addEventListener('click',async e=>{const btn=e.target.closest('[data-catalog-install]');if(!btn)return;try{const d=catalog.find(x=>x.deckId===btn.dataset.catalogInstall);if(!d)return;await installDeck(await fetchDeckRecord(d))}catch(err){toast(err.message)}});
 $('catalog-refresh').addEventListener('click',refreshCatalog);
 $('deck-import-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>20*1024*1024)throw Error('File oltre il limite di 20 MB');let data=JSON.parse(await file.text());if(Array.isArray(data)){const slug=file.name.replace(/\.json$/i,'').replace(/[^a-zA-Z0-9_-]/g,'-');const converted=Store.normalizeDeck(data,{allowLegacy:true,legacyDeckId:'legacy-'+slug,legacyTitle:slug});if(converted.errors.length)throw Error(converted.errors.join('; '));data=converted.deck;}await importBackup(data)}catch(err){console.warn(err);$('deck-import-report').textContent=err.message; $('deck-import-preview').hidden=false;pendingImport=null}e.target.value=''});
 $('deck-confirm-import').addEventListener('click',async()=>{if(!pendingImport)return;try{const mapping={};for(const part of $('deck-mapping').value.split(/[\n,]+/)){if(!part.trim())continue;const chunks=part.trim().split(/\s*(?:->|:|=)\s*/);if(chunks.length!==2)throw Error('Mappatura: usare vecchioID → nuovoID');mapping[chunks[0]]=chunks[1]}await installDeck(pendingImport.deck,{approved:true,mode:$('deck-conflict-mode').value,mapping})}catch(e){toast(e.message)}});
 $('deck-cancel-import').addEventListener('click',()=>{pendingImport=null;$('deck-import-preview').hidden=true});
 $('study-import-confirm').addEventListener('click',()=>commitStudyImport().catch(e=>toast(e.message)));
 $('study-import-cancel').addEventListener('click',()=>{pendingStudyImport=null;$('study-import-preview').hidden=true});
 $('study-export').addEventListener('click',()=>exportStudy().catch(e=>toast(e.message)));
 $('backup-export').addEventListener('click',()=>exportBackup().catch(e=>toast(e.message)));
 $('legacy-backup').addEventListener('click',async()=>{const data=(await db.read('meta','legacy-backup'))?.data;if(!data)return toast('Nessun backup legacy disponibile');downloadJSON('kotoba-legacy-settings.json',data)});
 $('pre-import-backup').addEventListener('click',async()=>{const data=(await db.read('meta','pre-import-backup'))?.data;if(!data)return toast('Nessun backup pre-importazione disponibile');downloadJSON('kotoba-backup-prima-importazione.json',data)});

 // Persistent session creator and manager.
 for(const id of ['create-deck','create-name','create-size','create-category','create-language','create-direction','create-sequence','create-favorite','create-known','create-exposure','create-register','create-scenario','create-group','create-story','create-example-count','create-shuffle','create-shuffle-examples']){
   $(id).addEventListener('change',()=>{if(['create-deck','create-register','create-group'].includes(id))updateAvailableOptions();if(id==='create-direction')renderCreateSequences();updateEligible()});
 }
 $('create-session').addEventListener('click',()=>{try{
   const options={deckId:$('create-deck').value,name:$('create-name').value,count:Number($('create-size').value),filters:sessionFiltersFromForm(),shuffle:$('create-shuffle').checked,shuffleExamples:$('create-shuffle-examples').checked,language:$('create-language').value,direction:$('create-direction').value,sequenceId:$('create-sequence').value,exampleCount:Number($('create-example-count').value)};
   createNewSession(options);renderLanguage();showView('study');toast('Sessione creata: ordine salvato');
 }catch(e){toast(e.message)}});
 $('saved-sessions').addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;const action=Object.keys(btn.dataset).find(k=>k.startsWith('session'));const id=btn.dataset[action],session=sessionById(id);if(!session)return;
   if(action==='sessionResume'){try{if(session.status==='completed'){session.status='in-progress';session.currentCardIndex=0;session.currentChapterIndex=0;session.completedAt=null}activateSession(session);renderLanguage();showView('study')}catch(err){toast(err.message)}return}
   if(action==='sessionCopy'){const deck=installedDecks.find(d=>d.deckId===session.deckId);if(!deck)return toast('Deck non installato');try{createNewSession({deckId:deck.deckId,filters:session.filters,count:session.requestedCount||session.orderedCardIds.length,shuffle:session.shuffleEnabled,shuffleExamples:session.exampleShuffleEnabled,language:session.language,direction:session.direction,sequenceId:session.sequenceId,name:(session.name||'Sessione')+' (copia)',exampleCount:session.exampleCount||state.exampleCount});renderLanguage();showView('study')}catch(err){toast(err.message)}return}
   if(action==='sessionArchive'){if(session.id===state.sessionId)stopLesson();session.status=session.status==='archived'?'in-progress':'archived';save();renderSessions();return}
   if(action==='sessionDelete'){if(!confirm('Eliminare la sessione? I progressi delle carte rimarranno salvati.'))return;if(session.id===state.sessionId){stopLesson();state.sessionId=null;}studyDoc.sessions=studyDoc.sessions.filter(s=>s.id!==id);save();renderSessions();}
 });
 $('study-favorite').addEventListener('click',()=>changeFlag(current(),'favorite'));
 $('study-known').addEventListener('click',()=>changeFlag(current(),'known'));
 $('detail-favorite').addEventListener('click',()=>changeFlag(wordById(state.chosenWordId),'favorite'));
 $('detail-known').addEventListener('click',()=>changeFlag(wordById(state.chosenWordId),'known'));
 // Global navigation and basic study controls.
 $('btn-menu').addEventListener('click',()=>state.drawerOpen?closeDrawer():openDrawer());
 $('btn-close-drawer').addEventListener('click',closeDrawer);$('drawer-shade').addEventListener('click',closeDrawer);
 $('btn-drawer-done').addEventListener('click',()=>{closeDrawer();showView('study')});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.drawerOpen)closeDrawer()});
 document.querySelectorAll('[data-drawer]').forEach(b=>b.addEventListener('click',()=>switchDrawerTab(b.dataset.drawer)));
 document.querySelectorAll('[data-menu-view]').forEach(b=>b.addEventListener('click',()=>{showView(b.dataset.menuView);closeDrawer()}));
 document.querySelectorAll('[data-goto-study]').forEach(b=>b.addEventListener('click',()=>showView('study')));
 for(const lang of ['it','en'])$('language-'+lang).addEventListener('click',()=>{
    if(state.lang===lang)return;if(state.playing||state.paused)stopLesson();interruptPreview();state.chapterIndex=0;state.activePlan=null;state.lang=lang;const session=currentSession();if(session)session.language=lang;resetReveal();state.visibleExampleIndex=null;state.phase=lang==='it'?'Pronto per iniziare':'Ready to start';save();renderLanguage();toast(lang==='it'?'Lingua madre: italiano':'Native language: English')
 });
 $('btn-play').addEventListener('click',startLesson);$('btn-repeat').addEventListener('click',()=>navigateChapter(-1));$('btn-next').addEventListener('click',()=>navigateChapter(1));
 $('btn-reveal').addEventListener('click',()=>{if(allRevealed())resetReveal();else revealAll();renderStudy()});
 $('example-prev').addEventListener('click',()=>moveExample(-1));$('example-next').addEventListener('click',()=>moveExample(1));
 $('btn-show-detail').addEventListener('click',()=>{state.chosenWordId=current().id;showView('library');renderDetail();if(innerWidth<721)$('detail-panel').scrollIntoView({behavior:'smooth',block:'start'})});
 // Session settings; the sequence for each translation direction is saved separately.
 $('study-category').addEventListener('change',e=>{state.category=e.target.value;$('create-category').value=state.category;save();updateEligible()});
 $('session-size').addEventListener('change',e=>{state.size=num(e.target.value,5,15000,20);$('create-size').value=state.size;save();updateEligible()});
 $('study-direction').addEventListener('change',e=>{if(state.playing||state.paused)stopLesson();state.chapterIndex=0;state.activePlan=null;state.direction=e.target.value;const session=currentSession();if(session){session.direction=state.direction;session.sequenceId=sequenceRepo.active(state.direction).sequenceId;}resetReveal();state.visibleExampleIndex=null;state.phase=t('Direzione cambiata','Direction changed');save();renderStudy();renderSequenceEditor()});
 $('example-count').addEventListener('change',e=>{if(state.playing||state.paused)stopLesson();state.exampleCount=num(e.target.value,0,10,1);save();renderStudy();previewPlan()});
 $('form-count').addEventListener('change',e=>{if(state.playing||state.paused)stopLesson();state.formCount=e.target.value;save();previewPlan()});
 $('global-gap').addEventListener('change',e=>{if(state.playing||state.paused)stopLesson();state.globalGap=num(e.target.value,0,12,.4);e.target.value=state.globalGap;save();previewPlan()});
 $('announce-forms').addEventListener('change',e=>{if(state.playing||state.paused)stopLesson();state.announceForms=e.target.checked;save();previewPlan()});
 $('wake-enabled').addEventListener('change',e=>{state.wake=e.target.checked;save();if(!state.wake)releaseWake();else if(state.playing)requestWake()});
 $('wheel-enabled').addEventListener('change',e=>{state.wheel=e.target.checked;save();if(!state.wheel)bridgeOff();else if(state.playing)bridgeOn()});
 $('reset-session').addEventListener('click',resetSession);
 // Both editor and playback are driven by the persisted active sequence ID.
 $('sequence-select').addEventListener('change',e=>{stopLesson();if(sequenceRepo.select(state.direction,e.target.value)){const session=currentSession();if(session)session.sequenceId=e.target.value;state.chapterIndex=0;save();renderSequenceEditor();renderStudy()}});
 $('sequence-description').addEventListener('change',e=>{selectedSequence().description=e.target.value.trim().slice(0,200);editorChange()});
 $('seq-new').addEventListener('click',()=>{if(sequenceRepo.list(state.direction).length>=50)return toast('Limite: 50 sequenze per direzione');const seq=sequenceRepo.create(state.direction);seq.name=t('Nuova sequenza','New sequence');editorChange();renderSequenceEditor()});
 $('seq-duplicate').addEventListener('click',()=>{if(sequenceRepo.list(state.direction).length>=50)return toast('Limite: 50 sequenze per direzione');sequenceRepo.duplicate(state.direction,selectedSequence().sequenceId);editorChange();renderSequenceEditor()});
 $('seq-rename').addEventListener('click',()=>{const seq=selectedSequence();const name=prompt(t('Nome della sequenza','Sequence name'),seq.name);if(name===null)return;seq.name=name.trim().slice(0,60)||seq.name;editorChange();renderSequenceEditor()});
 $('seq-delete').addEventListener('click',()=>{const seq=selectedSequence();if(sequenceRepo.list(state.direction).length<=1){toast(t('Conserva almeno una sequenza per direzione','Keep at least one sequence per direction'));return}if(!confirm(t(`Eliminare «${seq.name}»?`,`Delete «${seq.name}»?`)))return;sequenceRepo.remove(state.direction,seq.sequenceId);editorChange();renderSequenceEditor()});
 const editor=$('sequence-editor');
 function locate(gid,iid){const groups=selectedSequence().groups;const g=groups.find(x=>x.id===gid);return {groups,g,el:g?.items.find(x=>x.id===iid)}}
 editor.addEventListener('click',e=>{
   const gb=e.target.closest('[data-g-action]'),ib=e.target.closest('[data-i-action]');
   if(gb){const {groups,g}=locate(gb.dataset.gId),index=groups.indexOf(g);if(!g)return;
     switch(gb.dataset.gAction){
       case 'up':if(index>0)[groups[index-1],groups[index]]=[groups[index],groups[index-1]];break;
       case 'down':if(index<groups.length-1)[groups[index],groups[index+1]]=[groups[index+1],groups[index]];break;
       case 'remove':if(groups.length>1)groups.splice(index,1);break;
       case 'add-item':{const select=editor.querySelector(`[data-add-select="${g.id}"]`);if(g.items.length<25)g.items.push(item(select?.value||'word'));else toast('Limite: 25 elementi per gruppo');break}
     }
     editorChange();renderSequenceEditor();return;
   }
   if(ib){const {g,el}=locate(ib.dataset.gId,ib.dataset.iId);if(!el)return;
     if(ib.dataset.iAction==='preview'){previewSingle(g,el);return}
     const at=g.items.indexOf(el);
     switch(ib.dataset.iAction){
       case 'up':if(at>0)[g.items[at-1],g.items[at]]=[g.items[at],g.items[at-1]];break;
       case 'down':if(at<g.items.length-1)[g.items[at],g.items[at+1]]=[g.items[at+1],g.items[at]];break;
       case 'remove':g.items.splice(at,1);break;
     }
     editorChange();renderSequenceEditor();
   }
 });
 editor.addEventListener('input',e=>{if(e.target.matches('[data-a-value]'))e.target.nextElementSibling.textContent=fmtAudio(e.target.dataset.aValue.split(':').pop(),e.target.value)});
 editor.addEventListener('change',e=>{
   const a=e.target;
   const audioKey=a.dataset.aEnabled||a.dataset.aValue;
   if(audioKey){const bits=audioKey.split(':'),scope=bits[0],param=bits.pop();const gid=bits[1],iid=scope==='item'?bits[2]:null;const {g,el}=locate(gid,iid);const target=scope==='item'?el:g;if(!target)return;
     target.audioOverrides=target.audioOverrides||{};
     if(a.hasAttribute('data-a-enabled')){
       if(a.checked){const slider=editor.querySelector(`[data-a-value="${audioKey}"]`);target.audioOverrides[param]=Core.overrides({[param]:slider?.value})[param]}
       else delete target.audioOverrides[param];
     }else target.audioOverrides[param]=Core.overrides({[param]:a.value})[param];
     editorChange();renderSequenceEditor();return;
   }
   const groupKey=['enabled','name','repeat','between','after'].find(k=>a.hasAttribute('data-g-'+k));
   if(groupKey){const {g}=locate(a.getAttribute('data-g-'+groupKey));if(!g)return;
     switch(groupKey){case 'enabled':g.enabled=a.checked;break;case 'name':g.name=a.value.trim().slice(0,60)||'Gruppo';break;case 'repeat':g.repeat=num(a.value,1,10,1);break;case 'between':g.pauseBetweenGroupRepeatsMs=Math.round(num(a.value,0,60,0)*1000);break;case 'after':g.pauseAfterGroupMs=Math.round(num(a.value,0,60,0)*1000);break}
     editorChange();renderSequenceEditor();return;
   }
   const field=['enabled','type','repeat','between','after','move'].find(k=>a.hasAttribute('data-i-'+k));
   if(!field)return;const [gid,iid]=a.getAttribute('data-i-'+field).split(':');const {g,el,groups}=locate(gid,iid);if(!el)return;
   switch(field){
     case 'enabled':el.enabled=a.checked;break;
     case 'type':if(TYPE_KEYS.includes(a.value))el.type=a.value;break;
     case 'repeat':el.repeat=num(a.value,1,10,1);break;
     case 'between':el.pauseBetweenRepeatsMs=a.value.trim()===''?null:Math.round(num(a.value,0,60,0)*1000);break;
     case 'after':el.pauseAfterElementMs=Math.round(num(a.value,0,60,0)*1000);break;
     case 'move':{const to=groups.find(x=>x.id===a.value);if(to){g.items.splice(g.items.indexOf(el),1);to.items.push(el)}break}
   }
   editorChange();renderSequenceEditor();
 });
 $('add-group').addEventListener('click',()=>{const groups=selectedSequence().groups;if(groups.length>=16)return toast('Limite: 16 gruppi');groups.push(group(t(`Gruppo ${groups.length+1}`,`Group ${groups.length+1}`),[item('word')],1,0));editorChange();renderSequenceEditor();toast(t('Capitolo aggiunto','Chapter added'))});
 $('preset-standard').addEventListener('click',()=>{if(!confirm(t('Ripristinare la sequenza attiva?','Reset active sequence?')))return;sequenceRepo.reset(state.direction,false);editorChange();renderSequenceEditor()});
 $('preset-repeat').addEventListener('click',()=>{if(!confirm(t('Sostituire la sequenza attiva con il preset intensivo?','Replace active sequence with repeat preset?')))return;sequenceRepo.reset(state.direction,true);editorChange();renderSequenceEditor()});
 // Master settings are independent for JA / IT / EN and are stored with study preferences.
 const masterEditor=$('audio-masters');
 masterEditor.addEventListener('input',e=>{if(e.target.hasAttribute('data-master'))e.target.nextElementSibling.textContent=fmtAudio(e.target.dataset.master.split(':')[1],e.target.value)});
 masterEditor.addEventListener('change',e=>{if(!e.target.hasAttribute('data-master'))return;const [lang,key]=e.target.dataset.master.split(':');const next=Core.audioMasters({[lang]:{...state.audioMasters[lang],[key]:Number(e.target.value)}});state.audioMasters[lang]=next[lang];editorChange();renderMasterControls();renderSequenceEditor()});
 masterEditor.addEventListener('click',e=>{
   const lang=e.target.dataset.masterPreview,reset=e.target.dataset.masterReset;
   if(lang){const sample=lang==='ja-JP'?'次の言葉を練習しましょう。':lang==='it-IT'?'Questa è una prova della voce italiana.':'This is an English voice test.';manualSpeech(sample,lang)}
   if(reset){state.audioMasters[reset]={rate:1,pitch:1,volume:1};editorChange();renderMasterControls();renderSequenceEditor()}
 });
 // Library, individual voices and diagnostics.
 $('detail-register').addEventListener('change',e=>{detailRegister=e.target.value;detailScenario='all';renderDetail()});
 $('detail-scenario').addEventListener('change',e=>{detailScenario=e.target.value;renderDetail()});
 $('story-list').addEventListener('click',e=>{const b=e.target.closest('[data-story-open]');if(!b)return;stopStory();selectedStoryId=b.dataset.storyOpen;renderStories()});
 $('story-detail').addEventListener('click',e=>{if(e.target.closest('#story-play'))playStory();if(e.target.closest('#story-stop'))stopStory()});
 $('word-search').addEventListener('input',e=>{state.search=e.target.value;renderLibrary()});
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{state.libraryFilter=b.dataset.filter;renderLibrary()}));
 $('word-list').addEventListener('click',e=>{const target=e.target.closest('[data-word-id]');if(!target)return;state.chosenWordId=target.dataset.wordId;renderLibrary();renderDetail();if(innerWidth<721)$('detail-panel').scrollIntoView({behavior:'smooth',block:'start'})});
 $('btn-word-voice').addEventListener('click',()=>{const w=wordById(state.chosenWordId);if(w)manualSpeech(w.jp,'ja-JP')});
 $('detail-forms').addEventListener('click',e=>{const btn=e.target.closest('[data-form-index]');if(!btn)return;const w=wordById(state.chosenWordId),f=w.forms[Number(btn.dataset.formIndex)];manualSpeech(f.jp,'ja-JP')});
 $('ex-list').addEventListener('click',e=>{const ja=e.target.closest('[data-voice-ex-jp]'),native=e.target.closest('[data-voice-ex-native]');const w=wordById(state.chosenWordId);const ex=w.examples.find(x=>x.id===(ja?.dataset.voiceExJp||native?.dataset.voiceExNative));if(!ex)return;if(ja)manualSpeech(ex.jp,'ja-JP');else if(native)manualSpeech(ex[state.lang],locale())});
 $('btn-play-10').addEventListener('click',()=>{if($('btn-play-10').textContent.startsWith('■')){interruptPreview();$('btn-play-10').textContent=t('▶ Ascolta fino a 10','▶ Play up to 10')}else playTen()});
 $('btn-media').addEventListener('click',async()=>{const player=$('media-bed');if(!player.paused){player.pause();makeLog('AUDIO','traccia di prova fermata')}else try{await player.play();makeLog('AUDIO','traccia diagnostica avviata')}catch(e){makeLog('ERRORE',e.message)}});
 $('media-bed').addEventListener('play',()=>$('btn-media').textContent=t('■ Ferma audio','■ Stop test audio'));
 $('media-bed').addEventListener('pause',()=>$('btn-media').textContent=t('▶ Audio test','▶ Test audio'));
 $('btn-ja').addEventListener('click',()=>manualSpeech('この道をまっすぐ進んでください。','ja-JP'));
 $('btn-it').addEventListener('click',()=>manualSpeech('La lingua selezionata è italiana.','it-IT'));
 $('btn-en').addEventListener('click',()=>manualSpeech('The next Japanese word is about to begin.','en-US'));
 $('sim-prev').addEventListener('click',()=>{makeLog('SIMULATO','previoustrack');navigateChapter(-1)});
 $('sim-next').addEventListener('click',()=>{makeLog('SIMULATO','nexttrack');navigateChapter(1)});
 $('sim-play').addEventListener('click',()=>{makeLog('SIMULATO',state.playing?'pause':'play');state.playing?pauseLesson():startLesson()});
 $('clear-log').addEventListener('click',()=>{state.events=[];$('event-log').textContent=t('Registro svuotato','Log cleared')});
 document.addEventListener('visibilitychange',()=>{makeLog('PAGINA',document.hidden?'nascosta':'visibile');if(!document.hidden&&state.playing)requestWake()});
 if('speechSynthesis'in window){speechSynthesis.onvoiceschanged=loadVoices;loadVoices();setTimeout(loadVoices,850);setTimeout(loadVoices,2500)}
  boot().catch(e=>{console.error(e);$('boot-error').textContent=e.message||String(e);$('boot-error').hidden=false;});
 if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
 window.addEventListener('pagehide',()=>{cancelLesson();releaseWake();bridgeOff()});
 // Read-only QA surface, useful for validating nested repetition without TTS voices.
 window.KotobaDriveQA=Object.freeze({getPlan:()=>compileSequence(current()),getContextSelection:()=>examplesForCard(current()).map(x=>x.id),getStories:()=>activeDeck?.stories?.length||0,getSettings:()=>({lang:state.lang,direction:state.direction,exampleCount:state.exampleCount,groups:selectedSequence().groups,audioMasters:state.audioMasters}),getCurrent:()=>current().jp,getSequences:()=>sequenceRepo.serialize(),getDecks:()=>installedDecks.map(d=>({id:d.deckId,cards:d.cards.length})),getStudy:()=>snapshotStudy(),getSession:()=>structuredClone(currentSession()||null),getMetrics:()=>Sessions.dashboard(BANK,state.progress,studyDoc.sessions),getPlayback:()=>({index:state.index,chapter:state.chapterIndex,playing:state.playing,paused:state.paused,position:playbackController.index}),core:Core});
})();
