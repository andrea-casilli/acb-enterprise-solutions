# Nexus Enterprise Solutions

Nexus Enterprise Solutions è un portale operativo per coordinare persone, turni, attività, flussi di ricevimento merci e comunicazioni tra reparti. Riunisce le informazioni essenziali di HR operations e logistica inbound in un'unica interfaccia web multilingua.

> **Stato del progetto:** fondazione applicativa / pre-release. Prima di un utilizzo produttivo, completare i controlli indicati nella [checklist di go-live](docs/operations.md#checklist-di-go-live), in particolare quelli relativi a sicurezza, privacy e continuità operativa.

## Indice

- [Funzionalità](#funzionalità)
- [Lingue e comunicazioni interne](#lingue-e-comunicazioni-interne)
- [Architettura](#architettura)
- [Avvio rapido](#avvio-rapido)
- [Configurazione](#configurazione)
- [Sviluppo e qualità](#sviluppo-e-qualità)
- [Messa in produzione](#messa-in-produzione)
- [Documentazione](#documentazione)
- [Sicurezza e contributi](#sicurezza-e-contributi)

## Funzionalità

| Area | Capacità incluse |
| --- | --- |
| Personale | Anagrafica collaboratori, reparti e profili professionali |
| Presenze | Rilevazione di ingressi/uscite e stato della giornata lavorativa |
| Turni | Template e assegnazioni con stato di pianificazione |
| Mansionario | Attività per persona o profilo, priorità, scadenze e completamento |
| Inbound | Preavvisi, vettori, ricevimento e avanzamento dello stato della merce |
| Magazzino | Fornitori, depositi, ubicazioni, articoli, scorte e movimenti |
| Multilingua | Interfaccia in italiano, inglese, spagnolo, tedesco, francese e polacco |
| Comunicazioni interne | Messaggi e richieste tra reparti, priorità, stato di lavorazione e thread di risposta |

L'applicazione dispone di autenticazione JWT e di ruoli utente nell'anagrafica. Prima del go-live, autorizzazioni granulari per ruolo, audit trail e ulteriori misure di hardening devono essere configurati e verificati: consulta [Sicurezza](SECURITY.md) e la [checklist di go-live](docs/operations.md#checklist-di-go-live).

## Lingue e comunicazioni interne

Il selettore lingua è disponibile nella schermata di accesso e nel portale autenticato. La preferenza viene conservata nel browser dell'utente; alla prima apertura viene usata la lingua del browser quando supportata, altrimenti l'italiano. Date e formati dell'interfaccia adottano la localizzazione selezionata.

Il centro **Comunicazioni** raccoglie richieste e messaggi tra reparti con mittente, destinatario, priorità e stato. È un canale applicativo interno: conserva lo storico nel database e non invia e-mail, non crea caselle aziendali e non contatta provider o servizi esterni. Per limiti, flusso e integrazione API, consulta [Lingue e comunicazioni interne](docs/localization-and-communications.md).

## Architettura

```text
Browser
  │
  ▼
React + Vite (apps/web) ── HTTPS / REST ──► Express API (apps/api)
                                                   │
                                                   ▼
                                            Prisma ORM ──► MySQL 8.4+
```

- **Frontend:** React 18, TypeScript e Vite, con localizzazione lato client per sei lingue.
- **API:** Express, Zod, JWT e Prisma Client, inclusi messaggi e richieste interdipartimentali protetti.
- **Dati:** MySQL con schema Prisma per workforce management e inbound logistics.
- **Automazione:** GitHub Actions verifica installazione, schema Prisma e build a ogni push e pull request.

Per i confini, i componenti e il modello dati, consulta [docs/architecture.md](docs/architecture.md).

## Avvio rapido

### Prerequisiti

- Node.js 22 LTS o successivo
- npm 10 o successivo
- MySQL 8.4+ oppure Docker Desktop / Docker Engine

### Ambiente locale

In PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up -d mysql
npm ci
npm run db:generate
npx prisma db push
npm run db:seed
npm run dev
```

Apri il portale su [http://localhost:5173](http://localhost:5173). L'API espone l'health check su [http://localhost:3001/health](http://localhost:3001/health).

Il seed crea esclusivamente dati dimostrativi, incluso l'utente `admin@nexus.local` con password `ChangeMe123!`. Non usare queste credenziali al di fuori di un ambiente locale e sostituiscile prima di qualunque distribuzione condivisa.

> Se utilizzi un MySQL o MariaDB già attivo (ad esempio tramite XAMPP), non avviare il container sulla stessa porta. Aggiorna invece `DATABASE_URL` in `.env` con host, porta e credenziali corretti.

## Configurazione

| Variabile | Obbligatoria | Descrizione |
| --- | --- | --- |
| `DATABASE_URL` | Sì | URL di connessione MySQL usato da Prisma |
| `JWT_SECRET` | Sì | Segreto lungo, casuale e riservato per firmare i token |
| `PORT` | No | Porta dell'API; predefinita `3001` |
| `VITE_API_URL` | Produzione | URL pubblico dell'API per il frontend compilato |

Usa `.env.example` solo come riferimento. I file `.env` sono esclusi da Git; non salvare mai password, token, chiavi private o esportazioni contenenti dati personali nel repository.

## Sviluppo e qualità

```powershell
npm ci
npm run db:generate
npx prisma validate
npm run build

- `npm run dev` avvia API e frontend in modalità sviluppo.
- `npm run build` compila entrambi i workspace.
- `npm run db:generate` genera Prisma Client.
- `npm run db:migrate` è il comando interattivo per creare e applicare migrazioni durante lo sviluppo. Le migrazioni revisionate devono essere versionate prima del deploy.

La pipeline CI esegue validazione Prisma e build su push e pull request verso `main`. Per le convenzioni di modifica, consulta [CONTRIBUTING.md](CONTRIBUTING.md).

## Messa in produzione

La distribuzione in produzione richiede una configurazione esplicita dell'infrastruttura: reverse proxy HTTPS, MySQL non esposto pubblicamente, backup verificati, gestione centralizzata dei segreti e osservabilità. Non usare `prisma db push` come procedura di deploy: crea e revisiona migrazioni Prisma, quindi applicale con una procedura controllata.

La guida operativa, incluse le verifiche di disponibilità, backup e rollback, è disponibile in [docs/operations.md](docs/operations.md).

## Documentazione

- [Architettura e modello dati](docs/architecture.md)
- [Lingue e comunicazioni interne](docs/localization-and-communications.md)
- [Runbook operativo e checklist di go-live](docs/operations.md)
- [Policy di sicurezza](SECURITY.md)
- [Guida ai contributi](CONTRIBUTING.md)
- [Codice di condotta](CODE_OF_CONDUCT.md)

## Sicurezza e contributi

Le vulnerabilità non devono essere aperte come issue pubbliche: segui [SECURITY.md](SECURITY.md). Le issue e le pull request devono usare i template inclusi in `.github/` e rispettare [CONTRIBUTING.md](CONTRIBUTING.md).

## Licenza

Questo progetto è distribuito con [licenza MIT](LICENSE). Il testo completo è disponibile nel file `LICENSE` alla radice del repository.
