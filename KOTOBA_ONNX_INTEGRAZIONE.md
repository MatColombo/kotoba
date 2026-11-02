> **Aggiornamento v0.4.6 (ibrido):** per i nuovi annunci grammaticali, i profili per lingua e il comando `--tokens-only`, leggi [`KOTOBA_ONNX_V046_HYBRID.md`](KOTOBA_ONNX_V046_HYBRID.md).

# Kotoba Drive v0.4.5 — Pocket TTS ONNX JA / IT / EN

Questa distribuzione parte da `source-v1-stable.zip`, senza cambiare gli ID dei deck, il sistema di sessioni IndexedDB, i progressi, le sequenze e la modalità Web Speech precedente.

## Funzioni

- **Tre profili indipendenti**, uno per lingua (`ja`, `it`, `en`): voce, temperatura, step LSD, frame massimi, frame dopo EOS, pausa fra segmenti, silenzio iniziale e finale; per IT, separatore `;` e significato contestualizzato.
- **Copia → altre** copia i valori numerici di sintesi fra lingue; conserva voce, normalizzazione e opzioni specifiche della lingua.
- **Inglese femminile e maschile**: Alba (dal Lab v4.1) e VCTK p226, secondo campione pubblico, codificato dall'encoder inglese. I campioni JA restano female_03 e male_01, le alternative IT Alba, female_03, male_01 (codificate dall'encoder italiano).
- **Card pronta (strategia 1)**: sintetizza soltanto eventi parlati presenti nella sequenza corrente, raggruppati per lingua; riproduce dopo la preparazione; prepara le due card successive durante l'ascolto.
- **Live (strategia 2)**: all'apertura della card mette in coda gli eventi parlati nell'ordine della sequenza. Ogni audio viene riprodotto appena disponibile; non aspetta tutta la card.
- **Precarica 10 minuti (strategia 3)**: il bottone avvia un'operazione in anticipo limitata a 144 MiB di PCM; il bottone Ferma annulla i lavori in coda. Al termine la sessione continua in modalità 1 o 2.
- **Buffer sessione**: una card precedente, card attuale, due successive. Quando cambia l'ID sessione il PCM viene cancellato; riprendendo la stessa sessione *nella stessa pagina aperta* il PCM resta disponibile. Dopo un reload PWA il PCM non persiste, per scelta di memoria/privacy; progressi e preferenze sì, in IndexedDB.
- **Audio sintetizzato una volta, ripetuto molte volte**: riuso tra ripetizioni, capitoli e schemi. La cache ignora il playback rate; velocità/volume vengono applicati in Web Audio alla riproduzione, seguendo gli audio master e gli override di gruppi/elementi della sequenza.
- **Solo testo parlato realmente selezionato**: se si selezionano 3 esempi su 30, il motore genera solo quelli. Gli altri esempi sono *pretokenizzati su disco in fase build*, non sintetizzati a runtime.
- **Un modello per volta**: il Web Worker libera le sessioni ONNX della lingua precedente. Usa WASM single-thread (iOS Safari, senza requisiti COOP/COEP).
- **Token on demand**: i 30 esempi e le forme sono pretokenizzati con SentencePiece nel build Python in file JSON per shard di 20 card; LRU di soli 6 shard in RAM, e nessuna tokenizzazione SentencePiece JavaScript sul dispositivo.
- **Progresso**: l'anello percentuale misura il numero di utterance diverse della card con PCM pronto; non finge una percentuale basata su stime temporali.
- **Fallback esplicito**: se un deck importato non è pretokenizzato, la sintesi del testo non trovato torna a Web Speech con messaggio diagnostico.

## 1. Dove estrarre

Estrarre il contenuto di questo ZIP **nella root del repository Kotoba Drive**, preservando la cartella `.git` se esiste. Non sovrascrive la memoria di studio IndexedDB dell'utente. Per sicurezza conserva un backup del vecchio `index.html` prima del primo push.

I modelli ONNX, il runtime WASM e gli embedding dei campioni vocali **non sono contenuti nello ZIP sorgente**. La preparazione li copia dal tuo *Kotoba N5 ONNX Lab v4.1* già funzionante.

## 2. Preparazione su Windows

Aprire PowerShell nella **root di Kotoba Drive**. Usa il Python 3.11 del progetto `kotoba_japanese_onnx`, che ha già `sentencepiece`, `huggingface_hub`, `scipy`, `onnxruntime`, `soundfile` e `numpy` (in alternativa installali nel venv usato):

```powershell
$Py = 'C:\PERCORSO\kotoba_japanese_onnx\.venv\Scripts\python.exe'
$Lab = 'C:\PERCORSO\kotoba_japanese_onnx\kotoba_n5_onnx_pages_v4_1'
& $Py .\tools\prepare_kotoba_onnx.py --lab $Lab
& $Py .\tools\verify_onnx_deploy.py
& $Py .\source\build_index.py
& $Py -m http.server 8765
```

Apri `http://localhost:8765` (non aprire `index.html` come `file://`, il worker/Fetch richiedono HTTP/HTTPS).

