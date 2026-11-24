/* =====================================================================
   BEST - grafica e movimenti (23/11/2026). Va insieme a index.html e ui/best.css.
   Gira in Chrome (finestra app aperta da "Avvia BEST.vbs"); solo web standard, cosi' un domani va anche su Safari.
   Il motore (lettura file, avvio giochi) sta in ui/motore_chrome.js + server.py; qui c'e' solo quello che si vede:
     1. attrezzi            5. apri / chiudi schede e cassetti
     2. impostazioni        6. messaggi e avvio
     3. monoliti (disegno)  7. interfaccia viva (tele, braci, pausa)
     4. misure (disponi)    8. partenza
   ===================================================================== */

/* ---------- 1. attrezzi ---------- */
function el(id) { return document.getElementById(id); }
function haClasse(e, c) { return !!e && (' ' + e.className + ' ').indexOf(' ' + c + ' ') >= 0; }
function metti(e, c) { if (e && !haClasse(e, c)) e.className = e.className ? e.className + ' ' + c : c; }
function togli(e, c) { if (e && haClasse(e, c)) e.className = (' ' + e.className + ' ').replace(' ' + c + ' ', ' ').replace(/^\s+|\s+$/g, ''); }
function classe(e, c, si) { if (si) metti(e, c); else togli(e, c); }
function due(n) { return (n < 10 ? '0' : '') + n; }
function caso(a, b) { return a + Math.random() * (b - a); }
function adesso() { return new Date().getTime(); }
function rgbDi(hex) {
  var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || ''));
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 176, 0];
}
function vivace(c) {            // porta il colore del gioco a piena luce (per i bagliori)
  var k = 255 / (Math.max(c[0], c[1], c[2]) || 1);
  return [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k)];
}
function rgba(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')'; }
function riparti(e, c) { if (!e) return; togli(e, c); void e.offsetWidth; metti(e, c); }   // fa ripartire un'animazione CSS

var radice = document.documentElement;
var ORO = [255, 176, 0], CREMISI = [224, 38, 60];

// Se qualcosa va storto non compare la finestra di errore di Windows: la riga finisce in ui\errori.txt (da far leggere a Claude).
var erroriVisti = 0, erroreVecchio = window.onerror;
window.onerror = function (m, u, l) {
  try {
    if (erroriVisti++ < 20) {
      scriviFile(win('ui/errori.txt'), new Date().toLocaleString() + ' | ' + m + ' | ' + String(u).replace(/^.*[\\\/]/, '') + ':' + l + '\r\n', true);
    }
  } catch (e) {}
  if (erroreVecchio) { try { erroreVecchio(m, u, l); } catch (e2) {} }
  return true;
};
var IC_PLAY = '<svg viewBox="0 0 14 16" width="14" height="16"><path d="M1 1 L13 8 L1 15 Z"/></svg>';
var IC_X = '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M1 1 L13 13 M13 1 L1 13" fill="none" stroke="#f2ece2" stroke-width="1.6"/></svg>';
var IC_APRI = '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M3.5 2 L11.5 7 L3.5 12 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
var IC_ORA = '<svg viewBox="0 0 14 14" width="14" height="14"><circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M7 3.8 V7 L9.4 8.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
var IC_NOTE = '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M2 3 H12 M2 7 H12 M2 11 H8.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
var IC_RIPARA = '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M11.6 8.6 A4.9 4.9 0 1 1 11.2 4.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M11.9 1.6 V4.8 H8.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var IC_GUIDA ='<svg viewBox="0 0 14 14" width="14" height="14"><circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M7 6.3 V10.2 M7 3.8 V4.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

/* ---------- 2. impostazioni (ingranaggio in basso a destra) ----------
   Per aggiungere una voce: un altro oggetto in IMPOSTAZIONI con id, titolo, descr, scelte [[valore, etichetta]...],
   predefinito e applica(valore). La scelta finisce da sola in ui/preferenze.txt (una riga id=valore). */
