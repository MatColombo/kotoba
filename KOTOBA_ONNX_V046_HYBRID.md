# Kotoba Drive v0.4.6 — annunci grammaticali e TTS ibrido

Questa versione aggiorna la v0.4.5.1 (preparatore con recupero tokenizer dalle cache del Lab). **Non contiene modelli ONNX** e non modifica i dati di studio in IndexedDB.

## Cosa cambia

- **Annunci delle forme**: invece degli utterance brevi `Forma te` e `Forma nai, negativa`, i sintetizzatori leggono `Adesso ascolta la forma te.` e `Adesso ascolta la forma nai, negativa.`. Gli annunci in inglese ricevono una formula altrettanto completa. I testi scritti nelle card non cambiano.
- **Velocità degli annunci**: parametro `Velocità annunci forme · fattore ×`, inizialmente 0,80. È moltiplicato per la velocità post-sintesi già definita negli Audio master/override della sequenza (es. 1,20 × 0,80 = 0,96). **Non rigenera il PCM** se cambi solo la velocità.
- **Velocità delle coniugazioni**: parametro distinto `Velocità lettura forme · fattore ×`, inizialmente 0,90 per giapponese. Anche questo agisce in playback, dopo ONNX.
- **TTS per lingua**: in ogni sezione JA/IT/EN, `Motore voce` permette `Pocket TTS ONNX` oppure `Voce dispositivo · Web Speech, in diretta`.
- **Preset immediato**: il tasto `Usa modalità ibrida: JA ONNX + IT dispositivo` attiva ONNX, imposta JA su ONNX e IT sul dispositivo. L'inglese conserva il valore precedente.
- **Preparazione ottimizzata**: la card pronta, i due eventi futuri e il preload 10 minuti preparano **soltanto gli elementi ONNX**. Le parti lette dal dispositivo non occupano memoria PCM e non vengono considerate audio pre-generato. La percentuale riguarda la quota ONNX, non la voce device.
- **Nessun cambiamento ai deck/progressi**: il piano di sequenza, le ripetizioni, il numero di esempi e i capitoli continuano a funzionare come prima.

## Installazione consigliata

1. Crea un backup della cartella sorgente Kotoba (in particolare `source/`, `tools/` e `index.html`).
2. Estrai **lo ZIP patch** nella **root del repository Kotoba**, sovrascrivendo i file con lo stesso percorso. In alternativa usa lo ZIP sorgente completo.
3. Da PowerShell, nella root Kotoba:

```powershell
# Riutilizza le variabili del progetto create in precedenza.
# $Py  = "C:\\...\\kotoba_japanese_onnx\\.venv\\Scripts\\python.exe"
# $Lab = "C:\\...\\kotoba_japanese_onnx\\kotoba_n5_onnx_pages_v4_1"

& $Py .\tools\prepare_kotoba_onnx.py --lab $Lab --tokens-only
& $Py .\tools\verify_onnx_deploy.py
& $Py .\source\build_index.py
& $Py -m http.server 8765
```

`--tokens-only` **non riscarica i modelli né le voci**. È necessario perché i nuovi annunci grammaticali ONNX usano frasi più lunghe e richiedono nuovi ID SentencePiece. Se `onnx/manifest.json` non esiste ancora, esegui prima il preparatore completo con `--lab $Lab` senza `--tokens-only`.

4. Apri `http://localhost:8765` e vai in **Menu → Impostazioni → Pocket TTS**. Premi il preset ibrido. Controlla che IT sia `Voce dispositivo`, JA sia `Pocket TTS ONNX`.
5. In una sessione N5 o N4 con un verbo, abilita `Annuncia la forma grammaticale` e prova «forma te» / «forma nai», seguiti dalla forma giapponese.

## GitHub Pages

Dopo la verifica locale, dal repository Kotoba:

```powershell
git add -A
git commit -m "v0.4.6 - hybrid TTS and clearer grammar announcements"
git push
```

Il service worker usa una nuova versione di cache per aggiornare la shell della PWA. Su iPhone riapri/ricarica la pagina dopo che Pages ha distribuito i file nuovi. La memoria di studio non viene resettata.

## Limiti e controlli su iOS

La modalità dispositivo usa `window.speechSynthesis`, non ONNX e non un'API remota nostra. Le voci disponibili e la possibilità di parlare in background o a schermo bloccato dipendono da Safari/iOS e dalle voci installate. La voce italiana è selezionata preferendo `localService` e locale `it-IT`.

**Le parti native non vengono pregenerate**: iniziano quando la sequenza arriva a quell'evento. Se una sessione contiene voce dispositivo e ONNX, il progresso di preparazione arriva al 100% quando gli audio ONNX richiesti sono pronti, non quando è stata creata la futura voce di sistema.

Le frasi più lunghe e la velocità inferiore riducono il rischio di glitch degli annunci, ma la fedeltà acustica va verificata sull'iPhone reale; le prove automatiche non simulano iOS SpeechSynthesis né il segnale del modello ONNX.
