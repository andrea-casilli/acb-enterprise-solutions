# Lingue e comunicazioni interne

## Finalità

Nexus Enterprise Solutions offre un'interfaccia localizzata e un centro di comunicazione tra reparti. Le due capacità migliorano l'operatività di team internazionali senza spostare informazioni aziendali al di fuori del portale.

## Lingue supportate

| Codice | Lingua dell'interfaccia | Locale per date e formati |
| --- | --- | --- |
| `it` | Italiano | `it-IT` |
| `en` | English | `en-GB` |
| `es` | Español | `es-ES` |
| `de` | Deutsch | `de-DE` |
| `fr` | Français | `fr-FR` |
| `pl` | Polski | `pl-PL` |

Il selettore è disponibile sia nella pagina di accesso sia nel portale autenticato. La scelta viene memorizzata localmente nel browser. Per un nuovo browser, il portale usa la lingua del browser se è nell'elenco supportato; in tutti gli altri casi usa l'italiano.

La localizzazione riguarda le stringhe standard dell'interfaccia, la navigazione, gli stati e i formati visualizzati. Non modifica né traduce automaticamente messaggi, nomi di reparti, anagrafiche, attività, documenti o altri contenuti creati dagli utenti. Per contenuti multilingua formalmente approvati, l'organizzazione deve adottare un proprio processo editoriale e di revisione.

## Centro comunicazioni

La sezione **Comunicazioni** è il punto unico per messaggi e richieste tra reparti. Ogni comunicazione contiene:

- un riferimento univoco;
- reparto mittente e reparto destinatario;
- autore autenticato;
- titolo e contenuto;
- tipo (`MESSAGE` o `REQUEST`), priorità e stato;
- date di creazione, aggiornamento e, quando applicabile, chiusura;
- messaggi di risposta ordinati nel relativo thread.

Le priorità disponibili sono `LOW`, `NORMAL`, `HIGH` e `URGENT`. Gli stati seguono un flusso controllato:

```text
OPEN ───────► IN_PROGRESS ───────► RESOLVED ───────► CLOSED
  │                 │                    │
  └─────────────────┴────────────────────┴────────► CLOSED
                    RESOLVED ────────────► IN_PROGRESS
```

Una comunicazione `CLOSED` è conclusa e non accetta ulteriori risposte. Le richieste restano ordinate in base all'ultimo aggiornamento, così una nuova risposta riporta il thread tra gli elementi più recenti.

## Visibilità e responsabilità

Tutte le operazioni richiedono autenticazione. Gli utenti con ruolo `ADMIN`, `HR` o `SUPERVISOR` gestiscono le comunicazioni nell'intera organizzazione. Gli altri utenti possono consultare e aggiornare solo i thread in cui il proprio reparto è mittente o destinatario; per questi ruoli l'account deve essere associato a un reparto.

Gli amministratori dell'organizzazione devono definire chi può inviare richieste per ciascun reparto, i tempi attesi di presa in carico, il significato delle priorità e il responsabile della chiusura. La chiusura tecnica non sostituisce l'eventuale approvazione formale richiesta dai processi aziendali.

## Confine del servizio: non è posta elettronica

> Il centro comunicazioni è esclusivamente interno a Nexus Enterprise Solutions.

Il modulo registra le comunicazioni nel database MySQL e le espone agli utenti autorizzati tramite API del portale. Non invia e-mail, non crea né sincronizza caselle postali aziendali, non usa SMTP o IMAP, non effettua consegne a indirizzi esterni e non contatta provider di e-mail, chat o collaboration esterni.

L'indirizzo e-mail presente nell'anagrafica utente è un identificativo dell'account applicativo; non rappresenta una casella postale gestita dal portale. Qualsiasi futura integrazione con posta elettronica o un servizio esterno richiede una progettazione separata e una valutazione di sicurezza, privacy, audit, permessi, retry, monitoraggio e conservazione.

## API REST

Gli endpoint sono protetti da JWT e fanno parte del prefisso `/api`.

| Operazione | Endpoint | Note |
| --- | --- | --- |
| Elencare comunicazioni | `GET /api/communications` | Filtri disponibili per reparto, stato, priorità e tipo; limite massimo 100 |
| Leggere un thread | `GET /api/communications/:id` | Restituisce comunicazione e messaggi ordinati cronologicamente |
| Creare una comunicazione | `POST /api/communications` | Richiede destinatario, titolo e contenuto; priorità e tipo sono configurabili |
| Rispondere nel thread | `POST /api/communications/:id/messages` | Non consentito dopo la chiusura |
| Aggiornare lo stato | `PATCH /api/communications/:id/status` | Accetta solo le transizioni di stato consentite |

Le API validano titolo e contenuto, verificano l'esistenza dei reparti e applicano lo scope dell'utente autenticato. Client diversi dal portale devono usare esclusivamente questi endpoint protetti e non devono tentare di bypassare il controllo lato server.

## Indicazioni operative

- Usa un titolo che renda riconoscibile l'azione richiesta e indica nel testo il contesto, l'esito atteso e l'eventuale scadenza.
- Imposta `HIGH` o `URGENT` solo secondo la procedura aziendale definita; il modulo non sostituisce i canali di emergenza.
- Non inserire password, segreti, dati sanitari o informazioni non necessarie nei thread.
- Riesamina periodicamente le richieste aperte, i tempi di risoluzione e le policy di retention.
- Esegui il test di ogni lingua con utenti rappresentativi prima di rendere disponibile un nuovo rilascio.

Per requisiti di sicurezza, privacy e messa in produzione, consulta [operations.md](operations.md) e [SECURITY.md](../SECURITY.md).
