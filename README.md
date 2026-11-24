# BEST

Le configurazioni dei giochi **provate e sicure**, una scheda per gioco («paziente»), da rimettere con un clic.
**Un'app sola per PC Windows e Mac**: ogni computer mostra solo i suoi giochi.

## Cosa sta nel repository e cosa no
| Nel repository (uguale su PC e Mac) | Solo in locale, su ogni computer (escluso da `.gitignore`) |
|---|---|
| `index.html`, `ui/` (grafica e motore), `server.py` (ponte), avvii, icone, `README.md`, `CLAUDE.md`, `giochi.esempio.js` | `giochi.js` (schede dei giochi di quel computer), `giochi/` (impostazioni salvate, immagini, cronologia), `PROGETTO.md` (diario di quel computer), `ui/preferenze.txt`, `ui/errori.txt`, `*.bak` |

Così l'app resta leggera e si aggiorna con `git pull` su tutte e due le postazioni, senza mai toccare i giochi.

## Come sceglie i giochi
Ogni scheda in `giochi.js` ha `sistema: 'mac'` o `sistema: 'win'` (senza il campo vale `'win'`, come le vecchie schede del PC).
Il ponte dice alla pagina su che sistema gira (`/api/sistema`) e `ui/motore_chrome.js` tiene solo i giochi di quel sistema.

## Come è fatta
| Cosa | Dove |
|---|---|
| Pagina | `index.html` = scheletro · `ui/best.css` = aspetto · `ui/best.js` = disegno, movimenti, impostazioni · `ui/motore_chrome.js` = lettura file e avvio. Solo web standard (Chrome o Safari). |
| Ponte | `server.py` su **127.0.0.1:8820** (porta riservata a BEST, in esclusiva). Legge solo dentro BEST e nelle cartelle dei giochi (Windows `%LOCALAPPDATA%`; Mac `~/Library/Application Support`, `~/Library/Preferences`, `~/Library/Containers`, `~/Documents`), scrive solo `ui/*.txt`, rifiuta richieste da altri siti. |
| Avvio di un profilo | Controlla che il gioco sia chiuso, fa la `.bak` del file attuale, rimette il profilo, scrive `cronologia.txt`, apre `steam://rungameid/<id>`. Windows: `avvia.ps1`. Mac: `avvia_mac()` dentro `server.py`. |
| Avvio dell'app | Windows: `Avvia BEST.vbs` (collegamento «BEST» sul desktop, icona `best.ico`). Mac: `BEST.app` (icona `best.icns`), che lancia `avvia_mac.sh`. |
| Solo Windows | `/api/mirini` e `/api/ripara_mod` (Gears of War: E-Day sul PC). |

Stati delle prove: `ok` (verde), `in prova` (oro), `da provare` (grigio), `no` (rosso, da non usare).
Un gioco senza grafica salvata mostra la spia grigia «Da provare».

## Mettere BEST su un computer nuovo
1. `git clone` del repository.
2. Copiare `giochi.esempio.js` in `giochi.js` e scrivere le schede di quel computer; creare `giochi/<gioco>/`.
3. Mac: doppio clic su `BEST.app` (se non parte: `bash avvia_mac.sh`). Windows: `Avvia BEST.vbs`.
