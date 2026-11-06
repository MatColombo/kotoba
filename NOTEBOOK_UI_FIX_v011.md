# Kotoba Drive — Notebook UI v0.1.1

Patch UI per la precedente **Notebook UI v0.1**. Non cambia l'engine ONNX, il worker, gli indici dei deck, il formato dei dati o i progressi.

## Modifiche

- Highlight del termine negli esempi: cerca anche forme regolari non incluse nell'elenco delle declinazioni, soprattutto avverbiale `-く` per gli aggettivi `い` (es. `暖かい` → `暖かく`), forme `-かった`, `-くて`, `-ければ`, e forme comuni `な` / di verbi in `-る` quando identificabili. Esegue match più lunghi prima dei più corti. È un riconoscitore euristico e prudente, **non un parser morfologico completo**.
- Evidenziazione viola più satura, con leggero fondo e sottolineatura, inclusi tema chiaro/scuro e anteprima dimensioni testo.
- Tema Paper meno luminoso: sfondo `#EEEBDD` e superfici `#E6E2D3`; Graphite invariato.
- Studio: le forme sono in **un'unica riga scorrevole orizzontalmente**; esempi più spaziosi; footer player ancorato al bordo inferiore del viewport, senza righe verticali per gli elenchi delle forme.
- Opzione per sessione **Mostra lettura in kana**: selezionabile quando si crea una sessione e modificabile per la sessione in corso nella pagina Configurazione sessione; le sessioni esistenti mantengono per compatibilità il valore predefinito **mostra kana**. La scelta persiste con la sessione (anche al resume e duplicazione).
- Testo giapponese originale e traduzione dell'esempio **sempre visibili**, anche quando la riga kana è disabilitata. Sono nascosti soltanto i blocchi supplementari di lettura in kana; nessun testo è rimosso dai deck né dall'audio.
- Dicitura vicino al cerchio ONNX localizzata secondo la lingua della sessione: `Loading Japanese model…`, `42% — Generating Japanese audio…`, ecc., oppure equivalenti italiani. Il log tecnico sottostante conserva i messaggi raw e potrebbe ancora contenerne in italiano.
- Versione della cache service worker aggiornata a `notebook-011` per aggiornare la PWA su iPhone.

## Installazione della patch (non eliminare i dati)

Dalla directory **root** di Kotoba Drive:

```powershell
# Scarica il file ZIP e mettilo in Downloads.
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\Kotoba_Drive_Notebook_UI_v011_patch.zip" -DestinationPath . -Force

# Se $Py e' gia' configurato nella tua sessione PowerShell:
& $Py .\source\build_index.py

# Oppure usare il Python che hai gia' in kotoba_japanese_onnx:
# & "C:\PERCORSO\kotoba_japanese_onnx\.venv\Scripts\python.exe" .\source\build_index.py
```

Poi pubblica GitHub Pages con il tuo flusso abituale:

```powershell
git add -A
git commit -m "Notebook UI v0.1.1 - kana, highlight, layout, ONNX captions"
git push
```

Su iPhone chiudi e riapri la PWA. Non cancellare IndexedDB, dati del sito o la cartella `onnx/`.

**Importante:** la patch include un nuovo `source/word-highlighter.js` e aggiorna `source/build_index.py` e `source/template.html`. Copia tutti i file della patch; `index.html` è già rigenerato e incluso.

## Verifiche

- 109 test Node (`node --test tests/*.test.cjs`) superati.
- Evidenziazione `暖かく` testata su `だんだん暖かくなります。`, anche quando il deck presenta solo `暖かくない` / `暖かくて`.
- Chromium mock 320×640 e 390×844: barra delle forme su una riga, scorrimento laterale disponibile, player sul fondo del viewport e kana opzionale senza nascondere il giapponese o la traduzione.
- Test mock navigazione/Aspetto/Graphite completato senza errori JavaScript.
- Engine `source/engine.js`, `source/onnx-tts.js`, `source/storage.js`, `source/sessions.js`, `source/content.js`, `tts-worker.js`, modelli e deck invariati rispetto alla v0.1.

**Limiti:** non ho eseguito la nuova build in un vero iPhone Safari né sintetizzato audio ONNX reale in questa sessione. La verifica browser è con schermate e bridge simulati. Gli esempi di durata e prestazioni non sono benchmark audio.
