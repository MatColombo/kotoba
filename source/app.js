(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const textSafe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const POS={verb:{it:'VERBO · 動詞',en:'VERB · 動詞'},noun:{it:'SOSTANTIVO · 名詞',en:'NOUN · 名詞'},na:{it:'AGGETTIVO な',en:'な ADJECTIVE'},i:{it:'AGGETTIVO い',en:'い ADJECTIVE'}};
 const TYPES={word:{it:'Parola giapponese',en:'Japanese word'},meaning:{it:'Significato',en:'Meaning'},forms:{it:'Coniugazioni (con etichetta)',en:'Grammar forms (with label)'},exampleJP:{it:'Esempio giapponese',en:'Japanese example'},exampleNative:{it:'Traduzione esempio',en:'Example translation'}};
 const TYPE_KEYS=Object.keys(TYPES);
 const keyStorage='kotoba-drive-v2';
 const uid=()=>`k${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
 const num=(n,min,max,fallback=min)=>{const v=Number(n);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback};
 const item=(type,repeat=1)=>({id:uid(),type,repeat,after:0,enabled:true});
 const group=(name,items,repeat=1,after=0)=>({id:uid(),name,repeat,after,items});
 const makeDefault=direction=>{
   const first=direction==='jp-native'?'word':'meaning',second=direction==='jp-native'?'meaning':'word';
   return {groups:[group('01 · Domanda',[item(first)],1,4),group('02 · Risposta',[item(second)],1,.75),group('03 · Forme',[item('forms')],1,.6),group('04 · Esempi',[item('exampleJP'),item('exampleNative')],1,.65)]};
 };
 const makeRepeat=()=>({groups:[group('Ripasso · ×3',[item('word',2),item('meaning')],3,1),group('Forme',[item('forms')],1,.5),group('Esempi',[item('exampleJP'),item('exampleNative')],1,.5)]});
 const defaults={lang:'it',direction:'jp-native',category:'all',size:20,exampleCount:1,formCount:'all',globalGap:.4,announceForms:true,wheel:true,wake:true,sequences:{'jp-native':makeDefault('jp-native'),'native-jp':makeDefault('native-jp')},progress:{},exampleCycle:{}};
 let stored={};try{stored=JSON.parse(localStorage.getItem(keyStorage)||'{}')||{}}catch(e){}
 // Carry over language, studied words and direction from the previous demo, if present.
 if(!Object.keys(stored).length){try{const old=JSON.parse(localStorage.getItem('kotoba-drive-demo-v1')||'{}');if(old&&typeof old==='object'){for(const key of ['lang','direction','category','size','wheel','progress','exampleCycle'])if(old[key]!==undefined)stored[key]=old[key]}}catch(e){}}
 const state={...defaults,...stored,playing:false,paused:false,completed:false,view:'study',drawerOpen:false,drawerTab:'settings',deck:[],index:0,answerShown:false,visibleExampleIndex:null,runId:0,previewId:0,voices:[],phase:'',libraryFilter:'all',search:'',chosenWordId:1,hardwareCount:0,events:[]};
 if(state.lang!=='en')state.lang='it';if(!['jp-native','native-jp'].includes(state.direction))state.direction='jp-native';
 if(!['all','verb','noun','na','i'].includes(state.category))state.category='all';
 state.size=num(state.size,5,25,20);state.exampleCount=num(state.exampleCount,0,10,1);
 state.formCount=(state.formCount==='all'||['1','2','3','4','5','6'].includes(String(state.formCount)))?String(state.formCount):'all';
 state.globalGap=num(state.globalGap,0,12,.4);state.announceForms=state.announceForms!==false;state.wheel=state.wheel!==false;state.wake=state.wake!==false;
 if(!state.sequences||typeof state.sequences!=='object')state.sequences={};
 for(const dir of ['jp-native','native-jp'])if(!Array.isArray(state.sequences[dir]?.groups))state.sequences[dir]=makeDefault(dir);
 if(!state.progress||typeof state.progress!=='object')state.progress={};if(!state.exampleCycle||typeof state.exampleCycle!=='object')state.exampleCycle={};
 const t=(it,en)=>state.lang==='it'?it:en;
 const locale=()=>state.lang==='it'?'it-IT':'en-US';
 const wordById=id=>BANK.find(w=>w.id===id);
 const current=()=>state.deck[Math.min(state.index,Math.max(0,state.deck.length-1))]||BANK[0];
 const selectedSequence=()=>state.sequences[state.direction];
 const selectedExample=(w)=>{const base=state.visibleExampleIndex??num(state.exampleCycle[w.id]||0,0,10000,0)%10;return {example:w.examples[base%w.examples.length],index:base%w.examples.length}};
 const save=()=>{try{const fields=['lang','direction','category','size','exampleCount','formCount','globalGap','announceForms','wheel','wake','sequences','progress','exampleCycle'];const o={};for(const field of fields)o[field]=state[field];localStorage.setItem(keyStorage,JSON.stringify(o))}catch(e){}};
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 let toastTimer,activeSpeechFinish=null,wakeLockHandle=null;
 function toast(msg){const n=$('toast');n.textContent=msg;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),2600)}
 function progressFor(w){if(!state.progress[w.id])state.progress[w.id]={seen:0,known:0,hard:0};return state.progress[w.id]}
 function updateStats(){const entries=Object.values(state.progress);const seen=entries.reduce((s,p)=>s+(Number(p.seen)||0),0),hard=entries.reduce((s,p)=>s+(Number(p.hard)||0),0);$('study-stats').textContent=t(`Ripassi completati: ${seen} · Segnate difficili: ${hard}`,`Completed reviews: ${seen} · Marked difficult: ${hard}`)}
 function newDeck(){
   let words=BANK.filter(w=>state.category==='all'||w.pos===state.category);
   if(state.category==='all'&&state.size===20){const caps={verb:8,noun:4,na:4,i:4};words=Object.entries(caps).flatMap(([pos,count])=>shuffle(BANK.filter(w=>w.pos===pos)).slice(0,count))}
   else words=shuffle(words.slice()).slice(0,Math.min(words.length,state.size));
   state.deck=shuffle(words);state.index=0;state.completed=false;state.paused=false;state.answerShown=false;state.visibleExampleIndex=null;state.phase=t('Pronto per iniziare','Ready to start');renderStudy()
 }
 function formName(label,w){
   const by={
    'て形':['Forma te','Te form'],'ます形':['Forma masu','Masu form'],'ない形':['Forma nai, negativa','Nai negative form'],'た形':['Forma ta, passata','Ta past form'],
    '可能形':['Forma potenziale','Potential form'],'丁寧形':['Forma cortese','Polite form'],'過去形':['Forma passata','Past form'],'否定形':['Forma negativa','Negative form'],
    '連体形':w.pos==='na'?['Forma na, attributiva','Na attributive form']:['Forma attributiva','Attributive form'],
    '補語形':['Forma ni','Ni form'],'副詞形':['Forma avverbiale','Adverbial form'],'否定過去':['Forma negativa passata','Past negative form'],
    '条件形':['Forma condizionale','Conditional form']
   };
   return (by[label]||[label,label])[state.lang==='it'?0:1];
 }
 function filteredForms(w){return state.formCount==='all'?w.forms:w.forms.slice(0,Number(state.formCount))}
 // Script compiler: output a concrete sequence of speech and pauses. Consecutive
 // example tokens play together for example 1, then example 2, etc.
 function compileSequence(w,sequence=selectedSequence(),opts={}){
   const plan=[];let voices=0;
   const gap=num(opts.globalGap??state.globalGap,0,12,0);
   const maxExamples=num(opts.exampleCount??state.exampleCount,0,10,0);
   const initial=Number(state.exampleCycle[w.id]||0)%10;
   function pause(seconds,description){const amount=num(seconds,0,60,0);if(amount>0)plan.push({kind:'pause',seconds:amount,description})}
   function say(text,lang,type,label,exIndex=null){if(!text)return;if(voices>0)pause(gap,'gap');plan.push({kind:'say',type,text,lang,label,exIndex});voices++}
   function emit(token,index){
      switch(token.type){
       case 'word':say(w.jp,'ja-JP','word',w.jp);break;
       case 'meaning':say(w.meaning[state.lang],locale(),'meaning',w.meaning[state.lang]);break;
       case 'forms':for(const f of filteredForms(w)){
          if(state.announceForms)say(formName(f.label,w),locale(),'formLabel',formName(f.label,w));
          say(f.jp,'ja-JP','form',f.jp)
        }break;
       case 'exampleJP':{if(index===null)return;const e=w.examples[index];say(e.jp,'ja-JP','exampleJP',`例${index+1}: ${e.jp}`,index);break}
       case 'exampleNative':{if(index===null)return;const e=w.examples[index];say(e[state.lang],locale(),'exampleNative',`E${index+1}: ${e[state.lang]}`,index);break}
      }
   }
   function runToken(token,exampleIndex=null){const was=voices;for(let r=0;r<num(token.repeat,1,10,1);r++)emit(token,exampleIndex);if(voices>was)pause(token.after,'item')}
   const allGroups=(sequence&&Array.isArray(sequence.groups)?sequence.groups:[]).slice(0,25);
   for(const g of allGroups){
     for(let rep=0;rep<num(g.repeat,1,10,1);rep++){
       const begin=voices,items=(Array.isArray(g.items)?g.items:[]).filter(i=>i.enabled!==false&&TYPE_KEYS.includes(i.type)).slice(0,30);
       for(let j=0;j<items.length;){
         const v=items[j];
         if(v.type==='exampleJP'||v.type==='exampleNative'){
           const segment=[];while(j<items.length&&(items[j].type==='exampleJP'||items[j].type==='exampleNative'))segment.push(items[j++]);
           for(let i=0;i<maxExamples;i++){const ex=(initial+i)%10;for(const token of segment)runToken(token,ex)}
         }else{runToken(v);j++}
       }
       if(voices>begin)pause(g.after,'group');
     }
   }
   return {plan,sayCount:voices};
 }
 function previewPlan(){
   const {plan,sayCount}=compileSequence(current());$('preview-total').textContent=t(`${sayCount} letture`,`${sayCount} utterances`);
   const visible=plan.slice(0,48);
   $('sequence-preview').innerHTML=visible.map(s=>s.kind==='pause'?`<span class="preview-chip wait">${s.seconds.toLocaleString('it-IT')}s</span>`:`<span class="preview-chip" title="${textSafe(s.label)}">${textSafe(s.type==='formLabel'?`▣ ${s.label}`:s.type==='exampleJP'||s.type==='exampleNative'?s.label:s.text)}</span>`).join('')+(plan.length>48?`<span class="preview-more">… +${plan.length-48}</span>`:'')||'<span class="small-copy">Nessun elemento attivo.</span>';
 }
 // Readable current card, including the two-way prompt/answer presentation.
 function renderStudy(){
   const w=current(),total=state.deck.length,{example, index:exIndex}=selectedExample(w);const nativeFirst=state.direction==='native-jp';
   $('study-counter').textContent=t(`PAROLA ${Math.min(state.index+1,total)} / ${total}`,`WORD ${Math.min(state.index+1,total)} / ${total}`);
   $('progress-bar').style.width=(total?((state.index+1)/total*100):0)+'%';
   $('pos-pill').textContent=POS[w.pos][state.lang];
   $('front-label').textContent=nativeFirst?t(`DOMANDA · ${state.lang==='it'?'ITALIANO':'INGLESE'}`,`QUESTION · ENGLISH`):t('DOMANDA · GIAPPONESE','QUESTION · JAPANESE');
   $('answer-label').textContent=nativeFirst?t('SOLUZIONE · GIAPPONESE','ANSWER · JAPANESE'):t(`SOLUZIONE · ${state.lang==='it'?'ITALIANO':'INGLESE'}`,'ANSWER · ENGLISH');
   $('study-front').textContent=nativeFirst?w.meaning[state.lang]:w.jp;
   $('study-front').classList.toggle('native',nativeFirst);
   $('study-front').lang=nativeFirst?state.lang:'ja';
   $('study-front-reading').textContent=nativeFirst?'':w.kana;
   $('study-answer').textContent=state.answerShown?(nativeFirst?w.jp:w.meaning[state.lang]):'••••';
   $('study-answer').lang=nativeFirst?'ja':state.lang;
   $('study-answer').classList.toggle('jp',nativeFirst);
   $('study-answer').classList.toggle('masked',!state.answerShown);
   $('study-answer-reading').textContent=state.answerShown&&nativeFirst?w.kana:'';
   $('forms-heading').textContent=t('FORME GRAMMATICALI','GRAMMAR FORMS');
   $('forms-count').textContent=t(`${w.forms.length} forme`,`${w.forms.length} forms`);
   $('study-forms').innerHTML=state.answerShown?w.forms.slice(0,3).map(f=>`<span class="form-pill"><span>${textSafe(f.label)}</span>${textSafe(f.jp)}</span>`).join('')+(w.forms.length>3?`<span class="extra-counter">+${w.forms.length-3}</span>`:''):`<span class="muted-placeholder">${t('Visibili dopo la risposta','Shown after the answer')}</span>`;
   $('example-heading').textContent=t(`ESEMPIO ${exIndex+1} / 10`,`EXAMPLE ${exIndex+1} / 10`);
   $('study-example-jp').textContent=state.answerShown?example.jp:t('Frase nascosta fino alla soluzione','Sentence hidden until the answer');
   $('study-example-kana').textContent=state.answerShown?example.kana:'';
   $('study-example-native').textContent=state.answerShown?example[state.lang]:'';
   $('btn-play').innerHTML=state.playing?`<span class="control-symbol">Ⅱ</span><span>${t('Pausa','Pause')}</span>`:`<span class="control-symbol">▶</span><span>${state.completed?t('Nuova','New'):state.paused?t('Riprendi','Resume'):t('Avvia audio','Start audio')}</span>`;
   $('repeat-label').textContent=t('Ripeti','Repeat');$('next-label').textContent=t('Lo so','Known');
   $('btn-reveal').textContent=state.answerShown?t('Nascondi soluzione','Hide answer'):t('Mostra soluzione','Reveal answer');
   $('btn-show-detail').textContent=t('10 esempi ↗','10 examples ↗');
   $('playback-status').textContent=state.phase;$('status-dot').classList.toggle('live',state.playing);updateMediaMetadata();updateStats();
 }
 function renderLanguage(){
   for(const lang of ['it','en']){$('language-'+lang).classList.toggle('active',state.lang===lang);$('language-'+lang).setAttribute('aria-pressed',String(state.lang===lang))}
   document.documentElement.lang=state.lang;renderStudy();renderLibrary();renderDetail();renderSequenceEditor();
 }
 function showView(tab){if(state.view==='library'&&tab!=='library')interruptPreview();state.view=tab;for(const type of ['study','library','diagnostics'])$('view-'+type).classList.toggle('hidden',tab!==type);$('header-section').textContent=tab==='study'?'STUDIO':tab==='library'?'LESSICO':'TEST';if(tab==='library'){renderLibrary();renderDetail()}if(tab==='diagnostics')renderCapabilities();$('main-content').scrollTop=0}
 function openDrawer(tab='settings'){$('app-drawer').inert=false;$('app-drawer').classList.add('open');$('app-drawer').setAttribute('aria-hidden','false');$('drawer-shade').hidden=false;$('btn-menu').setAttribute('aria-expanded','true');state.drawerOpen=true;switchDrawerTab(tab);$('btn-close-drawer').focus()}
 function closeDrawer(){state.drawerOpen=false;$('app-drawer').classList.remove('open');$('app-drawer').setAttribute('aria-hidden','true');$('app-drawer').inert=true;$('drawer-shade').hidden=true;$('btn-menu').setAttribute('aria-expanded','false');$('btn-menu').focus()}
 function switchDrawerTab(tab){state.drawerTab=tab;for(const v of ['settings','sequence'])$('drawer-'+v).classList.toggle('hidden',v!==tab);document.querySelectorAll('[data-drawer]').forEach(b=>b.classList.toggle('active',b.dataset.drawer===tab));if(tab==='sequence')renderSequenceEditor();$('app-drawer').querySelector('.drawer-content').scrollTop=0}
 function renderLibrary(){const search=state.search.toLowerCase().trim();const rows=BANK.filter(w=>(state.libraryFilter==='all'||w.pos===state.libraryFilter)&&[w.jp,w.kana,w.meaning.it,w.meaning.en].join(' ').toLowerCase().includes(search));
   $('word-list').innerHTML=rows.map(w=>`<button class="word-row ${state.chosenWordId===w.id?'active':''}" type="button" data-word-id="${w.id}"><span><strong lang="ja">${textSafe(w.jp)}</strong><small lang="ja">${textSafe(w.kana)}</small></span><span class="word-translation">${textSafe(w.meaning[state.lang])}</span></button>`).join('')||`<p class="small-copy">${t('Nessun risultato','No results')}</p>`;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',state.libraryFilter===b.dataset.filter));
 }
 function renderDetail(){const w=wordById(state.chosenWordId)||BANK[0];$('detail-pos').textContent=POS[w.pos][state.lang];$('detail-word').textContent=w.jp;$('detail-reading').textContent=w.kana;$('detail-meaning').textContent=w.meaning[state.lang];
  $('detail-forms').innerHTML=w.forms.map((f,i)=>`<button class="form-chip" data-form-index="${i}" type="button"><small>${textSafe(f.label)} · ${textSafe(formName(f.label,w))}</small><span lang="ja">${textSafe(f.jp)} ♪</span></button>`).join('');
  $('ex-list').innerHTML=w.examples.map((ex,i)=>`<div class="ex-row"><div class="ex-line"><span class="ex-id">${String(i+1).padStart(2,'0')}</span><div class="ex-body"><div class="ex-ja" lang="ja">${textSafe(ex.jp)}</div><div class="ex-kana" lang="ja">${textSafe(ex.kana)}</div><div class="ex-native">${textSafe(ex[state.lang])}</div></div><div class="ex-buttons"><button data-voice-ex-jp="${i}" type="button" aria-label="Ascolta esempio giapponese">日</button><button data-voice-ex-native="${i}" type="button" aria-label="Ascolta traduzione">${state.lang.toUpperCase()}</button></div></div></div>`).join('');
 }
 function renderSequenceEditor(){
   $('sequence-direction-title').textContent=state.direction==='jp-native'?t('Giapponese → Italiano','Japanese → English'):t('Italiano → Giapponese','English → Japanese');
   const groups=selectedSequence().groups;
   $('sequence-editor').innerHTML=groups.map((g,gindex)=>{
     const id=textSafe(g.id);const groupOptions=groups.filter(other=>other.id!==g.id).map(other=>`<option value="${textSafe(other.id)}">${textSafe(other.name)}</option>`).join('');
     return `<section class="sequence-group" data-group-card="${id}"><div class="group-toolbar"><input class="group-title" aria-label="Nome gruppo" maxlength="50" data-g-name="${id}" value="${textSafe(g.name)}"><button class="micro-btn" data-g-action="up" data-g-id="${id}" title="Gruppo su" ${gindex===0?'disabled':''}>↑</button><button class="micro-btn" data-g-action="down" data-g-id="${id}" title="Gruppo giù" ${gindex===groups.length-1?'disabled':''}>↓</button><button class="micro-btn remove" data-g-action="remove" data-g-id="${id}" title="Elimina gruppo" ${groups.length<2?'disabled':''}>×</button></div>
       <div class="group-config"><div class="field-mini"><label>Ripetizioni gruppo</label><input class="small-input" data-g-repeat="${id}" type="number" min="1" max="10" value="${num(g.repeat,1,10,1)}"></div><div class="field-mini"><label>Pausa extra a fine gruppo (s)</label><input class="small-input" data-g-after="${id}" type="number" min="0" max="30" step="0.25" value="${num(g.after,0,30,0)}"></div></div>
       ${(g.items||[]).map((el,idx)=>`<div class="sequence-item"><div class="item-top"><input class="mini-toggle" type="checkbox" data-i-enabled="${id}:${textSafe(el.id)}" aria-label="Attiva elemento" ${el.enabled!==false?'checked':''}><select class="small-input item-type" data-i-type="${id}:${textSafe(el.id)}" aria-label="Tipo elemento">${TYPE_KEYS.map(k=>`<option value="${k}" ${el.type===k?'selected':''}>${textSafe(TYPES[k][state.lang])}</option>`).join('')}</select><button class="micro-btn" data-i-action="preview" data-g-id="${id}" data-i-id="${textSafe(el.id)}" title="Ascolta solo questo elemento">♪</button></div>
        <div class="item-meta"><div class="field-mini"><label>Ripetizioni elemento</label><input class="small-input" data-i-repeat="${id}:${textSafe(el.id)}" type="number" min="1" max="10" value="${num(el.repeat,1,10,1)}"></div><div class="field-mini"><label>Pausa extra dopo (s)</label><input class="small-input" data-i-after="${id}:${textSafe(el.id)}" type="number" min="0" max="30" step="0.25" value="${num(el.after,0,30,0)}"></div></div>
        <div class="item-transfer"><button class="micro-btn" data-i-action="up" data-g-id="${id}" data-i-id="${textSafe(el.id)}" title="Sposta sopra" ${idx===0?'disabled':''}>↑</button><button class="micro-btn" data-i-action="down" data-g-id="${id}" data-i-id="${textSafe(el.id)}" title="Sposta sotto" ${idx===g.items.length-1?'disabled':''}>↓</button><button class="micro-btn remove" data-i-action="remove" data-g-id="${id}" data-i-id="${textSafe(el.id)}" title="Elimina elemento">×</button>${groups.length>1?`<span>Sposta in</span><select class="small-input" data-i-move="${id}:${textSafe(el.id)}"><option value="">Questo gruppo</option>${groupOptions}</select>`:''}</div></div>`).join('')}
       <div class="new-item-row"><select class="small-input" aria-label="Tipo nuovo elemento" data-add-select="${id}">${TYPE_KEYS.map(k=>`<option value="${k}">${textSafe(TYPES[k][state.lang])}</option>`).join('')}</select><button class="outline-btn" data-g-action="add-item" data-g-id="${id}" type="button">+ Elemento</button></div></section>`
   }).join('');previewPlan();
 }
 function editorChange(){if(state.playing)stopLesson(t('Configurazione audio aggiornata','Audio sequence updated'));save();previewPlan()}
 function cancelVoice(){const finish=activeSpeechFinish;if(finish)finish();if('speechSynthesis'in window)try{speechSynthesis.cancel()}catch(e){}}
 function interruptPreview(){state.previewId++;cancelVoice()}
 function cancelLesson(){state.runId++;cancelVoice()}
 function setPlaybackState(){if('mediaSession'in navigator)try{navigator.mediaSession.playbackState=state.playing?'playing':'paused'}catch(e){}}
 function updateMediaMetadata(){if(!('mediaSession'in navigator)||!('MediaMetadata'in window))return;const w=current();try{navigator.mediaSession.metadata=new MediaMetadata({title:w.jp+' · '+w.kana,artist:w.meaning[state.lang],album:'Kotoba Drive · JLPT N4'})}catch(e){}}
 function makeLog(source,msg){const stamp=new Date().toLocaleTimeString('it-IT',{hour12:false});state.events.unshift(`${stamp} [${source}] ${msg}`);if(state.events.length>60)state.events.pop();$('event-log').textContent=state.events.join('\n')}
 async function bridgeOn(){if(!state.wheel)return;const player=$('media-bed');try{if(player.paused){await player.play();makeLog('AUDIO','traccia bridge avviata')}updateMediaMetadata()}catch(e){makeLog('ERRORE',`bridge: ${e.name||e.message}`)}}
 function bridgeOff(){const player=$('media-bed');if(!player.paused)player.pause()}
 async function requestWake(){if(!state.wake||!('wakeLock'in navigator)||!document.visibilityState||document.visibilityState!=='visible'||wakeLockHandle)return;try{const newLock=await navigator.wakeLock.request('screen');if(!state.playing){newLock.release().catch(()=>{});return}wakeLockHandle=newLock;newLock.addEventListener('release',()=>{if(wakeLockHandle===newLock)wakeLockHandle=null},{once:true})}catch(e){makeLog('SCHERMO',`Wake Lock non disponibile: ${e.name||e.message}`)}}
 function releaseWake(){if(wakeLockHandle){const lock=wakeLockHandle;wakeLockHandle=null;lock.release().catch(()=>{})}}
 function stopLesson(msg){releaseWake();state.playing=false;state.paused=true;cancelLesson();bridgeOff();setPlaybackState();state.phase=msg||t('In pausa','Paused');renderStudy()}
 function resetSession(){stopLesson();newDeck();toast(t('Sessione rigenerata','Session rebuilt'))}
 function loadVoices(){if(!('speechSynthesis'in window))return;state.voices=speechSynthesis.getVoices()||[];renderCapabilities()}
 function selectVoice(lang){const prefix=lang.split('-')[0].toLowerCase();const matches=state.voices.filter(v=>v.lang.toLowerCase().startsWith(prefix));return matches.find(v=>v.localService)||matches[0]||null}
 function renderCapabilities(){const tts='speechSynthesis'in window,ms='mediaSession'in navigator;$('cap-tts').textContent=tts?'DISPONIBILE':'NON DISPONIBILE';$('cap-tts').className=tts?'available':'unavailable';$('cap-media').textContent=ms?'API PRESENTE':'NON DISPONIBILE';$('cap-media').className=ms?'available':'unavailable';for(const [id,lang] of [['ja','ja-JP'],['it','it-IT'],['en','en-US']]){const v=selectVoice(lang);$('cap-'+id).textContent=v?`${v.name} (${v.lang})`:tts?'Voce non elencata':'Non disponibile';$('cap-'+id).className=v?'available':'unavailable'}$('hardware-count').textContent=String(state.hardwareCount)}
 function speak(text,lang){return new Promise(resolve=>{
   if(!('speechSynthesis'in window)){makeLog('TTS','Sintesi vocale non disponibile');resolve();return}
   let finished=false,timer=null;
   function finish(){if(finished)return;finished=true;clearTimeout(timer);if(activeSpeechFinish===finish)activeSpeechFinish=null;resolve()}
   const utterance=new SpeechSynthesisUtterance(String(text));utterance.lang=lang;utterance.rate=lang==='ja-JP'?.83:.93;utterance.volume=1;utterance.pitch=1;
   const voice=selectVoice(lang);if(voice)utterance.voice=voice;
   const maxWait=Math.min(40000,Math.max(6500,3200+String(text).length*280));
   utterance.onend=finish;utterance.onerror=e=>{if(e.error&&!['interrupted','canceled'].includes(e.error))makeLog('TTS',`${lang}: ${e.error}`);finish()};
   activeSpeechFinish=finish;
   timer=setTimeout(()=>{makeLog('TTS',`timeout ${lang}: possibile voce non attiva`);finish()},maxWait);
   try{speechSynthesis.resume();speechSynthesis.speak(utterance)}catch(e){makeLog('TTS',e.message);finish()}
 })}
 function setPhase(msg){state.phase=msg;$('playback-status').textContent=msg}
 async function pump(){
   const token=++state.runId;const valid=()=>state.playing&&token===state.runId;
   while(valid()&&state.index<state.deck.length){
     const w=current(),{plan,sayCount}=compileSequence(w);
     if(sayCount===0){state.playing=false;state.paused=true;releaseWake();bridgeOff();setPlaybackState();toast(t('Attiva almeno un elemento nella sequenza','Enable at least one sequence element'));renderStudy();return}
     state.answerShown=false;state.visibleExampleIndex=null;renderStudy();
     for(const step of plan){
       if(!valid())return;
       if(step.kind==='pause'){setPhase(t(`Pausa ${step.seconds}s`,`Pause ${step.seconds}s`));await delay(step.seconds*1000);continue}
       const nativeFirst=state.direction==='native-jp';
       const reveal=nativeFirst?['word','form','exampleJP'].includes(step.type):['meaning','exampleNative'].includes(step.type);
       if(reveal&&!state.answerShown){state.answerShown=true;renderStudy()}
       if(step.exIndex!==null&&step.exIndex!==undefined){state.visibleExampleIndex=step.exIndex;if(state.answerShown)renderStudy()}
       setPhase(t(`In ascolto · ${step.label}`,`Listening · ${step.label}`));
       await speak(step.text,step.lang);
     }
     if(!valid())return;
     progressFor(w).seen++;state.exampleCycle[w.id]=((Number(state.exampleCycle[w.id])||0)+state.exampleCount)%10;save();
     state.index++;state.answerShown=false;state.visibleExampleIndex=null;
     if(state.index<state.deck.length){renderStudy();setPhase(t('Prossima parola…','Next word…'));await delay(400)}
   }
   if(valid()){state.playing=false;state.paused=false;state.completed=true;releaseWake();state.index=Math.max(0,state.deck.length-1);state.answerShown=true;bridgeOff();setPlaybackState();state.phase=t('Sessione completata','Session complete');renderStudy();toast(t('Sessione terminata','Session finished'))}
 }
 function startLesson(){
   if(state.playing){stopLesson();return}
   if(state.completed||state.index>=state.deck.length||!state.deck.length)newDeck();
   if(!compileSequence(current()).sayCount){toast(t('Aggiungi elementi attivi alla sequenza','Add enabled elements to the sequence'));openDrawer('sequence');return}
   cancelLesson();interruptPreview();state.playing=true;state.paused=false;state.phase=t('Avvio audio…','Starting audio…');renderStudy();setPlaybackState();
   // This HTML media player provides the best available chance of receiving steering-wheel events.
   if(state.wheel)bridgeOn();requestWake();pump();
 }
 function nextWord(mark=false){
   if(mark){progressFor(current()).known++;save()}
   const wasPlaying=state.playing;cancelLesson();state.answerShown=false;state.visibleExampleIndex=null;
   state.index++;
   if(state.index>=state.deck.length){state.index=Math.max(0,state.deck.length-1);state.completed=true;state.playing=false;state.paused=false;releaseWake();bridgeOff();setPlaybackState();state.phase=t('Sessione completata','Session complete');renderStudy();return}
   state.phase=t('Parola successiva','Next word');renderStudy();if(wasPlaying)pump()
 }
 function repeatDifficult(){progressFor(current()).hard++;save();const wasPlaying=state.playing;cancelLesson();state.answerShown=false;state.visibleExampleIndex=null;state.phase=t('Ripeto la parola difficile','Repeating difficult word');renderStudy();if(wasPlaying)pump();else toast(t('Segnata come difficile','Marked difficult'))}
 function moveExample(direction){const w=current();state.visibleExampleIndex=null;state.exampleCycle[w.id]=((Number(state.exampleCycle[w.id])||0)+direction+10)%10;save();renderStudy()}
 async function manualSpeech(text,lang){if(state.playing)stopLesson(t('Pausa per ascolto singolo','Paused for single playback'));interruptPreview();await speak(text,lang)}
 async function previewSingle(g,el){if(state.playing)stopLesson();interruptPreview();const token=state.previewId;const {plan}=compileSequence(current(),{groups:[{...g,repeat:1,after:0,items:[{...el,enabled:true,repeat:1,after:0}]}]},{exampleCount:1});
   for(const s of plan){if(token!==state.previewId)return;if(s.kind==='say')await speak(s.text,s.lang);else await delay(s.seconds*1000)}
 }
 async function playTen(){const w=wordById(state.chosenWordId);if(!w)return;if(state.playing)stopLesson();interruptPreview();const token=state.previewId;$('btn-play-10').textContent=t('■ Ferma','■ Stop');for(let i=0;i<w.examples.length;i++){if(token!==state.previewId)break;await speak(w.examples[i].jp,'ja-JP');if(token!==state.previewId)break;await delay(200);if(token!==state.previewId)break;await speak(w.examples[i][state.lang],locale());if(token!==state.previewId)break;await delay(350)}$('btn-play-10').textContent=t('▶ Ascolta tutte','▶ Play all')}
 function setupMediaSession(){if(!('mediaSession'in navigator)){makeLog('MEDIA','API non disponibile');return}
   const on={
     play:()=>{makeLog('MEDIA','play ricevuto');if(state.view==='diagnostics')bridgeOn();else if(!state.playing)startLesson()},
     pause:()=>{makeLog('MEDIA','pause ricevuto');if(state.view==='diagnostics')bridgeOff();else if(state.playing)stopLesson()},
     stop:()=>{makeLog('MEDIA','stop ricevuto');if(state.view==='diagnostics')bridgeOff();else stopLesson()},
     nexttrack:()=>{makeLog('MEDIA','nexttrack ricevuto');if(state.view!=='diagnostics')nextWord(true)},
     previoustrack:()=>{makeLog('MEDIA','previoustrack ricevuto');if(state.view!=='diagnostics')repeatDifficult()},
     seekforward:e=>{makeLog('MEDIA',`seekforward +${e.seekOffset??'?'}s`);if(state.view!=='diagnostics')nextWord(true)},
     seekbackward:e=>{makeLog('MEDIA',`seekbackward -${e.seekOffset??'?'}s`);if(state.view!=='diagnostics')repeatDifficult()},
     seekto:e=>makeLog('MEDIA',`seekto ${Math.round(e.seekTime||0)}s`)
   };
   for(const [key,fn] of Object.entries(on))try{navigator.mediaSession.setActionHandler(key,(info={})=>{state.hardwareCount++;renderCapabilities();fn(info)})}catch(e){makeLog('MEDIA',`${key}: handler non disponibile`)}
   updateMediaMetadata();setPlaybackState();
 }
 function updateSettingElement(id,value){$(id).value=String(value)}
 function initializeSettings(){
   for(const [id,value] of [['study-category',state.category],['session-size',state.size],['study-direction',state.direction],['example-count',state.exampleCount],['form-count',state.formCount],['global-gap',state.globalGap]])updateSettingElement(id,value);
   $('announce-forms').checked=state.announceForms;$('wheel-enabled').checked=state.wheel;$('wake-enabled').checked=state.wake;
 }
 // Global navigation and basic study controls.
 $('btn-menu').addEventListener('click',()=>state.drawerOpen?closeDrawer():openDrawer());
 $('btn-close-drawer').addEventListener('click',closeDrawer);$('drawer-shade').addEventListener('click',closeDrawer);
 $('btn-drawer-done').addEventListener('click',()=>{closeDrawer();showView('study')});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.drawerOpen)closeDrawer()});
 document.querySelectorAll('[data-drawer]').forEach(b=>b.addEventListener('click',()=>switchDrawerTab(b.dataset.drawer)));
 document.querySelectorAll('[data-menu-view]').forEach(b=>b.addEventListener('click',()=>{showView(b.dataset.menuView);closeDrawer()}));
 document.querySelectorAll('[data-goto-study]').forEach(b=>b.addEventListener('click',()=>showView('study')));
 for(const lang of ['it','en'])$('language-'+lang).addEventListener('click',()=>{
    if(state.lang===lang)return;if(state.playing)stopLesson();interruptPreview();state.lang=lang;state.answerShown=false;state.visibleExampleIndex=null;state.phase=lang==='it'?'Pronto per iniziare':'Ready to start';save();renderLanguage();toast(lang==='it'?'Lingua madre: italiano':'Native language: English')
 });
 $('btn-play').addEventListener('click',startLesson);$('btn-repeat').addEventListener('click',repeatDifficult);$('btn-next').addEventListener('click',()=>nextWord(true));
 $('btn-reveal').addEventListener('click',()=>{state.answerShown=!state.answerShown;renderStudy()});
 $('example-prev').addEventListener('click',()=>moveExample(-1));$('example-next').addEventListener('click',()=>moveExample(1));
 $('btn-show-detail').addEventListener('click',()=>{state.chosenWordId=current().id;showView('library');renderDetail();if(innerWidth<721)$('detail-panel').scrollIntoView({behavior:'smooth',block:'start'})});
 // Session settings; the sequence for each translation direction is saved separately.
 $('study-category').addEventListener('change',e=>{state.category=e.target.value;save();resetSession()});
 $('session-size').addEventListener('change',e=>{state.size=num(e.target.value,5,25,20);save();resetSession()});
 $('study-direction').addEventListener('change',e=>{if(state.playing)stopLesson();state.direction=e.target.value;state.answerShown=false;state.visibleExampleIndex=null;state.phase=t('Direzione cambiata','Direction changed');save();renderStudy();renderSequenceEditor()});
 $('example-count').addEventListener('change',e=>{if(state.playing)stopLesson();state.exampleCount=num(e.target.value,0,10,1);save();renderStudy();previewPlan()});
 $('form-count').addEventListener('change',e=>{if(state.playing)stopLesson();state.formCount=e.target.value;save();previewPlan()});
 $('global-gap').addEventListener('change',e=>{if(state.playing)stopLesson();state.globalGap=num(e.target.value,0,12,.4);e.target.value=state.globalGap;save();previewPlan()});
 $('announce-forms').addEventListener('change',e=>{if(state.playing)stopLesson();state.announceForms=e.target.checked;save();previewPlan()});
 $('wake-enabled').addEventListener('change',e=>{state.wake=e.target.checked;save();if(!state.wake)releaseWake();else if(state.playing)requestWake()});
 $('wheel-enabled').addEventListener('change',e=>{state.wheel=e.target.checked;save();if(!state.wheel)bridgeOff();else if(state.playing)bridgeOn()});
 $('reset-session').addEventListener('click',resetSession);
 // Group editor controls are delegated so adding and reordering preserves interaction.
 function locate(gid,iid){const groups=selectedSequence().groups;const g=groups.find(x=>x.id===gid);return {groups,g,el:g?.items.find(i=>i.id===iid)}}
 const editor=$('sequence-editor');
 editor.addEventListener('click',e=>{
   const gb=e.target.closest('[data-g-action]');const ib=e.target.closest('[data-i-action]');
   if(gb){const {groups,g}=locate(gb.dataset.gId),index=groups.indexOf(g);if(!g)return;
     switch(gb.dataset.gAction){
       case 'up':if(index>0)[groups[index-1],groups[index]]=[groups[index],groups[index-1]];break;
       case 'down':if(index<groups.length-1)[groups[index],groups[index+1]]=[groups[index+1],groups[index]];break;
       case 'remove':if(groups.length>1)groups.splice(index,1);break;
       case 'add-item':{const choice=editor.querySelector(`[data-add-select="${g.id}"]`);if(g.items.length<25)g.items.push(item(choice?.value||'word'));else toast('Limite: 25 elementi per gruppo');break}
     }
     editorChange();renderSequenceEditor();return;
   }
   if(ib){const {g,el}=locate(ib.dataset.gId,ib.dataset.iId);if(!g||!el)return;
     if(ib.dataset.iAction==='preview'){previewSingle(g,el);return}
     const at=g.items.indexOf(el);
     switch(ib.dataset.iAction){
       case 'up':if(at>0)[g.items[at-1],g.items[at]]=[g.items[at],g.items[at-1]];break;
       case 'down':if(at<g.items.length-1)[g.items[at+1],g.items[at]]=[g.items[at],g.items[at+1]];break;
       case 'remove':g.items.splice(at,1);break;
     }
     editorChange();renderSequenceEditor();
   }
 });
 editor.addEventListener('change',e=>{
    const a=e.target;const groupId=a.getAttribute('data-g-name')||a.getAttribute('data-g-repeat')||a.getAttribute('data-g-after');
    if(groupId){const {g}=locate(groupId);if(!g)return;if(a.hasAttribute('data-g-name'))g.name=a.value.trim().slice(0,50)||'Gruppo';if(a.hasAttribute('data-g-repeat'))g.repeat=num(a.value,1,10,1);if(a.hasAttribute('data-g-after'))g.after=num(a.value,0,30,0);editorChange();renderSequenceEditor();return}
    const field=['enabled','type','repeat','after','move'].find(k=>a.hasAttribute('data-i-'+k));
    if(!field)return;const [gid,iid]=a.getAttribute('data-i-'+field).split(':');const {g,el,groups}=locate(gid,iid);if(!el)return;
    switch(field){case 'enabled':el.enabled=a.checked;break;case 'type':if(TYPE_KEYS.includes(a.value))el.type=a.value;break;case 'repeat':el.repeat=num(a.value,1,10,1);break;case 'after':el.after=num(a.value,0,30,0);break;case 'move':{const to=groups.find(x=>x.id===a.value);if(to){g.items.splice(g.items.indexOf(el),1);to.items.push(el)}break}}
    editorChange();renderSequenceEditor();
 });
 $('add-group').addEventListener('click',()=>{const groups=selectedSequence().groups;if(groups.length>=16){toast('Massimo 16 gruppi');return}groups.push(group(t(`Gruppo ${groups.length+1}`,`Group ${groups.length+1}`),[item('word')],1,0));editorChange();renderSequenceEditor();$('app-drawer').querySelector('.drawer-content').scrollTop=0;toast(t('Gruppo aggiunto','Group added'))});
 $('preset-standard').addEventListener('click',()=>{state.sequences[state.direction]=makeDefault(state.direction);editorChange();renderSequenceEditor();toast(t('Sequenza base ripristinata','Base sequence restored'))});
 $('preset-repeat').addEventListener('click',()=>{state.sequences[state.direction]=makeRepeat();editorChange();renderSequenceEditor();toast(t('Ripetizione parola ×2, gruppo ×3','Word ×2, group ×3'))});
 // Library, individual voices and diagnostics.
 $('word-search').addEventListener('input',e=>{state.search=e.target.value;renderLibrary()});
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{state.libraryFilter=b.dataset.filter;renderLibrary()}));
 $('word-list').addEventListener('click',e=>{const target=e.target.closest('[data-word-id]');if(!target)return;state.chosenWordId=Number(target.dataset.wordId);renderLibrary();renderDetail();if(innerWidth<721)$('detail-panel').scrollIntoView({behavior:'smooth',block:'start'})});
 $('btn-word-voice').addEventListener('click',()=>manualSpeech(wordById(state.chosenWordId).jp,'ja-JP'));
 $('detail-forms').addEventListener('click',e=>{const btn=e.target.closest('[data-form-index]');if(!btn)return;const w=wordById(state.chosenWordId),f=w.forms[Number(btn.dataset.formIndex)];manualSpeech(f.jp,'ja-JP')});
 $('ex-list').addEventListener('click',e=>{const ja=e.target.closest('[data-voice-ex-jp]'),native=e.target.closest('[data-voice-ex-native]');const w=wordById(state.chosenWordId);if(ja)manualSpeech(w.examples[Number(ja.dataset.voiceExJp)].jp,'ja-JP');else if(native)manualSpeech(w.examples[Number(native.dataset.voiceExNative)][state.lang],locale())});
 $('btn-play-10').addEventListener('click',()=>{if($('btn-play-10').textContent.startsWith('■')){interruptPreview();$('btn-play-10').textContent=t('▶ Ascolta tutte','▶ Play all')}else playTen()});
 $('btn-media').addEventListener('click',async()=>{const player=$('media-bed');if(!player.paused){player.pause();makeLog('AUDIO','traccia di prova fermata')}else try{await player.play();makeLog('AUDIO','traccia diagnostica avviata')}catch(e){makeLog('ERRORE',e.message)}});
 $('media-bed').addEventListener('play',()=>$('btn-media').textContent=t('■ Ferma audio','■ Stop test audio'));
 $('media-bed').addEventListener('pause',()=>$('btn-media').textContent=t('▶ Audio test','▶ Test audio'));
 $('btn-ja').addEventListener('click',()=>manualSpeech('この道をまっすぐ進んでください。','ja-JP'));
 $('btn-it').addEventListener('click',()=>manualSpeech('La lingua selezionata è italiana.','it-IT'));
 $('btn-en').addEventListener('click',()=>manualSpeech('The next Japanese word is about to begin.','en-US'));
 $('sim-prev').addEventListener('click',()=>{makeLog('SIMULATO','previoustrack');repeatDifficult()});
 $('sim-next').addEventListener('click',()=>{makeLog('SIMULATO','nexttrack');nextWord(true)});
 $('sim-play').addEventListener('click',()=>{makeLog('SIMULATO',state.playing?'pause':'play');state.playing?stopLesson():startLesson()});
 $('clear-log').addEventListener('click',()=>{state.events=[];$('event-log').textContent=t('Registro svuotato','Log cleared')});
 document.addEventListener('visibilitychange',()=>{makeLog('PAGINA',document.hidden?'nascosta':'visibile');if(!document.hidden&&state.playing)requestWake()});
 if('speechSynthesis'in window){speechSynthesis.onvoiceschanged=loadVoices;loadVoices();setTimeout(loadVoices,850);setTimeout(loadVoices,2500)}
 initializeSettings();newDeck();renderLanguage();setupMediaSession();makeLog('AVVIO','demo v0.2 pronta; testare i comandi fisici separatamente');
 if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
 window.addEventListener('pagehide',()=>{cancelLesson();releaseWake();bridgeOff()});
 // Read-only QA surface, useful for validating nested repetition without TTS voices.
 window.KotobaDriveQA=Object.freeze({getPlan:()=>compileSequence(current()),getSettings:()=>({lang:state.lang,direction:state.direction,exampleCount:state.exampleCount,groups:selectedSequence().groups}),getCurrent:()=>current().jp});
})();
