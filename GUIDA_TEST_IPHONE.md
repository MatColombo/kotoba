# Checklist manuale Safari iPhone — v0.4.2

**Compilare sul dispositivo reale**. Data, modello iPhone, versione iOS, modello autoradio, modo connessione (Bluetooth/CarPlay) e versione del browser devono essere registrati per ogni prova. Eseguire prove audio e volante con auto parcheggiata.

| Test | Risultato | Note |
|---|---|---|
| Aggiornamento da alpha.3/beta.1 mantenendo progressi | Da testare | Prima esportare backup completo |
| Avvio da Safari via HTTPS GitHub Pages | Da testare | Verificare intestazione v0.4.2 |
| Installazione su schermata Home e apertura PWA | Da testare | Non cancellare lo storage precedente |
| Layout senza scroll sulla flashcard (portrait) | Da testare | Provare orientamento ruotato |
| Menu, editor sequenze e slider | Da testare | Rate, pitch, volume per lingua/gruppo/elemento |
| TTS giapponese e IT/EN | Da testare | Riprodurre 3 esempi e 3 coniugazioni |
| Stop dopo errore TTS e nessun completamento errato | Da testare | Se la voce diventa indisponibile |
| Shuffle persistente | Da testare | Creare 10 carte, chiudere, riaprire |
| ★ preferito e Noto persistenti | Da testare | E controllare la dashboard |
| IndexedDB dopo chiusura e riavvio | Da testare | Salvare sessione e progressi |
| Esportazione e importazione study.json | Da testare | Confrontare master/override e contatori |
| Backup completo e recupero post import | Da testare | Usare deck di prova, non quello principale |
| Deck importato da JSON locale | Da testare | Controllare card ed ID |
| Aggiornamento additivo del deck | Da testare | Non deve alterare ordine sessione |
| Cache offline dopo installazione | Da testare | Modalità aereo, aprire PWA e deck |
| TTS offline | Da testare | Dipende dalle voci iOS installate |
| Screen Wake Lock | Da testare | Permessi e comportamento su iOS |
| Bluetooth play/pausa | Da testare | Registrare eventi nel Test volante |
| Volante avanti/indietro fra capitoli | Da testare | Solo ai confini cambia carta |
| Interruzione telefonata e ripresa | Da testare | Evitare doppie esposizioni |
| Pagina aggiornata via Service Worker | Da testare | Verificare asset e deck nuovo |

## Come verificare una sessione senza toccare lo schermo durante la guida

1. Da fermo aprire il menu Sessioni e statistiche.
2. Creare una sessione con 10 carte e shuffle attivo; memorizzare la prima parola.
3. Entrare nello studio, avviare la riproduzione e lasciare completare due capitoli.
4. Da fermo usare i pulsanti del volante e controllare in Test volante il registro degli eventi ricevuti.
5. Chiudere la PWA, riaprirla e verificare che ordine e posizione siano invariati.
6. Esportare `study.json`, importarlo su un'altra installazione di prova con lo stesso deck e verificare i progressi.

Un evento Media Session ricevuto non dimostra la compatibilità con *tutti* i comandi fisici o tutte le autoradio. Non dare esito "Superato" senza una verifica effettiva del dispositivo.

## Test aggiuntivi specifici della v0.4.1

- [ ] Avvia una carta senza premere «Mostra soluzione»: significato, forme ed esempi sono inizialmente nascosti e appaiono solo quando viene raggiunta la rispettiva lettura audio.
- [ ] Durante il primo capitolo premi **Successivo**: tutte le aree ancora nascoste diventano visibili; un ulteriore salto della stessa carta non le nasconde di nuovo.
- [ ] Alla nuova carta le sezioni ripartono nascoste.
- [ ] Su una frase molto lunga verifica l'andata/ritorno lento del testo giapponese, del kana e della traduzione; nessun carattere deve restare definitivamente inaccessibile.
- [ ] Il badge `Significato ♫ N` appare nell'angolo della carta; dopo una lettura completa del significato avanza di 1 e il valore è identico nel vocabolario e nel dettaglio.
- [ ] Interrompendo prima della fine la lettura del significato il badge **non** deve avanzare.
- [ ] Crea una sessione con shuffle **esempi attivo** ma shuffle **carte disattivo**; l'ordine delle carte è invariato e gli esempi variano fra i vocaboli.
- [ ] Chiudi e riapri la PWA: seed, ordine dei singoli esempi, posizione della sessione, preferiti e contatori devono restare invariati.
- [ ] In «Deck e backup», verifica deck N4 **revisione 6**; se è rimasta la 4, verifica l'aggiornamento del sito, la cache PWA e l'import del deck.
- [ ] Esegui un export di `study.json`, verifica che contenga `meaningPlays`, `exampleOrders` e `exampleShuffleSeed` per le sessioni nuove; ripristina solo dopo aver conservato un backup esterno.

Il controllo linguistico individuale di nuove frasi e storie non è coperto da questa checklist tecnica.

## Test supplementari v0.4.2 — vocabolo giapponese

- [ ] Su iPhone verticale apri **恥ずかしい** e **すばらしい**: tutti e cinque i caratteri devono rimanere completamente visibili, senza sovrapposizione con le forme o la soluzione.
- [ ] Su una card breve, ad esempio **選ぶ**, verifica che il layout affiancato mostri integralmente vocabolo e significato, quando lo spazio lo permette.
- [ ] Ripeti con il verso lingua madre → giapponese: anche il kanji mostrato come soluzione non deve essere tagliato.
- [ ] Ruota l'iPhone: se lo spazio verticale è insufficiente può sparire parte degli esempi, **non** il kanji.
- [ ] Su schermi piccoli verifica le frecce precedente/successivo e il pulsante play; devono restare utilizzabili.
- [ ] Aumenta le dimensioni del testo dalle impostazioni accessibilità e verifica che nessun carattere del vocabolo venga tagliato.
- [ ] Conferma che esempi troppo lunghi continuino a scorrere lentamente senza spostare il vocabolo principale.
