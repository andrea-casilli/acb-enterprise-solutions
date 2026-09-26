# Contribuire a Nexus Enterprise Solutions

Grazie per voler migliorare il progetto. Ogni modifica deve preservare affidabilità operativa, riservatezza dei dati e tracciabilità delle decisioni.

## Prima di iniziare

1. Leggi [README.md](README.md), [SECURITY.md](SECURITY.md) e la documentazione della componente interessata.
2. Apri o collega un'issue per le modifiche non banali; non usare issue pubbliche per problemi di sicurezza.
3. Mantieni lo scope della pull request ristretto e descrivi l'impatto su personale, turni o logistica.

## Ambiente di sviluppo

Segui la procedura di [avvio rapido](README.md#avvio-rapido). Usa dati fittizi o anonimizzati: non importare esportazioni di clienti, dipendenti, fornitori o magazzini reali.

## Standard per le modifiche

- Scrivi codice TypeScript leggibile e compatibile con le convenzioni esistenti.
- Valida input e autorizzazioni sul lato API; il frontend non è un confine di sicurezza.
- Versiona le modifiche allo schema tramite migrazioni Prisma revisionabili. Non usare `db push` come sostituto delle migrazioni nel percorso di rilascio.
- Aggiorna README o la documentazione quando cambia un comportamento operativo, una variabile d'ambiente o una procedura.
- Non includere segreti, valori `.env`, dump di database, credenziali demo aggiuntive o log con dati personali.

## Verifica prima della pull request

```powershell
npm ci
npm run db:generate
npx prisma validate
npm run build
```

Verifica manualmente il flusso modificato con dati demo e riporta l'evidenza nel template della pull request.

## Pull request

Compila integralmente il template. La revisione valuta funzionalità, compatibilità dello schema, sicurezza, privacy, documentazione e impatto sul rilascio. Evita di unire modifiche che richiedono una decisione di prodotto, una migrazione rischiosa o un cambiamento di accesso senza approvazione esplicita.

## Codice di condotta

Partecipando al progetto accetti il [Codice di condotta](CODE_OF_CONDUCT.md).
