# Changelog — Kotoba Drive v0.4.0

## Stabilizzazione della Fase 5

- **Playback:** un errore di Web Speech (`unavailable`, `error`, `timeout`) arresta l'esecuzione. Non è più possibile completare una carta quando la pronuncia è fallita. Il watchdog cancella la voce in timeout; callback tardive non completano sessioni precedenti.
- **Memoria:** i checkpoint vengono salvati quando il TTS inizia realmente a parlare e allo stop; le esposizioni complete richiedono fine naturale. Un ascolto interrotto può diventare parziale.
- **Import e backup:** prima della sostituzione di `study.json`, di un backup completo o di un aggiornamento manuale di deck esistente si salva un **backup di sicurezza nell'archivio IndexedDB**, in transazione con l'operazione. Nuovo comando per scaricarlo.
- **Validazione JSON:** controlli aggiuntivi su oggetti annidati malformati, ID e duplicati di sessioni, sequenze e gruppi. Conservata compatibilità con sequenze legacy sparse.
- **UI:** corretta l'etichetta "10 esempi" e aggiornata la versione visibile a 0.4.0, mantenendo evidente la revisione incompleta dei contenuti.
- **Distribuzione:** cache Service Worker aggiornata, build GitHub Pages ricostruita, PWA offline con asset statici precache; backup personali non inseriti nella cache.
- **QA:** 73 test Node (inclusi playback fault, backup atomico e simulazione offline SW), validazione contenuti, browser simulato su cinque viewport, benchmark riproducibile.

## Storia delle fasi precedenti

- **Fase 1:** riproduzione per capitoli, sequenze multiple, pause annidate, master TTS JA/IT/EN e override gruppi/elementi.
- **Fase 2:** deck JSON e `study.json` separati, IndexedDB, catalogo, riconciliazione e import/export.
- **Fase 3:** sessioni persistenti, shuffle, filtri, preferiti, noti, percentili e contatori.
- **Fase 4:** trenta scenari, tre registri, 2.250 esempi contestualizzati in bozza, otto storie.

Verifiche **non completate**: Safari iPhone reale, IndexedDB browser reale, ricezione Bluetooth fisica e revisione madrelingua del dataset.
