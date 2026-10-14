# Problemi noti e decisioni di rilascio

## Bloccanti per certificare la compatibilità iPhone

1. **IndexedDB reale non verificato in Chromium/Safari in questo ambiente.** La policy del browser di test impedisce la navigazione verso URL di prova, anche quando intercettati. I test dell'interfaccia usano archivio simulato; i test Node verificano transazioni e rollback simulati. Occorre test del dispositivo reale.
2. **Bluetooth fisico / Media Session:** prova da eseguire su iPhone e auto, soprattutto eventi `nexttrack`/`previoustrack` e salti per capitolo.
3. **Sintesi vocale Safari:** velocità, tono e volume sono verificati nella sandbox dall'utente in una fase precedente, ma la riproduzione integrata v0.4.0 su iPhone non è stata ricontrollata. La disponibilità offline delle voci non è garantita.

## Linguistica — non risolta in v0.4.0

- I 2.250 esempi contestualizzati sono **bozze** ricavate dalle frasi originali con cornici scenario, non 2.250 dialoghi originali scritti in informalità, cortesia e keigo coerenti.
- `CONTENT_QA.json` contiene **201 segnalazioni linguistiche euristiche**. Non equivalgono automaticamente a 201 errori, ma richiedono verifica.
- Mancano revisione madrelingua, verifica di sonkeigo/kenjōgo, naturalezza degli scenari, raffronto sistematico kana/kanji/traduzione.
- Le otto storie hanno una struttura coerente (38 segmenti totali) ma non hanno ricevuto revisione madrelingua.
- Conservare l'avviso "contenuti in revisione" nell'app e non presentare il registro superiore come modello didattico certificato.

## Tecniche e limiti scelti

- Solo PWA statica, nessun motore nativo iOS; le voci avanzate presenti in Impostazioni potrebbero non comparire in `getVoices()`.
- Web Speech non fornisce un mixer/amplificatore audio; rate/pitch/volume agiscono su utterance successive, senza mixaggio simultaneo.
- Il backup automatico `pre-import-backup` conserva solo l'ultima sostituzione locale e dipende dalla permanenza di IndexedDB.
- Il Service Worker non garantisce che le voci di sistema TTS funzionino offline.
- I contatori di esposizione rappresentano ascolti effettivi segnalati dal player, non valutazioni oggettive della memoria.
- I tempi di caricamento e le prestazioni misurati su Node/Chromium simulato non sostituiscono test su iPhone.

## Ambito escluso

Backend, account, cloud sync, mixing Web Audio, enfasi SSML, automatic voice casting nei dialoghi e generazione di contenuti tramite servizi esterni.
