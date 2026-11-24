// BEST — ESEMPIO di giochi.js. Copialo in giochi.js (che resta solo su questo computer) e scrivi i tuoi giochi.
// sistema: 'mac' o 'win' → la pagina mostra solo i giochi del computer su cui gira.
window.BEST_PC = {
  nome: 'Il mio computer',
  pezzi: ['Processore', 'RAM', 'Schermo']
};

window.BEST_GIOCHI = [
  {
    id: 'nome-gioco',                 // = nome della cartella in giochi/
    sistema: 'mac',                   // 'mac' oppure 'win'
    titolo: 'Nome del gioco',
    sotto: 'Campagna · Steam',
    colore: '#ffb000',                // luce della scheda
    stato: 'prova',
    aggiornato: 'gg/mm/aaaa',
    cartella: 'giochi/nome-gioco',
    copertina: 'giochi/nome-gioco/copertina.jpg',   // da Steam: appcache/librarycache/<AppID>/library_600x900.jpg
    sfondo: 'giochi/nome-gioco/sfondo.jpg',         // library_hero.jpg
    logo: 'giochi/nome-gioco/logo.png',             // logo.png
    steam: '000000',                  // AppID di Steam
    processi: 'NomeProgramma',        // nomi dei programmi del gioco, separati da virgola (Windows senza .exe)
    // fileGioco: file delle impostazioni del gioco. Mac: '~/Library/Application Support/...'  Windows: '%LOCALAPPDATA%\\...'
    fileGioco: '~/Library/Application Support/Gioco/impostazioni.cfg',
    profili: [
      // file = <PROFILO>_OK_<nome file> in giochi/<cartella>; senza file il tasto apre il gioco senza cambiare la grafica
      { nome: 'BASE', stato: 'ok', consigliato: true, breve: 'La più sicura', provato: 'gg/mm/aaaa · stabile',
        file: 'BASE_OK_impostazioni.cfg', voci: [['Risoluzione', '...']] }
    ],
    prove: [['Prossima prova', 'da provare']],
    regole: ['Mai cambiare la grafica a gioco aperto.'],
    paziente: 'Paziente n. 1',
    storia: [{ data: 'gg/mm/aaaa', tipo: 'nota', testo: 'Cosa è successo.' }]
  }
];
