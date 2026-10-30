---
title: "Il logo nelle email inviate con l'API di Gmail"
excerpt: "Immagini esterne tolte, sfondi spariti: come ho portato il logo di Job Tracker nell'email di riepilogo con un allegato in linea e cid:att0."
progetto: "Job Tracker"
tags: [Job Tracker, Email, Gmail, HTML]
---

L'email di riepilogo di [Job Tracker](/lavori/job-tracker/) la compone il backend Spring Boot in HTML; poi l'agente
la invia con lo strumento Gmail. Volevo una cosa semplice: il logo dell'app in alto. Ci sono voluti più tentativi del
previsto.

## Il sintomo

Nell'HTML c'era un normale `<img src="https://…/logo.png">`. Nell'email ricevuta, al suo posto, niente. Anche il
pulsante "Apri Job Tracker" aveva perso il colore di sfondo.

## La causa

Lo strumento di invio ripulisce l'HTML: toglie le immagini esterne e gli attributi di sfondo. È una protezione
ragionevole (le immagini esterne servono spesso a tracciare chi apre l'email), ma lascia solo due strade: niente
immagini, oppure immagini *allegate* al messaggio.

## La soluzione

Un'email può contenere immagini allegate "in linea" e richiamarle dall'HTML con un identificativo `cid:`. La parte
difficile è stata scoprire quale identificativo lo strumento assegna: ho preparato bozze con varianti diverse e
ispezionato il messaggio grezzo. Risultato: il primo allegato si chiama `att0`, quindi nell'HTML va scritto
`<img src="cid:att0">`.

Il resto:

- il backend restituisce, insieme a oggetto e HTML, il logo in base64; l'agente lo allega in linea;
- il logo è ridotto a 56 pixel e 48 colori: circa 800 byte, così l'agente lo copia senza errori;
- il pulsante usa un **bordo** nei colori del logo invece dello sfondo, che verrebbe tolto.

## Perché così

Un'immagine allegata non dipende da un server esterno, non viene bloccata come "contenuto remoto" e si vede anche
offline. E il pulsante con il bordo ha lo stesso aspetto in ogni client di posta, tema scuro compreso.
