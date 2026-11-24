---
title: "Ho costruito un agente AI che cerca lavoro al posto mio, due volte al giorno"
excerpt: "Job Tracker cerca gli annunci adatti ai tuoi criteri, li apre per controllare che siano veri e ancora aperti, scarta quelli che non vanno e ti manda un riepilogo per email."
progetto: "Job Tracker"
tags: [Job Tracker, Intelligenza artificiale, Java, Angular, AWS, Ricerca di lavoro]
header:
  image: /assets/images/copertina-agente-ai-cerca-lavoro.png
---

Cercare lavoro è un lavoro. Ogni mattina aprivo gli stessi siti, scorrevo gli stessi annunci ripubblicati dagli
aggregatori, cliccavo su offerte già chiuse, in sede quando cercavo da remoto, o vecchie di sei mesi.

Così ho costruito **Job Tracker**: due volte al giorno un agente AI cerca gli annunci adatti ai *miei* criteri, li
apre per controllare che siano veri e ancora aperti, scarta quelli che non vanno (e mi dice perché) e mi manda un
riepilogo per email.

È nato per me, ma oggi lo usano sempre più persone, ognuna con le proprie ricerche: sviluppatori e tecnici, e anche
profili lontani dal mondo IT.

## Cosa fa

- **Cerca alle 7:30 e alle 19:30** con i criteri di ognuno: ruolo e tecnologie, remoto / ibrido / in sede, tipo di
  contratto, tariffa o RAL minima, età massima degli annunci, aziende da escludere.
- **Apre e verifica ogni annuncio** prima di proporlo. Nell'app un'offerta è **"verificata il 23/11"** solo se
  l'agente ha davvero aperto la pagina; altrimenti è **"da controllare"**. Ho imparato che "trovato nei risultati di
  ricerca" e "verificato" non sono la stessa cosa.
- **Spiega gli scarti**: ogni annuncio scartato ha il suo motivo ("in sede a Milano, hai chiesto solo remoto", "non
  cita .NET") e lo recuperi con un clic se non sei d'accordo.
- **Non si ripete**: annunci già visti, scartati o a cui ti sei candidato non tornano.
- **Segue le candidature**: stato, storico, prossimo passo e promemoria per il sollecito.

## Tre cose che ho imparato e che funzionano

**1. Le regole le fa il codice, non il prompt.** All'inizio le regole stavano nelle istruzioni dell'agente ("solo
remoto", "al massimo 30 giorni"). Le rispettava… quasi sempre. Ora è il backend a dire di no: annuncio troppo vecchio,
link di un aggregatore invece dell'originale, offerta in sede per chi cerca solo remoto. L'agente è bravo a leggere e
valutare, il codice è bravo a rifiutare.

**2. Pagare solo quando serve.** L'app non ha un server acceso giorno e notte: parte quando qualcuno la usa, e
l'attesa all'avvio l'ho tolta con qualche accorgimento del cloud.

**3. I dati di chi cerca lavoro sono delicati.** Un CV e le aziende a cui ti candidi non sono informazioni da lasciare in
giro. L'accesso è protetto, anche con le passkey, senza password da ricordare; ogni utente vede soltanto i propri dati;
il CV è cifrato e parte solo dopo il tuo consenso.

Dietro c'è un'app Java e Angular sul cloud AWS, con un agente AI che fa le ricerche.

→ **Prova la demo, senza registrazione:** https://jobtrackerapp.it/demo/

→ **Prova gratuita di 14 giorni (fino a fine novembre):** https://jobtrackerapp.it/helloworld/

**Stai cercando lavoro, o conosci qualcuno che lo sta cercando?** Lascia che Job Tracker faccia le ricerche al posto
tuo: imposti una volta cosa cerchi e ogni mattina e ogni sera ti arrivano solo le offerte che valgono il tuo tempo.
**Fino a fine novembre la prova gratuita dura 14 giorni**: guarda la demo in un minuto e richiedi l'accesso.
