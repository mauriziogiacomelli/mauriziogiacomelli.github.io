---
title: "Da un utente a più utenti con @TenantId di Hibernate"
excerpt: "Job Tracker era nato per una persona sola. Per aprirlo ad altri senza rischiare di mostrare a qualcuno i dati di un altro ho usato la multi-tenancy di Hibernate: filtro e assegnazione automatici, verificati da test."
progetto: "Job Tracker"
tags: [Job Tracker, Java, Spring Boot, Hibernate, Sicurezza]
---

[Job Tracker](/lavori/job-tracker/) è nato come strumento personale: un solo utente, io. Quando ho deciso di aprirlo
a qualche collega, il problema era chiaro: offerte, candidature, ricerche e CV di ognuno devono restare **suoi**, e
un errore qui non è un bug qualsiasi, è una fuga di dati personali.

## La strada ovvia (e fragile)

Aggiungere una colonna `utente_id` a ogni tabella e un `where utente_id = ?` a ogni query. Funziona, finché tutti i
metodi se lo ricordano. Basta un nuovo endpoint, un repository Spring Data con un metodo derivato in più, un
`findById` dimenticato, e un utente vede l'offerta di un altro indovinandone l'id.

## La soluzione: @TenantId

Hibernate 6 ha la multi-tenancy "a colonna" integrata. Si marca il campo proprietario dell'entità:

```java
@Entity
public class Offerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @TenantId
    private String utenteId;
    // ...
}
```

e si dice a Hibernate chi è l'utente corrente:

```java
@Bean
CurrentTenantIdentifierResolver<String> risolutoreUtente(UtenteCorrente utenteCorrente) {
    return new CurrentTenantIdentifierResolver<>() {
        public String resolveCurrentTenantIdentifier() { return utenteCorrente.id(); }
        public boolean validateExistingCurrentSessions() { return true; }
    };
}
```

Da quel momento **ogni query** sulle entità con `@TenantId` viene filtrata sull'utente corrente, e ogni nuovo record
riceve il suo id in automatico. Nessun servizio deve ricordarsi niente.

## I dettagli che contano

- **Chi è l'utente corrente.** Per gli utenti viene dal token di Cognito, verificato da Spring Security. L'agente di
  ricerca lavora per tutti, uno alla volta: indica l'utente con un header, che un filtro di sicurezza accetta solo con
  il token dell'agente. I ruoli (amministratore o utente) stanno nel database, non nel token.
- **I dati esistenti.** Una migrazione Flyway ha aggiunto la colonna e assegnato tutto lo storico all'amministratore.
- **Le query SQL native** non passano dal filtro di Hibernate: dove servono, il filtro sull'utente è scritto a mano.
- **I test.** Un test di integrazione su PostgreSQL reale (Testcontainers) crea un secondo utente e verifica che
  parta da zero e che non possa leggere un'offerta dell'amministratore nemmeno conoscendone l'id: la risposta è 404,
  come se non esistesse.

## Perché così

La sicurezza che dipende dalla memoria di chi scrive il codice prima o poi cede. Spostare il filtro in un punto unico,
applicato dal framework, trasforma "ricordarsi di filtrare" in "dover fare apposta per non filtrare". E il test
garantisce che resti così anche dopo le prossime modifiche.