var FX = 'pieni';
var PREF = {};
var IMPOSTAZIONI = [
  { id: 'effetti', titolo: 'Interfaccia viva', descr: 'Quanti effetti e movimenti. Se sono troppi, abbassali.',
    scelte: [['pieni', 'Pieni'], ['ridotti', 'Ridotti'], ['spenti', 'Spenti']], predefinito: 'pieni',
    applica: function (v) { applicaEffetti(v); } }
];
function filePreferenze() { return win('ui/preferenze.txt'); }
function leggiPreferenze() {
  var t = leggi(filePreferenze()), i;
  if (t) {
    var righe = String(t).split(/\r?\n/);
    for (i = 0; i < righe.length; i++) { var m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(righe[i]); if (m) PREF[m[1]] = m[2]; }
  }
  for (i = 0; i < IMPOSTAZIONI.length; i++) if (!sceltaValida(IMPOSTAZIONI[i], PREF[IMPOSTAZIONI[i].id])) PREF[IMPOSTAZIONI[i].id] = IMPOSTAZIONI[i].predefinito;
}
function sceltaValida(v, val) { for (var k = 0; k < v.scelte.length; k++) if (v.scelte[k][0] === val) return true; return false; }
function salvaPreferenze() {
  try { var s = ''; for (var k in PREF) if (PREF.hasOwnProperty(k)) s += k + '=' + PREF[k] + '\r\n'; scriviFile(filePreferenze(), s, false); } catch (e) {}
}
function disegnaImpostazioni() {
  var h = '<div class="imp-in"><i class="ang a1"></i><i class="ang a2"></i><div class="imp-t">Impostazioni</div>';
  for (var i = 0; i < IMPOSTAZIONI.length; i++) {
    var v = IMPOSTAZIONI[i];
    h += '<div class="voceimp"><div class="ti">' + esc(v.titolo) + '</div><div class="de">' + esc(v.descr || '') + '</div><div class="seg">';
    for (var k = 0; k < v.scelte.length; k++)
      h += '<button id="imp-' + v.id + '-' + v.scelte[k][0] + '" class="' + (v.scelte[k][0] === PREF[v.id] ? 'on' : '') + '" onclick="scegli(\'' + v.id + '\',\'' + v.scelte[k][0] + '\')">' + esc(v.scelte[k][1]) + '</button>';
    h += '</div></div>';
  }
  el('imp').innerHTML = h + '</div>';
}
function scegli(id, val) {
  for (var i = 0; i < IMPOSTAZIONI.length; i++) {
    var v = IMPOSTAZIONI[i]; if (v.id !== id) continue;
    PREF[id] = val;
    for (var k = 0; k < v.scelte.length; k++) classe(el('imp-' + id + '-' + v.scelte[k][0]), 'on', v.scelte[k][0] === val);
    try { v.applica(val); } catch (e) {}
  }
  salvaPreferenze();
}
var impAperto = false;
function apriImpostazioni(si) {
  impAperto = typeof si === 'boolean' ? si : !impAperto;
  classe(el('imp'), 'aperto', impAperto); classe(el('ingranaggio'), 'aperto', impAperto);
}
function dentata(n, R, r, a1, a2) {          // contorno di una ruota dentata: n denti, raggio punta R, raggio gola r
  var d = '', k, P = function (ang, rag) { var t = (ang - 90) * Math.PI / 180; return (50 + rag * Math.cos(t)).toFixed(2) + ' ' + (50 + rag * Math.sin(t)).toFixed(2); };
  for (k = 0; k < n; k++) {
    var c = k * 360 / n;
    d += (k ? ' A ' + r + ' ' + r + ' 0 0 1 ' : 'M ') + P(c - a1, r) + ' L ' + P(c - a2, R) + ' A ' + R + ' ' + R + ' 0 0 1 ' + P(c + a2, R) + ' L ' + P(c + a1, r);
  }
  return d + ' A ' + r + ' ' + r + ' 0 0 1 ' + P(-a1, r) + ' Z';
}
function foro(rag) { return ' M ' + (50 - rag) + ' 50 A ' + rag + ' ' + rag + ' 0 1 0 ' + (50 + rag) + ' 50 A ' + rag + ' ' + rag + ' 0 1 0 ' + (50 - rag) + ' 50 Z'; }
function faiIngranaggio() {
  var S = '<svg viewBox="0 0 100 100" width="64" height="64">';
  el('ing-d2').innerHTML = S + '<path d="' + dentata(8, 47, 30, 8, 5) + foro(24) + '" fill="#e0263c" fill-rule="evenodd" stroke="#3a0810" stroke-width="1"/></svg>';
  el('ing-d1').innerHTML = S + '<defs><linearGradient id="acciaio" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1eadf"/><stop offset=".5" stop-color="#8f877c"/><stop offset="1" stop-color="#3b3531"/></linearGradient></defs>' +
    '<path d="' + dentata(8, 45, 35, 13.5, 8.5) + foro(22) + '" fill="url(#acciaio)" fill-rule="evenodd" stroke="#120c0b" stroke-width="1.6"/>' +
    '<circle cx="50" cy="50" r="29" fill="none" stroke="#000000" stroke-opacity=".5" stroke-width="1.6"/></svg>';
  el('ing-mz').innerHTML = S + '<path d="M50 34 L63.9 42 L63.9 58 L50 66 L36.1 58 L36.1 42 Z" fill="#191110" stroke="#e0263c" stroke-width="2"/><circle cx="50" cy="50" r="5.5" fill="#ffb000"/></svg>';
}

/* ---------- 3. monoliti: lo strato delle immagini (si costruisce una volta sola) ---------- */
var PAV = 92, SPAZIO = 12;      // PAV = fascia del pavimento sotto i monoliti (uguale a "bottom: 92px" nel CSS)
var NAT = [];                   // misure vere di sfondo e logo, per gioco
var sopra = -1;                 // gioco sotto il mouse (-1 = nessuno)
var aperti = {};                // cosa e' aperto: 'gioco0', 'crono0', 'note0', 'guida0'...
var TIPI = ['crono', 'note', 'guida'];

function coloreGioco(g) { return vivace(rgbDi(g.colore || '#ffb000')); }
function sfondoDi(g) { return g.sfondo || g.copertina || ''; }

function costruisci() {
  var h = '';
  for (var gi = 0; gi < BEST_GIOCHI.length; gi++) {
    var g = BEST_GIOCHI[gi], c = coloreGioco(g), im = 'background-image:url(\'' + esc(sfondoDi(g)) + '\')';
    var luce = 'linear-gradient(90deg,' + rgba(c, 0) + ',' + rgba(c, 1) + ' 28%,#fff 50%,' + rgba(c, 1) + ' 72%,' + rgba(c, 0) + ')';
    h += '<div class="mono chiusa" id="mono' + gi + '" style="animation-delay:' + (0.45 + gi * 0.17).toFixed(2) + 's">' +
      '<div class="galla" style="animation-duration:' + (8 + (gi * 3) % 5) + 's;animation-delay:-' + ((gi * 2.7) % 8).toFixed(1) + 's">' +
      '<div class="alone" style="box-shadow:0 0 80px -6px ' + rgba(c, 0.7) + ',0 0 0 1px ' + rgba(c, 0.6) + '"></div>' +
      '<div class="corpo">' +
        '<div class="pos" id="pos' + gi + '"><div class="par" id="par' + gi + '"><div class="img" style="' + im + ';animation-duration:' + (22 + (gi * 7) % 9) + 's;animation-delay:-' + ((gi * 5.3) % 17).toFixed(1) + 's"></div></div></div>' +
        '<div class="tinta" style="background:linear-gradient(0deg,' + rgba(c, 0.3) + ' 0%,' + rgba(c, 0) + ' 44%)"></div>' +
        '<div class="velo"></div><div class="velo2"></div><div class="trama"></div><div class="spento"></div>' +
        '<div class="lampo" id="lampo' + gi + '"></div>' +
        '<div class="guasto" id="guasto' + gi + '" style="background:linear-gradient(90deg,' + rgba(c, 0) + ',' + rgba(c, 1) + ' 30%,#fff 50%,' + rgba(c, 1) + ' 70%,' + rgba(c, 0) + ');box-shadow:0 0 12px ' + rgba(c, 0.9) + '"></div>' +
        '<div class="bordo"></div>' +
        '<i class="lin" style="background:' + luce + ';box-shadow:0 0 14px ' + rgba(c, 0.8) + '"></i>' +
        '<i class="scia" id="scia' + gi + '" style="background:linear-gradient(90deg,' + rgba(c, 0) + ',' + rgba(c, 1) + ' 60%,#fff);box-shadow:0 0 10px ' + rgba(c, 0.9) + '"></i>' +
        '<i class="ang a1" style="border-color:' + rgba(c, 1) + '"></i><i class="ang a2" style="border-color:' + rgba(c, 1) + '"></i>' +
        '<i class="tacche"></i><i class="tg tg1"></i><i class="tg tg2"></i><i class="dg dg1"></i><i class="dg dg2"></i>' +
      '</div></div>' +
      '<div class="riflesso"><div class="pos" id="rpos' + gi + '"><div class="img" style="' + im + '"></div></div><div class="sfuma"></div></div>' +
      '<div class="base" style="background:' + luce + ';box-shadow:0 0 22px 3px ' + rgba(c, 0.65) + '"></div>' +
    '</div>';
  }
  el('vis').innerHTML = h;
}

