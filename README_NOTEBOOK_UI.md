# Notebook UI v0.1.1 — aggiornamento

Vedi `NOTEBOOK_UI_FIX_v011.md` per installazione e modifica della riga kana, layout e highlight.

# Kotoba Drive — Notebook UI v0.1 (documentazione della baseline)

Questa è la prima integrazione delle schermate approvate nella v0.4.6 ONNX/ibrida. **Non cambia il motore di sintesi né il formato dei deck o dei progressi.**

## Installazione della patch su Kotoba Drive esistente (consigliata)

1. Fai una copia o un commit del repository corrente e un backup dei dati di studio dalla PWA.
2. Estrai `Kotoba_Drive_Notebook_UI_v01_patch.zip` **nella directory principale di Kotoba Drive**, sovrascrivendo i file indicati. La cartella `onnx/`, le cartelle di dati locali e `.git` non vanno cancellate.
3. Dalla directory principale esegui:

```powershell
$Py = "C:\Users\colomma004\Documents\development\other\LLM\TTS\kotoba_japanese_onnx\.venv\Scripts\python.exe"
& $Py .\source\build_index.py
& $Py -m http.server 8765
```

4. Apri `http://localhost:8765/` per il test sul PC. Non cancellare i dati del sito. Se usi il sito GitHub Pages, **usa lo stesso indirizzo e browser** per continuare a vedere sessioni e progressi già memorizzati in IndexedDB.
5. Pubblica `git push` solo dopo i test. Il service worker ha una nuova chiave di cache (`notebook-01`); al primo accesso dopo il deploy chiudi e riapri la PWA, senza eliminare i dati del sito.

**Nessun re-export ONNX necessario:** la patch non contiene pesi modello. Conserva `onnx/manifest.json`, tokenizer, indici e file ONNX già generati. Se l'indice del deck `openjlpt-n5` manca, rigeneralo con `& $Py .\tools\prepare_kotoba_onnx.py --lab $Lab --tokens-only` e verifica con `& $Py .\tools\verify_onnx_deploy.py`, usando `$Lab` già configurato sul tuo PC.

## Schermate

- **Home**: nome e icona, payoff, andamento 7 giorni, streak, ultime parole, sessione da riprendere, elenco sessioni (scroll solo in questa area).
- **Studio**: termine e significato affiancati, tutte le forme disponibili in righe con wrap, esempi sotto e termine in viola, contorno verde acqua sull'area in lettura, navigazione card separata dai passi audio, player ONNX con fase di caricamento nel cerchio Play.
- **Configurazione sessione**: modulo originale in pagina dedicata, filtri avanzati raggruppati e aiuti `ⓘ` espandibili.
- **Libreria**: Installati/Catalogo, ricerca, importazione JSON da entrambe le schede; dettaglio deck con storico degli ascolti completo disponibile e statistiche giornaliere registrate da questa release.
- **Sequenze**: editor originale a elementi e gruppi, con controlli ripetizioni visibili, preview audio e pannello espandibile con durata stimata di ogni evento e pause.
- **Audio e voci**: tutti i controlli ONNX/ibridi originali, Audio master e impostazioni per lingua, trasferiti nella pagina dedicata senza clonare gli input.
- **Aspetto**: Paper, Graphite, Auto; quadrettatura Assente/Tenue/Visibile; animazioni; dimensione Studio con anteprima visuale 6–30 px e Applica/Annulla.
- **Backup e dati / Diagnostica / Registro errori**: backup con le procedure esistenti; test tecnici e log originali conservati, Registro errori accessibile da Avanzate e Diagnostica.

## Compatibilità e limiti di questa beta

- ONNX in Safari iOS **non è stato eseguito** in questa build. La riuscita del laboratorio ONNX precedente non costituisce test di questa integrazione.
- I test browser eseguiti coprono il layout e le interazioni della nuova interfaccia **con dati/bridge simulati**, non la riproduzione audio reale. Nei test sulle dimensioni 320, 390 e 1440 px non sono comparsi errori JavaScript o overflow orizzontale.
- I grafici degli ultimi 7/30 giorni iniziano a raccogliere eventi **dopo l'installazione** di Notebook UI. Non si ricostruiscono cronologie giornaliere non presenti nello storico. I conteggi storici `exposures`, stellati e noti restano visibili.
- Preferenze Notebook e cronologia giornaliera sono salvate separatamente in `localStorage` (`kotoba-notebook-appearance-v1` e `kotoba-notebook-listens-v1`); **non fanno parte del backup originale**. I progressi di studio, i deck e le sessioni rimangono in IndexedDB con il formato originale.
- Il breakdown della sequenza usa pause effettivamente configurate e **stime** della durata del parlato, non misure PCM. Il preview audio continua a usare il compilatore delle sequenze originale.
- L'interfaccia è studiata per evitare lo scroll del documento; nei casi in cui contenuti, zoom o font superano lo spazio disponibile, scorre il singolo pannello dedicato.
- Il catalogo e la compatibilità ONNX di un deck importato continuano a dipendere dagli asset di pretokenizzazione esistenti.

## Test

- `npm test`: **105/105** superati, inclusi 4 controlli statici della nuova UI.
- Esami visuali con Chromium a 320×640, 390×844 e 1440×900 su Home, Studio, Libreria, Dettaglio, Aspetto, Backup e Registro errori. Sono **test di layout con dati simulati**, non test audio end-to-end.
- In Chromium mock: tema Graphite, anteprima font 6 px, Annulla/Applica, menu, schede Libreria, statistiche e dettaglio deck verificati.
- I file `source/engine.js`, `source/onnx-tts.js`, `source/storage.js`, `source/sessions.js`, `source/content.js`, `tts-worker.js`, e i deck completi N4/N5 sono stati confrontati byte per byte con la v0.4.6 e risultano **invariati**.

## Rollback

Torna al commit di prima della patch oppure ripristina i file dal backup del repository. L'installazione di Notebook UI non migra né elimina IndexedDB. Usa la funzione di backup di Kotoba prima di sostituire i file pubblicati.
