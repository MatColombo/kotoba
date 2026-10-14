# Kotoba Drive v0.4.0 — Guida e note di rilascio

PWA statica gratuita per ripassare vocaboli giapponesi N4 dall'iPhone con sintesi vocale e controlli multimediali sperimentali. **La release tecnica v0.4.0 è pronta da distribuire su GitHub Pages, ma non è ancora certificata su Safari/iPhone o su un'autoradio reale. I contenuti contestuali restano in revisione linguistica.**

## Installazione / aggiornamento GitHub Pages

1. Dalla PWA attualmente installata aprire **☰ → Deck e backup → Esporta study.json** e, meglio ancora, **Backup completo (deck + studio)**. Conservare i file fuori dall'iPhone.
2. Estrarre il pacchetto `kotoba-drive-v0.4.0-github-pages.zip`.
3. Caricare **i file e le cartelle estratti**, non lo ZIP, nella root del repository GitHub (`index.html`, `service-worker.js`, `decks/`, ecc.).
4. In **Settings → Pages** selezionare `Deploy from a branch`, branch `main`, `/ (root)`.
5. Attendere la pubblicazione HTTPS, aprire `https://USERNAME.github.io/REPOSITORY/` in Safari e ricaricare. La versione in alto deve indicare **v0.4.0**.
6. Per l'installazione dalla schermata Home: in Safari usare **Condividi → Aggiungi alla schermata Home**. Se compare ancora la versione precedente, chiudere la PWA, aprire una volta il sito in Safari e riavviare la PWA; può essere necessario attendere l'aggiornamento del Service Worker.
7. Verificare subito deck, sessioni salvate, lingua, master TTS, sequenze e preferiti. Se mancano dati, usare l'importazione del backup anziché cancellare l'app.

Non cancellare il vecchio sito o i dati di Safari prima di aver verificato il backup. Lo storage iOS può essere rimosso dal sistema: esportare periodicamente `study.json`.

## Funzioni principali

- **Audio e capitoli:** compilatore di eventi deterministico, pause annidate, ripetizioni, sezioni navigabili con i controlli multimediali disponibili.
- **Audio master:** velocità (`rate`), tono (`pitch`), volume per `ja-JP`, `it-IT`, `en-US`; override separati per gruppo ed elemento.
- **Deck e memoria separati:** `decks/n4-core.json` contiene il materiale didattico, IndexedDB conserva progressi, sessioni e sequenze, esportabili in `study.json`.
- **Sessioni:** filtri, shuffle una volta sola, ordine e posizione persistenti, stella preferito e flag Noto, contatori di ascolti, percentili di esposizione.
- **Contenuti:** 75 vocaboli; 750 esempi originali conservati; 2.250 esempi contestualizzati **in bozza**; 30 scenari, 8 gruppi e 8 storie.
- **Voce sandbox:** `voice-sandbox.html` è separato e sperimentale; non assegna voci differenti alle frasi dei deck.

## Gestione dati e backup

| File / archivio | Contenuto | Portabilità |
|---|---|---|
| `decks/n4-core.json` | Vocabolario, forme, esempi, scenari, storie e ID stabili | Condivisibile, indipendente dai progressi |
| `IndexedDB` | Dati operativi locali e transazioni | Legato all'installazione/browser |
| `study.json` | Sessioni, `deckId` / `cardId`, ascolti, preferenze, sequenze e master | Esportabile/importabile; **non** include il testo dei deck |
| Backup completo | `format: kotoba-backup`, deck e studio | Consigliato per trasferire l'app su un altro dispositivo |

L'importazione confronta versioni e ID: le aggiunte vengono riconciliate, mentre rimozioni e cambio ID richiedono intervento o scelta esplicita. **Prima di una sostituzione o di un aggiornamento del deck**, la PWA salva una copia recuperabile nell'archivio locale `pre-import-backup`. La si può scaricare tramite **Deck e backup → Backup prima dell'ultima importazione**. Il backup di sicurezza conserva l'ultima operazione soltanto; non sostituisce i download manuali, soprattutto prima di un aggiornamento della PWA stessa.

