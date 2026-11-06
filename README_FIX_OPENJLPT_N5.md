# Kotoba Drive v0.4.6.2 - Fix token ONNX per openjlpt-n5

## Problema

La v0.4.6 pretokenizza solo `jlpt-n4-core`, `kotoba-n4-final` e
`kotoba-n5-final`. Il deck stabile `openjlpt-n5` (file sorgente
`decks/jlpt-n5-openjlpt.json`) e' presente in Kotoba Drive ma assente da
`onnx/manifest.json`, quindi la sintesi fallisce prima di caricare i modelli.

## Contenuto della patch

- `tools/prepare_kotoba_onnx.py`: genera anche 34 shard per `openjlpt-n5`
  (674 card nel deck incluso nella versione v0.4.6), senza toccare pesi o voci.
- `tools/verify_onnx_deploy.py`: ora segnala gli indici ONNX mancanti per
  QUALSIASI deck distribuito insieme all'app, e verifica tutti gli ID delle card.

## Installazione Windows / PowerShell

Estrarre lo ZIP nella **root del repository Kotoba Drive**, sovrascrivendo i
soli due file sotto `tools/`. Conservare `onnx/`, `.git/` e IndexedDB.

Nella root del repository (con `$Py` e `$Lab` gia' definiti):

```powershell
& $Py .\tools\prepare_kotoba_onnx.py --lab $Lab --tokens-only
& $Py .\tools\verify_onnx_deploy.py
& $Py -c "import json; m=json.load(open('onnx/manifest.json',encoding='utf-8')); print('openjlpt-n5:',len(m['tokenIndexes']['openjlpt-n5']['shards']),'card')"
```

Atteso: `Token index jlpt-n5-openjlpt: 674 card / 34 shard`, poi
`Deck indicizzati: ... openjlpt-n5` e infine `openjlpt-n5: 674 card`.

Per GitHub Pages:

```powershell
git add -- tools/prepare_kotoba_onnx.py tools/verify_onnx_deploy.py onnx/manifest.json "onnx/tokens-jlpt-n5-openjlpt-*.json"
git commit -m "Fix ONNX token index for OpenJLPT N5"
git push
```

Attendere la distribuzione Pages, ricaricare l'app, e verificare che sul sito
`/onnx/manifest.json` contenga una voce `tokenIndexes.openjlpt-n5`.
Su Safari iOS chiudere e riaprire la PWA prima del test, per sostituire il
manifest in memoria. **Non cancellare i dati del sito**: contengono i progressi
salvati in IndexedDB.

## Note

- Non e' richiesta una nuova esportazione ONNX, ne' un nuovo download dei pesi.
- Il messaggio `AVVIO ... v0.4.4` e' una vecchia stringa nel log della v0.4.6,
  non una prova di un asset obsoleto.
- Il deck `openjlpt-n5` originale contiene placeholder nelle traduzioni italiane
  (ad esempio `[EN - da tradurre]`). Se desideri italiano naturale per lo
  studio, usa il deck curato `kotoba-n5-final`, non soltanto la sintesi ONNX.
- Per deck personali importati da file, la pretokenizzazione richiede ancora un
  passaggio in fase di preparazione: questa patch copre i quattro deck distribuiti.
