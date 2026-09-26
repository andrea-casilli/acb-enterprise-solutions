# ACB Enterprise Solutions

ACB Enterprise Solutions è un portale operativo open source per la gestione integrata di personale, turni, mansioni, logistica inbound e comunicazioni tra reparti.

La piattaforma riunisce processi HR e operativi in un'unica interfaccia web multilingua, pensata per aziende con reparti amministrativi, produttivi e logistici.

> **Stato del progetto:** pre-release. Prima dell'utilizzo in produzione, completare verifiche di sicurezza, privacy, backup, continuità operativa e controllo degli accessi.

## Funzionalità

| Area | Funzionalità |
| --- | --- |
| Personale | Anagrafica collaboratori, reparti, sedi, profili professionali e ruoli |
| Presenze | Gestione ingressi, uscite, stato giornaliero e consultazione presenze |
| Turni | Pianificazione, template, assegnazioni e monitoraggio dei turni |
| Mansionario | Attività per collaboratore o ruolo, priorità, scadenze e completamento |
| Logistica inbound | Preavvisi, fornitori, vettori, ricevimento merci e avanzamento consegne |
| Magazzino | Depositi, ubicazioni, articoli, scorte e movimenti |
| Comunicazioni | Richieste e messaggi operativi tra reparti con priorità e stato |
| Multilingua | Italiano, inglese, spagnolo, tedesco, francese e polacco |

## Reparti e profili

La piattaforma è configurabile per Direzione, Risorse Umane, Amministrazione, IT, Acquisti, Commerciale, Produzione, Qualità, Manutenzione, Logistica, Magazzino, Accettazione merci e Spedizioni.

I turni e le mansioni supportano profili come direttivo, responsabile di reparto, impiegato amministrativo, HR specialist, tecnico IT, operatore di produzione, addetto magazzino, addetto accettazione merci, addetto spedizioni, manutentore e addetto controllo qualità.

## Architettura

```text
Browser
  │
  ▼
React + Vite ── HTTPS / REST ──► Express API
                                      │
                                      ▼
                                 Prisma ORM
                                      │
                                      ▼
                                 MySQL 8.4+
```

- **Frontend:** React, TypeScript e Vite
- **Backend:** Express, Zod, JWT e Prisma Client
- **Database:** MySQL 8.4+
- **Automazione:** GitHub Actions per validazione e build

## Avvio rapido

### Prerequisiti

- Node.js 22 LTS o successivo
- npm 10 o successivo
- MySQL 8.4+ oppure Docker Desktop / Docker Engine

```powershell
Copy-Item .env.example .env
docker compose up -d mysql
npm ci
npm run db:generate
npx prisma db push
npm run db:seed
npm run dev
```

Apri il portale su [http://localhost:5173](http://localhost:5173). L'API espone il controllo di disponibilità su [http://localhost:3001/health](http://localhost:3001/health).

## Credenziali demo

```text
Email: admin@acb.local
Password: ChangeMe123!
```

Non utilizzare queste credenziali in ambienti condivisi o di produzione.

## Configurazione

| Variabile | Descrizione |
| --- | --- |
| `DATABASE_URL` | URL di connessione MySQL utilizzato da Prisma |
| `JWT_SECRET` | Segreto lungo e casuale per firmare i token |
| `PORT` | Porta API; valore predefinito 3001 |
| `VITE_API_URL` | URL pubblico dell'API usato dal frontend |

Non caricare mai su GitHub file `.env`, password, token, chiavi private o esportazioni contenenti dati personali.

## Produzione

Prima del go-live configurare HTTPS tramite reverse proxy, MySQL non esposto pubblicamente, backup verificati, gestione centralizzata dei segreti, controllo granulare degli accessi e audit trail. Non utilizzare `prisma db push` come procedura di deploy: usare migrazioni Prisma revisionate.

## Documentazione

- [Architettura e modello dati](docs/architecture.md)
- [Lingue e comunicazioni interne](docs/localization-and-communications.md)
- [Runbook operativo e checklist di go-live](docs/operations.md)
- [Policy di sicurezza](SECURITY.md)
- [Guida ai contributi](CONTRIBUTING.md)
- [Codice di condotta](CODE_OF_CONDUCT.md)

## Sicurezza

Le vulnerabilità non devono essere aperte come issue pubbliche. Seguire le indicazioni in [SECURITY.md](SECURITY.md).

## Licenza

ACB Enterprise Solutions è distribuito con licenza [MIT](LICENSE).
