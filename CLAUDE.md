# CLAUDE.md — Progetto BEST

BEST = le configurazioni dei giochi **provate e sicure**, una scheda per gioco («paziente»), pronte da rimettere con un clic.
**Un'app sola per PC Windows e Mac** (repository git); i giochi restano in locale su ogni computer. Leggi:
- **`README.md`**: com'è fatta l'app (uguale su tutti e due i computer).
- **`PROGETTO.md`**: il diario di QUESTO computer (macchina, pazienti, cose da fare). Non va nel repository.

Regole veloci:
- Rispondi **sempre in italiano**, semplice e concreto: Fabrice non è un tecnico.
- **Mai cambiare le impostazioni di un gioco mentre è aperto.** Prima di toccare un file di impostazioni: controllare che il gioco sia chiuso e farne una copia `.bak` accanto.
- Un effetto pesante alla volta (ray tracing, Frame Generation…), provando ogni volta il gioco vero (es. la Campagna), non solo il menu.
- Quando una prova riesce: **copiare** (mai spostare) il file delle impostazioni del gioco in `giochi/<gioco>/<PROFILO>_OK_<nome file>`, aggiornare `giochi.js` (profilo, prossime prove, tappa in `storia`) e `PROGETTO.md`.
- Quando una prova fallisce: rimettere subito l'ultimo profilo buono, segnare la causa in `giochi.js` (prova con stato `'no'`) e nella storia.
- Ogni gioco in `giochi.js` ha `sistema: 'mac'` o `'win'`: la pagina mostra solo quelli del computer su cui gira.
- `giochi.js`, `giochi/`, `PROGETTO.md` non vanno MAI nel repository (sono in `.gitignore`). Nel repository solo l'app.
- Modifiche a `server.py`: la parte Windows non si può provare dal Mac (e viceversa) → toccarla il meno possibile e dirlo a Fabrice.
- **Solo web standard** (Chrome o Safari). **Mai Internet Explorer / `mshta` / `.hta` / ActiveX** (decisione di Fabrice del 23/11/2026).
- Ponte `server.py` sulla porta **8820** (riservata a BEST, in esclusiva). Server di prova solo su porte libere sopra 9000, spenti alla fine.
- Processi: mai chiudere per nome, solo per numero di processo dopo aver controllato percorso e nome.
- Windows: cartella `C:\FABRICE\BEST`, sul desktop solo il collegamento «BEST» (`best.ico`) → `Avvia BEST.vbs`. Driver, Steam Input, arcade stick Hori e comandi del mouse nei giochi a pistola: non toccarli (regole in `C:\EMU\CLAUDE.md`). Scorta in `C:\Users\lanui\SCORTA_PROGETTI`.
- Mac: cartella `~/FABRICE/BEST`, avvio con `BEST.app` (`best.icns`) → `avvia_mac.sh`. Joypad Xbox Nano: progetto a parte in `~/FABRICE/NANO`.
