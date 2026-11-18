/*
 * Giro guidato di Job Tracker: pagina statica, nessuna libreria, nessuna chiamata al backend.
 *
 * Parametri nell'indirizzo:
 *   ?auto=1               avanza da solo (pulsanti Avanti/Indietro nascosti), per registrare un video; un clic passa subito al passo dopo
 *   ?ritmo=5              secondi per passo in automatico (predefinito 4; alcuni passi lunghi durano un po' di piu')
 *   ?ciclo=1              in automatico, finito il giro ricomincia dall'inizio
 *   ?pulito=1             nasconde anche il contatore "4 / 25"
 *   ?passo=7              apre direttamente il passo 7 (per registrare una scena sola)
 *   ?formato=verticale    impaginazione da telefono per un video 1080x1920
 * Tasti: freccia destra o Spazio avanti, freccia sinistra indietro, Esc chiude il giro.
 *
 * Tutto e' deterministico: tempi fissi, niente numeri casuali, niente date calcolate al momento.
 */
(function () {
  'use strict';

  // ---------------- Parametri ----------------
  const parametri = new URLSearchParams(location.search);
  const AUTO = parametri.get('auto') === '1';
  const CICLO = parametri.get('ciclo') === '1';
  const PULITO = parametri.get('pulito') === '1';
  const VERTICALE = parametri.get('formato') === 'verticale';
  const RITMO = limita(parseFloat(parametri.get('ritmo')) || 4, 1, 60);
  const PASSO_INIZIALE = parseInt(parametri.get('passo'), 10) || 1;
  const movimentoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)');

  // misure del giro (px logici del palco)
  const PAD = 8; // spazio attorno all'elemento illuminato
  const DISTANZA = 18; // tra il riflettore e il fumetto
  const MARGINE = 12; // dal bordo del palco

  // ---------------- Dati di esempio (da src/app/demo/dati-demo.ts) ----------------
  // le date sono scritte come in un giorno fisso, cosi' ogni registrazione e' identica
  const OFFERTE = {
    1: { azienda: 'Nordlicht Software', ruolo: 'Senior Java Developer – Spring Boot e microservizi', sezione: 'NUOVA',
      compenso: '300-350 €/giorno', modalita: '100% remoto', contratto: 'P.IVA, 12 mesi', stato: 'ATTIVA', match: 'ALTO',
      pubblicata: 'pubblicata ieri', nuova: true, link: true },
    2: { azienda: 'Fintech Aurora', ruolo: 'Full Stack Developer Java / Angular', sezione: 'NUOVA',
      compenso: '280-320 €/giorno', modalita: 'Remoto, 1 giorno al mese a Milano', contratto: 'P.IVA', stato: 'ATTIVA',
      match: 'ALTO', pubblicata: 'pubblicata 2 giorni fa', candidato: true, link: true },
    3: { azienda: 'Logistica Delta', ruolo: 'Backend Engineer Java 21 – migrazione cloud', sezione: 'NUOVA',
      compenso: '250 €/giorno', modalita: 'Full remote', contratto: 'Freelance', stato: 'ATTIVA', match: 'MEDIO',
      pubblicata: 'pubblicata 4 giorni fa', nuova: true, link: true },
    4: { azienda: 'Studio Vela Consulting', ruolo: 'Java Developer per progetto bancario', sezione: 'NUOVA',
      compenso: null, modalita: 'Ibrido Trento', contratto: 'P.IVA', stato: 'ND', match: 'MEDIO',
      pubblicata: 'pubblicata 6 giorni fa', link: true },
    5: { azienda: 'Helix Health', ruolo: 'Senior Full Stack Engineer (Java, React)', sezione: 'DIPENDENTE',
      compenso: 'RAL 52-58k', modalita: '100% remoto Italia', contratto: 'Tempo indeterminato', stato: 'ATTIVA',
      match: 'MEDIO', pubblicata: 'pubblicata 3 giorni fa', link: true },
    6: { azienda: 'Quanta Retail', ruolo: 'Angular Developer con conoscenze Java', sezione: 'SPUNTO', compenso: null,
      modalita: 'Remoto', contratto: null, stato: 'ND', match: 'BASSO', pubblicata: 'data n.d.', link: false },
  };
  const SEZIONI = { NUOVA: 'Freelance / P.IVA', DIPENDENTE: 'Dipendente', SPUNTO: 'Spunto' };
  const COLORE_MATCH = { ALTO: 'verde', MEDIO: 'arancio', BASSO: 'grigio' };

  /** La scheda di un'offerta, con la stessa struttura di offerta-card.component.ts. */
  function scheda(o) {
    const classi = ['scheda'];
    if (o.nuova) classi.push('nuova');
    if (o.candidato) classi.push('candidata');
    const testa = o.nuova || o.match
      ? `<div class="testa">${o.nuova ? '<span class="etichetta nuova">nuova</span>' : ''}${o.match
        ? `<span class="etichetta ${COLORE_MATCH[o.match]}">match ${o.match.toLowerCase()}</span>` : ''}</div>`
      : '';
    const fatti = [
      o.modalita ? `<li><span class="mi" aria-hidden="true">place</span>${o.modalita}</li>` : '',
      o.contratto ? `<li><span class="mi" aria-hidden="true">description</span>${o.contratto}</li>` : '',
      `<li><span class="mi" aria-hidden="true">schedule</span>${o.pubblicata}</li>`,
      o.link ? '<li><span class="mi" aria-hidden="true">public</span>da example.com</li>' : '',
    ].join('');
    const sezione = `<span class="etichetta${o.sezione === 'NUOVA' ? ' accento' : o.sezione === 'SPUNTO' ? ' grigio' : ''}">${SEZIONI[o.sezione]}</span>`;
    const stato = o.stato === 'ATTIVA' ? '<span class="etichetta verde"><span class="mi" aria-hidden="true">check_circle</span>verificata</span>' : '';
    return `<article class="${classi.join(' ')}">
      <a class="corpo" href="#">
        ${testa}
        <span class="azienda${!o.nuova && !o.match ? ' accanto-al-link' : ''}">${o.azienda}</span>
        <h3 class="ruolo">${o.ruolo}</h3>
        <div class="compenso${o.compenso ? '' : ' assente'}">${o.compenso || 'Compenso non indicato'}</div>
        <ul class="fatti">${fatti}</ul>
        <div class="etichette">${o.candidato ? '<span class="etichetta candidato"><span class="mi" aria-hidden="true">send</span>candidato</span>' : ''}${sezione}${stato}</div>
      </a>
      ${o.candidato ? '' : `<div class="azioni"><button type="button" class="pulsante testo scarta"><span class="mi" aria-hidden="true">block</span> Scarta</button></div>`}
      ${o.link ? '<a class="annuncio" href="#" aria-label="Apri l\'annuncio originale"><span class="mi" aria-hidden="true">open_in_new</span></a>' : ''}
    </article>`;
  }

  document.querySelectorAll('[data-offerte]').forEach((griglia) => {
    griglia.innerHTML = griglia.dataset.offerte.split(',').map((id) => scheda(OFFERTE[id])).join('');
  });

  // ---------------- I passi del giro ----------------
  const PRIMA_SCHEDA = '#nuove > .scheda:nth-child(1)';
  const PASSI = [
    {
      scheda: 'inizio', schermata: 'dashboard', peso: 1.6,
      titolo: 'Le offerte giuste, senza cercarle',
      testo: 'Due volte al giorno, alle 7:30 e alle 19:30, un agente cerca per te le offerte di lavoro IT secondo i tuoi criteri, '
        + 'valuta quanto corrispondono al tuo profilo e controlla che l\'annuncio sia ancora aperto. Tu le trovi qui, in ordine, '
        + 'e in un\'email di riepilogo.',
      extra: '<div class="punti-forza">'
        + '<span class="etichetta accento"><span class="mi" aria-hidden="true">schedule</span>7:30 e 19:30</span>'
        + '<span class="etichetta verde"><span class="mi" aria-hidden="true">insights</span>Match con il tuo profilo</span>'
        + '<span class="etichetta"><span class="mi" aria-hidden="true">verified</span>Annunci verificati</span>'
        + '<span class="etichetta arancio"><span class="mi" aria-hidden="true">mail</span>Riepilogo via email</span>'
        + '</div>',
    },
    {
      schermata: 'dashboard', bersaglio: ['#numeri'],
      titolo: 'Tutto a colpo d\'occhio',
      testo: 'Quante offerte l\'agente ti ha segnalato, quante negli ultimi 7 giorni, le candidature aperte e quelle arrivate '
        + 'al colloquio. Ogni riquadro apre il suo elenco.',
    },
    {
      schermata: 'dashboard', bersaglio: ['#testa-nuove'],
      titolo: 'Nuove da vedere',
      testo: 'In cima trovi le offerte appena trovate e non ancora aperte, con il loro numero. Quando le hai guardate, '
        + '<strong>Segna tutte come viste</strong> fa pulizia.',
    },
    {
      schermata: 'dashboard', bersaglio: [PRIMA_SCHEDA + ' .testa'],
      titolo: 'Novità e match',
      testo: 'L\'etichetta <strong>NUOVA</strong> segnala un\'offerta che non hai ancora aperto. Il <strong>match</strong> '
        + '(alto, medio o basso) dice quanto corrisponde al tuo profilo e, se l\'hai caricato, al tuo CV.',
    },
    {
      schermata: 'dashboard', bersaglio: [PRIMA_SCHEDA + ' .compenso', PRIMA_SCHEDA + ' .fatti', PRIMA_SCHEDA + ' .etichette'],
      titolo: 'L\'essenziale, subito',
      testo: 'Il compenso è in evidenza; sotto ci sono modalità di lavoro, contratto e da quanto è pubblicato l\'annuncio. '
        + '<strong>verificata</strong> vuol dire che l\'agente ha controllato che l\'annuncio sia ancora attivo.',
    },
    {
      schermata: 'dashboard', bersaglio: [PRIMA_SCHEDA],
      titolo: 'Scarta o apri l\'annuncio',
      testo: 'Non ti interessa? <strong>Scarta</strong> la toglie dagli elenchi e l\'agente non te la riproporrà; puoi '
        + 'annullare subito. L\'icona in alto a destra apre l\'annuncio originale, il resto della scheda apre il dettaglio.',
    },
    {
      schermata: 'dashboard', bersaglio: ['#da-sollecitare'],
      titolo: 'Da sollecitare',
      testo: 'Le candidature inviate da più di 10 giorni e ancora senza risposta compaiono qui: è il momento giusto per un '
        + 'sollecito gentile.',
    },
    {
      schermata: 'offerte', bersaglio: ['#filtro-ricerca', '#tendina-ricerca'], apri: 'tendina-ricerca',
      titolo: 'Quale ricerca guardare',
      testo: 'Ogni ricerca ha i suoi risultati. Scegli la predefinita (con la stella viola), un\'altra delle tue ricerche '
        + 'oppure tutte insieme.',
    },
    {
      schermata: 'offerte', bersaglio: ['#filtro-cerca'], azione: scriviNelCampo,
      titolo: 'Cerca azienda o ruolo',
      testo: 'Scrivi una parte del nome dell\'azienda o del ruolo, per esempio «Delta» o «Java», e l\'elenco si restringe '
        + 'mentre scrivi.',
    },
    {
      schermata: 'offerte', bersaglio: ['#filtro-tipo', '#tendina-tipo'], apri: 'tendina-tipo',
      titolo: 'Tipo',
      testo: '<strong>Freelance / P.IVA</strong>, <strong>Dipendente</strong> oppure <strong>Spunto</strong>: gli spunti '
        + 'sono annunci interessanti ma senza data o senza un link diretto, da verificare prima di candidarti.',
    },
    {
      schermata: 'offerte', bersaglio: ['#filtro-match', '#tendina-match'], apri: 'tendina-match',
      titolo: 'Match',
      testo: 'Mostra solo le offerte con match alto, medio o basso rispetto al tuo profilo: comodo quando hai poco tempo e '
        + 'vuoi partire dalle migliori.',
    },
    {
      schermata: 'offerte', bersaglio: ['#filtro-stato', '#tendina-stato'], apri: 'tendina-stato', peso: 1.4,
      titolo: 'Stato',
      testo: 'Di partenza vedi tutto tranne le offerte scartate. Puoi guardare solo le attive, le chiuse o quelle non ancora '
        + 'verificate, e ritrovare quelle che hai scartato tu. Con <strong>Scartata dall\'agente</strong> vedi gli annunci '
        + 'che l\'agente non ti ha proposto, con il motivo.',
    },
    {
      schermata: 'offerte', bersaglio: ['#filtro-ordina', '#tendina-ordina', '#interruttori'], apri: 'tendina-ordina',
      titolo: 'Ordine e interruttori',
      testo: 'Ordina per offerte trovate, segnalate o pubblicate di recente, oppure per azienda. Gli interruttori mostrano '
        + 'solo le nuove, o anche quelle a cui ti sei già candidato.',
    },
    {
      schermata: 'dettaglio', bersaglio: ['#azioni-dettaglio'],
      titolo: 'La scheda dell\'offerta',
      testo: 'Aprendo un\'offerta trovi tutti i dettagli. Da qui apri l\'annuncio originale, registri la candidatura con '
        + '<strong>Mi sono candidato</strong> oppure scarti l\'offerta con <strong>Non mi interessa</strong>.',
    },
    {
      schermata: 'dettaglio', bersaglio: ['#dt-match', '#dd-match', '#dt-gap', '#dd-gap', '#dt-verifica', '#dd-verifica'],
      titolo: 'Cosa ti manca',
      testo: 'Il <strong>gap rispetto al profilo</strong> dice cosa chiede l\'annuncio che nel tuo profilo non c\'è. Sotto '
        + 'vedi come l\'agente ha verificato l\'annuncio; se ha qualcosa da segnalarti, lo trovi nelle note.',
    },
    {
      schermata: 'candidature', bersaglio: ['#vista-candidature'],
      titolo: 'Le tue candidature',
      testo: 'Ogni candidatura ha il suo stato: Inviata, Colloquio, Offerta ricevuta, Rifiutata, Ritirata o Nessuna risposta. '
        + 'Con Aperte, Chiuse e Tutte scegli cosa vedere; aprendone una aggiorni lo stato.',
    },
    {
      schermata: 'candidature', bersaglio: ['#cand-orbita', '#cand-greenfield'],
      titolo: 'Promemoria',
      testo: 'Dopo 10 giorni senza novità compare <strong>da sollecitare</strong>. Il prossimo passo, come un colloquio '
        + 'fissato, lo scrivi nella candidatura e lo ritrovi qui.',
    },
    {
      schermata: 'ricerca', bersaglio: ['#ricerca-agente'], azione: premiCercaOra,
      titolo: 'La ricerca dell\'agente',
      testo: 'Il riquadro con la stella viola è la ricerca che l\'agente usa da solo, ogni giorno alle 7:30 e alle 19:30. '
        + '<strong>Cerca ora</strong> lancia subito un giro in più, nei limiti del tuo piano.',
    },
    {
      schermata: 'ricerca', bersaglio: ['#cosa-cercare'],
      titolo: 'Ruoli e parole chiave',
      testo: 'Le parole da cercare negli annunci: ruoli e tecnologie. Scrivi una parola e premi Invio. Se le lasci vuote, '
        + 'l\'agente le ricava dal profilo.',
    },
    {
      schermata: 'ricerca', bersaglio: ['#dove-e-come'], peso: 1.3,
      titolo: 'Dove e come',
      testo: 'Modalità di lavoro, giorni in sede al mese e località accettate. Con il contratto compaiono il compenso minimo '
        + 'al giorno o la RAL minima: gli annunci che offrono meno vengono scartati.',
    },
    {
      schermata: 'ricerca', bersaglio: ['#altri-filtri'],
      titolo: 'Altri filtri',
      testo: 'Parole da escludere (per esempio «stage»), ruoli junior da scartare, età massima degli annunci (se la lasci '
        + 'vuota vale 30 giorni) e aziende da non proporre.',
    },
    {
      schermata: 'ricerca', bersaglio: ['#profilo'],
      titolo: 'Il tuo profilo',
      testo: 'Competenze ed esperienza in poche righe, senza dati personali: servono a calcolare il match e il gap di ogni '
        + 'offerta. Se preferisci, in <strong>Da dove parti?</strong> le fai proporre dal tuo CV.',
    },
    {
      schermata: 'impostazioni', bersaglio: ['#colonne-email'],
      titolo: 'Le email',
      testo: 'Scegli l\'email del mattino, della sera o entrambe, il match minimo delle offerte da includere e le sezioni da '
        + 'ricevere. Se spegni un\'email, quel giro di ricerca non si fa.',
    },
    {
      schermata: 'impostazioni', email: true, bersaglio: ['#finestra-email-corpo'], azione: scorriEmail, peso: 1.6,
      titolo: 'Ogni mattina e sera ti arriva questo',
      testo: 'Un riepilogo con le nuove offerte, quanto corrispondono al tuo profilo e le candidature da sollecitare. Con '
        + '<strong>Apri nell\'app</strong> vai dritto all\'offerta.',
    },
    {
      scheda: 'fine', schermata: 'dashboard', peso: 1.8,
      titolo: 'Pronto a provarlo?',
      testo: 'Job Tracker è su invito: chiedi la prova gratuita e l\'agente comincia a cercare per te. Se vuoi prima '
        + 'curiosare, apri la demo interattiva con i dati di esempio.',
      extra: '<div class="scheda-finale">'
        + '<a class="viola esterno" href="../helloworld"><span class="mi" aria-hidden="true">rocket_launch</span>Richiedi la prova gratuita</a>'
        + '<a class="contorno-chiaro esterno" href="../demo/"><span class="mi" aria-hidden="true">touch_app</span>Apri la demo interattiva</a>'
        + '</div>',
    },
  ];

  // ---------------- Elementi ----------------
  const $ = (s) => document.querySelector(s);
  const palco = $('#palco');
  const pagina = $('#pagina');
  const contenuto = pagina.querySelector('.contenuto');
  const giro = $('#giro');
  const riflettore = $('#riflettore');
  const fumetto = $('#fumetto');
  const freccia = $('#freccia');
  const titolo = $('#fumetto-titolo');
  const testo = $('#fumetto-testo');
  const extra = $('#fumetto-extra');
  const contatore = $('#contatore');
  const barra = $('#avanzamento-barra');
  const indietro = $('#indietro');
  const avanti = $('#avanti');
  const riprendi = $('#riprendi');
  const finestraEmail = $('#finestra-email');
  const email = $('#email-esempio');

  // logo e marchio sopra il titolo delle schede di apertura e chiusura
  const testaCentrale = document.createElement('div');
  testaCentrale.className = 'testa-centrale';
  testaCentrale.hidden = true;
  testaCentrale.innerHTML = '<img class="logo-grande" src="../logo.svg" alt="" width="72" height="72"><span class="nome-marchio marchio-grande">Job Tracker</span>';
  fumetto.insertBefore(testaCentrale, fumetto.querySelector('.fumetto-testa'));

  document.body.classList.toggle('auto', AUTO);
  document.body.classList.toggle('pulito', PULITO);

  // ---------------- Stato ----------------
  let scala = 1;
  let larghezza = 0;
  let altezza = 0;
  let attuale = 0;
  let schermataAttiva = null;
  let gettone = 0; // ogni cambio di passo lo incrementa: le attese di un passo superato si fermano da sole
  let timer = null;
  let chiuso = false;
  let scorrimento = null; // animazione di scorrimento in corso
  let scorroIo = false;

  // ---------------- Utilita' ----------------
  function limita(valore, minimo, massimo) { return Math.min(Math.max(valore, minimo), massimo); }
  function ridotto() { return movimentoRidotto.matches; }
  function attendi(ms) { return new Promise((fatto) => setTimeout(fatto, ms)); }
  function prossimoFotogramma() { return new Promise((fatto) => requestAnimationFrame(() => fatto())); }

  /** Rettangolo di un elemento in px logici del palco (toglie la scala applicata al palco). */
  function rettangolo(elemento) {
    const p = palco.getBoundingClientRect();
    const r = elemento.getBoundingClientRect();
    return {
      left: (r.left - p.left) / scala, top: (r.top - p.top) / scala,
      right: (r.right - p.left) / scala, bottom: (r.bottom - p.top) / scala,
    };
  }
  function unione(rettangoli) {
    return rettangoli.reduce((a, b) => ({
      left: Math.min(a.left, b.left), top: Math.min(a.top, b.top),
      right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom),
    }));
  }

  // ---------------- Palco: dimensioni e scala ----------------
  /*
   * PC: il palco e' largo 1280 px logici (alto in proporzione) e scalato sullo schermo: a 1920x1080 e a 1280x720
   * l'immagine e' la stessa. Verticale: 540 px logici di larghezza (1080x1920 = scala 2). Telefono vero: scala 1.
   */
  function adatta() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let telefono;
    let sinistra = 0;
    if (VERTICALE) {
      telefono = true;
      scala = Math.min(vw / 540, vh / 900);
      larghezza = 540;
      altezza = vh / scala;
      sinistra = (vw - larghezza * scala) / 2;
    } else if (vw < 760) {
      telefono = true;
      scala = 1;
      larghezza = vw;
      altezza = vh;
    } else {
      telefono = false;
      scala = Math.min(vw / 1280, vh / 640);
      larghezza = vw / scala;
      altezza = vh / scala;
    }
    document.body.classList.toggle('telefono', telefono);
    document.body.classList.toggle('verticale', VERTICALE);
    palco.style.width = `${larghezza}px`;
    palco.style.height = `${altezza}px`;
    palco.style.left = `${sinistra}px`;
    palco.style.transform = scala === 1 ? '' : `scale(${scala})`;
    // larghezza del fumetto: fissa sul PC, quasi tutto lo schermo sul telefono
    const passo = PASSI[attuale];
    fumetto.style.width = `${larghezzaFumetto(passo)}px`;
  }
  function telefono() { return document.body.classList.contains('telefono'); }
  function larghezzaFumetto(passo) {
    if (telefono()) return Math.min(larghezza - 2 * MARGINE, passo && passo.scheda ? 500 : 460);
    return passo && passo.scheda ? 620 : 360;
  }

  // ---------------- Schermate ----------------
  const NAV_DI = { dettaglio: 'offerte' };
  function aggiornaNav(nome) {
    const voce = NAV_DI[nome] || nome;
    document.querySelectorAll('[data-vai]').forEach((a) => {
      const attiva = a.dataset.vai === voce;
      a.classList.toggle('attiva', attiva);
      if (attiva) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function mostraSchermata(nome) {
    document.querySelectorAll('.schermata').forEach((s) => { s.hidden = s.dataset.schermata !== nome; });
    pagina.scrollTop = 0;
    aggiornaNav(nome);
    schermataAttiva = nome;
  }
  async function cambiaSchermata(nome) {
    if (schermataAttiva === null || ridotto()) {
      mostraSchermata(nome);
      return;
    }
    contenuto.classList.add('sfuma');
    await attendi(260);
    mostraSchermata(nome);
    await prossimoFotogramma();
    contenuto.classList.remove('sfuma');
  }

  async function mostraEmail(visibile) {
    if (visibile === !finestraEmail.hidden) return;
    if (visibile) {
      finestraEmail.hidden = false;
      email.scrollTop = 0;
      await prossimoFotogramma();
      finestraEmail.classList.add('visibile');
    } else {
      finestraEmail.classList.remove('visibile');
      if (!ridotto()) await attendi(260);
      finestraEmail.hidden = true;
    }
  }

  // ---------------- Azioni dei singoli passi ----------------
  /** Rimette a posto quello che un passo puo' aver cambiato (tendine, testo scritto, email scorsa). */
  function pulisci() {
    document.querySelectorAll('.tendina.aperta').forEach((t) => t.classList.remove('aperta'));
    document.querySelectorAll('.campo.con-tendina').forEach((c) => c.classList.remove('con-tendina'));
    $('#testo-cerca').textContent = '';
    $('#filtro-cerca').classList.remove('scritto');
    $('#cerca-ora').classList.remove('premuto');
  }
  function apriTendina(id) {
    const tendina = document.getElementById(id);
    tendina.classList.add('aperta');
    tendina.closest('.campo').classList.add('con-tendina');
  }

  /** "Cerca azienda o ruolo": il testo si scrive da solo, una lettera ogni 150 ms. */
  async function scriviNelCampo(mio) {
    const campo = $('#filtro-cerca');
    const valore = $('#testo-cerca');
    await attendi(500);
    if (mio !== gettone) return;
    campo.classList.add('scritto');
    for (const lettera of 'Delta') {
      await attendi(ridotto() ? 0 : 150);
      if (mio !== gettone) return;
      valore.textContent += lettera;
    }
  }

  /** "Cerca ora": un lampo sul pulsante, come se lo si premesse. */
  async function premiCercaOra(mio) {
    await attendi(1400);
    if (mio !== gettone) return;
    const pulsante = $('#cerca-ora');
    pulsante.classList.add('premuto');
    await attendi(700);
    if (mio !== gettone) return;
    pulsante.classList.remove('premuto');
  }

  /** Email di esempio: dopo un attimo scorre piano fino alle candidature. */
  async function scorriEmail(mio) {
    email.scrollTop = 0;
    await attendi(1200);
    if (mio !== gettone) return;
    const fine = email.scrollHeight - email.clientHeight;
    if (fine <= 0) return;
    if (ridotto()) { email.scrollTop = fine; return; }
    const durata = 2600;
    const inizio = performance.now();
    await new Promise((fatto) => {
      function passo(ora) {
        if (mio !== gettone) { fatto(); return; }
        const t = limita((ora - inizio) / durata, 0, 1);
        email.scrollTop = fine * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        if (t < 1) requestAnimationFrame(passo); else fatto();
      }
      requestAnimationFrame(passo);
    });
  }

  // ---------------- Scorrimento della pagina ----------------
  function scorriPagina(verso, animato) {
    if (scorrimento) cancelAnimationFrame(scorrimento);
    scorrimento = null;
    const da = pagina.scrollTop;
    if (!animato || ridotto() || Math.abs(verso - da) < 2) {
      scorroIo = true;
      pagina.scrollTop = verso;
      requestAnimationFrame(() => { scorroIo = false; });
      return;
    }
    const durata = 480;
    const inizio = performance.now();
    scorroIo = true;
    function passo(ora) {
      const t = limita((ora - inizio) / durata, 0, 1);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      pagina.scrollTop = da + (verso - da) * e;
      if (t < 1) {
        scorrimento = requestAnimationFrame(passo);
      } else {
        scorrimento = null;
        requestAnimationFrame(() => { scorroIo = false; });
      }
    }
    scorrimento = requestAnimationFrame(passo);
  }

  // ---------------- Riflettore e fumetto ----------------
  /**
   * Mette il riflettore sull'elemento del passo e il fumetto accanto. Se l'elemento sta nella pagina, prima calcola
   * di quanto scorrerla e usa gia' la posizione finale: riflettore e scorrimento si muovono insieme.
   */
  function posiziona(passo, { scorri, animato }) {
    const fw = fumetto.offsetWidth;
    const fh = fumetto.offsetHeight;

    if (passo.scheda) {
      riflettore.classList.add('senza-anello');
      metti(riflettore, larghezza / 2, altezza / 2, 0, 0);
      fumetto.dataset.lato = '';
      fumetto.style.left = `${Math.round((larghezza - fw) / 2)}px`;
      fumetto.style.top = `${Math.round(Math.max(MARGINE, (altezza - fh) / 2))}px`;
      return;
    }
    riflettore.classList.remove('senza-anello');

    const elementi = passo.bersaglio.map((s) => document.querySelector(s)).filter(Boolean);
    if (!elementi.length) return;
    let r = unione(elementi.map(rettangolo));
    const laterale = !telefono() && (larghezza - r.right - PAD >= fw + DISTANZA + MARGINE || r.left - PAD >= fw + DISTANZA + MARGINE);

    if (scorri && elementi.every((e) => pagina.contains(e))) {
      const vista = rettangolo(pagina);
      const visibile = pagina.clientHeight;
      const attualeScroll = pagina.scrollTop;
      const massimo = pagina.scrollHeight - visibile;
      const cima = r.top - vista.top + attualeScroll; // posizione dell'elemento nel contenuto della pagina
      const alto = r.bottom - r.top;
      let voluto;
      if (laterale) {
        voluto = alto + 2 * PAD <= visibile - 24 ? cima - (visibile - alto) / 2 : cima - PAD - 12;
      } else {
        const totale = alto + 2 * PAD + DISTANZA + fh;
        voluto = totale <= visibile - 24 ? cima - PAD - (visibile - totale) / 2 : cima - PAD - 12;
      }
      voluto = Math.round(limita(voluto, 0, Math.max(0, massimo)));
      const delta = voluto - attualeScroll;
      scorriPagina(voluto, animato);
      r = { left: r.left, right: r.right, top: r.top - delta, bottom: r.bottom - delta };
    }

    metti(riflettore, r.left - PAD, r.top - PAD, r.right - r.left + 2 * PAD, r.bottom - r.top + 2 * PAD);
    piazzaFumetto(r, fw, fh, passo);
  }

  function metti(elemento, x, y, w, h) {
    elemento.style.left = `${Math.round(x)}px`;
    elemento.style.top = `${Math.round(y)}px`;
    elemento.style.width = `${Math.round(w)}px`;
    elemento.style.height = `${Math.round(h)}px`;
  }

  function piazzaFumetto(r, fw, fh, passo) {
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    const ordine = telefono()
      ? ['sotto', 'sopra']
      : [passo.lato, 'destra', 'sinistra', 'sotto', 'sopra'].filter(Boolean);
    const posti = {
      destra: () => {
        const x = r.right + PAD + DISTANZA;
        return x + fw <= larghezza - MARGINE ? { x, y: limita(cy - fh / 2, MARGINE, altezza - fh - MARGINE) } : null;
      },
      sinistra: () => {
        const x = r.left - PAD - DISTANZA - fw;
        return x >= MARGINE ? { x, y: limita(cy - fh / 2, MARGINE, altezza - fh - MARGINE) } : null;
      },
      sotto: () => {
        const y = r.bottom + PAD + DISTANZA;
        return y + fh <= altezza - MARGINE ? { x: limita(cx - fw / 2, MARGINE, larghezza - fw - MARGINE), y } : null;
      },
      sopra: () => {
        const y = r.top - PAD - DISTANZA - fh;
        return y >= MARGINE ? { x: limita(cx - fw / 2, MARGINE, larghezza - fw - MARGINE), y } : null;
      },
    };
    let lato = '';
    let punto = null;
    for (const l of ordine) {
      punto = posti[l]();
      if (punto) { lato = l; break; }
    }
    if (!punto) {
      // l'elemento e' troppo grande: il fumetto sta sopra la parte bassa dello schermo, senza freccia
      punto = { x: limita(cx - fw / 2, MARGINE, larghezza - fw - MARGINE), y: altezza - fh - MARGINE - (telefono() ? 64 : 0) };
    }
    fumetto.dataset.lato = lato;
    fumetto.classList.toggle('da-sotto', lato === 'sotto');
    fumetto.classList.toggle('da-destra', lato === 'destra');
    fumetto.classList.toggle('da-sinistra', lato === 'sinistra');
    fumetto.style.left = `${Math.round(punto.x)}px`;
    fumetto.style.top = `${Math.round(punto.y)}px`;
    // la freccia punta al centro dell'elemento, senza uscire dagli angoli arrotondati
    freccia.style.top = '';
    freccia.style.left = '';
    if (lato === 'destra' || lato === 'sinistra') {
      freccia.style.top = `${Math.round(limita(cy - punto.y - 7, 18, fh - 32))}px`;
    } else if (lato === 'sotto' || lato === 'sopra') {
      freccia.style.left = `${Math.round(limita(cx - punto.x - 7, 20, fw - 34))}px`;
    }
  }

  function riempiFumetto(passo, indice) {
    const centrale = !!passo.scheda;
    fumetto.classList.toggle('centrale', centrale);
    fumetto.classList.toggle('iniziale', passo.scheda === 'inizio');
    testaCentrale.hidden = !centrale;
    fumetto.style.width = `${larghezzaFumetto(passo)}px`;
    titolo.textContent = passo.titolo;
    testo.innerHTML = `<p>${passo.testo}</p>`;
    extra.innerHTML = passo.extra || '';
    contatore.textContent = `${indice + 1} / ${PASSI.length}`;
    indietro.disabled = indice === 0;
    const ultimo = indice === PASSI.length - 1;
    avanti.innerHTML = indice === 0
      ? 'Inizia il giro <span class="mi" aria-hidden="true">arrow_forward</span>'
      : ultimo
        ? '<span class="mi" aria-hidden="true">replay</span> Ricomincia'
        : 'Avanti <span class="mi" aria-hidden="true">arrow_forward</span>';
    fumetto.setAttribute('aria-label', `Passo ${indice + 1} di ${PASSI.length}: ${passo.titolo}`);
  }

  function aggiornaAvanzamento() {
    barra.style.width = `${((attuale + 1) / PASSI.length) * 100}%`;
  }

  // ---------------- Navigazione tra i passi ----------------
  async function vaiA(indice) {
    indice = limita(indice, 0, PASSI.length - 1);
    const mio = ++gettone;
    clearTimeout(timer);
    attuale = indice;
    const passo = PASSI[indice];
    aggiornaAvanzamento();

    if (fumetto.classList.contains('visibile')) {
      fumetto.classList.remove('visibile');
      if (!ridotto()) await attendi(200);
      if (mio !== gettone) return;
    }
    pulisci();
    if (!passo.email) await mostraEmail(false);
    if (mio !== gettone) return;
    if (passo.schermata !== schermataAttiva) await cambiaSchermata(passo.schermata);
    if (mio !== gettone) return;
    if (passo.email) {
      await mostraEmail(true);
      if (mio !== gettone) return;
    }
    if (passo.apri) apriTendina(passo.apri);

    riempiFumetto(passo, indice);
    await prossimoFotogramma();
    if (mio !== gettone) return;
    posiziona(passo, { scorri: true, animato: true });
    if (!ridotto()) await attendi(passo.scheda ? 250 : 430);
    if (mio !== gettone) return;

    fumetto.classList.add('visibile');
    fumetto.focus({ preventScroll: true });
    if (passo.azione) passo.azione(mio);
    if (AUTO) programma(passo);
  }

  function programma(passo) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (attuale < PASSI.length - 1) vaiA(attuale + 1);
      else if (CICLO) vaiA(0);
    }, RITMO * (passo.peso || 1) * 1000);
  }

  function avantiUno() {
    if (attuale < PASSI.length - 1) vaiA(attuale + 1);
    else vaiA(0);
  }
  function indietroUno() {
    if (attuale > 0) vaiA(attuale - 1);
  }

  function chiudiGiro() {
    if (chiuso) return;
    chiuso = true;
    gettone++;
    clearTimeout(timer);
    pulisci();
    mostraEmail(false);
    fumetto.classList.remove('visibile');
    giro.classList.add('chiuso');
    riprendi.hidden = false;
    riprendi.focus({ preventScroll: true });
  }
  function riapriGiro(indice) {
    chiuso = false;
    giro.classList.remove('chiuso');
    riprendi.hidden = true;
    vaiA(indice);
  }

  // ---------------- Comandi ----------------
  avanti.addEventListener('click', avantiUno);
  indietro.addEventListener('click', indietroUno);
  $('#chiudi-giro').addEventListener('click', chiudiGiro);
  riprendi.addEventListener('click', () => riapriGiro(attuale));

  document.addEventListener('keydown', (evento) => {
    if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
    if (evento.key === 'Escape') {
      chiudiGiro();
      return;
    }
    if (chiuso) return;
    const suComando = evento.target.closest && evento.target.closest('button, a');
    if (evento.key === 'ArrowRight' || evento.key === 'PageDown') {
      evento.preventDefault();
      avantiUno();
    } else if (evento.key === 'ArrowLeft' || evento.key === 'PageUp') {
      evento.preventDefault();
      indietroUno();
    } else if (evento.key === ' ' && !suComando) {
      evento.preventDefault();
      avantiUno();
    } else if (evento.key === 'Home') {
      evento.preventDefault();
      vaiA(0);
    } else if (evento.key === 'End') {
      evento.preventDefault();
      vaiA(PASSI.length - 1);
    }
  });

  // le schermate sono finte: i loro link e pulsanti non portano da nessuna parte; le voci del menu portano al
  // primo passo di quella sezione (o, a giro chiuso, mostrano solo la schermata)
  document.addEventListener('click', (evento) => {
    // in automatico un clic (o un tocco) in qualsiasi punto passa subito alla schermata dopo, tranne sui link veri
    if (AUTO && !chiuso) {
      const esterno = evento.target.closest('a.esterno, #riprendi');
      if (esterno) return;
      evento.preventDefault();
      avantiUno();
      return;
    }
    const comando = evento.target.closest('#app a, #app button, #finestra-email a, #finestra-email button');
    if (!comando || comando.classList.contains('esterno')) return;
    evento.preventDefault();
    const voce = comando.dataset.vai;
    if (!voce) return;
    if (chiuso) {
      mostraEmail(false);
      cambiaSchermata(voce);
      return;
    }
    const indice = PASSI.findIndex((p) => p.schermata === voce && !p.scheda);
    if (indice >= 0) vaiA(indice);
  });

  // chi scorre la pagina a mano: il riflettore segue l'elemento
  pagina.addEventListener('scroll', () => {
    if (scorroIo || chiuso || !fumetto.classList.contains('visibile')) return;
    posiziona(PASSI[attuale], { scorri: false, animato: false });
  }, { passive: true });

  let attesaRidimensiona = null;
  window.addEventListener('resize', () => {
    adatta();
    clearTimeout(attesaRidimensiona);
    attesaRidimensiona = setTimeout(() => {
      if (!chiuso) posiziona(PASSI[attuale], { scorri: true, animato: false });
    }, 60);
  });

  // ---------------- Avvio ----------------
  adatta();
  mostraSchermata(PASSI[limita(PASSO_INIZIALE - 1, 0, PASSI.length - 1)].schermata);
  // si parte quando le icone sono caricate (cambiano le misure); senza rete si parte lo stesso dopo 2 secondi
  const caratteri = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([caratteri, attendi(2000)]).then(() => {
    // le icone Material arrivano con il primo uso: si chiede il carattere esplicitamente
    const icone = document.fonts && document.fonts.load ? document.fonts.load('24px "Material Icons"') : Promise.resolve();
    return Promise.race([icone, attendi(2000)]);
  }).catch(() => {}).then(() => vaiA(PASSO_INIZIALE - 1));
})();
