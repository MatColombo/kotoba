# Kotoba Drive v0.4.1

PWA statica, local-first e gratuita per ripassare vocaboli giapponesi N4 con audio. Distribuibile su GitHub Pages, senza backend o servizi a pagamento.

- **[LEGGIMI.md](LEGGIMI.md):** installazione, migrazione, import/export, istruzioni e opzioni di shuffle.
- **[CHANGES.md](CHANGES.md):** modifiche v0.4.1.
- **[TEST_REPORT.md](TEST_REPORT.md):** risultati verificati e limiti.
- **[GUIDA_TEST_IPHONE.md](GUIDA_TEST_IPHONE.md):** prova manuale su iPhone e volante.
- **[PROBLEMI_NOTI.md](PROBLEMI_NOTI.md):** stato di revisione linguistica e limiti iOS.

Sorgenti in `source/`, deck in `decks/`, formati in `schemas/`.

```sh
python3 source/build_index.py
npm test
python3 tools/validate_content.py
```

**Contenuti:** 75 parole, 750 esempi precedenti preservati, 2.250 esempi contestuali riscritti in bozza, 30 scenari e otto storie. Le nuove frasi **non sono certificate da un revisore madrelingua**; non usarle come modello definitivo di keigo senza controllo specialistico.