Il comando preparatore:
1. Copia i quattro modelli ONNX di ogni lingua, più i piccoli embedding delle voci già presenti nel Lab v4.1.
2. Recupera tokenizer e BOS dai bundle originali del Lab e del progetto Pocket TTS.
3. Ottiene, se possibile, `vctk/p226_023_enhanced.wav` dal repository **pubblico** `kyutai/tts-voices`, e usa **l'encoder inglese offline** per creare `en/voices/vctk_p226.f32`. Nessuna richiesta al modello riservato di Giovanni.
4. Precalcola token di tutti gli esempi, forme, significati, varianti del separatore, voci e storie dei deck N4 core, N4 completo, N5 completo.
5. Tenta di rendere locali JS/WASM di ONNX Runtime Web versione **1.20.0**, per evitare il CDN in fase di esecuzione; se il download fallisce mantiene il fallback al CDN.

Il preparatore salta la nuova voce maschile se non può scaricare il WAV. In alternativa, **salva un campione inglese maschile con licenza appropriata** e passa:

```powershell
& $Py .\tools\prepare_kotoba_onnx.py --lab $Lab --male-en-wav 'C:\voci\male_en.wav'
```

Se l'encoder inglese non è nella cartella `_download_models` del Lab, aggiungi `--english-encoder 'C:\...\mimi_encoder.onnx'`. L'encoder è usato solo sul PC e **non viene pubblicato sul sito**.

Per testare temporaneamente senza voce maschile né download rete:

```powershell
& $Py .\tools\prepare_kotoba_onnx.py --lab $Lab --no-male-download --no-ort-vendor
```

Non usare `--no-male-download` per il rilascio finale se vuoi selezionare la voce inglese maschile nella PWA.

## 3. Test

```powershell
npm test
```

Sono presenti i test Kotoba esistenti e nuovi test di sessione, cache PCM, segmentazione, separatori e precaricamento. Abilita la voce ONNX dal **menu → impostazioni → Pocket TTS ONNX**. Seleziona una sessione del deck N5 installato, imposta **3 esempi** e avvia la sequenza. Confronta modalità 1 e 2, poi Precarica 10 minuti. I WAV non sono salvati su disco/IndexedDB e devono essere ricreati dopo il riavvio.

Controlla l'RTF su Safari iOS nel sistema Lab già validato, ma non assumere che la stessa prestazione si conservi in Kotoba con sequenze e cache: misura tempi e RAM sull'iPhone reale dopo la pubblicazione.

## 4. GitHub Pages

Dopo test locale, ferma il server (`Ctrl+C`) e verifica il sito:

```powershell
& $Py .\tools\verify_onnx_deploy.py

git add -A
git commit -m "Kotoba Drive ONNX JA IT EN session buffer e voci"
git push
```

In GitHub: **Settings → Pages → Deploy from a branch → main → /(root)**, se non già configurato. Non usare Git LFS per i modelli ONNX pubblicati su Pages. Il verificatore blocca file singoli da 100 MiB o più e segnala se il sito eccede 1 GiB.

## 5. Compromessi e tattiche ulteriori

- **Voce preparata una sola volta** in file `.f32` e cache dello stato vocale del worker: al cambio voce nella stessa lingua non si scarica un altro modello.
- **Niente WAV pre-renderizzati**: tutta la voce delle card viene generata nel browser; nessuna API TTS remota.
- **Cache opportunistica**: sottoponi al worker solo le quattro card della finestra attiva e scarta richieste in coda se salti card. Il precaricamento è l'unica eccezione a questa finestra.
- **Troncamenti**: le frasi lunghe vengono segmentate prima di SentencePiece. Il limite di `maxFrames` rimane per segmento e serve a evitare generazioni illimitate; un EOS anticipato può comunque causare testo omesso.
- **Rete/offline**: la PWA rimane offline per studio e progressi, ma una sintesi ONNX interamente offline richiede che il browser abbia già conservato tutti i pesi e gli shard necessari. I pesi passano per la cache HTTP del browser, non vengono duplicati nella Cache API del service worker. Il sistema non garantisce il riuso offline dei pesi dopo lo svuotamento della cache HTTP.
- **Safari iOS**: un preload prolungato può essere sospeso se la pagina va in background. Preferisci tenerla aperta in primo piano e abilitare il Wake Lock dove supportato.
- **Velocità e pitch**: `AudioBufferSourceNode.playbackRate` cambia la velocità **dopo** la sintesi, senza generare di nuovo il PCM. Come nel normale Web Audio, cambia anche l'altezza percepita; l'override di pitch indipendente della sintesi Web Speech non è replicato dal motore ONNX in questa versione.
- **Licenze vocali**: controlla le licenze dei campioni distribuiti nel repository finale. VCTK p226 è un esempio di voice prompt del dataset VCTK; il corpus VCTK è distribuito con licenza CC BY 4.0 e richiede attribuzione, oltre al rispetto delle licenze del modello e del deck. Link origine: https://huggingface.co/kyutai/tts-voices/tree/main/vctk

## 6. Test non eseguibili in questo pacchetto

Nella sessione di sviluppo non erano disponibili i **pesi ONNX reali del tuo PC**, quindi non è stato possibile verificare l'audio o il consumo di memoria su Safari. Sono stati verificati il compilatore di sequenze e lo shard database di test, la sintassi e i test unitari. Il preparatore è stato anche esercitato con bundle ONNX simulati e modelli SentencePiece di test. **Prima del push esegui su PC il generatore e i test acustici reali.**
