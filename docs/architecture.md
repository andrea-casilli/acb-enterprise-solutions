# Architettura

## Obiettivo

Nexus Enterprise Solutions centralizza processi di workforce management, inbound logistics e collaborazione interna: presenza del personale, pianificazione dei turni, assegnazione di attività, accettazione delle merci e richieste tra reparti. L'interfaccia è localizzata in italiano, inglese, spagnolo, tedesco, francese e polacco.

## Componenti

| Componente | Percorso | Responsabilità |
| --- | --- | --- |
| Web portal | `apps/web` | Interfaccia React per consultazione e operatività quotidiana, localizzazione lato client e centro comunicazioni |
| API | `apps/api` | Autenticazione, validazione degli input, API REST e controllo di accesso alle comunicazioni interdipartimentali |
| Data access | `prisma` | Schema relazionale MySQL e seed dimostrativo |
| Database | MySQL | Persistenza delle entità operative e logistiche |
| CI | `.github/workflows` | Validazione, build e analisi statica del repository |

## Flusso delle richieste

1. Il browser carica l'applicazione React compilata e seleziona la lingua salvata localmente o la lingua del browser supportata.
2. Il frontend richiede autenticazione all'API e usa il token JWT per le chiamate protette.
3. L'API valida il payload con Zod, applica lo scope dell'utente e usa Prisma Client per accedere a MySQL.
4. Il database restituisce dati di dominio, inclusi thread e stati delle comunicazioni, che l'API espone tramite endpoint REST.

L'health check dell'API è disponibile in `GET /health`. Gli endpoint sotto `/api` richiedono autenticazione. L'attuale catalogo degli endpoint copre dashboard, personale, presenze, turni, attività, ricevimento e anagrafiche.

## Domini dati principali

```text
User ── 1:1 ── Employee ── N:1 ── Department
                      └── N:1 ── JobProfile
Employee ── 1:N ── ClockEvent / ShiftAssignment / WorkTask

User ── 1:N ── DepartmentCommunication (autore)
Department ── 1:N ── DepartmentCommunication (mittente / destinatario)
DepartmentCommunication ── 1:N ── CommunicationMessage ── N:1 ── User

GoodsReceipt ── N:1 ── Supplier
             └── N:1 ── Warehouse ── 1:N ── StockLocation
             └── 1:N ── ReceiptLine ── N:1 ── Item
Item ── 1:N ── InventoryStock / StockMovement
```

Lo schema Prisma è la fonte di verità per il modello dati. Qualunque evoluzione deve essere accompagnata da una migrazione versionata, revisionata e reversibile nel piano di rilascio.

## Localizzazione e comunicazioni

La localizzazione è una responsabilità del frontend: le stringhe standard dell'interfaccia, la navigazione e gli stati vengono risolti nella lingua selezionata, senza modificare i dati operativi memorizzati. Testi inseriti dagli utenti, denominazioni aziendali e dati anagrafici non vengono tradotti automaticamente.

Il dominio `DepartmentCommunication` registra una comunicazione interna con riferimento, mittente, destinatario, autore, priorità e stato. `CommunicationMessage` conserva le risposte del thread. Gli stati previsti sono `OPEN`, `IN_PROGRESS`, `RESOLVED` e `CLOSED`; una comunicazione chiusa non accetta nuovi messaggi.

Il centro comunicazioni non è un sistema di posta elettronica: l'API non dispone di endpoint SMTP/IMAP, non chiama servizi esterni e non effettua consegne e-mail. Le comunicazioni restano nel perimetro del portale e del database MySQL.

## Confini di sicurezza

Il repository separa frontend, API e database, ma l'architettura non elimina la necessità di controlli applicativi e infrastrutturali. Per il go-live, le autorizzazioni devono essere applicate lato API per ogni azione sensibile; il frontend e il token memorizzato nel browser non costituiscono da soli un confine di sicurezza.

Per le comunicazioni, gli utenti con ruolo `ADMIN`, `HR` o `SUPERVISOR` hanno visibilità di gestione; gli altri ruoli sono limitati alle comunicazioni in cui il proprio reparto è mittente o destinatario e richiedono un account associato a un reparto.

I requisiti di hardening, privacy e monitoraggio sono raccolti in [operations.md](operations.md) e [SECURITY.md](../SECURITY.md). La guida funzionale su lingue e messaggistica è disponibile in [localization-and-communications.md](localization-and-communications.md).
