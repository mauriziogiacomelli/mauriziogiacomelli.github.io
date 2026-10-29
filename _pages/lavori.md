---
title: "Lavori"
permalink: /lavori/
layout: single
author_profile: true
toc: true
toc_label: "Progetti"
---

Una selezione di progetti personali che mostrano come lavoro: dall'analisi alla messa in produzione, con codice testato e scelte tecniche motivate.

## Job Tracker

**Applicazione web full stack per gestire una ricerca di lavoro**: un agente AI cerca e verifica nuove offerte due volte al giorno per ogni utente, secondo i suoi criteri; l'app tiene traccia delle candidature e del loro stato e invia un riepilogo via email.

[Prova la demo](https://mauriziogiacomelli.github.io/job-tracker-demo/){: .btn .btn--primary .btn--large}
[Come è fatto](https://mauriziogiacomelli.github.io/job-tracker-demo/#/come-e-fatto){: .btn .btn--inverse .btn--large}

La demo è navigabile senza registrazione e usa dati di esempio inventati: si possono cercare offerte, registrare candidature, cambiarne lo stato e modificare le impostazioni.
{: .notice--info}

![Elenco delle offerte nella demo di Job Tracker](/assets/images/lavori/job-tracker-offerte.png)

### Cosa fa

- Raccoglie le offerte trovate da un **agente di ricerca automatico** (ogni giorno alle 7:30 e alle 19:30, avviato da un timer AWS puntuale al minuto), evitando i doppioni e senza riaprire gli annunci già scartati
- **Verifica ogni annuncio**: data, contratto, compenso e requisiti, con la corrispondenza rispetto al profilo e cosa manca
- **Più utenti**, ognuno con le sue ricerche, offerte ed email; l'amministratore invita gli utenti e decide quanti possono essercene
- **CV facoltativo**: letto nel browser, l'agente propone profilo e parole chiave per la ricerca
- Mostra le offerte con **filtri, ordinamento e paginazione**: compenso, modalità di lavoro, data di pubblicazione, grado di corrispondenza con il profilo
- Gestisce le **candidature** con lo storico dei cambi di stato e segnala quelle da sollecitare
- Permette di configurare l'**email di riepilogo**: quali giri, quali sezioni, quale soglia di interesse; se spegni l'email di un giro, quel giro non si fa
- Funziona su PC e **su telefono**, installabile come app (PWA)

### Architettura e tecnologie

| Livello | Tecnologie |
|---|---|
| Frontend | Angular 19 (standalone, signals), Angular Material, PWA |
| Backend | Java 21, Spring Boot 4, Spring Data JPA, Spring Security (OAuth2 resource server), Flyway |
| Dati | PostgreSQL serverless (Neon) |
| Cloud | AWS Lambda con SnapStart, API Gateway, Amazon Cognito (managed login), EventBridge Scheduler, SSM Parameter Store; frontend su GitHub Pages |
| Agente | Routine Claude nel cloud, avviata dal timer AWS, che lavora sull'API con un token dedicato |
| Infrastruttura | AWS CDK in Java (infrastruttura come codice) |
| Qualità | Test di integrazione con Testcontainers su PostgreSQL reale, test unitari Angular, test end-to-end con verifica dell'accessibilità (Cypress + axe) |

**Costo di esercizio: 0 € al mese**, grazie a servizi serverless che si pagano solo quando vengono usati.

### Punti di interesse tecnico

- **Sicurezza senza password nel backend**: login con OpenID Connect (authorization code + PKCE) e API che accetta solo token JWT firmati, verificati su issuer, scadenza, tipo e client
- **Privilegio minimo**: l'agente automatico usa un token "macchina" che può registrare offerte ma non modificare candidature o impostazioni, e non ottiene mai i permessi di amministratore; ogni regola è coperta da un test
- **Dati separati per utente** con la multi-tenancy di Hibernate: nessun utente vede i dati di un altro, nemmeno conoscendone gli identificativi
- **CV cifrato** nel database con AES-256-GCM, con la chiave conservata separatamente in AWS; all'agente arrivano solo estratti senza recapiti
- **Sicurezza verificata** con test di intrusione sull'ambiente reale e revisione del codice
- **Spring Boot su AWS Lambda**: avvio rapido con SnapStart e gestione corretta delle connessioni al database attorno allo snapshot
- **27 problemi reali risolti e documentati** durante lo sviluppo (sintomo, causa, soluzione e motivazione), consultabili nella pagina [Come è fatto](https://mauriziogiacomelli.github.io/job-tracker-demo/#/come-e-fatto)

<figure class="half">
  <img src="/assets/images/lavori/job-tracker-candidatura.png" alt="Dettaglio di una candidatura con storico degli stati">
  <img src="/assets/images/lavori/job-tracker-mobile.png" alt="Elenco delle offerte su telefono">
  <figcaption>Dettaglio di una candidatura e vista da telefono.</figcaption>
</figure>