function precarica() {          // legge le misure vere delle immagini, poi rimette tutto a posto
  for (var gi = 0; gi < BEST_GIOCHI.length; gi++) {
    NAT[gi] = NAT[gi] || {};
    (function (i, g) {
      var a = new Image(); a.onload = function () { NAT[i].sw = a.width; NAT[i].sh = a.height; disponi(false); }; a.src = sfondoDi(g);
      if (g.logo) { var b = new Image(); b.onload = function () { NAT[i].lw = b.width; NAT[i].lh = b.height; disponi(false); }; b.src = g.logo; }
    })(gi, BEST_GIOCHI[gi]);
  }
}

/* lo strato dei comandi: si ridisegna a ogni avvio riuscito (profilo in uso, cronologia) */
function corto(pr) { return pr.corto || String(pr.breve || '').split(' \u00b7 ')[0]; }
function suggerimento(pr) {
  return (pr.file ? 'Rimette la grafica ' + pr.nome + ' e apre il gioco da Steam' : 'Apre il gioco da Steam senza cambiare la grafica') + (pr.breve ? ' \u2014 ' + pr.breve : '');
}
function cassetto(id, titolo, corpo, cl) {
  return '<div class="cassetto' + (cl ? ' ' + cl : '') + '" id="' + id + '"><div class="ctesta"><span>' + esc(titolo) + '</span><button class="cx" title="Chiudi" onclick="apri(\'' + id + '\')">' + IC_X + '</button></div><div class="ccorpo">' + corpo + '</div></div>';
}

var DETT_APERTI = {};                  // dettagli tecnici aperti (freccina accanto ai tasti), restano aperti se la scheda si ridisegna
function dettagli(id, e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  DETT_APERTI[id] = !DETT_APERTI[id];
  classe(el('dt' + id), 'aperto', DETT_APERTI[id]);
  classe(el('fr' + id), 'su', DETT_APERTI[id]);
}

