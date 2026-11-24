// ====== MOTORE per Chrome (non è grafica) ======
// Chrome non può toccare i file del PC: lo fa server.py (127.0.0.1:8820) per conto della pagina.
// Funzioni: leggi, leggiUtf8, scriviFile, cronologia, profiloInUso, gioca.
window.BEST_CHROME = true;
var occupato = false;

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function win(rel) { return rel; }                     // qui i percorsi restano relativi alla cartella BEST

function ponte(cosa, dati, poi) {                     // senza "poi" aspetta la risposta (serve per disegnare subito)
  var x = new XMLHttpRequest();
  x.open('POST', '/api/' + cosa, !!poi);
  x.setRequestHeader('Content-Type', 'application/json');
  if (poi) {
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      var r = null; try { r = JSON.parse(x.responseText); } catch (e) {}
      poi(x.status === 200 ? r : null);
    };
  }
  try { x.send(JSON.stringify(dati)); } catch (e) { if (poi) poi(null); return null; }
  if (poi) return null;
  try { return x.status === 200 ? JSON.parse(x.responseText) : null; } catch (e2) { return null; }
}

// Percorsi dei file dei giochi: Windows %LOCALAPPDATA%\... o C:\... ; Mac ~/Library/... o /Users/...
// Tutto il resto è relativo alla cartella BEST.
function datiLettura(f) {
  return (/^%|^[A-Za-z]:\\|^~\/|^\//.test(f)) ? { percorso: f } : { rel: f };
}

// ---- Un'app sola per PC e Mac: si tengono solo i giochi del sistema su cui gira ----
// Ogni gioco in giochi.js ha sistema: 'mac' o 'win' (senza il campo vale 'win', come le vecchie schede del PC).
// Il sistema lo dice il ponte (server.py); se non risponde, si guarda il browser.
window.BEST_SISTEMA = (function () {
  var r = ponte('sistema', {});
  if (r && r.sistema) return r.sistema;
  return /Mac/i.test(navigator.platform || navigator.userAgent) ? 'mac' : 'win';
})();
window.BEST_GIOCHI_TOTALI = window.BEST_GIOCHI ? BEST_GIOCHI.length : 0;
if (window.BEST_GIOCHI) {
  window.BEST_GIOCHI = BEST_GIOCHI.filter(function (g) { return (g.sistema || 'win') === BEST_SISTEMA; });
}
function leggi(f) { var r = ponte('leggi', datiLettura(f)); return r ? r.testo : null; }
function leggiUtf8(f) { var d = datiLettura(f); d.utf8 = true; var r = ponte('leggi', d); return r && r.testo ? r.testo : ''; }
function scriviFile(f, testo, aggiungi) { ponte('scrivi', { rel: f, testo: testo, aggiungi: !!aggiungi }, function () {}); }

function cronologia(g) {
  var righe = leggiUtf8(g.cartella + '/cronologia.txt').split(/\r?\n/), out = '', n = 0;
  for (var i = righe.length - 1; i >= 0 && n < 15; i--) {
    if (!righe[i]) continue;
    var c = righe[i].split('|');
    out += '<div' + (n === 0 ? ' class="primo"' : '') + '><span class="q">' + esc(c[0]) + '</span><span class="n">' + esc(c[1] || '') + '</span><span class="x">' + esc(c[2] || '') + '</span></div>';
    n++;
  }
  return out || '<div class="x">Ancora niente.</div>';
}

// -1 = grafica cambiata a mano · -2 = gioco senza file della grafica in BEST (ancora da provare)
function profiloInUso(g) {
  if (!g.fileGioco || !g.profili.some(function (p) { return !!p.file; })) return -2;
  var att = leggi(g.fileGioco);
  if (att === null) return -1;
  for (var i = 0; i < g.profili.length; i++) if (g.profili[i].file && leggi(g.cartella + '/' + g.profili[i].file) === att) return i;
  return -1;
}

// Premuto un tasto: rimette la grafica del profilo (se ha un file) e apre il gioco da Steam.
// avvia.ps1 esce con 0 = fatto, 2 = gioco ancora aperto, 1 = errore.
function gioca(gi, pi) {
  if (occupato) return;
  var g = BEST_GIOCHI[gi], pr = pi >= 0 ? g.profili[pi] : null;
  occupato = true;
  premuto(gi, pi);
  scrivi(gi, 'att', pr ? 'Metto la grafica ' + pr.nome + '…' : 'Apro il gioco…');
  setTimeout(function () {
    var dati = { dest: g.fileGioco, processi: g.processi, steam: g.steam, cronologia: g.cartella + '/cronologia.txt' };
    if (pr && pr.file) dati.fonte = g.cartella + '/' + pr.file;
    if (pr) dati.nome = pr.nome;
    ponte('avvia', dati, function (ris) {
      var r = ris && typeof ris.codice === 'number' ? ris.codice : 1;
      occupato = false;
      rilascia();
      if (r === 0) {
        disegna(); riapri();
        scrivi(gi, 'ok', (pr && pr.file ? 'Grafica ' + pr.nome + ' messa. ' : (pr ? pr.nome + ': grafica lasciata com\'è. ' : '')) + 'Il gioco si sta aprendo da Steam: aspetta qualche secondo.');
        if (pr && pr.guida && document.getElementById('guida' + gi)) accendiGuida(gi);
        // solo i profili con "mirini: true": parte anche il programmino dei mirini (aspetta il gioco e si chiude con lui)
        if (pr && pr.mirini) ponte('mirini', { gioco: g.id }, function (m) {
          if (!m || !m.ok) scrivi(gi, 'err', 'Il gioco si sta aprendo, ma i mirini non sono partiti. Chiama Claude.');
        });
        riposo();
      }
      else if (r === 2) scrivi(gi, 'err', 'Il gioco è ancora aperto: chiudilo (Torna al desktop) e premi di nuovo.');
      else scrivi(gi, 'err', 'Qualcosa non è andato: non ho cambiato niente. Chiama Claude.');
    });
  }, attesaAvvio());
}

// Tasto discreto «Ripara split-screen» (giochi con "ripara" in giochi.js): server.py rimette la modifica dalla copia
// tenuta in BEST, solo a gioco chiuso. Risposta: codice 0 = fatto o già a posto, 2 = gioco aperto, 1 = errore.
function riparaMod(gi) {
  if (occupato) return;
  var g = BEST_GIOCHI[gi];
  occupato = true;
  scrivi(gi, 'att', 'Controllo la modifica per giocare in due…');
  ponte('ripara_mod', { gioco: g.id }, function (ris) {
    occupato = false;
    var r = ris && typeof ris.codice === 'number' ? ris.codice : 1;
    var testo = ris && ris.messaggio ? ris.messaggio : 'Qualcosa non è andato: non ho cambiato niente. Chiama Claude.';
    if (r === 0) { disegna(); riapri(); }  // la cronologia («Recenti») si aggiorna
    scrivi(gi, r === 0 ? 'ok' : 'err', testo);
  });
}
