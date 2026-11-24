#!/bin/bash
# BEST sul Mac - accende il ponte (server.py, porta 8820) se serve e apre BEST in una finestra di Chrome senza barre.
# Lo usa BEST.app (icona). Si può anche lanciare a mano: bash avvia_mac.sh
BASE="$(cd "$(dirname "$0")" && pwd)"
URL="http://127.0.0.1:8820/"

acceso() { curl -s -o /dev/null -m 1 -w '%{http_code}' "${URL}giochi.js" | grep -q 200; }

if ! acceso; then
  PY=/usr/bin/python3
  [ -x /opt/homebrew/bin/python3 ] && PY=/opt/homebrew/bin/python3
  cd "$BASE" && nohup "$PY" "$BASE/server.py" >/dev/null 2>&1 &
  for i in $(seq 1 40); do sleep 0.15; acceso && break; done
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -x "$CHROME" ]; then
  "$CHROME" --app="$URL" --window-size=1300,900 >/dev/null 2>&1 &
else
  open -a Safari "$URL"
fi