function disegna() {
  var h = '';
  for (var gi = 0; gi < BEST_GIOCHI.length; gi++) {
    var g = BEST_GIOCHI[gi], uso = profiloInUso(g), tasti = '', dett = '', st = '', i;
    for (i = 0; i < g.profili.length; i++) {
      var pr = g.profili[i], tag = '', cl = 'tasto';
      if (i === uso) { tag = '<span class="tag t-uso"><i class="led"></i>In uso ora</span>'; cl += ' inuso'; }
      else if (pr.consigliato) { tag = '<span class="tag t-cons">Consigliata</span>'; }
      else if (pr.stato === 'prova') { tag = '<span class="tag t-prova">In prova</span>'; }
      if (pr.consigliato) cl += ' consigliato';
      var idD = gi + '_' + i, apertoD = !!DETT_APERTI[idD], righeD = pr.spiega ? '<div class="dt-s">' + esc(pr.spiega) + '</div>' : '', vociD = pr.voci || [];
      for (var kd = 0; kd < vociD.length; kd++) righeD += '<div class="dt-r"><span class="dt-k">' + esc(vociD[kd][0]) + '</span><span class="dt-v">' + esc(vociD[kd][1]) + '</span></div>';
      if (pr.provato) righeD += '<div class="dt-p">' + esc(pr.provato) + '</div>';
      tasti += '<div class="prof-riga">' +
        '<button class="' + cl + '" id="tasto' + gi + '_' + i + '" onclick="gioca(' + gi + ',' + i + ')" title="' + esc(suggerimento(pr)) + '">' +
        '<span class="luce"></span><span class="mir m1"></span><span class="mir m2"></span><span class="dentro"><span class="play">' + IC_PLAY + '</span>' +
        '<span class="tx"><span class="nome2">' + esc(pr.nome) + '</span><span class="breve">' + esc(corto(pr)) + '</span></span>' + tag + '</span><span class="carica"></span></button>' +
        (righeD ? '<button class="freccina' + (apertoD ? ' su' : '') + '" id="fr' + idD + '" title="Dettagli tecnici" onclick="dettagli(\'' + idD + '\', event)"><span></span></button>' : '') +
        '</div>' +
        (righeD ? '<div class="dett-tec' + (apertoD ? ' aperto' : '') + '" id="dt' + idD + '"><div class="dt-in">' + righeD + '</div></div>' : '');
      var v = '', voci = pr.voci || [];
      for (var k = 0; k < voci.length; k++) v += (k ? ' \u00b7 ' : '') + esc(voci[k][0]) + ': ' + esc(voci[k][1]);
      dett += '<div class="prof"><b>' + esc(pr.nome) + '</b> \u2014 ' + esc(pr.provato || '') + (pr.breve ? '<br>' + esc(pr.breve) : '') + '<br><span class="voce">' + v + '</span></div>';
    }
    var reg = '', prove = '', regole = g.regole || [], storia = g.storia || [];
    for (i = 0; i < regole.length; i++) reg += '<div class="regola"><i></i>' + esc(regole[i]) + '</div>';
    if (g.prove) for (i = 0; i < g.prove.length; i++) {
      var ps = g.prove[i][1], pc = ps === 'ok' ? ' p-ok' : (ps === 'in prova' ? ' p-prova' : (ps === 'no' ? ' p-no' : ''));
      prove += '<div class="provar' + pc + '"><i></i>' + esc(g.prove[i][0]) + '</div>';
    }
    for (i = storia.length - 1; i >= 0; i--) {
      var s = storia[i], tipo = String(s.tipo || 'nota'), c = tipo === 'ok' ? 'tok' : tipo;
      st += '<div class="tappa"><span class="q">' + esc(s.data) + '</span><span class="t ' + esc(c) + '">' + esc(tipo.toUpperCase()) + '</span>' + esc(s.testo) + '</div>';
    }
    var guida = '', chipGuida = '';
    if (g.guida) {
      var passi = '<ol class="passi">';
      for (i = 0; i < g.guida.passi.length; i++) passi += '<li><b>' + (i + 1) + '</b>' + esc(g.guida.passi[i]) + '</li>';
      var spiega = '', sp = g.guida.spiega || [];      // spiega = [[titolo, testo]...]: a cosa servono i tasti, in parole semplici
      for (i = 0; i < sp.length; i++) spiega += '<div class="gspiega"><b>' + esc(sp[i][0]) + '</b><span>' + esc(sp[i][1]) + '</span></div>';
      guida = cassetto('guida' + gi, 'Guida', '<div class="gtitolo">' + esc(g.guida.titolo) + '</div>' + passi + '</ol>' + spiega, 'guida');
      chipGuida = '<button class="chip" id="b-guida' + gi + '" onclick="apri(\'guida' + gi + '\')" title="' + esc(g.guida.titolo) + '">' + IC_GUIDA + 'Guida</button>';
    }
    // ripara = { etichetta, titolo }: tasto discreto che rimette una modifica del gioco dalla copia tenuta in BEST (lo fa server.py)
    var chipRipara = g.ripara ? '<button class="chip" id="b-ripara' + gi + '" onclick="riparaMod(' + gi + ')" title="' + esc(g.ripara.titolo || '') + '">' + IC_RIPARA + esc(g.ripara.etichetta || 'Ripara') + '</button>' : '';
    h += '<div class="scheda chiusa" id="testa' + gi + '" onclick="tocca(' + gi + ', event)" onmouseenter="sopraA(' + gi + ')" onmouseleave="sopraA(-1)" style="animation-delay:' + (0.8 + gi * 0.17).toFixed(2) + 's">' +
      '<div class="num">' + due(gi + 1) + '<i></i></div>' +
      (g.logo ? '<img class="logo" id="logo' + gi + '" src="' + esc(g.logo) + '" alt="' + esc(g.titolo) + '">' : '<div class="logo titolo" id="logo' + gi + '">' + esc(g.titolo) + '</div>') +
      '<div class="costola"><span>' + esc(g.titolo) + '</span></div>' +
      (uso >= 0
        ? '<div class="spia"><span class="pill"><i class="led"></i><span class="et">In uso</span><b>' + esc(g.profili[uso].nome) + '</b></span></div>'
        : (uso === -2      // -2 = nessuna grafica salvata in BEST per questo gioco: niente allarme, è solo da provare
          ? '<div class="spia nuovo"><span class="pill"><i class="led"></i><span class="et">Da provare</span></span></div>'
          : '<div class="spia no"><span class="pill"><i class="led"></i><span class="et">Grafica cambiata a mano</span></span></div>')) +
      '<div class="invito">Apri</div>' +
      '<div class="gioco" id="gioco' + gi + '">' +
        '<button class="chiudi" title="Chiudi la scheda" onclick="apriScheda(' + gi + ')">' + IC_X + '</button>' +
        '<div class="colonna" id="col' + gi + '">' +
          (uso >= 0 || uso === -2 ? '' : '<div class="uso no"><i class="led"></i><span class="et">Grafica cambiata a mano</span><span class="perche">Non \u00e8 una configurazione provata. Se il gioco va male, premi un tasto qui sotto.</span></div>') +
          '<div class="capo"><i></i>Avvia il gioco<b></b></div>' +
          '<div class="tasti">' + tasti + '</div>' +
          '<div class="legami">' +
            '<button class="chip" onclick="gioca(' + gi + ',-1)" title="Apri il gioco senza cambiare niente">' + IC_APRI + 'Apri senza cambiare</button>' +
            '<button class="chip" id="b-crono' + gi + '" onclick="apri(\'crono' + gi + '\')" title="Usate di recente">' + IC_ORA + 'Recenti</button>' +
            '<button class="chip" id="b-note' + gi + '" onclick="apri(\'note' + gi + '\')" title="Dettagli e note">' + IC_NOTE + 'Note</button>' +
            chipGuida +
            chipRipara +
          '</div>' +
          '<div class="stato" id="stato' + gi + '"></div>' +
        '</div>' +
        cassetto('crono' + gi, 'Usate di recente', '<div class="crono">' + cronologia(g) + '</div>') +
        cassetto('note' + gi, 'Dettagli e note', '<h4>Le configurazioni</h4>' + dett + (prove ? '<h4>Prove</h4>' + prove : '') + (reg ? '<h4>Regole d\'oro</h4>' + reg : '') + (st ? '<h4>Storia (dalla pi\u00f9 recente)</h4>' + st : '')) +
        guida +
      '</div></div>';
  }
  el('giochi').innerHTML = h;
  segnaSopra();
  stati(false, true);
}

/* ---------- 4. misure: dove sta ogni monolite (chiuso, aperto, di lato) ---------- */
function selezionato() { for (var i = 0; i < BEST_GIOCHI.length; i++) if (aperti['gioco' + i]) return i; return -1; }
function px(e, prop, v) { if (e) e.style[prop] = Math.round(v) + 'px'; }

