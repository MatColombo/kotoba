# Kotoba Drive v0.4.2 — Istruzioni

Versione di aggiornamento della PWA Kotoba Drive v0.4.0. Hosting gratuito GitHub Pages, Web Speech API e IndexedDB, senza backend.

## Aggiornamento dal sito esistente

1. **Prima di installare la nuova versione** aprire la PWA attuale → **☰ → Deck e backup → Esporta study.json**, e possibilmente **Backup completo (deck + studio)**. Conservare il file al di fuori dell'app.
2. Scaricare ed estrarre `kotoba-drive-v0.4.2-github-pages.zip` e caricare tutti i file estratti nella root del repository GitHub Pages; non caricare il file ZIP tal quale.
3. Assicurarsi che `decks/n4-core.json` (revisione **6**) e `decks/catalog.json` siano pubblicati; se il sito è in una sottocartella, mantenere la stessa struttura dei percorsi.
4. In **Settings → Pages**, se necessario, usare `Deploy from a branch`, branch `main`, directory `/ (root)`.
5. Aprire il sito HTTPS su Safari, attendere il nuovo Service Worker, chiudere e riaprire la PWA dalla schermata Home. La versione nell'intestazione deve indicare **v0.4.1**.
6. Controllare deck, progressi, sessioni, audio master e sequenze. Per compatibilità degli ID, il deck N4 integrato passa automaticamente dalla revisione 4 o 5 alla 6; prima della sostituzione editoriale viene generato un backup recuperabile dalla sezione **Deck e backup**.
7. In caso di dati mancanti non eliminare subito lo storage: ripristinare un backup tramite la funzione di importazione.

L'aggiornamento del Service Worker non può garantire un refresh immediato su ogni versione di Safari; se il sito mostra vecchi esempi, verificare anzitutto la revisione del deck installato e la cache PWA.

## Cosa cambia

### Rivelazione su flashcard

Durante la lettura normale, significato, forme, esempio giapponese e traduzione vengono mostrati progressivamente quando il relativo elemento audio viene riprodotto. Premere **Successivo** per saltare a un altro capitolo della stessa carta svela anche le parti ancora nascoste. La rivelazione rimane fino al passaggio alla carta successiva, che ricomincia nascosta. Il pulsante **Mostra soluzione** svela tutto manualmente.

La zona esempi ha più spazio. Giapponese, kana e traduzione possono andare a capo; se un testo supera l'altezza disponibile, si sposta verticalmente con movimento lento. In impostazioni di accessibilità con movimento ridotto, l'animazione è disabilitata e l'area è scorrevole manualmente.

### Contatore del significato

Il badge `Significato ♫ N` sulla flashcard, nel vocabolario e nel dettaglio indica quante letture **effettivamente terminate** del significato sono state confermate dal lettore Web Speech. Un salto durante il parlato o un errore non incrementano il contatore. È distinto dalle **esposizioni complete**, che richiedono il completamento di tutta la card. L'audio singolo di prova, esterno alla sessione, non incrementa il contatore.

### Shuffle degli esempi

Aprire **☰ → Sessioni e statistiche** e nella creazione sessione abilitare **Mescola anche gli esempi**. La checkbox è indipendente da **Mescola l'ordine delle carte**. L'ordine viene determinato e salvato **una volta per sessione e per vocabolo**, con seed e ID degli esempi. I filtri per registro e scenario vengono applicati prima del mescolamento. Chiudere e riprendere la sessione non rimescola né esempi né carte. Le impostazioni non cambiano l'ordine del deck originale.

### Contenuti contestuali

Il deck N4 è aggiornato alla **revisione 6**: 2.250 frasi contestuali nuove (30 per ciascuna delle 75 parole, distribuite sui tre registri), senza ripetere esattamente nessuno dei 750 esempi storici. I 750 esempi precedenti restano nel gruppo **Originali (v0.3)** e conservano gli ID. Sono mantenuti 30 scenari, otto storie e tutti gli ID delle carte e degli esempi contestuali già memorizzati nelle sessioni.

**Qualità linguistica:** 60 esempi per `場合` e `心配` sono stati scritti individualmente; altri 2.190 esempi sono stati costruiti da temi lessicali e modelli di frasi con forme verbali e aggettivali diverse. Si tratta di nuove bozze, NON di 2.250 frasi certificate dopo rilettura individuale: rimane necessaria una revisione competente di giapponese, keigo, kana e traduzioni. `CONTENT_QA.json` misura la correttezza formale, non la naturalezza del testo.

## Architettura dei dati

- `decks/n4-core.json`: parole, forme, esempi, scenari e storie. ID permanenti, revisione 6.
- `IndexedDB`: deck installati, memorie di ascolto e preferiti, sequenze e sessioni.
- `study.json`: backup portabile dei dati personali; memorizza `meaningPlays`, progressi, master TTS e, per le sessioni mescolate, `exampleShuffleSeed`, `exampleOrders`, `exampleOffsets`.
- `schemas/`: schemi JSON per i formati portabili.
- `service-worker.js`: cache versionata, distinta dallo storage personale.
- `voice-sandbox.html`: pagina sperimentale di voci, separata dai deck.

Per ricostruire la build monolitica, modificare i sorgenti in `source/` e lanciare `python3 source/build_index.py`.

## Test

```sh
npm test
python3 tools/validate_content.py
python3 tests/browser_revision041_mock.py
```

I test Playwright richiedono Chromium e Playwright Python. I test UI usano un archivio e un TTS simulati, quindi non dimostrano la persistenza IndexedDB reale né la qualità delle voci su iPhone. I test in un contesto reale sono stati bloccati da una policy di navigazione nell'ambiente di esecuzione. Vedere `TEST_REPORT.md` e `GUIDA_TEST_IPHONE.md`.

## Uso alla guida

Configurare sessione, filtri, shuffle e sequenze prima di mettersi al volante. Non interagire con lo schermo durante la guida. Safari può non inoltrare i comandi media Bluetooth alla Web Speech API; il comportamento dell'auto richiede un test reale.

**Aggiornamento della verifica finale:** corretti anche 58 casi di disallineamento evidente fra passato giapponese e traduzioni inglesi e introdotto un test specifico. La revisione madrelingua completa resta da eseguire.

## Correzione layout v0.4.2

- **Kanji senza tagli:** la parola giapponese non ha più limiti di altezza (`max-height`) o `overflow:hidden`; può occupare più righe. Il relativo contenitore non viene compresso per fare posto agli esempi.
- **Uso della larghezza:** margini laterali ottimizzati; l'indicatore di capitolo e l'etichetta della domanda condividono una riga. Sulle card con parole giapponesi brevi, in verticale e con larghezza sufficiente, parola e significato sono affiancati. In orientamento desktop ampio vale la stessa disposizione.
- **Priorità:** parola e navigazione restano visibili; esempi, forme e metadati secondari cedono spazio se l'altezza è insufficiente. La dimensione del font della parola resta quella già prevista dalle regole responsive della v0.4.1: non è stata ridotta per la correzione.
- **Telefoni stretti:** i tasti capitolo conservano l'area cliccabile; sotto 350 px nascondono solo le didascalie lunghe, lasciando visibili le frecce.
- **Compatibilità:** gli ID delle 75 carte, gli esempi e i dati personali sono invariati; il deck N4 resta alla revisione 6. È sufficiente aggiornare i file del sito, mantenendo il backup delle preferenze.

Test automatici: `python3 tests/browser_layout042_mock.py` e `python3 tests/browser_shortword042_mock.py` (richiedono Playwright e Chromium). La verifica reale su Safari/iPhone resta da effettuare.
