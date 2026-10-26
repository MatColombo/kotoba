# Pubblicazione Kotoba Drive v0.4.4 — N4 e N5 completi

Il progetto include due nuovi file pubblicabili su GitHub Pages:

- `decks/n4-final-kotoba-drive.json`: 630 vocaboli N4; 18.900 esempi contestuali; 1.238 originali.
- `decks/n5-final-kotoba-drive.json`: 674 vocaboli N5; 20.220 esempi contestuali; 1.320 originali.

`decks/catalog.json` pubblica **soltanto questi due deck completi**. Il vecchio `decks/n4-core.json` (75 carte, rev. 6) e `decks/jlpt-n5-openjlpt.json` (anteprima) restano nel repository per compatibilità storica, ma non vengono più proposti dal catalogo. I nuovi ID sono `kotoba-n4-final` e `kotoba-n5-final` e i progressi non sono trasferiti o cancellati automaticamente.

## Scegli quale archivio applicare

- **`KotobaDrive-v0.4.4-N4-N5-online.zip` (consigliato):** contiene la versione completa dell'app e i due deck, senza la cartella `.git`. Dopo averlo estratto, copia il contenuto della sottocartella `kotoba/` nella radice del tuo repository. Usalo se il branch remoto potrebbe essere diverso dalla versione allegata.
- **`KotobaDrive-v0.4.4-update-main.zip`:** contiene soltanto i 17 file aggiunti/modificati rispetto al `kotoba.zip` caricato. Usalo solo se la tua copia Git usa già la stessa versione di partenza.

## Pubblicare dalla cartella Git esistente con Git Bash

1. Esegui il backup dei dati di studio nella PWA: **Deck e backup → Backup completo**.
2. **Prima di estrarre l'aggiornamento**, porta la tua copia locale di `main` alla versione online. Se ci sono modifiche non committate, salvale in una copia/commit e non cancellarle:

```bash
git switch main
git pull --ff-only origin main
```

3. Estrai l'archivio scelto sopra la **radice della cartella Git locale** (quella con `.git`): per il pacchetto completo copia il **contenuto** di `kotoba/`, per il pacchetto aggiornamento estrai direttamente la radice. Non cancellare `.git`.
4. Dalla cartella del repository verifica le modifiche e i test:

```bash
git status --short
npm test
python3 source/build_index.py
git -c core.whitespace=cr-at-eol diff --check
git diff --stat
```

5. Pubblica **soltanto dopo aver esaminato `git diff` e verificato i permessi di redistribuzione degli esempi di origine**:

```bash
git add decks/catalog.json decks/n4-final-kotoba-drive.json decks/n5-final-kotoba-drive.json service-worker.js package.json manifest.webmanifest source/app.js source/template.html index.html README.md CHANGES.md LEGGIMI.md ONLINE_DECKS_DEPLOY.md tests/content.test.cjs tests/storage.test.cjs tests/online-complete-decks.test.cjs tests/service-worker.test.cjs
git commit -m "Publish complete JLPT N4 and N5 decks in online catalog"
git push origin main
```

**Nota su Git:** se `git pull --ff-only` segnala modifiche locali o rami divergenti, non usare `reset --hard`. Risolvi prima le differenze e conserva i file personali. I comandi sopra presuppongono una copia già aggiornata del repository e senza conflitti.

Se GitHub Pages pubblica da `main` / `(root)`, dopo il deploy verifica:

```text
https://<utente>.github.io/<repository>/decks/catalog.json
https://<utente>.github.io/<repository>/decks/n4-final-kotoba-drive.json
https://<utente>.github.io/<repository>/decks/n5-final-kotoba-drive.json
```

## Utilizzo nell'app

1. Apri la PWA aggiornata (intestazione `v0.4.4`).
2. Apri **Deck e backup** → **Catalogo online**.
3. Premi **Installa** accanto a N4 completo e conferma l'anteprima; ripeti per N5.
4. Da **Deck installati**, premi **Apri deck** per attivare N4 completo o N5 completo.
5. Una volta installati, i deck restano in IndexedDB e sono disponibili offline sullo stesso browser/dispositivo.

Il sito conserva il piccolo deck N4 precedente come starter, senza modificarne ID o progressi. I due deck completi **non vengono scaricati automaticamente**, e non sono nel precache del Service Worker: sarebbe un download forzato di oltre 30 MiB anche per chi usa solo N4 o solo N5. Per uno studio offline occorre installare i deck mentre è disponibile una connessione.

## Note su qualità, pubblicazione e limiti

- I JSON caricati sono gli artefatti forniti dall'utente, copiati senza riscrivere i vocaboli, le traduzioni o gli ID.
- Gli esempi non sono stati tutti revisionati da un madrelingua; la validazione automatica non è una certificazione linguistica.
- Gli esempi originari conservati in `legacyExamples` possono avere condizioni di riutilizzo/attribuzione: verificare licenze e provenienza prima di rendere pubblico il repository.
- L'importazione nel browser può essere soggetta a limiti di spazio IndexedDB (in particolare su Safari/iPhone); si consiglia il backup dei progressi. Test automatici non sostituiscono il test reale su iPhone.
- Per una nuova revisione contenutistica, incrementare il campo `revision` nel file deck e nel catalogo, conservando invariati gli ID.