function disponi(anim, rapido) {
  var vis = el('vis'), n = window.BEST_GIOCHI ? BEST_GIOCHI.length : 0;
  if (!vis || !n) return;
  var W = vis.clientWidth, H = vis.clientHeight, cH = Math.max(240, H - PAV), sel = selezionato(), i;
  var costa = n <= 3 ? 86 : (n <= 5 ? 72 : 58), wMax = Math.max(300, W - (n - 1) * (costa + SPAZIO)), larg = [], x = 0;
  if (sel >= 0) {
    for (i = 0; i < n; i++) larg[i] = i === sel ? wMax : costa;
    if (sopra >= 0 && sopra !== sel) { larg[sopra] += 14; larg[sel] -= 14; }      // la costa sotto il mouse si allarga un po'
  } else {
    var base = (W - SPAZIO * (n - 1)) / n;
    for (i = 0; i < n; i++) larg[i] = base;
    if (sopra >= 0 && n > 1) { var piu = Math.min(54, base * 0.1); for (i = 0; i < n; i++) larg[i] = i === sopra ? base + piu : base - piu / (n - 1); }
  }
  if (!anim) metti(radice, 'fisso');
  classe(radice, 'rapido', !!rapido);
  for (i = 0; i < n; i++) {
    var g = BEST_GIOCHI[i], nt = NAT[i] || {}, w = larg[i], m = el('mono' + i), t = el('testa' + i);
    px(m, 'left', x); px(m, 'width', w); px(t, 'left', x); px(t, 'width', w);
    // immagine: grande quanto serve al monolite spalancato, cosi' aprendo si scopre senza ingrandirsi
    var rap = (nt.sw && nt.sh) ? nt.sw / nt.sh : (g.sfondo ? 3.097 : 0.667);
    var iw = Math.max(cH * rap, wMax), ih = iw / rap;
    var fuoco = (typeof g.fuoco === 'number' ? g.fuoco : 50) / 100;
    var il = w * (i === sel ? 0.66 : 0.5) - iw * fuoco, it = (cH - ih) / 2;
    if (il > 0) il = 0; if (il < w - iw) il = w - iw;
    var p = el('pos' + i), r = el('rpos' + i);
    px(p, 'left', il); px(p, 'top', it); px(p, 'width', iw); px(p, 'height', ih);
    px(r, 'left', il); px(r, 'top', cH - it - ih); px(r, 'width', iw); px(r, 'height', ih);
    // logo: al centro in basso da chiuso, in alto a sinistra da aperto
    var lg = el('logo' + i), rl = (nt.lw && nt.lh) ? nt.lw / nt.lh : 4, lw, lh;
    if (lg) {
      var scritta = !g.logo;           // senza logo: il titolo scritto (la sua altezza si misura dopo averlo messo largo giusto)
      if (i === sel) lw = scritta ? Math.min(440, w - 150) : Math.min(360, 112 * rl, w - 150);
      else lw = scritta ? Math.max(60, w - 36) : Math.min(w * 0.66, 430, 118 * rl);
      px(lg, 'width', lw);
      lh = scritta ? (lg.offsetHeight || 40) : lw / rl;
      if (i === sel) { px(lg, 'left', 46); px(lg, 'top', 46); px(el('col' + i), 'top', 46 + lh + 22); }
      else { px(lg, 'left', (w - lw) / 2); px(lg, 'top', cH * 0.67 - lh / 2); }
    }
    // cassetti: a destra dei tasti se c'e' posto, altrimenti sopra
    var cw = Math.min(470, w - 46 - 492 - 44); if (cw < 320) cw = Math.min(470, w - 44);
    for (var k = 0; k < TIPI.length; k++) px(el(TIPI[k] + i), 'width', cw);
    x += w + SPAZIO;
  }
  if (!anim) { void vis.offsetWidth; togli(radice, 'fisso'); }
}

/* ---------- 5. aprire e chiudere ---------- */
function statoDi(e, s) { if (!e) return; togli(e, 'chiusa'); togli(e, 'aperta'); togli(e, 'costa'); metti(e, s); }
function stati(anim, gia) {          // mette a ogni monolite il suo stato e li dispone
  var sel = selezionato();
  for (var j = 0; j < BEST_GIOCHI.length; j++) {
    var s = sel < 0 ? 'chiusa' : (j === sel ? 'aperta' : 'costa'), t = el('testa' + j);
    statoDi(el('mono' + j), s); statoDi(t, s);
    classe(t, 'gia', !!gia && s === 'aperta');
  }
  classe(el('vis'), 'conSopra', sel < 0 && sopra >= 0);
  disponi(anim);
  coloreTema();
}
function segnaSopra() {
  for (var j = 0; j < BEST_GIOCHI.length; j++) { classe(el('mono' + j), 'sopra', j === sopra); classe(el('testa' + j), 'sopra', j === sopra); }
  classe(el('vis'), 'conSopra', selezionato() < 0 && sopra >= 0);
}
function sopraA(gi) {                // il mouse entra (o esce, -1) da un monolite
  if (sopra === gi) return;
  sopra = gi; segnaSopra(); disponi(true, true); coloreTema();
}
function chiudiCassetti(gi) { for (var k = 0; k < TIPI.length; k++) { aperti[TIPI[k] + gi] = false; mostraCassetto(TIPI[k] + gi, false); } }
function mostraCassetto(id, si, anim) {
  var e = el(id); if (!e) return;
  e.style.display = si ? 'block' : 'none';
  classe(e, 'entra', !!(si && anim));
  classe(el('b-' + id), 'su', !!si);
}
function apri(id) {                  // cassetti: Recenti, Note, Guida (uno alla volta per gioco)
  aperti[id] = !aperti[id];
  var m = /^([a-z]+)(\d+)$/.exec(id);
  if (aperti[id] && m) for (var k = 0; k < TIPI.length; k++) if (TIPI[k] !== m[1]) { aperti[TIPI[k] + m[2]] = false; mostraCassetto(TIPI[k] + m[2], false); }
  mostraCassetto(id, aperti[id], true);
}
function mostraScheda(gi, si) { aperti['gioco' + gi] = si; stati(false, true); }
function apriScheda(gi) {            // un clic apre il gioco (e chiude gli altri), un altro lo richiude
  var id = 'gioco' + gi, si = !aperti[id];
  for (var j = 0; j < BEST_GIOCHI.length; j++) { aperti['gioco' + j] = false; chiudiCassetti(j); }
  aperti[id] = si;
  sopra = -1; segnaSopra();
  stati(true, false);
}
function riapri() {
  for (var id in aperti) {
    if (!aperti[id] || !el(id)) continue;
    if (id.indexOf('gioco') === 0) mostraScheda(+id.substring(5), true);
    else mostraCassetto(id, true, false);
  }
}
function dentro(e, c) {
  var t = e && (e.target || e.srcElement);
  while (t && t !== document) { if (typeof t.className === 'string' && haClasse(t, c)) return true; t = t.parentNode; }
  return false;
}
function tocca(gi, e) {              // clic su un monolite chiuso o di lato: si apre
  e = e || window.event;
  if (dentro(e, 'gioco')) return;
  if (!aperti['gioco' + gi]) apriScheda(gi);
}

