# Report di verifica — Kotoba Drive v0.4.1

## Automatici eseguiti

| Verifica | Esito |
|---|---|
| `npm test` (Node.js, motore/deck/storage/sessioni/SW) | **81/81 passati** |
| Esempi contestuali | **2.250** nuove frasi giapponesi, globalmente uniche |
| Confronto testuale con 750 esempi precedenti | **0 frasi identiche** |
| Distribuzione | 75 carte × 3 registri × 10 esempi |
| Diversità etichette grammaticali | Almeno **12** etichette distinte per carta |
| `tools/validate_content.py` | **0 errori strutturali, 0 segnalazioni euristiche**, revisione madrelingua **non eseguita** |
| Conservazione delle 750 frasi originali e degli ID delle carte | Testata |
| Sessioni con shuffle esempi indipendente, seed, ordine per ID e filtri | Testata a livello di funzioni |
| Contatore del significato dopo fine TTS, separato dall'esposizione | Test unitario e browser simulato |
| Backup/import ripetuto: conteggio significati via massimo | Testato a livello di funzioni |
| Service Worker cache offline e pulizia vecchie versioni | Test automatici simulati |

## Browser con archivio e sintesi simulati

`tests/browser_revision041_mock.py` in Chromium headless: **passato**.

Controllati: rivelazione inizialmente nascosta, salto capitolo in avanti che svela tutto, rivelazione persistente negli altri capitoli, reset alla card successiva, sessione con shuffle esempi attivo e shuffle carte disattivo, contatore incrementato da lettura significato conclusa, dettaglio vocabolo aggiornato, viewport 320 × 568 / 390 × 844 / 1366 × 768 senza scroll pagina e senza errori JavaScript. Sul viewport 320 è stato corretto un collasso iniziale della parola giapponese.

La nuova zona esempi usa `overflow:hidden` e scorrimento CSS per testo troppo alto; movimento ridotto rispettato. Il risultato visivo effettivo deve essere controllato su iPhone.

## Test non eseguiti o non conclusivi

- **IndexedDB reale con pagina ricaricata:** tentata navigazione Chromium verso origin HTTPS sintetico, bloccata da `ERR_BLOCKED_BY_ADMINISTRATOR`. Non dichiarata superata.
- **Safari iPhone reale, sintesi vocale, persistenza tra chiusure e comandi volante:** da eseguire sul dispositivo.
- **Revisione linguistica madrelingua di ogni frase e delle otto storie:** non eseguita. I 2.250 esempi sono nuove bozze, non testi grammaticalmente certificati.

## Rilascio

La build monolitica `index.html` viene generata da `source/` con `python3 source/build_index.py`; il deck N4 integrato è versione 6. Il pacchetto statico è predisposto per GitHub Pages ed è accompagnato da sorgenti, schemi e istruzioni. L'installazione effettiva su GitHub non è stata eseguita da questo ambiente.

## Verifica aggiuntiva di concordanza temporale

Individuati e corretti 58 casi con aggettivi al passato in giapponese ma traduzione inglese al presente. Aggiornate inoltre le traduzioni parallele al passato e al negativo generate dagli stessi modelli; test regressione aggiunto. Non rappresenta una verifica globale delle 2.250 frasi.
