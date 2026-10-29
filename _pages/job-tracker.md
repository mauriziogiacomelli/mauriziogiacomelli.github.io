---
title: "Job Tracker: come è fatto"
permalink: /lavori/job-tracker/
excerpt: "Architettura, scelte tecniche e problemi risolti di Job Tracker: Angular 19, Spring Boot 4 su AWS Lambda, Cognito, PostgreSQL serverless e un agente AI che cerca offerte di lavoro."
toc: true
toc_label: "Indice"
---

<!-- generata da scripts/case-study-sito.mjs del repository job-tracker: non modificare a mano -->

**Job Tracker** raccoglie le offerte di lavoro trovate da un agente automatico due volte al giorno, tiene traccia delle candidature e del loro stato, e invia un riepilogo via email. È un progetto full stack completo: frontend Angular, backend Spring Boot su AWS Lambda, login con Amazon Cognito, database PostgreSQL serverless, infrastruttura come codice e test automatici.

[Prova la demo](https://mauriziogiacomelli.github.io/job-tracker-demo/){: .btn .btn--primary .btn--large}
[Torna a Lavori](/lavori/){: .btn .btn--inverse .btn--large}

- **3** stack AWS definiti in Java (CDK)
- **20** test di integrazione su PostgreSQL reale
- **33** test end-to-end Cypress, accessibilità inclusa
- **26** problemi risolti e documentati
- **0 €** costo mensile previsto

## Funzionalità

### Dashboard e offerte

Le offerte appena trovate sono segnate “nuova” e stanno in cima alla dashboard finché non le apri, su ogni dispositivo.

*Quando apri un’offerta il backend salva la data di apertura, così l’etichetta “nuova” sparisce su tutti i tuoi dispositivi. Filtri, ordinamento e pagine della lista li calcola il backend, con Spring Data JPA Specifications e paginazione.*

### Candidature e storico

Dall’offerta si registra la candidatura; ogni cambio di stato (colloquio, offerta, rifiuto…) resta nello storico.

*Dopo la candidatura l’offerta esce dagli elenchi (filtro con sottoquery EXISTS) e si segue da Candidature; resta visibile a richiesta.*

### Ricerche salvate

Criteri personalizzabili (ruoli, modalità, contratto, compenso, aziende escluse) salvati con un nome.

*Una sola ricerca è “predefinita”, garantito da un indice univoco parziale in PostgreSQL: è quella che usa l’agente.*

### Cerca ora

Oltre ai giri delle 7:30 e 19:30, la ricerca si può avviare subito; la pagina mostra l’avanzamento.

*Il backend chiama il trigger API della routine con un token custodito in SSM; limiti per utente (una ricerca ogni 15 minuti, poche ogni 2 ore). Nella demo è solo simulata.*

### Profilo dal CV

Facoltativo: carichi o incolli il CV, dai il consenso al trattamento dei dati, e l’agente propone profilo e parole chiave per la ricerca. Il file viene letto nel browser e non lascia il dispositivo.

*Testo cifrato con AES-256-GCM (chiave in SSM); recupero “stile RAG” con estratti e punteggio BM25, senza recapiti: all’agente arriva solo ciò che serve.*

### Primo accesso guidato

Chi entra la prima volta trova un benvenuto che spiega come iniziare: CV o due parole chiave. Finché la ricerca è vuota l’agente non parte, così nessuno riceve offerte a caso.

*Il backend calcola se il profilo è compilato (parole chiave o profilo nella ricerca predefinita) ed espone all’agente solo chi va incluso nei giri.*

### Offerte scartate

“Non mi interessa” toglie l’offerta dagli elenchi e l’agente non la ripropone più; si può annullare.

*Nuovo stato SCARTATA (migrazione Flyway): escluso dagli elenchi, ma letto dall’agente per riconoscere i doppioni.*

### Più utenti

Ognuno ha offerte, candidature, ricerche ed email propri. L’amministratore invita gli utenti e può sospendere accesso, ricerca automatica ed email.

*Multi-tenancy di Hibernate (@TenantId): ogni query è filtrata sull’utente del token; gli inviti passano da Cognito (AdminCreateUser) con permessi IAM minimi.*

### Riepilogo email configurabile

Si scelgono i giri da ricevere, le sezioni dell’email e il match minimo delle offerte mostrate.

*Le impostazioni stanno nel database; l’agente le legge a ogni giro con un token in sola lettura.*

### App installabile

Si installa sul telefono come app (PWA), con navigazione in basso e avviso quando esce una nuova versione.

*Service worker di Angular: controlla gli aggiornamenti all’avvio e al ritorno in primo piano, poi propone “Aggiorna”.*

## Architettura

![Schema dell'architettura: browser, GitHub Pages, Cognito, API Gateway, Lambda con Spring Boot, SSM, Neon PostgreSQL e agente di ricerca](/assets/images/lavori/job-tracker-architettura.svg)

Il modello dei dati e i flussi principali (giro dell'agente, "Cerca ora", analisi del CV) sono illustrati nella pagina interattiva [Come è fatto](https://mauriziogiacomelli.github.io/job-tracker-demo/#/come-e-fatto) della demo.

## Tecnologie e perché

### Frontend

- **Angular 19 (standalone, signals)**: Interfaccia web: pagine, navigazione, stato dell’applicazione.
  Framework maturo per applicazioni gestionali. Le API moderne (signals, nuovo control flow, rotte in lazy loading) riducono il codice e i cicli di change detection.
- **Angular Material (tema Material 3)**: Componenti grafici accessibili: campi, menu, dialog, paginazione.
  Componenti già accessibili e responsive; il tema è costruito sui colori del sito personale.
- **angular-oauth2-oidc**: Login OpenID Connect con authorization code + PKCE, rinnovo dei token, header Bearer.
  Libreria standard e indipendente dal fornitore: lo stesso codice funzionerebbe con Keycloak o Microsoft Entra ID.
- **PWA (service worker)**: App installabile sul telefono, caricamento rapido.
  Esperienza da app senza sviluppare un’app nativa.
- **Cypress + axe-core**: Test end-to-end dei flussi completi e controlli automatici di accessibilità (WCAG).
  Verificano l’app come la usa una persona; girano sulla modalità demo, quindi senza login né servizi cloud.

### Backend

- **Java 21 + Spring Boot 4**: API REST per offerte, candidature e impostazioni.
  Stack enterprise di riferimento; Spring Boot 4 è la generazione più recente (Spring Framework 7, Jakarta EE 11).
- **Spring Data JPA + Specifications**: Accesso al database e ricerca con filtri componibili.
  I filtri (testo, tipo, stato, data) si combinano in modo tipizzato senza scrivere query a mano.
- **Spring Security (OAuth2 resource server)**: Valida i token JWT di Cognito e decide chi può fare cosa.
  Il backend non gestisce password né sessioni: si fida solo di token firmati, verificati su issuer, scadenza, tipo e client.
- **Flyway**: Versiona lo schema del database con script SQL numerati.
  Lo schema evolve in modo riproducibile in locale, nei test e in produzione; Hibernate si limita a verificarlo.
- **Testcontainers**: Test di integrazione su un PostgreSQL vero, avviato in Docker.
  Si verifica il comportamento reale (SQL, vincoli, sicurezza) invece di un database simulato in memoria.

### Dati

- **PostgreSQL su Neon (serverless)**: Database dell’applicazione.
  PostgreSQL identico a quello locale, piano gratuito permanente, si sospende quando non è usato.

### Cloud

- **AWS Lambda con SnapStart**: Esegue il backend Spring Boot senza server da gestire.
  Si paga solo l’uso effettivo; SnapStart riparte da uno snapshot della JVM già avviata e riduce l’avvio a freddo.
- **API Gateway (HTTP API)**: Punto di ingresso HTTPS dell’API, CORS, limiti di richieste.
  Più economico e veloce della variante REST API; gestisce CORS e throttling senza codice.
- **Amazon Cognito**: Utenti, login, emissione dei token per l’utente e per l’automazione.
  Servizio gestito (password, MFA, recupero account) e gratuito per pochi utenti.
- **GitHub Pages**: Pubblicazione del frontend in HTTPS.
  Hosting statico senza server; GitHub Pages dà un indirizzo sul dominio personale.
- **AWS CDK in Java**: Infrastruttura come codice: Cognito, Lambda, API Gateway, permessi IAM.
  Infrastruttura riproducibile e versionata, scritta nello stesso linguaggio del backend.

### Automazione

- **Routine Claude Code + Gmail**: Cerca nuove offerte due volte al giorno, o subito con “Cerca ora”, e invia un riepilogo via email.
  Agente nel cloud, attivo anche a computer spento, con permessi minimi sull’API.

## Problemi risolti durante lo sviluppo

26 problemi reali incontrati costruendo e mettendo in produzione l'app, con sintomo, causa, soluzione e motivazione.

### Sicurezza e login

#### Dopo il login l’API rispondeva 401

- **Sintomo:** Il login funzionava, ma tutte le chiamate all’API venivano rifiutate come non autenticate.
- **Causa:** L’interceptor della libreria OAuth che aggiunge il token è registrato tramite dependency injection, mentre l’HttpClient era configurato solo con interceptor funzionali: veniva ignorato senza errori.
- **Soluzione:** Aggiunto withInterceptorsFromDi() alla configurazione di HttpClient.
- **Perché:** Mantiene la libreria standard invece di riscrivere a mano l’aggiunta del token.

#### Errori di validazione trasformati in 403

- **Sintomo:** Un input non valido inviato dall’automazione riceveva 403 Forbidden invece di 400.
- **Causa:** Spring inoltra gli errori alla rotta /error, che era protetta come il resto dell’API: il client macchina non aveva il ruolo richiesto.
- **Soluzione:** La rotta /error è accessibile a tutti; aggiunto un test che verifica il 400.
- **Perché:** Il client deve ricevere l’errore vero per capire cosa correggere.

#### Privilegio minimo per l’automazione

- **Sintomo:** L’automazione doveva scrivere offerte, ma non doveva poter leggere o modificare tutto.
- **Causa:** Un unico tipo di token avrebbe dato all’automazione gli stessi poteri dell’utente.
- **Soluzione:** Due tipi di token: utente (ruolo completo) e client credentials con scope dedicati (scrittura offerte, sola lettura). Ogni regola è coperta da test.
- **Perché:** Se il secret dell’automazione venisse compromesso, il danno possibile resta limitato.

#### Pagina bianca all’avvio

- **Sintomo:** Con una configurazione sbagliata l’app restava completamente bianca.
- **Causa:** L’inizializzazione del login avviene prima dell’avvio dell’app: un errore lì bloccava tutto.
- **Soluzione:** Errore gestito con un messaggio visibile e senza redirect infiniti verso il login.
- **Perché:** Un problema di configurazione deve essere diagnosticabile, non silenzioso.

#### Privacy del CV: chi può leggerlo

- **Sintomo:** Un CV contiene dati personali, a volte anche particolari (salute, origine): non può stare in chiaro in un database gestito da terzi.
- **Causa:** Database (Neon) e infrastruttura (AWS) sono di due fornitori diversi, e l’analisi la fa un agente di IA esterno.
- **Soluzione:** Testo cifrato dall’app con AES-256-GCM e chiave in AWS SSM: Neon conserva solo dati illeggibili, AWS ha la chiave ma non i dati. Consenso obbligatorio verificato dal server, file letto nel browser e mai inviato, recapiti tolti dagli estratti, cancellazione immediata con la revoca, informativa pubblica.
- **Perché:** Nessun fornitore da solo può leggere un CV. Il passo successivo valutato è l’analisi via Claude su Amazon Bedrock in UE, coperta dal contratto sul trattamento dei dati di AWS.

#### Il caricamento del CV falliva su Lambda

- **Sintomo:** In locale il CV si caricava, online la richiesta finiva con un errore 500.
- **Causa:** Su Lambda le richieste multipart non arrivano a Spring, e una richiesta non può superare 6 MB: un PDF con foto ci sta stretto. In più, aprire file caricati da altri sul server espone a PDF malevoli e “zip bomb”.
- **Soluzione:** Il testo si estrae nel browser (pdf.js per i PDF, fflate per i .docx, caricati solo quando servono) con controlli su firma del file, dimensione, pagine e testo decompresso; al server arriva solo il testo, in JSON. Il server non apre più file: tolta la libreria PDFBox.
- **Perché:** Il file non lascia mai il dispositivo, il limite sale a 15 MB e sul server sparisce un’intera classe di attacchi.

### Spring Boot su Lambda

#### L’applicazione non partiva su Lambda

- **Sintomo:** Errore all’avvio: ClassNotFoundException jakarta.el.ELManager.
- **Causa:** Per alleggerire il pacchetto era stato escluso Tomcat (su Lambda non serve un server HTTP), ma insieme era stata tolta la libreria di espressioni usata da Bean Validation.
- **Soluzione:** Esclusi solo i moduli server di Tomcat, mantenuto tomcat-embed-el.
- **Perché:** Pacchetto leggero senza perdere la validazione degli input.

#### 500 su ogni richiesta autenticata

- **Sintomo:** Le richieste con token valido fallivano con UnsupportedOperationException; in locale funzionavano.
- **Causa:** Dopo l’autenticazione Spring Security cambia l’ID di sessione (protezione da session fixation), ma l’adattatore servlet di Lambda non supporta le sessioni.
- **Soluzione:** Protezione disattivata esplicitamente: l’API è stateless e non usa sessioni.
- **Perché:** Con soli token Bearer la session fixation non è un rischio; la configurazione dichiara il modello reale.

#### Stato di salute sempre DOWN

- **Sintomo:** L’endpoint di health rispondeva 503 anche con database funzionante.
- **Causa:** Il controllo dello spazio su disco guardava la cartella dell’applicazione, che su Lambda è in sola lettura e risulta a 0 byte liberi.
- **Soluzione:** Controllo del disco disattivato solo nel profilo Lambda.
- **Perché:** Lo stato di salute deve riflettere i problemi veri (database), non limiti dell’ambiente.

#### Import CSV rifiutato (415)

- **Sintomo:** Il caricamento di un file CSV restituiva 415 Unsupported Media Type solo in produzione.
- **Causa:** L’adattatore Lambda non riconosceva l’header content-type inoltrato in minuscolo dall’HTTP API e lo sostituiva con application/json.
- **Soluzione:** L’endpoint legge il corpo come testo indipendentemente dal Content-Type dichiarato.
- **Perché:** Soluzione robusta e indipendente da un difetto dell’infrastruttura.

#### SnapStart e connessioni al database

- **Sintomo:** Con SnapStart le connessioni aperte prima dello snapshot sarebbero risultate morte dopo il ripristino.
- **Causa:** Lo snapshot congela la memoria della JVM, socket compresi.
- **Soluzione:** Hook CRaC e pool Hikari sospendibile: Spring chiude le connessioni prima dello snapshot e le riapre dopo.
- **Perché:** Si ottiene l’avvio rapido di SnapStart senza errori di connessione intermittenti.

### Infrastruttura AWS

#### CORS dal dominio GitHub

- **Sintomo:** Dal sito su GitHub Pages il browser bloccava le chiamate all’API.
- **Causa:** Le risposte preflight non contenevano gli header CORS, perché l’origine non arrivava correttamente a Spring attraverso l’adattatore.
- **Soluzione:** CORS gestito da API Gateway (risponde da solo alle OPTIONS) e lista delle origini allineata anche in Spring.
- **Perché:** CORS al bordo è più efficiente (le preflight non arrivano a Lambda) e non dipende dall’adattatore.

#### Scelta del database

- **Sintomo:** Serviva un PostgreSQL gratuito, senza costi fissi di rete.
- **Causa:** Aurora DSQL è gratuito ma richiede una sola DDL per transazione, autenticazione IAM e non è supportato dalla versione di Flyway in uso; RDS richiede una rete pubblica o un NAT a pagamento.
- **Soluzione:** PostgreSQL su Neon: nessuna modifica al codice, piano gratuito, password custodita cifrata in SSM Parameter Store.
- **Perché:** Valutate le alternative, è stata scelta quella con il minore impatto sul codice e costo zero.

#### Indirizzo su GitHub Pages

- **Sintomo:** L’app doveva vivere in una sottocartella del sito personale senza alterarlo.
- **Causa:** GitHub Pages non riscrive gli URL: le rotte dell’app avrebbero richiesto di sostituire la pagina 404 del sito.
- **Soluzione:** Rotte con # e indirizzi di login/logout calcolati dal percorso base della pagina.
- **Perché:** Il sito esistente resta intatto e la stessa build funziona sotto qualunque percorso.

#### Avviare l’agente su richiesta

- **Sintomo:** L’agente partiva solo agli orari programmati: serviva un modo per lanciarlo subito dall’app.
- **Causa:** Il trigger da evento GitHub richiede un repository collegato all’agente, che qui non serve.
- **Soluzione:** Trigger API della routine chiamato dal backend; il token è una SecureString in SSM letta al primo uso. Se la chiamata fallisce la richiesta viene annullata, così non resta “in attesa” per ore.
- **Perché:** Nessun segreto nel codice o nel browser, e un limite di frequenza protegge i consumi.

### Dati e backend

#### Colonna non trovata: "statoa"

- **Sintomo:** Hibernate non trovava la colonna stato\_a della tabella degli eventi.
- **Causa:** La strategia di naming converte "statoA" in "statoa": una maiuscola finale non viene separata.
- **Soluzione:** Nome della colonna dichiarato esplicitamente.
- **Perché:** Il mapping resta esplicito e verificato all’avvio (ddl-auto=validate).

#### Campi booleani assenti rifiutati

- **Sintomo:** Le richieste senza un campo booleano opzionale venivano rifiutate.
- **Causa:** Jackson 3 (Spring Boot 4) non accetta null per i tipi primitivi.
- **Soluzione:** Campo opzionale dichiarato come Boolean, con default lato servizio.
- **Perché:** Il contratto dell’API distingue "non indicato" da "falso".

#### Offerte senza data in cima all’elenco

- **Sintomo:** Ordinando per data di pubblicazione, le offerte senza data comparivano per prime.
- **Causa:** In PostgreSQL i valori nulli vengono prima nell’ordinamento discendente.
- **Soluzione:** Ordinamento con "nulls last" applicato a tutte le ricerche, coperto da un test.
- **Perché:** Le offerte più recenti e verificate devono essere le prime che si vedono.

#### Da un utente a più utenti senza rischi

- **Sintomo:** L’app era nata per una persona sola: aggiungere utenti voleva dire toccare ogni query, con il rischio di mostrare a qualcuno i dati di un altro.
- **Causa:** Un filtro “where utente = ?” scritto a mano in ogni metodo è facile da dimenticare.
- **Soluzione:** Colonna utente su ogni tabella (migrazione Flyway che assegna i dati esistenti all’amministratore) e @TenantId di Hibernate: il filtro e l’assegnazione sono automatici. L’agente indica l’utente con un header, verificato da un filtro di sicurezza.
- **Perché:** Un test verifica che un utente non possa leggere un’offerta di un altro neppure conoscendone l’id.

#### Un CV intero costa token, e contiene dati personali

- **Sintomo:** Passare tutto il CV all’agente a ogni analisi e a ogni valutazione di un’offerta significava migliaia di parole lette ogni volta, compresi nome, telefono ed email.
- **Causa:** Un modello linguistico legge tutto ciò che riceve: più testo vuol dire più consumo, e più dati personali esposti.
- **Soluzione:** Indice del CV a estratti brevi per sezione, con parole chiave ricavate da un dizionario tecnico e ricerca BM25: l’agente chiede la sintesi o gli estratti pertinenti ai requisiti di un’offerta. I recapiti vengono rimossi e il testo è cifrato nel database; senza consenso il CV non entra.
- **Perché:** Meno token e meno dati personali in giro, con lo stesso risultato: un test verifica sintesi, budget e anonimizzazione.

### Qualità e test

#### Modifica persa nelle impostazioni

- **Sintomo:** Un test end-to-end falliva in modo intermittente: un interruttore cambiato subito dopo l’apertura tornava al valore precedente.
- **Causa:** Race condition: la risposta del server arrivava dopo il tocco dell’utente e sovrascriveva il modulo.
- **Soluzione:** Modulo disabilitato finché i dati non sono caricati; il test attende il caricamento.
- **Perché:** Un test instabile spesso segnala un difetto reale, non va ignorato né ripetuto finché passa.

#### Tastiera aperta sul dialog di candidatura

- **Sintomo:** Il test scriveva il "prossimo passo" dentro il campo data.
- **Causa:** Il dialog metteva il focus sul primo campo (la data): sul telefono questo apre subito la tastiera sopra il modulo.
- **Soluzione:** Il dialog non mette più il focus automatico su un campo; nei test un comando dedicato tocca il campo e poi scrive.
- **Perché:** Il test ha fatto emergere un fastidio reale per chi usa l’app dal telefono.

#### Accessibilità: contrasto e nomi mancanti

- **Sintomo:** I controlli automatici axe-core segnalavano violazioni gravi.
- **Causa:** Contrasto insufficiente (link della striscia demo, badge colorati, offerte chiuse rese semitrasparenti), barra di caricamento senza nome e schede con un nome accessibile diverso dal testo visibile.
- **Soluzione:** Colori dei badge schiariti fino al rapporto 4.5:1, offerte chiuse distinte da bordo e testo barrato invece che dall’opacità, nomi accessibili corretti; i controlli girano a ogni esecuzione dei test, dopo il caricamento dei dati.
- **Perché:** L’accessibilità verificata in automatico non regredisce con le modifiche successive.

#### Avviso di nuova versione che non compariva

- **Sintomo:** L’app installata sul telefono si aggiornava in silenzio alla riapertura, ma con l’app aperta l’avviso “Aggiorna” non compariva.
- **Causa:** Il timer dei controlli girava nella zona di Angular: l’app non risultava mai “stabile” e il service worker veniva registrato solo dopo 30 secondi, quindi il controllo al ritorno in primo piano non partiva.
- **Soluzione:** Timer ed eventi fuori dalla zona di Angular, controllo anche all’avvio, registrazione immediata del service worker; versione visibile nel menu per verificarlo.
- **Perché:** Il comportamento è stato verificato sul telefono con release successive, non solo nei test automatici.

### Processo

#### Codice su GitHub che non compilava

- **Sintomo:** In locale tutto funzionava, ma due classi non erano mai finite nel repository.
- **Causa:** La regola .gitignore "config/" escludeva tutte le cartelle con quel nome, compreso il package Java config.
- **Soluzione:** Regola ancorata (/config/) e verifica con un clone pulito del repository.
- **Perché:** La build da zero è l’unica prova che il repository è completo.

#### Accesso a internet dell’automazione

- **Sintomo:** La ricerca automatica trovava gli annunci ma non riusciva ad aprirli.
- **Causa:** L’ambiente cloud dell’agente aveva un accesso alla rete limitato (errore DNS).
- **Soluzione:** Accesso alla rete abilitato e, come ripiego, ricerca mirata con indicazione esplicita del livello di verifica di ogni offerta.
- **Perché:** Le informazioni non verificate vengono dichiarate come tali, mai presentate come certe.
