---
title: "Job Tracker: un agente AI che cerca lavoro al posto mio"
excerpt: "Perché ho costruito Job Tracker, cosa fa e con quali tecnologie: Angular, Spring Boot su AWS Lambda e un agente AI che due volte al giorno cerca offerte per me."
tags: [Job Tracker, Spring Boot, Angular, AWS, AI]
---

Cercare un nuovo incarico da freelance significa aprire ogni giorno le stesse dieci piattaforme, scorrere decine di
annunci già visti, scartare quelli in sede o sotto tariffa e tenere traccia a mano delle candidature inviate. È un
lavoro ripetitivo, e il lavoro ripetitivo si può automatizzare.

Così è nato **Job Tracker**.

## Cosa fa

- **Cerca al posto mio, due volte al giorno.** Alle 7:30 e alle 19:30 un agente AI legge i miei criteri (ruoli,
  tecnologie, modalità di lavoro, contratto, compenso minimo, aziende da escludere) e cerca annunci su LinkedIn,
  Indeed, portali italiani e siti carriere delle aziende.
- **Verifica ogni annuncio.** Apre la pagina, ricava data, contratto, compenso e requisiti, valuta quanto
  corrispondono al mio profilo e scrive cosa manca. Gli annunci fuori criteri vengono scartati con il motivo.
- **Mi manda un riepilogo per email**: nuove offerte, offerte da approfondire, candidature in corso con il
  promemoria di sollecito.
- **Tiene traccia delle candidature**: stato, storico, colloqui, prossimo passo.

## Come è fatto

| Livello | Tecnologia |
|---|---|
| Frontend | Angular 19 con signals, Angular Material, app installabile (PWA) |
| Backend | Java 21, Spring Boot 4, Spring Security, Hibernate multi-tenancy, Flyway |
| Cloud | AWS Lambda con SnapStart, API Gateway, Cognito, EventBridge Scheduler, infrastruttura come codice con AWS CDK |
| Database | PostgreSQL serverless su Neon |
| Agente | Routine di Claude Code avviata dal timer AWS |

È un'applicazione completa, non un prototipo: più utenti con dati separati, CV cifrato nel database, test
automatici (unitari, di integrazione su PostgreSQL reale ed end-to-end con controlli di accessibilità), test di
intrusione e revisione di sicurezza del codice.

## Provala

La **[demo](/job-tracker-demo/)** funziona senza login, con dati di esempio. La pagina
**[Job Tracker: come è fatto](/lavori/job-tracker/)** racconta architettura, scelte tecniche e i problemi reali
risolti durante lo sviluppo.

Nei prossimi articoli racconto alcuni di questi problemi, uno alla volta.