/* ---------- 6. messaggi e avvio ---------- */
function scrivi(gi, c, t) {
  var e = el('stato' + gi); if (!e) return;
  e.className = 'stato'; void e.offsetWidth;
  e.className = 'stato pieno ' + c;
  e.innerHTML = esc(t) + '<i class="cur"></i>';
}
var tastoPremuto = null;
function premuto(gi, pi) { tastoPremuto = el('tasto' + gi + '_' + pi); metti(tastoPremuto, 'premuto'); }
function rilascia() { togli(tastoPremuto, 'premuto'); tastoPremuto = null; }
function attesaAvvio() { return FX === 'pieni' ? 420 : 60; }      // negli effetti pieni lascia vedere la barra che si carica
function accendiGuida(gi) {          // dopo l'avvio di un profilo con guida: la guida si apre da sola, in verde
  var id = 'guida' + gi; if (!el(id)) return;
  chiudiCassetti(gi); aperti[id] = true;
  mostraCassetto(id, true, true); metti(el(id), 'accesa');
}

/* ---------- 7. interfaccia viva ----------
   Due tele: "fondo" (dietro: luci lente e pavimento a griglia) e "braci" (davanti alle immagini, dietro ai comandi).
   Tutto si ferma da solo quando la finestra non e' in primo piano o un gioco e' appena partito: niente scheda video rubata al gioco. */
var cvF, cxF, cvB, cxB, LW = 0, LH = 0;
var tema = [255, 176, 0], temaVerso = [255, 176, 0], temaChiave = '';
var braci = [], sprite1 = null, sprite2 = null;
var inGiro = false, tPrec = 0, tAnim = 40;
var mx = -9999, my = -9999, parX = 9, parY = 9, PARS = [];
var banda = { y: -9999, tra: 3 };
var nascita = adesso(), fuocoEvento = true, riposoAttivo = false, riposoDa = 0, riposoGuardia = 0, ultimoGesto = adesso();
var SONNO = 150000;      // dopo 2 minuti e mezzo senza mouse ne' tasti l'interfaccia si ferma da sola (si risveglia al primo movimento)

var hasFocusVisto = false;           // "document.hasFocus()" ha detto si' almeno una volta: allora in questa finestra funziona e ci si puo' fidare del suo no
function inPrimoPiano() {
  if (adesso() - nascita < 3200) return true;          // l'accensione si vede sempre
  try { if (document.hidden) return false; } catch (e1) {}
  var hf = null;
  try { hf = !!document.hasFocus(); } catch (e2) {}
  if (hf) { hasFocusVisto = true; return true; }
  if (hf === false && hasFocusVisto) return false;
  return fuocoEvento;                                   // altrimenti valgono gli eventi della finestra (e i gesti di chi la usa)
}
function vivo() { return FX === 'pieni' && !riposoAttivo && inPrimoPiano(); }
function riposo(guardia) {           // un gioco sta partendo (o nessuno tocca il PC): tutto fermo
  riposoAttivo = true; riposoDa = adesso();
  riposoGuardia = typeof guardia === 'number' ? guardia : 3500;      // dopo un avvio, per qualche secondo il mouse non risveglia
}
function gesto() {                   // mouse o tastiera dentro BEST: se era a riposo si risveglia
  ultimoGesto = adesso(); fuocoEvento = true;
  if (riposoAttivo && ultimoGesto - riposoDa >= riposoGuardia) { riposoAttivo = false; parti(); }
}

function coloreTema() {
  if (!window.BEST_GIOCHI) return;
  var sel = selezionato(), k = sel >= 0 ? sel : sopra, c = k >= 0 ? coloreGioco(BEST_GIOCHI[k]) : ORO, chiave = c.join(',');
  if (chiave === temaChiave) return;
  temaChiave = chiave; temaVerso = c;
  var a = el('ambA'), b = el('ambB'), su = haClasse(a, 'su') ? b : a, giu = su === a ? b : a;
  su.style.background = 'radial-gradient(ellipse at 50% 112%, ' + rgba(c, 0.36) + ' 0%, ' + rgba(c, 0.1) + ' 36%, ' + rgba(c, 0) + ' 64%), radial-gradient(ellipse at 50% -22%, ' + rgba(c, 0.17) + ' 0%, ' + rgba(c, 0) + ' 54%)';
  metti(su, 'su'); togli(giu, 'su');
  if (!inGiro) { tema = c.slice(0); fotogrammaFermo(); }
}