Se importi `study.json` su un dispositivo diverso, installa prima gli stessi deck (stessi `deckId` e ID delle carte). La fusione adotta il massimo dei contatori anziché sommarli; non può ricostruire cronologie complete da soli contatori aggregati.

## Riproduzione e definizione delle statistiche

Un ascolto **completo** viene conteggiato soltanto quando la sequenza termina naturalmente, senza salto di capitolo o errore TTS. Una riproduzione interrotta dopo l'avvio può costituire un ascolto **parziale**. Pause, salti e callback TTS ritardate non attribuiscono completamenti. Se il sistema non può pronunciare un elemento o interviene un timeout, la sequenza si arresta e la carta non viene considerata completamente ascoltata.

Il percentile rappresenta la **frequenza di esposizione**, non la conoscenza linguistica. I contatori uguali sono mantenuti nella stessa fascia; "Noto" è una classificazione esplicita effettuata dall'utente. Lo shuffle è fissato e registrato alla creazione della sessione.

## Architettura

- `source/engine.js`: sequenze, profili audio, SpeechAdapter, PlaybackController, navigazione capitoli.
- `source/storage.js`: contratti JSON, differenze tra deck, import/export, repository IndexedDB e backup atomici.
- `source/sessions.js`: filtri, shuffle, percentili, contatori e checkpoint.
- `source/content.js`: selezione di registri, esempi e storie.
- `source/app.js`: UI e collegamento dei componenti.
- `source/template.html`, `source/app.css`, `source/build_index.py`: sorgenti e costruzione di `index.html` monolitico compatibile con GitHub Pages.
- `decks/catalog.json`: catalogo statico (URL relativi); `schemas/`: JSON Schema per file portabili.
- `service-worker.js`: cache versionata per risorse statiche. Dati personali **non** salvati nella Cache API.

Per ricostruire `index.html`: `python3 source/build_index.py`. La build pubblicata è generata dai sorgenti; evitare di modificare solo `index.html` se si vogliono mantenere modifiche successive.

## Test e verifica

```bash
npm test
python3 tools/validate_content.py
python3 tests/browser_phase5_mock.py
node tools/bench-release.cjs
```

I test browser con storage **simulato** richiedono Playwright Python e Chromium. Non testano IndexedDB reale. `TEST_REPORT.md` distingue ciò che è stato verificato da ciò che richiede un iPhone. `GUIDA_TEST_IPHONE.md` include la checklist manuale. `PERFORMANCE_DATA.json` raccoglie le misure eseguite su Node nel container, non sull'iPhone.

## Limitazioni note

- **iPhone Safari:** funzionamento reale con voci TTS, IndexedDB persistente, Wake Lock, ricaricamento della PWA e ricezione dei comandi Bluetooth **da verificare sul dispositivo**.
- Il TTS giapponese/iOS può esporre soltanto Kyoko standard; la PWA non può richiedere tutte le voci installate. Voce offline non garantita.
- La Media Session API non assicura che `nexttrack`/`previoustrack` del volante siano inoltrati alla PWA.
- **Contenuti:** 2.250 esempi sono derivazioni situazionali delle frasi originali, non dialoghi naturali riscritti nei tre registri; il keigo non è verificato. 201 segnalazioni automatiche richiedono revisione umana. Non utilizzare questi esempi come riferimento di correttezza definitiva.
- Il controllo "Esporta backup prima dell'ultima importazione" dipende anch'esso dalla persistenza IndexedDB; conservare sempre una copia scaricata altrove.
- Nessun mixing Web Audio, enfasi SSML, backend, riconoscimento vocale o voci assegnate ai personaggi.

**Sicurezza durante la guida:** preparare sessione, filtri e impostazioni a veicolo fermo. Non interagire con lo schermo durante la guida.
