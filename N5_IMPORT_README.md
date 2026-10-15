# Kotoba Drive N5 — conversione OpenJLPT, anteprima lessicale

## Che cosa e' incluso
- 674/674 lemmi da `/mnt/data/n5.json` senza esclusioni, ID `openjlpt-n5:<sourceId>` stabili e livello `jlptLevel: N5` per ciascuna carta.
- Definizioni **inglesi originali**. Il campo `meaning.it` riporta esplicitamente `[EN - da tradurre]` seguito dall'inglese. **Non e' una traduzione italiana.**
- 1.320 frasi sorgente archiviate in `sourceExamples` con ID Tatoeba e furigana quando disponibili. Di queste, 1.192 sono anche in `examples` con una lettura kana integrale ricostruibile dai dati sorgente e con una traduzione italiana **non pronta**, segnata `EN - traduzione italiana da completare`.
- 72 cluster preliminari nel file `decks/jlpt-n5-clusters.json`, **non** storie compiute.
- 674 schede, forme grammaticali automatiche limitate ai pattern supportati (NON revisionate).

## Limitazioni IMPORTANTI
- I 20.220 esempi contestualizzati richiesti (10 informali, 10 colleghi, 10 superiori per 674 parole) non sono stati generati. Validatore della skill: **FAIL** per completezza (4.718 errori di quota/registro, non significa 4.718 vocaboli invalidi).
- Traduzioni italiane non presenti nel dataset esterno e non inventate. Usare lingua madre **EN** per il deck N5, finche' non sono state preparate traduzioni italiane.
- Non tutte le frasi sorgente sono adatte come esempi del lemma: alcune usano forme alternative o un senso differente; le licenze dei singoli contributi Tatoeba devono essere accertate prima di ridistribuzione pubblica.
- Classificazione N5 proveniente da OpenJLPT, non da lista JLPT ufficiale.
- La nuova build consente le categorie grammaticali `pronoun`, `adverb`, `numeral`, ecc. senza falsificare `pos`. I menu a filtro di categoria mantengono le quattro tipologie precedenti: scegliere **Tutte** per includere anche le nuove categorie.
- L'app v0.4.2 non accetta le POS estese: per importare questo file e' necessario il pacchetto v0.4.3-n5-preview incluso.
- Nessuna verifica manuale Safari/iOS e nessuna revisione madrelingua effettuata.

## Installazione
1. Esportare `study.json` dalla PWA corrente.
2. Pubblicare il pacchetto di anteprima nel repository GitHub Pages (inclusa `decks/`).
3. Aprire Deck e backup e installare `JLPT N5 - OpenJLPT (EN, bozza)` dal catalogo.
4. Selezionare lingua EN quando si studia N5. Controllare che le schede N4 e i progressi restino presenti.
5. Non considerare questi dati pronti alla pubblicazione didattica completa.

## Qualita' tecnica
- Schema deck esteso: pass.
- Importazione tramite `Store.normalizeDeck`: 0 errori, 0 avvisi.
- Suite Node: 81/81 pass.
- Validazione completa della skill (30 esempi per parola): **FAIL atteso**.
- I dati personali non vengono incorporati nel JSON e gli altri deck sono invariati.
