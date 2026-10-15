# Problemi noti — Kotoba Drive v0.4.2

## Lingua e didattica

Il deck contiene **2.250 frasi contestuali nuove**, non più costruite racchiudendo una delle 750 vecchie frasi in una cornice di scenario. Sono tutte diverse e non coincidono testualmente con i 750 esempi originali, che restano preservati.

Tuttavia **la revisione madrelingua individuale non è stata eseguita**. Sessanta frasi (`場合` e `心配`) sono state curate una per una; le altre 2.190 derivano da modelli grammaticali e collocazioni selezionate. Alcuni usi in rapporto ai 30 scenari possono risultare generici, forzati o non pienamente naturali; traduzioni, forme negative e keigo richiedono ancora una verifica specialistica. Nessuno di questi limiti viene rilevato con certezza dal solo validatore degli ID e del kana. Le otto storie rimangono nella loro versione precedente, non revisionata da un madrelingua.

`CONTENT_QA.json`: 0 anomalie strutturali e 0 segnalazioni degli euristici attuali **non significa** 0 errori linguistici.

## Dispositivo e compatibilità

- Test integrato su **Safari iPhone reale** e comandi fisici del volante Bluetooth: ancora da eseguire.
- **IndexedDB reale attraverso riavvio**: l'ambiente di QA blocca navigazioni verso URL di prova, anche intercettati dal browser; il test browser disponibile usa un archivio simulato. Verificare la conservazione delle sessioni sul telefono prima di affidarsi all'app.
- Web Speech iOS può mostrare soltanto alcune voci standard; voce offline, velocità percepita e inoltro Media Session possono variare.
- Il contatore `meaningPlays` misura letture completate **dentro la sequenza audio**; le anteprime manuali dal lessico non vengono conteggiate.
- Il movimento automatico delle frasi dipende da spazio e dimensioni del dispositivo; `prefers-reduced-motion` lo disabilita per accessibilità.

## Decisioni deliberate

Nessun backend, nessun mixing audio, nessuna enfasi SSML, nessun personaggio con voce assegnata. La sandbox delle voci resta una pagina separata. Eseguire regolarmente backup `study.json` e conservare le copie scaricate anche fuori da Safari.

La verifica finale ha corretto 58 incongruenze ricorrenti fra passato giapponese e tempi inglesi; altre collocazioni e scelte di registro possono essere innaturali. Per esempio, un abbinamento tra lessico professionale e oggetti quotidiani può risultare grammaticalmente parsabile ma semanticamente inappropriato. Evitare di utilizzare il dataset come riferimento di keigo senza revisione.
