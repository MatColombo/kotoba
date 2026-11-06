/* Kotoba Drive Notebook UI: presentation adapter only. No speech engine, storage schema,
   sequence compiler, TTS worker or ONNX asset modifications. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key='kotoba-notebook-appearance-v1';const activityKey='kotoba-notebook-listens-v1';
 let bridge=null,initialized=false,selectedDeck=null,libraryTab='installed',searchVisible=false,settings=null;
 const defaultAppearance={theme:'auto',fontPx:17,grid:'subtle',animations:true};
 const readAppearance=()=>{try{return {...defaultAppearance,...JSON.parse(localStorage.getItem(key)||'{}')}}catch(_){return {...defaultAppearance}}};
 const saveAppearance=()=>{try{localStorage.setItem(key,JSON.stringify(settings))}catch(e){console.warn(e)}};
 const listenEvents=()=>{try{const events=JSON.parse(localStorage.getItem(activityKey)||'[]');return Array.isArray(events)?events:[]}catch(_){return []}};
 const localDay=at=>{const d=new Date(at);if(!Number.isFinite(d.getTime()))return '';const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),n=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${n}`};
 const recentDays=n=>Array.from({length:n},(_,i)=>{const day=new Date();day.setHours(12,0,0,0);day.setDate(day.getDate()-(n-1-i));return localDay(day)});
 const shortDate=iso=>{if(!iso)return '—';const d=new Date(iso);if(!Number.isFinite(d.getTime()))return '—';const days=Math.floor((new Date().setHours(0,0,0,0)-new Date(d).setHours(0,0,0,0))/86400000);return days===0?'Oggi':days===1?'Ieri':days>1?`${days} giorni fa`:d.toLocaleDateString('it-IT')};
 const deckTitle=(data,id)=>data.installedDecks.find(d=>d.deckId===id)?.title||data.catalog.find(d=>d.deckId===id)?.title||id||'—';
 function applyAppearance(){const mode=settings.theme==='auto'?(window.matchMedia('(prefers-color-scheme:dark)').matches?'graphite':'paper'):settings.theme;
  document.documentElement.dataset.nbTheme=mode;document.documentElement.dataset.nbGrid=settings.grid;document.documentElement.dataset.nbMotion=settings.animations?'on':'off';
  document.documentElement.style.setProperty('--nb-translation-size',settings.fontPx+'px');
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=mode==='graphite'?'#1C1D1F':'#F8F6EF';
  document.querySelectorAll('[data-nb-theme-choice]').forEach(b=>{b.classList.toggle('selected',b.dataset.nbThemeChoice===settings.theme);b.setAttribute('aria-pressed',String(b.dataset.nbThemeChoice===settings.theme))});
  $('nb-grid-style').value=settings.grid;$('nb-animations').checked=settings.animations;
 }
 function updateFontPreview(){const px=Number($('nb-font-size').value);$('nb-font-px').textContent=`${px} px`;$('nb-font-preview').style.setProperty('--nb-preview-size',px+'px')}
 function syncAppearance(){applyAppearance();$('nb-font-size').value=settings.fontPx;updateFontPreview()}
 function fillHome(){if(!bridge)return;const data=bridge.data(),events=listenEvents(),days=recentDays(7),dayCounts=new Map(days.map(d=>[d,0]));for(const event of events)if(dayCounts.has(localDay(event.at)))dayCounts.set(localDay(event.at),dayCounts.get(localDay(event.at))+1);
  const highest=Math.max(1,...dayCounts.values());$('nb-activity-bars').innerHTML=days.map((d,i)=>`<div class="nb-bar-col" title="${safe(d)}: ${dayCounts.get(d)} card completate"><div class="nb-bar-base"><div class="nb-bar ${i===6?'today':''}" style="height:${dayCounts.get(d)?Math.max(7,100*dayCounts.get(d)/highest):0}%"></div></div><small>${['D','L','M','M','G','V','S'][new Date(d+'T12:00:00').getDay()]||'·'}</small></div>`).join('');
  const heardDays=new Set(events.map(e=>localDay(e.at)));let streak=0;const today=new Date();today.setHours(12,0,0,0);if(!heardDays.has(localDay(today)))today.setDate(today.getDate()-1);while(heardDays.has(localDay(today))){streak++;today.setDate(today.getDate()-1)}
  $('nb-streak').innerHTML=`<svg aria-hidden="true" width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.2 0 7-2.8 7-6.5 0-3.4-2-5.6-4-8-.3 2.1-1.1 3.8-2.2 4.6C12.6 7.7 10.6 4.4 8 2c.3 3.7-1.2 5.5-3 8.3A9.3 9.3 0 0 0 4 15.5C4 19.2 6.8 22 12 22Z"/><path d="M12 22c-2.4 0-4-1.5-4-3.5 0-1.2.8-2.6 2-4 .4 1.7 1.1 2.4 2 3.1.8-1.1 1-2.1 1.2-3 1.6 1.8 2.8 3 2.8 4.4 0 2.2-1.6 4-4 4Z"/></svg> <b>${streak}</b>`;
  const last=events[events.length-1];$('nb-last-deck').textContent=last?`${deckTitle(data,last.deckId)} · ${shortDate(last.at)}`:'Nessun ascolto registrato';
  $('nb-recent-cards').textContent=events.length?events.slice(-3).reverse().map(e=>e.jp).join(' · '):'—';
  const sessions=data.sessions.filter(s=>s.status!=='archived').sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  const lastSession=sessions.find(s=>s.status!=='completed');$('nb-home-resume').hidden=!lastSession;
  if(lastSession){const p=Math.min((Number(lastSession.currentCardIndex)||0)+1,lastSession.orderedCardIds.length);
   $('nb-home-resume').innerHTML=`<small>RIPRENDI</small><div class="nb-resume-main"><div><strong>${safe(lastSession.name||deckTitle(data,lastSession.deckId))}</strong><span>${safe(deckTitle(data,lastSession.deckId))} · ${p} / ${lastSession.orderedCardIds.length}</span></div><button type="button" class="nb-resume-play" data-nb-resume="${safe(lastSession.id)}" aria-label="Riprendi ultima sessione">▶</button></div>`;
  }
  $('nb-sessions-count').textContent=sessions.length;
  $('nb-home-sessions').classList.toggle('nb-few',sessions.length<=3);
  $('nb-home-sessions').innerHTML=sessions.length?sessions.map(s=>{const deck=deckTitle(data,s.deckId),n=Math.min((Number(s.currentCardIndex)||0)+1,s.orderedCardIds.length);
   return `<div class="nb-session-row"><button type="button" class="nb-session-primary" data-nb-resume="${safe(s.id)}"><strong>${safe(s.name||deck)}</strong><span>${safe(deck)} · ${n}/${s.orderedCardIds.length}</span></button><button type="button" class="nb-small-icon" data-nb-resume="${safe(s.id)}" aria-label="Apri sessione">▶</button><button type="button" class="nb-small-icon" data-nb-session-more="${safe(s.id)}" aria-label="Azioni sessione">···</button></div>`}).join(''):'<div class="nb-empty-sessions"><p>Nessuna sessione</p><button type="button" data-nb-action="new-session">+ Crea la prima sessione</button></div>';
 }
 function renderLibrary(){if(!bridge)return;const data=bridge.data();$('nb-tab-installed').classList.toggle('selected',libraryTab==='installed');$('nb-tab-catalog').classList.toggle('selected',libraryTab==='catalog');const q=$('nb-library-search').value.trim().toLowerCase();const entries=libraryTab==='installed'?data.installedDecks:data.catalog;
  $('nb-library-list').innerHTML=entries.filter(d=>!q||`${d.title} ${d.deckId} ${d.level||''}`.toLowerCase().includes(q)).map(d=>{
   const installed=data.installedDecks.some(x=>x.deckId===d.deckId);
   return `<div class="nb-library-row"><span class="nb-library-book">▤</span><button type="button" class="nb-library-name" data-nb-deck="${safe(d.deckId)}"><strong>${safe(d.title)}</strong><span>${Number(d.cards?.length||d.cardCount)||'—'} vocaboli</span></button>${libraryTab==='catalog'?`<button type="button" class="nb-install-action" data-nb-install="${safe(d.deckId)}" ${installed?'disabled':''}>${installed?'✓':'↓'}</button>`:'<span class="nb-library-arrow">›</span>'}</div>`
  }).join('')+'<button class="nb-library-import" type="button" data-nb-action="import">⇧ &nbsp; Importa da file locale…</button>';
 }
 function renderDetail(){if(!bridge)return;const data=bridge.data(),deck=data.installedDecks.find(d=>d.deckId===selectedDeck)||data.installedDecks.find(d=>d.deckId===data.activeDeckId);if(!deck){$('nb-detail-title').textContent='Deck non installato';return}selectedDeck=deck.deckId;
  $('nb-detail-title').textContent=deck.title;const progress=data.deckStates[deck.deckId]?.cards||{};const all=deck.cards.map(c=>({c,p:progress[String(c.id)]||{}})),studied=all.filter(x=>Number(x.p.exposures)>0).length,stars=all.filter(x=>x.p.favorite).length,known=all.filter(x=>x.p.known).length,unheard=all.length-studied;
  const last=[...all].map(x=>x.p.lastSeen).filter(Boolean).sort().pop();$('nb-detail-meta').textContent=`${all.length} vocaboli · Ultimo ascolto ${last?shortDate(last):'non registrato'}`;
  $('nb-detail-stats').innerHTML=[['▤',studied,'Studiate'],['☆',stars,'Stellate'],['✓',known,'Note']].map(([ic,n,label])=>`<div><small>${ic}</small><strong>${n}</strong><span>${label}</span></div>`).join('');
  $('nb-detail-unheard').textContent=`${unheard} / ${all.length} mai ascoltate per intero`;
  const dist=new Map();for(const item of all){const n=Number(item.p.exposures)||0;if(n>0)dist.set(n,(dist.get(n)||0)+1)}
  const rows=[...dist.entries()].sort((a,b)=>b[0]-a[0]);const max=Math.max(1,...rows.map(x=>x[1]));$('nb-detail-distribution').innerHTML=rows.length?rows.slice(0,14).map(([count,n])=>`<div class="nb-dist-row"><span>${count}×</span><div><i style="width:${Math.max(1,n/max*100)}%"></i></div><b>${n}</b></div>`).join(''):'<p class="nb-muted">Nessuna card ascoltata per intero</p>';
  const ev=listenEvents().filter(e=>e.deckId===deck.deckId),days=recentDays(30),counts=new Map(days.map(d=>[d,0]));for(const e of ev)if(counts.has(localDay(e.at)))counts.set(localDay(e.at),counts.get(localDay(e.at))+1);const top=Math.max(1,...counts.values());
  $('nb-month-activity').innerHTML=days.map(d=>`<div title="${safe(d)} · ${counts.get(d)} ascolti"><i style="height:${counts.get(d)?Math.max(6,counts.get(d)*100/top):0}%"></i></div>`).join('');
  $('nb-month-caption').textContent=ev.filter(e=>counts.has(localDay(e.at))).length?`${[...counts.values()].reduce((a,b)=>a+b,0)} ascolti · ${[...counts.values()].filter(Boolean).length} giorni attivi`:'Nessuna attività giornaliera registrata (storico disponibile dal redesign)';
  const sessionCount=data.sessions.filter(s=>s.deckId===deck.deckId).length;$('nb-deck-sessions').innerHTML=`Sessioni esistenti <span>${sessionCount} ›</span>`;
 }
 function setUpViews(){
  // Existing inputs and listeners are moved, never cloned: the original engine keeps their IDs.
  const audio=$('nb-audio-content'),masters=document.querySelector('.audio-masters-panel'),onnx=document.querySelector('.onnx-settings');if(masters)audio.appendChild(masters);if(onnx)audio.appendChild(onnx);
  const seq=$('drawer-sequence');seq.classList.remove('hidden');$('nb-sequences-content').appendChild(seq);
  const seqToolbar=document.createElement('div');seqToolbar.className='nb-seq-header';seqToolbar.innerHTML='<button type="button" id="nb-seq-preview-play">▶ Prova sequenza</button><button type="button" id="nb-seq-preview-details">≡ Breakdown tempi</button>';$('nb-sequences-content').prepend(seqToolbar);
  const seqBreak=document.createElement('div');seqBreak.id='nb-sequence-breakdown';seqBreak.className='nb-sequence-breakdown';seqBreak.hidden=true;$('nb-sequences-content').appendChild(seqBreak);
  // Existing controls in the original settings panel remain available under Advanced.
  const diag=$('view-diagnostics');const summary=document.createElement('div');summary.id='nb-diagnostics-overview';summary.className='nb-diagnostics-overview';diag.insertBefore(summary,diag.firstElementChild.nextSibling);
  const legacy=$('drawer-settings');const advancedLink=document.createElement('details');advancedLink.className='nb-technical-link';advancedLink.innerHTML='<summary>Avanzate</summary><button type="button" data-nb-view="notebook-errors">Registro errori ↗</button>';legacy.appendChild(advancedLink);
  const diagBody=$('view-diagnostics').querySelector('.diagnostics-layout');if(diagBody){const d=document.createElement('details');d.className='nb-diag-expand';d.innerHTML='<summary>Test audio e volante · dettagli</summary>';diagBody.before(d);d.appendChild(diagBody)}const diagHead=$('view-diagnostics').querySelector('.section-header h1');if(diagHead)diagHead.textContent='Diagnostica';
  const original=$('view-sessions');original.classList.add('nb-session-editor');const panes=original.querySelectorAll('.session-pane');if(panes[0]){panes[0].classList.add('nb-session-create');const explanation=panes[0].querySelector('p.small-copy');if(explanation)explanation.hidden=true;
   const fields=panes[0].querySelectorAll('.field-block,.field-grid,.session-check');const names=['create-favorite','create-known','create-exposure','create-register','create-scenario','create-group','create-story','create-shuffle-examples'];
   const advanced=document.createElement('details');advanced.className='nb-config-advanced';advanced.innerHTML='<summary>Opzioni avanzate <span>⌄</span></summary><div class="nb-advanced-fields"></div>';
   for(const n of [...fields])if(names.some(id=>n.querySelector('#'+id)))advanced.querySelector('div').appendChild(n);
   const create=panes[0].querySelector('#create-session');if(create)create.before(advanced);
   const hints={'create-deck':'Deck che fornisce le card','create-size':'Numero di card da inserire nella sessione','create-language':'Lingua madre per significati e traduzioni','create-direction':'Direzione della domanda, giapponese o lingua madre','create-example-count':'Esempi letti per ogni card','create-sequence':'Ordine e ripetizioni della lettura','create-shuffle':'Mescola le card una volta alla creazione','create-favorite':'Filtra le card in base alla stella. I progressi esistenti non vengono modificati.','create-known':'Includi o escludi le card contrassegnate come note.','create-exposure':'Filtra in base al numero di ascolti completi registrati.','create-register':'Seleziona il registro degli esempi da usare.','create-scenario':'Filtra gli esempi per scenario contestuale.','create-group':'Restringe la sessione a uno specifico gruppo di vocaboli.','create-story':'Seleziona le card collegate a una storia.','create-shuffle-examples':'Mescola gli esempi utilizzati nella sessione senza modificare il deck.'};
   for(const [id,hint] of Object.entries(hints)){const node=$(id);const label=node?.closest('.field-block')?.querySelector('label')||node?.closest('.session-check')?.querySelector('b');if(label&&!label.querySelector('.nb-info')){const i=document.createElement('button');i.type='button';i.className='nb-info';i.textContent='ⓘ';i.title=hint;i.setAttribute('aria-label','Spiegazione: '+hint);i.setAttribute('aria-expanded','false');
     const tip=document.createElement('span');tip.className='nb-help-popover';tip.hidden=true;tip.textContent=hint;
     i.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();const opening=tip.hidden;for(const other of document.querySelectorAll('.nb-help-popover'))other.hidden=true;tip.hidden=!opening;i.setAttribute('aria-expanded',String(opening))});label.appendChild(i);label.appendChild(tip)}}
  }
 }
 function syncDiagnostics(){if(!bridge)return;const data=bridge.getEngineStatus();$('nb-diagnostics-overview').innerHTML=`<div><span>Motore ONNX</span><strong>${data.enabled?'Abilitato':'Disattivato'}</strong></div><div><span>Manifest ONNX</span><strong>${data.ready?'Caricato':'Non verificato'}</strong></div><div><span>Voce del dispositivo</span><strong>${'speechSynthesis'in window?'Disponibile':'Non disponibile'}</strong></div><button type="button" data-nb-view="notebook-errors">Registro errori ›</button>`;}
 function previewBreakdown(){if(!bridge)return;const result=bridge.plan(),events=result.plan.filter(e=>['say','pause'].includes(e.kind));let total=0;const lines=events.slice(0,90).map(e=>{let seconds=e.kind==='pause'?Number(e.seconds)||0:Math.max(.5,String(e.text||'').length/(e.lang==='ja-JP'?6.5:13))/(Number(e.settings?.rate)||1);total+=seconds;return `<div><span>${safe(e.kind==='pause'?'Pausa':e.label||e.type)}</span><span>${e.kind==='pause'?'—':(Number(e.settings?.rate)||1).toFixed(2)+'×'}</span><strong>${e.kind==='pause'?seconds.toFixed(1):'≈'+seconds.toFixed(1)} s</strong></div>`}).join('');
  $('nb-sequence-breakdown').innerHTML=`<p>Breakdown nell'ordine reale · durate parlato stimate, pause esatte</p>${lines}${events.length>90?'<small>Mostrati i primi 90 eventi</small>':''}<b>Totale parziale ≈ ${total.toFixed(1)} s</b>`;
 }
 function closeMenu(){const n=$('nb-nav');n.hidden=true;$('nb-nav-shade').hidden=true;$('btn-menu').setAttribute('aria-expanded','false')}
 function toggleMenu(){const open=$('nb-nav').hidden;$('nb-nav').hidden=!open;$('nb-nav-shade').hidden=!open;$('btn-menu').setAttribute('aria-expanded',String(open))}
 function selectView(v){closeMenu();bridge.closeLegacy?.();bridge.view(v);if(v==='notebook-library')renderLibrary();if(v==='notebook-detail')renderDetail();if(v==='notebook-sequences'){$('drawer-sequence').classList.remove('hidden');previewBreakdown()}if(v==='notebook-appearance')syncAppearance();if(v==='notebook-errors')$('nb-error-log').textContent=bridge.getLog();if(v==='diagnostics')syncDiagnostics();}
 function actions(e){
  const view=e.target.closest('[data-nb-view]');if(view){selectView(view.dataset.nbView);return}
  const resume=e.target.closest('[data-nb-resume]');if(resume){try{bridge.resume(resume.dataset.nbResume)}catch(err){alert(err.message)}return}
  const more=e.target.closest('[data-nb-session-more]');if(more){const id=more.dataset.nbSessionMore,existing=document.querySelector('.nb-session-popover');existing?.remove();const pop=document.createElement('div');pop.className='nb-session-popover';pop.innerHTML=`<button data-nb-session-operation="sessionCopy" data-id="${safe(id)}">Duplica</button><button data-nb-session-operation="sessionArchive" data-id="${safe(id)}">Archivia</button><button data-nb-session-operation="sessionDelete" data-id="${safe(id)}">Elimina</button>`;more.closest('.nb-session-row').appendChild(pop);return}
  const operation=e.target.closest('[data-nb-session-operation]');if(operation){const b=document.createElement('button');b.dataset[operation.dataset.nbSessionOperation]=operation.dataset.id;$('saved-sessions').appendChild(b);b.click();b.remove();document.querySelector('.nb-session-popover')?.remove();fillHome();return}
  const deck=e.target.closest('[data-nb-deck]');if(deck){const data=bridge.data(),id=deck.dataset.nbDeck;if(data.installedDecks.some(d=>d.deckId===id)){selectedDeck=id;selectView('notebook-detail')}else bridge.view('decks');return}
  const install=e.target.closest('[data-nb-install]');if(install&&!install.disabled){bridge.view('decks');return}
  const tab=e.target.closest('[data-nb-tab]');if(tab){libraryTab=tab.dataset.nbTab;renderLibrary();return}
  const theme=e.target.closest('[data-nb-theme-choice]');if(theme){settings.theme=theme.dataset.nbThemeChoice;saveAppearance();applyAppearance();return}
  const action=e.target.closest('[data-nb-action]');if(action){const type=action.dataset.nbAction;if(type==='new-session')bridge.newSession();if(type==='import'){bridge.view('decks');$('deck-import-file').click()}if(type==='search-decks'){searchVisible=!searchVisible;$('nb-library-search').hidden=!searchVisible;if(searchVisible)$('nb-library-search').focus()}return}
 }
 function init(){if(initialized)return;bridge=window.KotobaNotebookBridge;if(!bridge)return;initialized=true;settings=readAppearance();applyAppearance();setUpViews();
  document.addEventListener('click',actions);
  document.addEventListener('kotoba:toggle-menu',toggleMenu);$('nb-close-menu').addEventListener('click',closeMenu);$('nb-nav-shade').addEventListener('click',closeMenu);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  $('nb-advanced-link').addEventListener('click',()=>{closeMenu();bridge.legacySettings()});
  $('nb-library-search').addEventListener('input',renderLibrary);
  $('nb-detail-more').addEventListener('click',()=>selectView('decks'));
  $('nb-create-from-deck').addEventListener('click',()=>bridge.newSession(selectedDeck));
  $('nb-deck-sessions').addEventListener('click',()=>selectView('home'));
  $('nb-font-size').addEventListener('input',updateFontPreview);
  $('nb-font-cancel').addEventListener('click',()=>{$('nb-font-size').value=settings.fontPx;updateFontPreview()});
  $('nb-font-apply').addEventListener('click',()=>{settings.fontPx=Number($('nb-font-size').value);saveAppearance();applyAppearance()});
  $('nb-grid-style').addEventListener('change',e=>{settings.grid=e.target.value;saveAppearance();applyAppearance()});
  $('nb-animations').addEventListener('change',e=>{settings.animations=e.target.checked;saveAppearance();applyAppearance()});
  window.matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change',()=>{if(settings.theme==='auto')applyAppearance()});
  $('nb-backup-export').addEventListener('click',()=>$('backup-export').click());
  $('nb-backup-import').addEventListener('click',()=>{$('view-decks').classList.remove('hidden');selectView('decks');$('deck-import-file').click()});
  $('nb-backup-more').addEventListener('click',()=>alert('Il backup completo contiene deck, sessioni, progressi e impostazioni presenti nel formato originale Kotoba Drive. Gli asset ONNX non vengono esportati.'));
  $('nb-copy-log').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(bridge.getLog())}catch(_){const t=document.createElement('textarea');t.value=bridge.getLog();document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}});
  $('nb-clear-log').addEventListener('click',()=>{$('clear-log').click();$('nb-error-log').textContent=bridge.getLog()});
  $('nb-seq-preview-play').addEventListener('click',()=>bridge.preview());
  $('nb-seq-preview-details').addEventListener('click',()=>{$('nb-sequence-breakdown').hidden=!$('nb-sequence-breakdown').hidden;previewBreakdown()});
  $('nb-sequences-content').addEventListener('change',()=>requestAnimationFrame(previewBreakdown));
  document.addEventListener('kotoba:listen-complete',()=>{if(bridge.getView()==='home')fillHome();if(bridge.getView()==='notebook-detail')renderDetail()});
  document.addEventListener('kotoba:viewchange',e=>{const v=e.detail.view;if(v==='home')fillHome();if(v==='notebook-library')renderLibrary();if(v==='notebook-detail')renderDetail();if(v==='notebook-sequences'){$('drawer-sequence').classList.remove('hidden');previewBreakdown()}if(v==='notebook-errors')$('nb-error-log').textContent=bridge.getLog();if(v==='diagnostics')syncDiagnostics()});
  document.addEventListener('kotoba:deckchange',renderDetail);
  syncAppearance();fillHome();renderLibrary();syncDiagnostics();
 }
 document.addEventListener('kotoba:booted',init);
 // Covers the unlikely case where an embedding booted before this file registered listeners.
 if(window.KotobaNotebookBridge&&window.KotobaDriveQA?.getDecks?.()?.length)queueMicrotask(init);
})();