var SC = 1;                              // finestra molto grande (es. a tutto schermo 5120x1440): le tele si disegnano a meta' misura, per non pesare
function misuraTela() {
  LW = radice.clientWidth || 1284; LH = radice.clientHeight || 940;
  SC = LW * LH > 2600000 ? 0.5 : 1;
  var w = Math.round(LW * SC), h = Math.round(LH * SC);
  if (cvF && (cvF.width !== w || cvF.height !== h)) { cvF.width = w; cvF.height = h; cvB.width = w; cvB.height = h; }
}
function faiSprite(c) {
  var s = document.createElement('canvas'); s.width = 64; s.height = 64;
  var x = s.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.16, rgba([(c[0] + 255) / 2, (c[1] + 255) / 2, (c[2] + 255) / 2], 0.95));
  g.addColorStop(0.42, rgba(c, 0.4));
  g.addColorStop(1, rgba(c, 0));
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return s;
}
function nuovaBrace(p, daSotto) {
  p.x = Math.random() * LW;
  p.y = daSotto ? LH + Math.random() * 60 : Math.random() * LH;
  p.vy = 12 + Math.random() * 40; p.vx = (Math.random() - 0.5) * 12;
  p.grande = Math.random() < 0.13;
  p.r = p.grande ? 12 + Math.random() * 22 : 2.4 + Math.random() * 4.6;
  p.a = p.grande ? 0.05 + Math.random() * 0.09 : 0.3 + Math.random() * 0.6;
  p.f = Math.random() * 6.283; p.o = 0.5 + Math.random() * 1.7; p.w = 5 + Math.random() * 20;
  p.chiara = Math.random() < 0.28;
  return p;
}
function luce(c, x, y, rag, col, a) {
  var g = c.createRadialGradient(x, y, 0, x, y, rag);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - rag, y - rag, rag * 2, rag * 2);
}
function disegnaFondo() {
  var c = cxF, R = Math.max(LW, LH), yh = LH - PAV + 3, i;
  c.setTransform(SC, 0, 0, SC, 0, 0);
  c.clearRect(0, 0, LW, LH);
  c.globalCompositeOperation = 'lighter';
  luce(c, LW * (0.5 + 0.34 * Math.cos(tAnim * 0.05)), LH * (0.4 + 0.2 * Math.sin(tAnim * 0.041)), R * 0.62, tema, 0.15);
  luce(c, LW * (0.2 + 0.2 * Math.sin(tAnim * 0.033 + 1.3)), LH * (0.82 + 0.12 * Math.cos(tAnim * 0.047)), R * 0.5, CREMISI, 0.12);
  luce(c, LW * (0.82 + 0.16 * Math.cos(tAnim * 0.039 + 2.1)), LH * (0.22 + 0.16 * Math.sin(tAnim * 0.052 + 0.7)), R * 0.46, [255, 120, 24], 0.085);
  // pavimento: bagliore all'orizzonte e griglia in prospettiva che viene avanti
  var g = c.createLinearGradient(0, yh, 0, LH);
  g.addColorStop(0, rgba(tema, 0.3)); g.addColorStop(0.5, rgba(tema, 0.07)); g.addColorStop(1, rgba(tema, 0));
  c.fillStyle = g; c.fillRect(0, yh, LW, LH - yh);
  var gl = c.createLinearGradient(0, yh, 0, LH);
  gl.addColorStop(0, rgba(tema, 0.04)); gl.addColorStop(1, rgba(tema, 0.5));
  c.strokeStyle = gl; c.lineWidth = 1; c.beginPath();
  var vx = LW / 2, vy = yh - 34, passo = LW / 13;
  for (i = -15; i <= 15; i++) {
    var xb = vx + i * passo * 1.9, xa = vx + (xb - vx) * (yh - vy) / (LH - vy);
    c.moveTo(xa, yh); c.lineTo(xb, LH);
  }
  c.stroke();
  var fase = (tAnim * 0.16) % 1;
  for (i = 0; i < 7; i++) {
    var z = (i + fase) / 7, y = yh + (LH - yh) * z * z;
    c.strokeStyle = rgba(tema, (0.08 + 0.42 * z).toFixed(3)); c.beginPath(); c.moveTo(0, Math.round(y) + 0.5); c.lineTo(LW, Math.round(y) + 0.5); c.stroke();
  }
  c.globalCompositeOperation = 'source-over';
}
function disegnaBraci(dt, fermo) {
  var c = cxB, i, p;
  c.setTransform(SC, 0, 0, SC, 0, 0);
  c.clearRect(0, 0, LW, LH);
  c.globalCompositeOperation = 'lighter';
  if (fermo) { banda.y = -9999; banda.tra = caso(4, 9); }
  if (!fermo && mx > -999) luce(c, mx, my, 280, tema, 0.13);           // luce che segue il mouse
  banda.tra -= dt;                                                     // banda di scansione che scende ogni tanto
  if (banda.tra <= 0 && banda.y < -999) { banda.y = -160; }
  if (banda.y > -999) {
    banda.y += dt * LH / 2.4;
    var g = c.createLinearGradient(0, banda.y, 0, banda.y + 150);
    g.addColorStop(0, rgba(tema, 0)); g.addColorStop(0.72, rgba(tema, 0.05)); g.addColorStop(0.97, 'rgba(255,244,222,0.17)'); g.addColorStop(1, rgba(tema, 0));
    c.fillStyle = g; c.fillRect(0, banda.y, LW, 150);
    if (banda.y > LH + 20) { banda.y = -9999; banda.tra = caso(8, 15); }
  }
  for (i = 0; i < braci.length; i++) {
    p = braci[i];
    p.y -= p.vy * dt; p.x += (p.vx + Math.sin(tAnim * p.o + p.f) * p.w) * dt;
    if (p.y < -40 || p.x < -50 || p.x > LW + 50) nuovaBrace(p, true);
    var a = p.a * (0.6 + 0.4 * Math.sin(tAnim * (1.4 + p.o) + p.f)) * Math.min(1, (LH + 40 - p.y) / 150) * Math.min(1, (p.y + 40) / 190);
    if (a <= 0.004) continue;
    c.globalAlpha = a > 1 ? 1 : a;
    c.drawImage(p.chiara ? sprite2 : sprite1, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function parallasse() {                // le immagini seguono appena il mouse (profondita')
  var tx = mx > -999 ? mx / LW - 0.5 : 0, ty = mx > -999 ? my / LH - 0.5 : 0;
  if (Math.abs(tx - parX) < 0.004 && Math.abs(ty - parY) < 0.004) return;
  parX = tx; parY = ty;
  var s = 'translate(' + (-tx * 28).toFixed(1) + 'px,' + (-ty * 14).toFixed(1) + 'px)';
  for (var i = 0; i < PARS.length; i++) if (PARS[i]) PARS[i].style.transform = s;
}
function fotogrammaFermo() {           // un solo disegno, senza movimento (effetti ridotti o spenti, o finestra in pausa)
  if (!cxF) return;
  misuraTela(); disegnaFondo(); cxB.setTransform(1, 0, 0, 1, 0, 0); cxB.clearRect(0, 0, cvB.width, cvB.height);
}
function giro(t) {
  if (!vivo()) { inGiro = false; classe(radice, 'ferma', FX === 'pieni'); if (FX === 'pieni') disegnaBraci(0, true); return; }
  window.requestAnimationFrame(giro);
  var dt = tPrec ? Math.min(0.05, Math.max(0.001, (t - tPrec) / 1000)) : 0.016, i, cambia = false;
  tPrec = t; tAnim += dt;
  for (i = 0; i < 3; i++) { var d = temaVerso[i] - tema[i]; if (Math.abs(d) > 0.6) { tema[i] += d * Math.min(1, dt * 3.4); cambia = true; } else tema[i] = temaVerso[i]; }
  if (cambia || !sprite1) sprite1 = faiSprite(tema);
  disegnaFondo(); disegnaBraci(dt); parallasse();
}
function parti() {
  if (inGiro || !cxF || !vivo()) return;
  inGiro = true; tPrec = 0; togli(radice, 'ferma');
  window.requestAnimationFrame(giro);
}
function applicaEffetti(v) {
  FX = v;
  togli(radice, 'fx-pieni'); togli(radice, 'fx-ridotti'); togli(radice, 'fx-spenti'); metti(radice, 'fx-' + v);
  togli(radice, 'ferma');
  if (v === 'pieni') parti();
  else { for (var i = 0; i < PARS.length; i++) if (PARS[i]) PARS[i].style.transform = ''; parX = 9; fotogrammaFermo(); }
}
function ciclo(f, a, b) { (function g() { setTimeout(function () { try { if (vivo()) f(); } catch (e) { if (window.ERRORI) ERRORI.push('ciclo: ' + e.message); } g(); }, caso(a, b)); })(); }
function unMonolite() {                // un monolite a caso tra quelli non di lato
  var v = [], i; for (i = 0; i < BEST_GIOCHI.length; i++) if (!haClasse(el('mono' + i), 'costa')) v.push(i);
  return v.length ? v[Math.floor(Math.random() * v.length)] : -1;
}
function fxScia() { var i = unMonolite(), e = el('scia' + i); if (!e) return; classe(e, 'giu', Math.random() < 0.5); riparti(e, 'corre'); }
function fxGuasto() {
  var i = unMonolite(), e = el('guasto' + i); if (!e) return;
  e.style.top = Math.round(caso(8, 90)) + '%'; riparti(e, 'scossa');
  if (PARS[i]) { PARS[i].style.transform = 'translate(' + Math.round(caso(-7, 7)) + 'px,0)'; setTimeout(function () { parX = 9; }, 90); }
}
function fxTubo() { riparti(el('nome'), 'sfarfalla'); }
function fxRiflesso() { var i = unMonolite(), e = el('lampo' + i); if (e && !haClasse(el('mono' + i), 'aperta')) riparti(e, 'passa'); }   // un riflesso di luce attraversa un monolite chiuso

function avviaVita() {
  cvF = el('fondo'); cvB = el('braci');
  try { cxF = cvF.getContext('2d'); cxB = cvB.getContext('2d'); } catch (e) { cxF = null; return; }
  misuraTela();
  var n = Math.round(Math.min(170, Math.max(60, LW * LH / 9000)));
  for (var i = 0; i < n; i++) braci.push(nuovaBrace({}, false));
  sprite1 = faiSprite(tema); sprite2 = faiSprite([255, 222, 170]);
  for (i = 0; i < BEST_GIOCHI.length; i++) PARS[i] = el('par' + i);
  document.onmousemove = function (e) {
    e = e || window.event;
    if (e.clientX === mx && e.clientY === my) return;        // IE manda "mousemove" anche a mouse fermo: non conta come gesto
    mx = e.clientX; my = e.clientY; gesto();
  };
  radice.onmouseleave = function () { mx = -9999; };
  window.onblur = function () { fuocoEvento = false; };
  window.onfocus = function () { fuocoEvento = true; parti(); };
  setInterval(function () {                                                        // sentinella
    if (FX !== 'pieni') return;
    if (!riposoAttivo && adesso() - ultimoGesto > SONNO) riposo(0);                  // nessuno al PC: a riposo
    if (!inGiro) parti();                                                          // la finestra e' tornata davanti: riparte
  }, 700);
  ciclo(fxScia, 2200, 5200); ciclo(fxGuasto, 5000, 11000); ciclo(fxTubo, 7000, 15000); ciclo(fxRiflesso, 6000, 12000);
  fotogrammaFermo();
  parti();
}

/* ---------- 8. partenza ---------- */
var GIORNI = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'], MESI = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'], oraVista = '';
function orologio() {
  var d = new Date(), o = due(d.getHours()) + '<i>:</i>' + due(d.getMinutes());
  if (o === oraVista) return;
  oraVista = o; el('ora').innerHTML = o;
  el('data').innerHTML = GIORNI[d.getDay()] + ' ' + d.getDate() + ' ' + MESI[d.getMonth()];
}
function inizio() {
  try { leggiPreferenze(); } catch (e1) { PREF.effetti = 'pieni'; }
  for (var v = 0; v < IMPOSTAZIONI.length; v++) { try { IMPOSTAZIONI[v].applica(PREF[IMPOSTAZIONI[v].id]); } catch (e0) {} }
  try { orologio(); setInterval(orologio, 5000); faiIngranaggio(); disegnaImpostazioni(); } catch (e2) {}
  if (window.BEST_GIOCHI && !BEST_GIOCHI.length && window.BEST_GIOCHI_TOTALI) {   // giochi.js c'è, ma nessun gioco è di questo sistema
    el('giochi').innerHTML = '<div class="guaio">Su questo ' + (window.BEST_SISTEMA === 'mac' ? 'Mac' : 'PC') + ' non ci sono ancora giochi in BEST. Chiama Claude per aggiungerne uno.</div>';
    return;
  }
  if (!window.BEST_GIOCHI || !BEST_GIOCHI.length) {
    el('giochi').innerHTML = '<div class="guaio">Non riesco a leggere <b>giochi.js</b>: le schede dei giochi non ci sono. Chiama Claude.</div>';
    return;
  }
  if (window.BEST_PC && BEST_PC.pezzi) { var pz = []; for (var i = 0; i < BEST_PC.pezzi.length; i++) pz.push(esc(BEST_PC.pezzi[i])); el('piede').innerHTML = pz.join('<b>//</b>'); }
  costruisci();
  disegna();                               // da qui in poi le schede funzionano: quello che segue e' solo bellezza
  try { precarica(); } catch (e3) {}
  try { avviaVita(); } catch (e4) {}
  metti(radice, 'entra'); setTimeout(function () { togli(radice, 'entra'); }, 3000);
  window.onresize = function () { misuraTela(); disponi(false); if (!inGiro) fotogrammaFermo(); };
  document.onkeydown = function (e) {
    e = e || window.event; gesto(); if (e.keyCode !== 27) return;
    if (impAperto) { apriImpostazioni(false); return; }
    var sel = selezionato(); if (sel < 0) return;
    for (var k = 0; k < TIPI.length; k++) if (aperti[TIPI[k] + sel]) { apri(TIPI[k] + sel); return; }
    apriScheda(sel);
  };
  document.onmousedown = function (e) {
    e = e || window.event; gesto(); if (!impAperto) return;
    var t = e.target || e.srcElement;
    while (t && t !== document) { if (t.id === 'imp' || t.id === 'ingranaggio') return; t = t.parentNode; }
    apriImpostazioni(false);
  };
}
try { inizio(); } catch (ex) {
  try { window.onerror('partenza: ' + (ex && ex.message), 'best.js', 0); } catch (ex2) {}
  if (el('giochi')) el('giochi').innerHTML = '<div class="guaio">BEST non \u00e8 riuscita a partire bene. Chiama Claude. Intanto puoi aprire i giochi direttamente da Steam.</div>';
}
