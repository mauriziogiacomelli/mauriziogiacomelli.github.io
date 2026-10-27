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

**Applicazione web full stack per gestire una ricerca di lavoro**: un agente automatico trova nuove offerte due volte al giorno, l'app tiene traccia delle candidature e del loro stato e invia un riepilogo via email.

[Prova la demo](https://mauriziogiacomelli.github.io/job-tracker-demo/){: .btn .btn--primary .btn--large}
[Come è fatto](https://mauriziogiacomelli.github.io/job-tracker-demo/#/come-e-fatto){: .btn .btn--inverse .btn--large}

La demo è navigabile senza registrazione e usa dati di esempio inventati: si possono cercare offerte, registrare candidature, cambiarne lo stato e modificare le impostazioni.
{: .notice--info}

![Elenco delle offerte nella demo di Job Tracker](/assets/images/lavori/job-tracker-offerte.png)

### Cosa fa

- Raccoglie le offerte trovate da un **agente di ricerca automatico** (ogni giorno alle 7:30 e alle 19:30), evitando i doppioni
- Mostra le offerte con **filtri, ordinamento e paginazione**: compenso, modalità di lavoro, data di pubblicazione, grado di corrispondenza con il profilo
- Gestisce le **candidature** con lo storico dei cambi di stato e segnala quelle da sollecitare
- Permette di configurare l'**email di riepilogo**: quali giri, quali sezioni, quale soglia di interesse
- Funziona su PC e **su telefono**, installabile come app (PWA)

### Architettura e tecnologie

| Livello | Tecnologie |
|---|---|
| Frontend | Angular 19 (standalone, signals), Angular Material, PWA |
| Backend | Java 21, Spring Boot 4, Spring Data JPA, Spring Security (OAuth2 resource server), Flyway |
| Dati | PostgreSQL serverless (Neon) |
| Cloud | AWS Lambda con SnapStart, API Gateway, Amazon Cognito, S3 e CloudFront, SSM Parameter Store |
| Infrastruttura | AWS CDK in Java (infrastruttura come codice) |
| Qualità | Test di integrazione con Testcontainers su PostgreSQL reale, test unitari Angular |

**Costo di esercizio: 0 € al mese**, grazie a servizi serverless che si pagano solo quando vengono usati.

### Punti di interesse tecnico

- **Sicurezza senza password nel backend**: login con OpenID Connect (authorization code + PKCE) e API che accetta solo token JWT firmati, verificati su issuer, scadenza, tipo e client
- **Privilegio minimo**: l'agente automatico usa un token "macchina" che può registrare offerte ma non modificare candidature o impostazioni; ogni regola è coperta da un test
- **Spring Boot su AWS Lambda**: avvio rapido con SnapStart e gestione corretta delle connessioni al database attorno allo snapshot
- **19 problemi reali risolti e documentati** durante lo sviluppo (sintomo, causa, soluzione e motivazione), consultabili nella pagina [Come è fatto](https://mauriziogiacomelli.github.io/job-tracker-demo/#/come-e-fatto)

<figure class="half">
  <img src="/assets/images/lavori/job-tracker-candidatura.png" alt="Dettaglio di una candidatura con storico degli stati">
  <img src="/assets/images/lavori/job-tracker-mobile.png" alt="Elenco delle offerte su telefono">
  <figcaption>Dettaglio di una candidatura e vista da telefono.</figcaption>
</figure>
