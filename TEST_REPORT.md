# Kotoba Drive v0.4.0 — Rapporto di test (14 ottobre 2026)

## Risultati effettivamente verificati

| Sistema | Verifica | Esito |
|---|---|---|
| Node 22 | `npm test` | **73/73 superati** |
| Motore audio | Ripetizioni, pause, master, gerarchia, stop, timeout, TTS fail, callback tardive | Test con fake TTS e scheduler superati |
| Deck & backup | Schema/ID, aggiornamento additivo, remap, rimozioni, backup atomico, import duplicato | Test funzionali e transazionali simulati superati |
| Sessioni | Shuffle, checkpoint, classificazione, complete/partial, percentili, filtri | Test unitari superati |
| Service Worker | Cache di deck e fallback navigazione offline, pulizia versioni, cross-origin e POST | Test in ambiente Service Worker simulato superati |
| Contenuti | 75 carte, 750 esempi originali, 2.250 nuovi, 30 scenari, 8 storie, 38 segmenti | **0 errori strutturali** |
| Chromium `set_content` | Browser con database e TTS **simulati** | UI e navigazione, 5 viewport, errori JS: **0** |
| Prestazioni (Node) | Parse, validazione, compilazione, filtri su deck reale | Vedi `PERFORMANCE_DATA.json` |

## Qualità linguistica

- **201** segnalazioni automatiche in `CONTENT_QA.json` (possibili problemi morfologici/di matching, non errori accertati).
- **Revisione madrelingua: NON effettuata.** I registri, soprattutto il keigo, sono in fase di bozza.

## Test non eseguiti o non dimostrabili qui

- IndexedDB *reale* tra riavvii di un browser: **non verificato**. Chromium blocca la navigazione su URL di prova in questo ambiente; le simulazioni non equivalgono a verifica IndexedDB reale.
- Installazione reale e aggiornamento PWA su Safari iPhone: **non verificati**.
- Comportamento offline su iPhone (Service Worker e voci TTS installate): **non verificato**.
- Volume, tono e velocità *effettivamente percepiti* in Kotoba Drive 0.4.0 su iPhone: **non testati**, nonostante la sandbox precedente abbia funzionato sull'iPhone dell'utente.
- Comandi Bluetooth fisici del volante, telefonate/interruzioni e Wake Lock: **non verificati**.
- Autenticità linguistica dei 2250 esempi nei 3 registri: **non certificata**.

## Decisione di rilascio

**Build statica 0.4.0 prodotta e verificata automaticamente.** Non è corretto definirla universalmente stabile o certificata su iOS. La compatibilità iPhone richiede esecuzione della checklist in `GUIDA_TEST_IPHONE.md`. Il materiale didattico contestuale resta esplicitamente in revisione.
