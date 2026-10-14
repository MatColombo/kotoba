/* Kotoba Drive local-first persistence and portable JSON contracts.
 * No network or DOM dependencies; the browser adapter uses IndexedDB only. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KotobaStore=api;})(typeof globalThis==='object'?globalThis:this,function(){'use strict';
 const VERSION=1, DB_NAME='kotoba-drive-v04', DB_VERSION=2;
 const copy=o=>structuredClone(o);
 const isObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
 const idKey=x=>String(x);
 const safeId=id=>typeof id==='string'&&/^[a-zA-Z0-9][\w:.-]{0,127}$/.test(id);
 const stableString=v=>JSON.stringify(v,(k,x)=>isObj(x)?Object.fromEntries(Object.keys(x).sort().map(key=>[key,x[key]])):x);
 const hash=v=>{let h=2166136261;for(const ch of stableString(v)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')};
 const cardFingerprint=c=>hash({jp:c.jp,kana:c.kana,pos:c.pos,meaning:c.meaning,forms:c.forms});
 const progressDefault=()=>({exposures:0,partial:0,seen:0,hard:0,known:false,favorite:false,firstSeen:null,lastSeen:null,knownChangedAt:null,exampleCounts:{},listenedMs:0,creditedRuns:[]});
 const emptyStudy=()=>({schemaVersion:1,deckStates:{},sessions:[],sequences:null,settings:{},audioMasters:{},activeDeckId:null,exportedAt:null});
 function normalizeDeck(raw,{allowLegacy=false,legacyDeckId='jlpt-n4-core',legacyTitle='JLPT N4'}={}){
  const errors=[],warnings=[];
  if(!isObj(raw)&&!Array.isArray(raw))return {errors:['Il file JSON deve contenere un deck oggetto.'],warnings,deck:null};
  const legacy=Array.isArray(raw);if(legacy&&!allowLegacy)return{errors:['Formato array storico: importare con conversione legacy esplicita.'],warnings,deck:null};
  const deck=legacy?{schemaVersion:1,deckId:legacyDeckId,revision:1,title:legacyTitle,description:'75 vocaboli N4 originali',level:'N4',languages:['ja','it','en'],license:'Contenuti Kotoba Drive; verificare prima della redistribuzione',source:'Kotoba Drive',cards:raw,stories:[],scenarios:[]}:copy(raw);
  if(deck.schemaVersion!==1)errors.push('schemaVersion del deck non supportata (attesa 1).');
  if(!safeId(deck.deckId))errors.push('deckId assente o non valido.');
  if(!Number.isInteger(deck.revision)||deck.revision<1)errors.push('revision deve essere intero positivo.');
  if(typeof deck.title!=='string'||!deck.title.trim())errors.push('title obbligatorio.');
  if(!Array.isArray(deck.languages)||!deck.languages.includes('ja')||!deck.languages.some(x=>x==='it'||x==='en'))errors.push('languages deve includere ja e it o en.');
  if(!Array.isArray(deck.cards)||!deck.cards.length)errors.push('cards deve contenere almeno una carta.');
  if(!Array.isArray(deck.cards))return {deck:null,errors,warnings};
  if(deck.cards.length>15000)errors.push('Numero massimo di carte superato (15000).');
  const ids=new Set(),exampleIds=new Set();
  for(const [i,c] of deck.cards.entries()){
   if(!isObj(c)){errors.push(`cards[${i}] non è un oggetto.`);continue}
   if(c.id===undefined||c.id===null||!safeId(idKey(c.id))){errors.push(`cards[${i}].id non valido.`);continue}
   const cid=idKey(c.id);if(ids.has(cid))errors.push(`ID carta duplicato: ${cid}`);ids.add(cid);
   if(!['verb','noun','na','i'].includes(c.pos))errors.push(`Carta ${cid}: pos non valida.`);
   if(typeof c.jp!=='string'||!c.jp.trim()||typeof c.kana!=='string'||!c.kana.trim())errors.push(`Carta ${cid}: jp/kana obbligatori.`);
   if(!isObj(c.meaning)||typeof c.meaning.it!=='string'||typeof c.meaning.en!=='string')errors.push(`Carta ${cid}: meaning.it/en obbligatori.`);
   if(!Array.isArray(c.forms))errors.push(`Carta ${cid}: forms deve essere un array.`);
   else for(const f of c.forms)if(!isObj(f)||typeof f.jp!=='string'||typeof f.label!=='string')errors.push(`Carta ${cid}: forma non valida.`);
   if(!Array.isArray(c.examples))errors.push(`Carta ${cid}: examples deve essere un array.`);
   else if(c.examples.length>1500)errors.push(`Carta ${cid}: troppi esempi (max 1500).`);
   if(Array.isArray(c.examples))for(const [j,e] of c.examples.entries()){
    if(!isObj(e)){errors.push(`Carta ${cid}: esempio ${j+1} invalido.`);continue}
    if(e.id===undefined){if(legacy){e.id=`${cid}:ex:${j+1}`}else errors.push(`Carta ${cid}: esempio ${j+1} privo di ID.`)}
    if(e.id===undefined||e.id===null||!safeId(idKey(e.id)))errors.push(`Carta ${cid}: ID esempio non valido.`);
    const xid=`${cid}/${idKey(e.id)}`;if(exampleIds.has(xid))errors.push(`Carta ${cid}: ID esempio duplicato ${e.id}`);exampleIds.add(xid);
    for(const field of ['jp','kana','it','en'])if(typeof e[field]!=='string'||!e[field].trim())errors.push(`Carta ${cid}: esempio ${j+1} campo ${field} mancante.`);
   }
  }
  if(deck.stories!==undefined&&!Array.isArray(deck.stories))errors.push('stories deve essere array.');
  if(deck.scenarios!==undefined&&!Array.isArray(deck.scenarios))errors.push('scenarios deve essere array.');
  if(Array.isArray(deck.stories)){
    const storyIds=new Set();
    for(const st of deck.stories){
      if(!isObj(st)||st.id===undefined||!safeId(idKey(st.id))){errors.push('Storia priva di ID valido.');continue}
      if(storyIds.has(idKey(st.id)))errors.push(`ID storia duplicato: ${st.id}`);storyIds.add(idKey(st.id));
      if(st.cardIds!==undefined&&!Array.isArray(st.cardIds))errors.push(`Storia ${st.id}: cardIds non è un array.`);
      for(const ref of Array.isArray(st.cardIds)?st.cardIds:[])if(!ids.has(idKey(ref)))errors.push(`Storia ${st.id}: riferimento carta mancante ${ref}`);
    }
  }
  if(Array.isArray(deck.scenarios)){
    const scIds=new Set();for(const sc of deck.scenarios){if(!isObj(sc)||sc.id===undefined||!safeId(idKey(sc.id))){errors.push('Scenario senza ID valido.');continue}if(scIds.has(idKey(sc.id)))errors.push(`ID scenario duplicato: ${sc.id}`);scIds.add(idKey(sc.id))}
    for(const c of deck.cards)if(Array.isArray(c?.examples))for(const e of c.examples)if(isObj(e)&&e.scenarioId!==undefined&&!scIds.has(idKey(e.scenarioId)))errors.push(`Scenario mancante: ${e.scenarioId}`);
  }
  if(deck.storyGroups!==undefined){if(!Array.isArray(deck.storyGroups))errors.push('storyGroups deve essere array');else{
   const groupIds=new Set();for(const g of deck.storyGroups){if(!isObj(g)||!safeId(idKey(g.id))||groupIds.has(idKey(g.id))){errors.push('Gruppo narrativo senza ID valido/univoco');continue}groupIds.add(idKey(g.id));if(!Array.isArray(g.cardIds)){errors.push(`Gruppo ${g.id}: cardIds non valido`);continue}for(const ref of g.cardIds)if(!ids.has(idKey(ref)))errors.push(`Gruppo ${g.id}: carta mancante ${ref}`);}
   for(const c of deck.cards){if(isObj(c)&&c.storyGroupId&&!groupIds.has(idKey(c.storyGroupId)))errors.push(`Carta ${c.id}: gruppo narrativo mancante`)}
  }}
  for(const c of deck.cards)if(Array.isArray(c?.legacyExamples)){const legacyIds=new Set();for(const e of c.legacyExamples){if(!isObj(e)||!safeId(idKey(e.id))||legacyIds.has(idKey(e.id)))errors.push(`Carta ${c.id}: ID esempio legacy non valido/duplicato`);else legacyIds.add(idKey(e.id))}}
  for(const st of deck.stories||[]){
    if(!isObj(st))continue;
    if(!Array.isArray(st.segments)){errors.push(`Storia ${st.id}: segments non è un array`);continue}
    const used=new Set();
    for(const seg of st.segments){
      if(!isObj(seg)){errors.push(`Storia ${st.id}: segmento non valido`);continue}
      for(const k of ['jp','kana','it','en'])if(typeof seg[k]!=='string'||!seg[k])errors.push(`Storia ${st.id}: segmento senza ${k}`);
      if(seg.cardIds!==undefined&&!Array.isArray(seg.cardIds)){errors.push(`Storia ${st.id}: riferimenti del segmento non validi`);continue}
      for(const ref of seg.cardIds||[]){if(!ids.has(idKey(ref)))errors.push(`Storia ${st.id}: carta ${ref} non esiste`);used.add(idKey(ref))}
    }
    if(Array.isArray(st.cardIds))for(const id of st.cardIds)if(!used.has(idKey(id)))warnings.push(`Storia ${st.id}: vocabolo ${id} non referenziato nei segmenti`)
  }
  deck.stories=deck.stories||[];deck.scenarios=deck.scenarios||[];
  if(legacy)warnings.push('Import legacy: gli ID degli esempi sono stati assegnati una sola volta e saranno conservati.');
  return {deck:errors.length?null:deck,errors,warnings};
 }
 function compareDeck(oldDeck,nextDeck){
  if(oldDeck&&idKey(oldDeck.deckId)!==idKey(nextDeck.deckId))throw Error('deckId differente: non è un aggiornamento.');
  const old=new Map((oldDeck?.cards||[]).map(c=>[idKey(c.id),c]));const next=new Map(nextDeck.cards.map(c=>[idKey(c.id),c]));
  const added=[],removed=[],modified=[],exampleAdded=[],exampleModified=[],exampleRemoved=[];
  for(const [id,c] of next){const before=old.get(id);if(!before){added.push(id);continue}if(cardFingerprint(c)!==cardFingerprint(before))modified.push(id);const existing=new Map([...(before.examples||[]),...(before.legacyExamples||[])].map(x=>[idKey(x.id),x]));for(const e of [...(c.examples||[]),...(c.legacyExamples||[])]){if(!existing.has(idKey(e.id)))exampleAdded.push(`${id}/${e.id}`);else if(hash(e)!==hash(existing.get(idKey(e.id))))exampleModified.push(`${id}/${e.id}`)}const nextEx=new Set([...(c.examples||[]),...(c.legacyExamples||[])].map(e=>idKey(e.id)));for(const e of before.examples||[])if(!nextEx.has(idKey(e.id)))exampleRemoved.push(`${id}/${e.id}`)}
  for(const id of old.keys())if(!next.has(id))removed.push(id);
  return {kind:!oldDeck?'new':!removed.length&&!exampleRemoved.length&&!modified.length&&!exampleModified.length?'additive':(removed.length||exampleRemoved.length)?'requires-reconciliation':'editorial',added,removed,modified,exampleAdded,exampleModified,exampleRemoved,oldRevision:oldDeck?.revision??null,newRevision:nextDeck.revision};
 }
 function normalizeStudy(doc){if(!isObj(doc)||doc.schemaVersion!==1)throw Error('Formato study.json non supportato');
  const out={...emptyStudy(),...copy(doc)};
  if(!isObj(out.deckStates)||!isObj(out.settings)||!isObj(out.audioMasters)||!Array.isArray(out.sessions))throw Error('Struttura study.json non valida');
  for(const [deckId,s] of Object.entries(out.deckStates)){if(!safeId(deckId)||!isObj(s)||!isObj(s.cards))throw Error('deckStates non valido');for(const [cid,p] of Object.entries(s.cards)){if(!safeId(cid)||!isObj(p))throw Error('Stato carta non valido');}}
  if(out.sessions.length>10000)throw Error('Troppi record di sessione');
  const sessionIds=new Set();
  for(const session of out.sessions){
    if(!isObj(session)||!safeId(session.id)||!safeId(session.deckId)||!Array.isArray(session.orderedCardIds)||session.orderedCardIds.length>15000||session.orderedCardIds.some(x=>!safeId(idKey(x)))||sessionIds.has(session.id))throw Error('Sessione non valida o duplicata');
    sessionIds.add(session.id);
  }
  if(out.sequences!=null){
    if(!isObj(out.sequences)||!Array.isArray(out.sequences.sequences)||out.sequences.sequences.length>200)throw Error('Sequenze di studio non valide');
    const sequenceIds=new Set();
    for(const seq of out.sequences.sequences){
      if(!isObj(seq)||!safeId(seq.sequenceId)||sequenceIds.has(seq.sequenceId)||!Array.isArray(seq.groups)||seq.groups.length>25)throw Error('Sequenza non valida');
      sequenceIds.add(seq.sequenceId);
      const groupIds=new Set();
      for(const g of seq.groups){
        if(!isObj(g)||!safeId(g.id)||groupIds.has(g.id))throw Error('Gruppo della sequenza non valido');
        const items=g.items===undefined?(g.elements===undefined?[]:g.elements):g.items;
        if(!Array.isArray(items)||items.length>30)throw Error('Elementi della sequenza non validi');
        groupIds.add(g.id);
        const itemIds=new Set();
        for(const el of items){if(!isObj(el)||!safeId(el.id)||itemIds.has(el.id))throw Error('Elemento della sequenza non valido');itemIds.add(el.id)}
      }
    }
  }
  return out;
 }
 function mergeStudy(current,incoming){current=normalizeStudy(current);incoming=normalizeStudy(incoming);const out=copy(current),conflicts=[];
  for(const [id,next] of Object.entries(incoming.deckStates)){
   if(!out.deckStates[id]){out.deckStates[id]=copy(next);continue}
   const dest=out.deckStates[id].cards;for(const [cardId,other] of Object.entries(next.cards)){
    if(!dest[cardId]){dest[cardId]=copy(other);continue}
    const p=dest[cardId];
    for(const key of ['exposures','partial','seen','hard','listenedMs'])p[key]=Math.max(Number(p[key])||0,Number(other[key])||0);
    const oldTime=Date.parse(p.updatedAt||p.lastSeen||0)||0,newTime=Date.parse(other.updatedAt||other.lastSeen||0)||0;
    if(newTime>oldTime){p.favorite=!!other.favorite;p.known=!!other.known;p.knownChangedAt=other.knownChangedAt||p.knownChangedAt;p.updatedAt=other.updatedAt||p.updatedAt;p.lastSeen=other.lastSeen||p.lastSeen;}
    else if(newTime===oldTime&&(p.favorite!==other.favorite||p.known!==other.known))conflicts.push(`Flag carta ${id}/${cardId}: conservato stato locale`);
    p.creditedRuns=[...new Set([...(p.creditedRuns||[]),...(other.creditedRuns||[])])].slice(-150);
    for(const [e,v] of Object.entries(other.exampleCounts||{}))p.exampleCounts={...p.exampleCounts,[e]:Math.max(Number(p.exampleCounts?.[e])||0,Number(v)||0)};
   }
  }
  const sessions=new Map(out.sessions.map(s=>[s.id,s]));for(const s of incoming.sessions){const existing=sessions.get(s.id);if(!existing||String(s.updatedAt||'')>String(existing.updatedAt||''))sessions.set(s.id,copy(s));else if(existing)conflicts.push(`Sessione ${s.id}: conservata revisione locale`)}out.sessions=[...sessions.values()];
  // Personal configuration is not combined unpredictably; the local installation wins.
  if(stableString(current.sequences)!==stableString(incoming.sequences))conflicts.push('Sequenze personali: conservata versione locale');
  if(stableString(current.audioMasters)!==stableString(incoming.audioMasters))conflicts.push('Master audio: conservata configurazione locale');
  return {study:out,conflicts};
 }
 function reconcileStudy(doc,deckId,diff,{mode='retain',mapping={}}={}){
  const out=normalizeStudy(doc),valid=new Set(diff.nextCardIds||[]),mapped={};
  for(const [oldId,newId] of Object.entries(mapping)){if(!diff.removed.includes(oldId)||!valid.has(idKey(newId)))throw Error(`Mappatura non valida ${oldId} → ${newId}`);mapped[idKey(oldId)]=idKey(newId)}
  const state=out.deckStates[deckId];if(state)for(const [oldId,newId] of Object.entries(mapped)){if(state.cards[oldId]){if(!state.cards[newId])state.cards[newId]=state.cards[oldId];else{const p=state.cards[newId],prior=state.cards[oldId];for(const key of ['exposures','partial','seen'])p[key]=Math.max(p[key]||0,prior[key]||0)}delete state.cards[oldId]}}
  for(const session of out.sessions.filter(s=>s.deckId===deckId)){
   session.orderedCardIds=session.orderedCardIds.map(c=>mapped[idKey(c)]||idKey(c));
   if(mode==='exclude')session.orderedCardIds=session.orderedCardIds.filter(c=>valid.has(idKey(c)));
   session.currentCardIndex=Math.min(session.currentCardIndex||0,Math.max(0,session.orderedCardIds.length-1));
  }
  return out;
 }
 const req=r=>new Promise((ok,fail)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)});
 class Database{
  constructor(db){this.db=db}
  static async open(indexedDB=globalThis.indexedDB){if(!indexedDB)throw Error('IndexedDB non disponibile');const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;for(const [name,key] of [['decks','deckId'],['study','id'],['sessions','id'],['sequences','id'],['meta','id']])if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:key})};return new Database(await req(request))}
  transact(stores,mode,fn){return new Promise((resolve,reject)=>{const tx=this.db.transaction(stores,mode);let result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||Error('Transazione fallita'));tx.onabort=()=>reject(tx.error||Error('Transazione annullata'));try{result=fn(tx)}catch(e){try{tx.abort()}catch(_){}reject(e)}})}
  read(store,key){return req(this.db.transaction(store,'readonly').objectStore(store).get(key))}
  list(store){return req(this.db.transaction(store,'readonly').objectStore(store).getAll())}
  put(store,data){return this.transact([store],'readwrite',tx=>tx.objectStore(store).put(data))}
  remove(store,key){return this.transact([store],'readwrite',tx=>tx.objectStore(store).delete(key))}
  saveBundle({study,sessions,sequenceLibrary,backup=null}){return this.transact(['study','sessions','sequences',...(backup?['meta']:[])],'readwrite',tx=>{
    if(backup)tx.objectStore('meta').put({id:'pre-import-backup',data:backup,savedAt:new Date().toISOString()});
    tx.objectStore('study').put({id:'main',data:study});
    if(sessions){tx.objectStore('sessions').clear();for(const item of sessions)tx.objectStore('sessions').put(item);}
    tx.objectStore('sequences').clear();
    if(sequenceLibrary)tx.objectStore('sequences').put({id:'library',data:sequenceLibrary});
  })}
  replaceAll({decks,study,backup}){return this.transact(['decks','study','sessions','sequences','meta'],'readwrite',tx=>{
    tx.objectStore('meta').put({id:'pre-import-backup',data:backup,savedAt:new Date().toISOString()});
    tx.objectStore('decks').clear();
    for(const item of decks)tx.objectStore('decks').put(item);
    tx.objectStore('study').put({id:'main',data:study});
    tx.objectStore('sessions').clear();
    for(const session of study.sessions)tx.objectStore('sessions').put(session);
    tx.objectStore('sequences').clear();
    if(study.sequences)tx.objectStore('sequences').put({id:'library',data:study.sequences});
  })}
  applyDeckUpdate(deck,study,sessionList,sequenceLibrary,backup=null){return this.transact(['decks','study','sessions','sequences',...(backup?['meta']:[])],'readwrite',tx=>{
   if(backup)tx.objectStore('meta').put({id:'pre-import-backup',data:backup,savedAt:new Date().toISOString()});
   tx.objectStore('decks').put(deck);tx.objectStore('study').put({id:'main',data:study});
   tx.objectStore('sessions').clear();for(const s of sessionList||[])tx.objectStore('sessions').put(s);
   if(sequenceLibrary)tx.objectStore('sequences').put({id:'library',data:sequenceLibrary});
  })}
 }
 class DeckRepository{constructor(db){this.db=db}get(id){return this.db.read('decks',id)}list(){return this.db.list('decks')}save(d){return this.db.put('decks',d)}remove(id){return this.db.remove('decks',id)}}
 class StudyRepository{constructor(db){this.db=db}async get(){return(await this.db.read('study','main'))?.data||null}save(study){return this.db.put('study',{id:'main',data:normalizeStudy(study)})}}
 class SessionRepository{constructor(db){this.db=db}get(id){return this.db.read('sessions',id)}list(){return this.db.list('sessions')}save(session){return this.db.put('sessions',session)}remove(id){return this.db.remove('sessions',id)}}
 class SequenceRepository{constructor(db){this.db=db}async get(){return(await this.db.read('sequences','library'))?.data||null}save(library){return this.db.put('sequences',{id:'library',data:library})}}
 return {VERSION,DB_NAME,DB_VERSION,normalizeDeck,normalizeStudy,compareDeck,cardFingerprint,progressDefault,emptyStudy,mergeStudy,reconcileStudy,hash,Database,DeckRepository,StudyRepository,SessionRepository,SequenceRepository};
});
