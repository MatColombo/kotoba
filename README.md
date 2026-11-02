# Kotoba Drive v0.4.5 — integrazione ONNX sperimentale

**[Istruzioni installazione TTS, tre strategie e GitHub Pages](KOTOBA_ONNX_INTEGRAZIONE.md)**.

# Kotoba Drive v0.4.4 — Deck completi N4 e N5 online

**Novità:** il catalogo online di GitHub Pages propone ora i due deck completi già convertiti in formato Kotoba Drive: **N4 (630 carte, 18.900 esempi contestuali)** e **N5 (674 carte, 20.220 esempi contestuali)**. Entrambi mantengono gli esempi sorgente originali in `legacyExamples`.

Per la pubblicazione e la procedura di installazione, leggere **[ONLINE_DECKS_DEPLOY.md](ONLINE_DECKS_DEPLOY.md)**. I deck completi sono installabili una volta dalla sezione **Deck e backup → Catalogo online** e restano disponibili in IndexedDB per lo studio offline. Il vecchio deck integrato N4 da 75 parole rimane disponibile senza alterare i progressi esistenti. Gli ID dei nuovi deck sono distinti. La revisione linguistica professionale e la verifica delle licenze sorgente sono ancora da completare.

---

# Kotoba Drive v0.4.2

PWA statica, local-first e gratuita per ripassare vocaboli giapponesi N4 con audio. Distribuibile su GitHub Pages, senza backend o servizi a pagamento.

- **[LEGGIMI.md](LEGGIMI.md):** installazione, migrazione, import/export, istruzioni e opzioni di shuffle.
- **[CHANGES.md](CHANGES.md):** modifiche v0.4.2.
- **[TEST_REPORT.md](TEST_REPORT.md):** risultati verificati e limiti.
- **[GUIDA_TEST_IPHONE.md](GUIDA_TEST_IPHONE.md):** prova manuale su iPhone e volante.
- **[PROBLEMI_NOTI.md](PROBLEMI_NOTI.md):** stato di revisione linguistica e limiti iOS.

La v0.4.2 protegge la visualizzazione integrale dei kanji, ricolloca le etichette secondarie e usa due colonne sulle card con parole brevi quando lo schermo lo consente. Nessuna modifica agli ID del deck o della memoria.

Sorgenti in `source/`, deck in `decks/`, formati in `schemas/`.

```sh
python3 source/build_index.py
npm test
python3 tools/validate_content.py
```

**Contenuti:** 75 parole, 750 esempi precedenti preservati, 2.250 esempi contestuali riscritti in bozza, 30 scenari e otto storie. Le nuove frasi **non sono certificate da un revisore madrelingua**; non usarle come modello definitivo di keigo senza controllo specialistico.
