# Kotoba Drive v0.2 — PWA audio giapponese N4

Una webapp statica, gratuita, senza account né API a pagamento. Ottimizzata per iPhone tenuto con lo schermo acceso. **I comandi del volante via Bluetooth restano sperimentali e devono essere verificati sull'auto reale, da fermi.**

## Pubblicazione gratuita su GitHub Pages

1. Estrai tutti i file del pacchetto ZIP.
2. Apri un repository GitHub **pubblico**, per esempio `kotoba-drive`.
3. Carica i file nella radice del repository. **`index.html` deve stare nella root**, non dentro `source/` né dentro un'altra cartella.
4. In **Settings → Pages**, seleziona **Deploy from a branch**, branch `main` e cartella `/ (root)`.
5. La pagina sarà accessibile a `https://TUO-USERNAME.github.io/kotoba-drive/` (l'attivazione può impiegare qualche minuto).
6. Sul telefono, apri l'URL con Safari. Facoltativo: **Condividi → Aggiungi alla schermata Home**.

Se aggiorni una versione precedente: sovrascrivi i file con gli stessi nomi, assicurati di aggiornare **anche `service-worker.js`**, pubblica le modifiche e riapri la pagina in Safari. In caso di cache temporaneamente vecchia, chiudi e riapri la PWA dopo l'aggiornamento del service worker.

## Novità v0.2

- La schermata iniziale è una **flashcard a tutta altezza** (niente scroll verticale sulla pagina principale). Le altre sezioni sono accessibili con il **menu ☰**.
- In **Impostazioni → Direzione**, la card inverte correttamente domanda e soluzione: lingua madre → giapponese o giapponese → lingua madre. Le forme ed esempi rimangono nascosti finché non si rivela la risposta.
- In **Impostazioni → Esempi da leggere** puoi scegliere **0–10 esempi** per vocabolo. L'indice degli esempi avanza a ogni parola completata.
- In **Impostazioni → Coniugazioni da leggere** puoi scegliere tutte le forme o le prime 1–6. L'opzione **Annuncia la forma grammaticale** pronuncia l'etichetta *nella lingua madre*, ad esempio «forma te», «forma masu», seguita dalla forma in giapponese.
- In **Sequenza audio** puoi riordinare i gruppi e gli elementi con ↑/↓, spostare elementi fra gruppi, duplicarli aggiungendo nuovi elementi, attivarli/disattivarli con una casella, e ascoltare l'anteprima di un singolo elemento con ♪.
- Ogni **elemento** ha un numero di ripetizioni e una pausa extra dopo l'elemento. Ogni **gruppo** ha un numero di ripetizioni e una pausa extra alla fine di **ogni ripetizione del gruppo**. La **pausa fra letture** è comune a tutte le battute vocali ed è additiva rispetto alle pause specifiche.
- L'ordine della sequenza audio è memorizzato **separatamente per le due direzioni di traduzione**, e tutte le impostazioni vengono salvate nel browser.
- Puoi provare un preset **«Parola ×2 · gruppo ×3»** che legge `parola giapponese, parola giapponese, significato` **tre volte di seguito**. I gruppi delle coniugazioni ed esempi rimangono disponibili dopo questo blocco.
- Quando **Esempio giapponese** e **Traduzione esempio** sono consecutivi nello stesso gruppo, vengono letti a coppie per tutti gli esempi scelti: frase1→traduzione1→frase2→traduzione2, e così via.
- Un'impostazione **Mantieni lo schermo acceso** prova la Screen Wake Lock API durante la sessione. L'effettivo supporto dipende da Safari/iOS.

## Controlli del volante (ancora da testare)

La webapp prova a mappare play/pausa, traccia precedente e traccia successiva tramite Media Session API. Può mantenere un file MP3 quasi silenzioso in sottofondo per registrarsi come lettore multimediale, con il rischio che alcune configurazioni iOS gestiscano diversamente la sintesi vocale in parallelo. Vai in **☰ → Test volante** a veicolo fermo per distinguere gli eventi `MEDIA` reali dagli eventi `SIMULATO`. La presenza dell'API **non** significa che i pulsanti hardware funzioneranno.

## Contenuto e costi

Il dataset originale contiene **25 termini** (10 verbi, 5 sostantivi, 5 aggettivi な, 5 aggettivi い), con **250 frasi** (10 per vocabolo), lettura kana e traduzioni in italiano e inglese. Il livello JLPT N4 è indicativo. Non ci sono chiamate a servizi cloud TTS, ma la sintesi vocale Web Speech API richiede che il dispositivo disponga delle voci necessarie, e il funzionamento offline delle voci dipende da iOS.

Non serve installare librerie JavaScript o utilizzare un processo di build per la pubblicazione: il file `index.html` contiene già HTML, CSS, JavaScript, vocabolario e una traccia audio incorporata. I progressi e la configurazione vengono memorizzati localmente; una cancellazione dei dati di Safari può eliminarli.

## File inclusi

- `index.html` — pagina auto-contenuta pronta per GitHub Pages e anteprima locale
- `vocab.json` — dati strutturati dei 25 termini / 250 esempi
- `manifest.webmanifest`, `service-worker.js`, icone — installabilità PWA e cache
- `source/template.html`, `source/app.css`, `source/app.js`, `source/build_index.py` — sorgenti modificabili
- `bridge.mp3` — traccia quasi silenziosa utilizzata per rigenerare la pagina
- `source/qa.py`, `source/qa_playback.py` — test browser, non necessari per usare la webapp

### Ricompilare dopo una modifica al dataset o al codice

Da una macchina con Python 3 installato, esegui `python3 source/build_index.py` nella cartella del progetto. Ricarica quindi `index.html` e `service-worker.js` su GitHub.

I test automatici sono stati eseguiti su Chromium per i layout 390×844, 375×667, 320×568 e desktop 1440×900, incluse le sequenze audio con Web Speech API simulata. **Non sono test su Safari/iPhone fisico**.

**Sicurezza**: imposta durata, sequenza e contenuti mentre sei fermo; evita di usare lo schermo mentre guidi.


## Laboratorio voci (standalone)

Apri `/voice-sandbox.html` dal dominio GitHub Pages per selezionare fino a tre voci e testare alternanza, velocita, tono e volume. Questo laboratorio non altera i dati del deck o delle sessioni.
