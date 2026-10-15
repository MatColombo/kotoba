# Changelog — Kotoba Drive v0.4.2

## Layout flashcard: kanji sempre prioritario

- Rimosso il taglio della parola principale dovuto a `max-height` e `overflow:hidden`.
- L'area del vocabolo usa la propria altezza naturale, consentendo la disposizione su più righe; il pannello degli esempi si ridimensiona prima del kanji.
- Utilizzata più larghezza utile: margini orizzontali ridotti, riga unica per capitolo ed etichetta della domanda, disposizione a due colonne per parole giapponesi brevi su telefono sufficientemente largo e per le card desktop.
- Conservate le dimensioni del testo principale e quelle dei tasti di navigazione. Su schermi molto stretti i pulsanti precedente/successivo mostrano le frecce senza didascalie lunghe.
- Verificati layout a 320×568, 375×667, 390×844, 428×926, 1366×768, 844×390 e 320×480 con Chromium simulato, compresa una parola giapponese artificiale lunga. Testato anche giapponese nella soluzione, in direzione inversa.
- Nessuna modifica allo schema del deck o dei progressi; cache Service Worker aggiornata. Le frasi restano bozze da revisionare linguisticamente.

---

# Changelog — Kotoba Drive v0.4.1

## Flashcard e player

- Rivelazione progressiva per `meaning`, forme grammaticali, frase giapponese e traduzione: ciascun elemento appare quando raggiunto dalla lettura audio.
- Se l'utente salta **in avanti** a un altro capitolo della stessa carta, ogni area ancora nascosta viene svelata e rimane visibile nei capitoli successivi. La carta nuova parte nuovamente nascosta.
- Pannello esempi ampliato: testo giapponese, lettura kana e traduzione ora vanno a capo; se la loro area non basta, scorrimento verticale automatico lento avanti/indietro. L'animazione non viene riavviata a ogni aggiornamento dell'interfaccia; rispetta `prefers-reduced-motion`.
- Corretto il layout a 320×568, che inizialmente comprimeva a zero la parola giapponese. Il contatore resta visibile anche su schermi bassi.
- Contatore `meaningPlays`: incrementa **solo quando termina con successo** una lettura TTS dell'elemento significato. È visibile in un angolo della carta, nell'elenco lessicale e nel dettaglio.
- `meaningPlays` è indipendente dal conteggio esposizioni complete; sopravvive a salvataggi, backup, fusioni e riconciliazione degli ID.

## Sessioni

- Nuova opzione indipendente **Mescola anche gli esempi** nel creatore della sessione.
- L'ordine per carta è estratto una sola volta, con seed e lista ordinata degli ID degli esempi salvati nella sessione. I filtri di registro/scenario si applicano prima del sorteggio; nuovi esempi di una revisione successiva finiscono in fondo, senza alterare l'ordine iniziale.
- Shuffle carte e shuffle esempi possono essere attivi, disattivi o combinati.

## Contenuti

- Deck N4 alla **revisione 6**: tutte le 2.250 frasi contestuali hanno ora testo giapponese nuovo e distinto. Nessuna è identica a una delle 750 frasi originali.
- Composizione di proposizioni con vocaboli e forme grammaticali diverse, senza più citazioni del vecchio esempio incorniciate nello scenario. Sono incluse 60 frasi scritte individualmente per 場合 e 心配; le altre 2.190 frasi sono bozze costruite da modelli grammaticali e associazioni lessicali curate.
- ID dei 75 vocaboli, ID delle 2.250 frasi contestuali e 750 vecchi esempi mantenuti; le otto storie e i trenta scenari restano disponibili.
- **Attenzione:** la revisione madrelingua individuale non è stata eseguita. Generazione, verifica della struttura e originalità testuale non certificano naturalezza, accuratezza delle traduzioni o uso corretto del keigo. Il deck rimane indicato come «contenuti in revisione».
- Aggiornamento automatico e transazionale dalla revisione 4 o 5 alla 6 se gli ID rimangono compatibili: copia recuperabile della precedente revisione dei deck e della memoria archiviata nel backup pre-importazione.

## Test

- 80/80 test Node.js, comprendendo motore audio, archivio, backup, shuffle degli esempi, contatore separato e originalità delle 2.250 nuove frasi.
- Browser Chromium con archivio e sintesi simulati: salto in avanti, nuova carta, contatore TTS, salvataggio della sessione e layout 320/390/1366 px; nessun errore JavaScript rilevato.
- 0 errori di struttura, 0 segnalazioni euristiche superficiali; **nessuna revisione linguistica madrelingua**.
- IndexedDB reale in browser non verificato a causa di blocco alle navigazioni locali/intercettate; test iPhone, volante Bluetooth e TTS reale restano da eseguire.

## Verifica finale del pacchetto

- Corretti i casi sistematici di mancato allineamento del tempo verbale fra aggettivi giapponesi al passato e traduzione inglese/italiana in frasi generate (58 esempi segnalati nella prima verifica).
- Aggiunto test automatico sul tempo passato degli aggettivi e aggiornato il nome cache del Service Worker per distribuire i nuovi contenuti.
- Il controllo non equivale a una revisione linguistica individuale dei 2.250 esempi.
