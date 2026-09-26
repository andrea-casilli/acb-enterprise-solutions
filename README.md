# ACB Enterprise Solutions

ACB Enterprise Solutions è un portale operativo open source per coordinare personale, turni, mansioni, logistica inbound e comunicazioni tra reparti in un’unica interfaccia web.

> Stato del progetto: pre-release. Prima dell’uso produttivo, completare la checklist di sicurezza, privacy, backup e continuità operativa.

## Funzionalità

- Anagrafica collaboratori, reparti e profili professionali
- Presenze, pianificazione turni e mansionario
- Gestione ricevimento merci, fornitori, depositi, articoli e movimenti
- Comunicazioni e richieste operative tra reparti
- Interfaccia in italiano, inglese, spagnolo, tedesco, francese e polacco

## Architettura

- Frontend: React, TypeScript e Vite
- API: Express, Zod, JWT e Prisma Client
- Database: MySQL 8.4+
- Automazione: GitHub Actions per validazione e build

## Avvio rapido

```powershell
Copy-Item .env.example .env
docker compose up -d mysql
npm ci
npm run db:generate
npx prisma db push
npm run db:seed
npm run dev

## Licenza
```text
docs: rename README to ACB Enterprise Solutions
