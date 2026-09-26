# Policy di sicurezza

## Segnalare una vulnerabilità

Non aprire issue pubbliche per vulnerabilità, esposizione di dati, credenziali, token o potenziali bypass di autorizzazione.

Usa la funzione **Report a vulnerability** nella scheda *Security* del repository GitHub, se abilitata dal titolare. Se non è disponibile, contatta privatamente il maintainer del repository e condividi solo le informazioni strettamente necessarie per la riproduzione. Includi impatto, componenti coinvolti, passaggi riproducibili con dati fittizi/sanitizzati e una prova di concetto non distruttiva, se disponibile.

Non accedere, modificare o estrarre dati di terzi per dimostrare il problema.

## Gestione della segnalazione

Il maintainer confermerà la ricezione, valuterà la priorità e comunicherà il piano di mitigazione attraverso il canale privato. La divulgazione pubblica deve avvenire solo dopo la correzione e il coordinamento con il maintainer.

## Versioni supportate

Finché non viene pubblicata una release stabile, la sicurezza viene gestita sulla branch `main`. Le versioni precedenti non sono supportate salvo indicazione esplicita nelle note di rilascio.

## Requisiti minimi per un ambiente di produzione

- Impostare `JWT_SECRET` con un valore casuale, lungo e custodito in un secret manager; non affidarsi mai al valore di sviluppo.
- Usare account MySQL dedicati con privilegi minimi, password univoche e rete non esposta pubblicamente.
- Terminare TLS con un reverse proxy configurato correttamente e limitare CORS alle origini autorizzate.
- Proteggere i backup, testarne periodicamente il ripristino e definire tempi di conservazione.
- Applicare autorizzazioni effettive per ruolo, audit trail e logging strutturato prima di trattare dati reali.
- Non distribuire le credenziali o i dati di seed demo in ambienti condivisi.

## Ambito

Sono in ambito le componenti versionate in questo repository: frontend, API, schema Prisma, configurazioni di build e workflow GitHub. Dipendenze di terze parti devono essere segnalate con riferimenti alla versione coinvolta.
