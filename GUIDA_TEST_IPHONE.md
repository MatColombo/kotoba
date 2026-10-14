# Checklist manuale Safari iPhone — v0.4.0

**Compilare sul dispositivo reale**. Data, modello iPhone, versione iOS, modello autoradio, modo connessione (Bluetooth/CarPlay) e versione del browser devono essere registrati per ogni prova. Eseguire prove audio e volante con auto parcheggiata.

| Test | Risultato | Note |
|---|---|---|
| Aggiornamento da alpha.3/beta.1 mantenendo progressi | Da testare | Prima esportare backup completo |
| Avvio da Safari via HTTPS GitHub Pages | Da testare | Verificare intestazione v0.4.0 |
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
