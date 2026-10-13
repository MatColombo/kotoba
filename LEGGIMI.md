# Kotoba Drive — demo gratuita N4 (iPhone)

Demo senza account, backend, API a pagamento o librerie esterne. Dati locali: **25 termini** (10 verbi, 5 sostantivi, 5 aggettivi な, 5 aggettivi い), **10 esempi per termine = 250 frasi**, con giapponese, lettura completa in kana, traduzione italiana e inglese. Ogni termine comprende coniugazioni grammaticali appropriate alla categoria.

## Come usare la demo

1. **Su computer:** apri `index.html` in Chrome, Edge o Safari. Non servono installazioni. Aprendo il file locale, la modalità PWA/offline tramite Service Worker non è attiva, ma contenuti e funzioni base sono incorporati.
2. **Su iPhone:** pubblica gratuitamente i file del pacchetto su un hosting statico con HTTPS (per esempio Cloudflare Pages o GitHub Pages); apri poi l'URL pubblico in Safari. Non è necessario comprare un dominio. Se vuoi, scegli **Condividi → Aggiungi alla schermata Home**.
3. Tocca **IT** o **EN** per cambiare in qualsiasi momento lingua madre. Cambiano significati, traduzioni degli esempi e lingua della voce di risposta.
4. In **Vocabolario** puoi cercare e filtrare le parole, ascoltare singolarmente le parole, le coniugazioni, le frasi giapponesi o le traduzioni, oppure avviare la lettura di 10 esempi.
5. In **Studio audio** scegli direzione, categorie, quantità di parole, pausa di richiamo, lettura opzionale delle coniugazioni, esempi e traduzioni. Premi **Avvia audio** **prima** di cominciare a guidare. Le sessioni sono di 20 termini per impostazione iniziale; il catalogo completo è di 25 perché la ripartizione richiesta (10+5+5+5) dà 25.
6. In **Test volante**, **da fermo**, avvia la traccia diagnostica e premi i pulsanti del volante. Cerca nel registro eventi etichettati `MEDIA`. Quelli etichettati `SIMULATO` sono solo simulazioni via pagina.

## Controlli previsti

- Prossima traccia / salto avanti: registra "nota" e passa alla parola successiva.
- Precedente traccia / salto indietro: registra "difficile" e ripete la parola.
- Play/pausa: sospende o riprende la sessione.

**Questa è una sperimentazione:** su iPhone il browser può non ricevere i comandi hardware dal volante, anche quando la Media Session API risulta disponibile. La demo usa in via facoltativa un file audio MP3 quasi silenzioso come bridge per attivare la sessione multimediale; la sintesi vocale usa `speechSynthesis` con le voci che il dispositivo mette a disposizione. Il comportamento in Bluetooth e la simultaneità fra TTS e audio vanno verificati sul dispositivo reale. Non possiamo garantirli con un test in Chromium. In mancanza di comandi hardware, lo studio resta utilizzabile con riproduzione automatica.

## Offline e dati

Le parole e le frasi sono già dentro `index.html`; non vengono inviate a un server. Se distribuita su HTTPS, la PWA registra un Service Worker che salva in cache la pagina e gli asset principali. L'effettiva disponibilità delle voci TTS offline dipende dalle voci installate e da iOS. Contenuti e stato dei ripassi sono salvati localmente nel browser; il sistema operativo potrebbe eliminare dati e cache in condizioni particolari.

## Struttura file

- `index.html`: demo pronta per hosting e auto-contenuta (HTML, CSS, JavaScript, lessico e audio di supporto incorporati).
- `vocab.json`: dataset originale per futuri ampliamenti.
- `manifest.webmanifest`, `service-worker.js`, `icon.svg`, `icon-192.png`, `icon-512.png`: asset PWA.
- `source/template.html`, `source/build_index.py`, `source/bridge.mp3`: codice modificabile per rigenerare `index.html` dopo una modifica a `vocab.json` (copiali insieme alla radice se vuoi eseguire `python3 build_index.py`).

## Modifica del vocabolario

Ogni voce in `vocab.json` ha `pos`, `jp`, `kana`, `meaning.it`, `meaning.en`, `forms` e `examples` (10 oggetti con `jp`, `kana`, `it`, `en`). Il file va verificato linguisticamente prima di un eventuale rilascio pubblico. Per rigenerare, copia il contenuto di `source/` nella directory che contiene `vocab.json` ed esegui `python3 build_index.py`.

**Nota N4:** livello indicativo; il JLPT non pubblica una lista ufficiale di vocaboli/grammatica per i livelli post-2010. Alcune frasi usano vocaboli aggiuntivi più complessi per offrire contesti non banali.

**Sicurezza:** configura la sessione e verifica i controlli soltanto a veicolo fermo. Nessuna funzione della demo deve richiedere di guardare o toccare lo schermo durante la guida.
