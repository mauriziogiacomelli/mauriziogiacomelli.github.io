---
title: "Partenza puntuale alle 7:30 con EventBridge Scheduler"
excerpt: "Il giro di ricerca di Job Tracker partiva con 6-12 minuti di ritardo. Un timer AWS e una piccola Lambda lo fanno partire all'orario esatto, anche con l'ora legale."
progetto: "Job Tracker"
tags: [Job Tracker, AWS, EventBridge, Lambda]
---

L'agente di [Job Tracker](/lavori/job-tracker/) cerca offerte di lavoro due volte al giorno, alle 7:30 e alle 19:30.
O meglio: avrebbe dovuto. L'email del mattino arrivava alle 7:38, alle 7:41, a volte quasi alle 7:45.

## Il sintomo

L'agente è una *routine* di Claude Code nel cloud, con il suo orario in formato cron. Ogni giro partiva in ritardo,
e mai dello stesso tempo.

## La causa

Lo scheduler delle routine aggiunge di proposito un ritardo casuale, tra i 6 e i 12 minuti, per distribuire il carico
quando migliaia di routine hanno lo stesso orario. È una scelta sensata per chi gestisce il servizio, ma non
configurabile. E se l'email deve essere lì quando accendo il computer, "verso le 7:40" non basta.

## La soluzione

Le routine si possono avviare anche via API, con una chiamata HTTP e un token. Allora l'orario l'ho spostato su AWS:

1. **EventBridge Scheduler** con l'espressione `cron(30 7,19 * * ? *)`, fuso orario `Europe/Rome` e finestra
   flessibile disattivata: parte all'orario esatto e segue da solo il cambio dell'ora legale.
2. Il timer invoca una **Lambda** minima che legge il token da SSM Parameter Store (cifrato, mai nel codice) e
   chiama l'API della routine con il messaggio "Giro programmato".
3. Nella routine resta solo un orario di riserva annuale che, senza quel messaggio, non fa nulla.

Il tutto è infrastruttura come codice con AWS CDK in Java, insieme al resto dell'app. Costo: zero, perché due
invocazioni al giorno stanno ampiamente nel piano gratuito.

## Perché così

Il servizio che esegue il lavoro (l'agente) e quello che decide *quando* eseguirlo (il timer) ora sono separati.
L'orario dipende da un componente pensato per essere puntuale, e l'ho verificato con una prova a sessione chiusa: il
giro è partito all'orario giusto anche senza nessuno collegato.
