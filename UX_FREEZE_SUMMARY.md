# Kotoba Drive — UX congelata, base Notebook UI

## Principi trasversali

Layout school notebook essenziale, sfondo leggermente quadrettato, barra superiore compatta con icona originale, nome app e menu hamburger categorizzato. Senza navigazione inferiore persistente. Pagine statiche con scorrimento solo di liste e pannelli variabili, salvo eccezioni necessarie per accessibilità o contenuti lunghi.

Tema Paper: sfondo #F8F6EF, inchiostro #263442, azione #345C94, avanzamento #268276. Tema Graphite: #1C1D1F, inchiostro #E9E8E3, azione #85ABF1, avanzamento #6BC5AE. Semantica ambra per streak, porpora per vocabolo nell'esempio, bordo verde acqua per contenuto in lettura.

## Home

20% branding nome+payoff, 20% 7 giorni + streak + ultimo deck + ultime 3 card, 15% riprendi (solo quando applicabile), lista sessioni nello spazio residuo. Solo lista scrollabile. `+` a sinistra dell'intestazione Sessioni e shortcut esplicito in stato vuoto.

## Studio

30% alto termine JA a sinistra / significato a destra; 70% area contestuale. Tutte le forme visibili insieme, label+forma indivisibili, wrap con spazio e separatori `│`, esempio corrente sotto. Forma letta e frase letta **solo contorno**, mai sfondo pieno. Termine studiato nell'esempio color porpora. Play footer con card precedente / N di M / card seguente e tasti step precedente / Play-Pausa / step successivo, nessun titolo di capitolo. Loading ONNX usa l'anello al posto del Play con `Caricamento modello <lingua>…` / `<N>% — Generazione <lingua>…`. Valore N complessivo per card, escludendo TTS dispositivo in ibrido. Niente log sullo Studio. Stella e Noto come occhielli angolari.

## Sessioni, Sequenze, Audio

Configurazione sessione rapida con opzioni avanzate e aiuti `ⓘ`. Sequenze a gruppi ed elementi ordinabili, ripetizioni direttamente modificabili, anteprima con tempi/pausa/speed, durate parlato esplicitamente stimate. Parametri TTS e voci per JA/IT/EN e copia parametri numerici; ONNX/dispositivo per lingua e modalità Ready, Live, Precaricamento, mantenendo playback speed e motore attuali.

## Libreria e deck

Installati / Catalogo con riga finale sempre visibile “Importa da file locale…”. Il dettaglio deck mostra studiati, stellati, noti, distribuzione per numero ascolti completi (senza barre a 0, testo con numero mai ascoltati), attività 30 giorni e data ultimo ascolto. Dati assenti non vanno inventati.

## Aspetto, Backup, Diagnostica

Aspetto con Paper/Graphite/Auto, trama, animazioni, **dimensione testo reale** con anteprima live e conferma, range 6–30 px del testo più piccolo e rapporti tipografici costanti. Backup originale conservato. Diagnostica riassuntiva più Registro errori separato, nascosto nelle impostazioni avanzate e collegato da Diagnostica. Motori, modelli, deck, sessioni e progressi della versione stabile non si modificano.
