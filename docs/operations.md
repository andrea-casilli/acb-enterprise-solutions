# Runbook operativo e go-live

## Configurazione degli ambienti

| Ambiente | Dati | Database | Segreti |
| --- | --- | --- | --- |
| Sviluppo | Solo dati fittizi | MySQL locale o container | `.env` locale non versionato |
| Staging | Dati sintetici o anonimizzati | Istanza isolata | Secret manager della piattaforma |
| Produzione | Dati operativi autorizzati | MySQL gestito e non pubblico | Secret manager con rotazione |

Non riutilizzare mai password di sviluppo, dati demo o dump locali in staging o produzione.

## Deploy consigliato

1. Compila e valida l'artefatto con CI.
2. Esegui backup verificato del database di destinazione.
3. Applica le migrazioni Prisma revisionate in una finestra controllata.
4. Distribuisci API e frontend dietro un reverse proxy HTTPS.
5. Configura `VITE_API_URL` con l'endpoint HTTPS dell'API prima della build del frontend.
6. Verifica `GET /health`, login, dashboard e un flusso di ricevimento con dati di prova.
7. Monitora errori, latenza e connessioni al database dopo il rilascio.

## Backup e ripristino

- Definisci frequenza, retention, cifratura e proprietario dei backup MySQL in base agli obblighi aziendali.
- Esegui test periodici di ripristino su un ambiente isolato; un backup non testato non è una garanzia.
- Documenta RPO e RTO concordati e la procedura di escalation.
- Verifica che dump, log e snapshot non siano caricati nel repository né inviati su canali non autorizzati.

## Osservabilità

In produzione, raccogli almeno esito e tempi dell'health check, errori API e tassi di autenticazione fallita, saturazione di CPU/memoria/connessioni MySQL, esito di backup/migrazioni/deployment ed eventi di sicurezza senza registrare segreti o dati non necessari.

## Privacy e dati del personale e delle comunicazioni

Presenze, identificativi, assegnazioni di lavoro e contenuti delle comunicazioni interne possono costituire dati personali o informazioni aziendali riservate. Prima dell'uso con dati reali, il titolare deve definire base giuridica, ruoli di trattamento, minimizzazione, tempi di conservazione, controllo degli accessi, informativa e procedure per l'esercizio dei diritti, in conformità alla normativa applicabile (incluso GDPR quando pertinente).

Definisci inoltre regole chiare per la classificazione delle informazioni, l'uso accettabile del centro comunicazioni, il trattamento delle richieste urgenti e la conservazione o cancellazione dei thread. I contenuti dei messaggi non devono essere copiati in log applicativi, sistemi di monitoraggio o canali esterni non autorizzati.

## Localizzazione e comunicazioni interne

Prima del rilascio, verifica le sei lingue supportate (italiano, inglese, spagnolo, tedesco, francese e polacco) sui flussi essenziali: accesso, navigazione, presenze, turni, mansionario, ricevimento e comunicazioni. I testi operativi inseriti manualmente restano nella lingua in cui sono stati creati; non considerare la localizzazione dell'interfaccia una traduzione certificata o automatica dei contenuti aziendali.

Il centro comunicazioni è un servizio interno al portale. Non è configurato per inviare e-mail, gestire una casella postale aziendale, inoltrare messaggi verso Internet o notificare provider esterni. L'eventuale adozione di una vera integrazione e-mail richiede un progetto dedicato che includa identità, consenso, auditing, sicurezza, policy di retention, gestione degli errori e monitoraggio della consegna.

## Checklist di go-live

- [ ] Il repository è privato o pubblico secondo una decisione esplicita del titolare e dispone di una licenza definita.
- [ ] `JWT_SECRET`, password database e altri segreti sono generati, custoditi e ruotabili tramite un secret manager.
- [ ] Il fallback di sviluppo per i segreti è disabilitato o reso impossibile nell'ambiente di produzione.
- [ ] Le autorizzazioni per ruolo sono applicate lato API e verificate per ogni endpoint sensibile.
- [ ] CORS è limitato alle origini web autorizzate e tutto il traffico esterno usa HTTPS.
- [ ] MySQL è su rete privata, con utente dedicato a privilegi minimi, backup e restore testati.
- [ ] Tutte le modifiche di schema sono rappresentate da migrazioni Prisma revisionate.
- [ ] Log e audit trail rispettano requisiti di sicurezza, privacy e conservazione concordati.
- [ ] Sono verificati i testi e i formati delle sei lingue supportate sui flussi critici e sulle viste per ruolo.
- [ ] Sono definiti destinatari autorizzati, regole di priorità, tempi di presa in carico e retention delle comunicazioni interdipartimentali.
- [ ] È esplicitamente comunicato agli utenti che il centro comunicazioni è interno e non invia e-mail o notifiche esterne.
- [ ] CI, dependency updates e code scanning sono attivi sul repository GitHub.
- [ ] Sono definiti ownership tecnica, procedura di incident response e piano di rollback.
