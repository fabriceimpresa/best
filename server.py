# BEST - ponte tra la pagina (in Chrome o Safari) e il computer: legge i file dei giochi e li avvia.
# Funziona su Windows e su Mac (stesso file): riconosce da solo il sistema.
# Ascolta SOLO su 127.0.0.1:8820 (porta riservata a BEST).
# Avvio: Windows "Avvia BEST.vbs" (icona BEST sul desktop) · Mac "BEST.app" (o avvia_mac.sh).
import ctypes
import hashlib
import json
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
import zipfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

WIN = os.name == 'nt'
MAC = sys.platform == 'darwin'
SISTEMA = 'win' if WIN else ('mac' if MAC else 'altro')
if WIN:
    from ctypes import wintypes

PORTA = 8820
BASE = os.path.dirname(os.path.abspath(__file__))
ORIGINI = ('http://127.0.0.1:%d' % PORTA, 'http://localhost:%d' % PORTA)

# Cartelle dove stanno le impostazioni dei giochi: solo qui il ponte legge e (all'avvio di un profilo) scrive.
if WIN:
    LOCALAPPDATA = os.path.normcase(os.path.abspath(os.environ.get('LOCALAPPDATA', '')))
    CARTELLE_GIOCHI = [LOCALAPPDATA]
else:
    CASA = os.path.expanduser('~')
    CARTELLE_GIOCHI = [os.path.join(CASA, 'Library', 'Application Support'),
                       os.path.join(CASA, 'Library', 'Preferences'),
                       os.path.join(CASA, 'Library', 'Containers'),
                       os.path.join(CASA, 'Documents')]


def dentro(percorso, cartella):
    p = os.path.normcase(os.path.abspath(percorso))
    c = os.path.normcase(os.path.abspath(cartella))
    return p == c or p.startswith(c + os.sep)


def nei_giochi(percorso):
    # realpath: un collegamento non deve portare fuori dalle cartelle permesse
    p = os.path.realpath(percorso)
    return any(dentro(p, os.path.realpath(c)) for c in CARTELLE_GIOCHI)


def espandi(p):
    if WIN:
        return os.path.abspath(os.path.expandvars(p.replace('/', '\\')))
    return os.path.abspath(os.path.expanduser(os.path.expandvars(p))) if p else ''


def da_base(rel):
    if WIN:
        return os.path.abspath(os.path.join(BASE, rel.replace('/', '\\')))
    return os.path.abspath(os.path.join(BASE, rel))


class Ponte(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=BASE, **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def rispondi(self, codice, dati):
        corpo = json.dumps(dati).encode('utf-8')
        self.send_response(codice)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def do_POST(self):
        # Solo la pagina di BEST puo' chiedere qualcosa (niente siti esterni).
        host = self.headers.get('Host', '')
        origine = self.headers.get('Origin')
        if host not in ('127.0.0.1:%d' % PORTA, 'localhost:%d' % PORTA) or (origine and origine not in ORIGINI):
            return self.rispondi(403, {'errore': 'vietato'})
        try:
            n = int(self.headers.get('Content-Length', '0'))
            d = json.loads(self.rfile.read(n).decode('utf-8') or '{}')
        except Exception:
            return self.rispondi(400, {'errore': 'richiesta'})
        try:
            if self.path == '/api/sistema':
                return self.rispondi(200, {'sistema': SISTEMA})
            if self.path == '/api/leggi':
                return self.rispondi(200, {'testo': self.leggi(d)})
            if self.path == '/api/scrivi':
                return self.rispondi(200, {'ok': self.scrivi(d)})
            if self.path == '/api/avvia':
                return self.rispondi(200, {'codice': self.avvia(d)})
            if self.path == '/api/mirini':
                return self.rispondi(200, {'ok': avvia_mirini(d.get('gioco'))})
            if self.path == '/api/ripara_mod':
                codice, messaggio = ripara_mod(d.get('gioco'))
                return self.rispondi(200, {'codice': codice, 'messaggio': messaggio})
        except Exception as e:
            return self.rispondi(500, {'errore': str(e)})
        return self.rispondi(404, {'errore': 'sconosciuto'})

    # Legge un file: dentro BEST (percorso relativo) o dentro le cartelle dei giochi
    # (Windows: %LOCALAPPDATA% con %VARIABILI%; Mac: ~/Library/... e ~/Documents, con ~).
    def leggi(self, d):
        if d.get('rel'):
            f = da_base(d['rel'])
            if not dentro(f, BASE):
                return None
        else:
            f = espandi(d.get('percorso', ''))
            if not f or not nei_giochi(f):
                return None
        if not os.path.isfile(f):
            return None
        with open(f, 'rb') as h:
            dati = h.read()
        if d.get('utf8'):
            return dati.decode('utf-8', 'replace').lstrip('\ufeff')
        return dati.decode('latin-1')     # confronto byte per byte

    # Scrive solo dentro BEST/ui (preferenze.txt, errori.txt).
    def scrivi(self, d):
        f = da_base(d.get('rel', ''))
        if not dentro(f, os.path.join(BASE, 'ui')) or not f.lower().endswith('.txt'):
            return False
        with open(f, 'a' if d.get('aggiungi') else 'w', encoding='utf-8', newline='\r\n' if WIN else '') as h:
            h.write(d.get('testo', ''))
        return True

    # Rimette la grafica e avvia il gioco. 0 = fatto, 2 = gioco aperto, 1 = errore.
    # Windows: avvia.ps1 (come sempre). Mac: avvia_mac() qui sotto (stesse regole).
    def avvia(self, d):
        giochi = os.path.join(BASE, 'giochi')
        fonte = ''
        if d.get('fonte'):
            fonte = da_base(d['fonte'])
            if not dentro(fonte, giochi):
                return 1
        dest = d.get('dest', '') or ''
        steam = str(d.get('steam', ''))
        if not steam.isdigit():
            return 1
        cronologia = da_base(d.get('cronologia', ''))
        if not dentro(cronologia, giochi):
            return 1
        if not WIN:
            return avvia_mac(fonte, dest, d.get('processi', ''), steam, d.get('nome', ''), cronologia)
        cmd = ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden',
               '-File', os.path.join(BASE, 'avvia.ps1')]
        if fonte:
            cmd += ['-Fonte', fonte]
        if not dentro(espandi(dest), LOCALAPPDATA):
            return 1
        cmd += ['-Dest', dest, '-Processi', d.get('processi', ''), '-Steam', steam,
                '-Cronologia', cronologia]
        if d.get('nome'):
            cmd += ['-Nome', d['nome']]
        r = subprocess.run(cmd, creationflags=0x08000000)   # CREATE_NO_WINDOW
        return r.returncode


def avvia_mac(fonte, dest, processi, steam, nome, cronologia):
    """Come avvia.ps1, ma per il Mac. fonte vuota = non cambia la grafica, avvia e basta."""
    try:
        nomi = set(x.strip().lower() for x in (processi or '').split(',') if x.strip())
        if nomi & processi_accesi():
            return 2
        if fonte:
            dest = espandi(dest)
            if not dest or not nei_giochi(dest) or not os.path.isfile(fonte):
                return 1
            if not os.path.isdir(os.path.dirname(dest)):
                return 1
            if os.path.isfile(dest):
                if impronta_file(fonte) != impronta_file(dest):
                    shutil.copyfile(dest, dest + '.prima_di_BEST_' + time.strftime('%Y%m%d_%H%M%S') + '.bak')
            shutil.copyfile(fonte, dest)
        with open(cronologia, 'a', encoding='utf-8') as h:
            h.write('%s|%s|avviato da BEST\n' % (time.strftime('%d/%m/%Y %H:%M'), nome or '(senza cambiare)'))
        subprocess.run(['open', 'steam://rungameid/' + steam], check=True)
        return 0
    except Exception:
        return 1


# ---------- azioni dedicate (percorsi FISSI scritti qui: dalla pagina arriva solo il nome del gioco) ----------
# Solo Windows: servono a Gears of War: E-Day sul PC (sul Mac non ci sono).
MIRINI = {      # programmino che disegna i mirini sopra il gioco (non tocca il gioco)
    'gears-eday': os.path.join(BASE, 'giochi', 'gears-eday', 'mirini', 'mirini.py'),
}
MOD = {         # modifica reinstallabile dalla copia locale tenuta in BEST
    'gears-eday': {
        'copia': os.path.join(BASE, 'giochi', 'gears-eday', 'mod'),                    # zip + versione.txt
        'gioco': r'C:\Program Files (x86)\Steam\steamapps\common\GoWEDay',
        'paks': r'FairlightConcept\Content\Paks',
        'dentro_zip': 'FairlightConcept/Content/Paks/~mods/EDayLocalSplitScreen/',
        'dest': r'FairlightConcept\Content\Paks\~mods\EDayLocalSplitScreen',
        'file': ('EDayLocalSplitScreen_P.pak', 'EDayLocalSplitScreen_P.ucas', 'EDayLocalSplitScreen_P.utoc'),
        'processi': ('goweday-steam.exe', 'start_protected_game.exe'),
        'cronologia': os.path.join(BASE, 'giochi', 'gears-eday', 'cronologia.txt'),
    },
}
serratura_mod = threading.Lock()


def processi_accesi():
    """Nomi (minuscoli) dei programmi che girano. Solo l'elenco: non apre e non tocca nessun processo.
    Windows: con .exe (es. 'cod.exe'). Mac: nome del programma (es. 'metroredux2033')."""
    if not WIN:
        r = subprocess.run(['ps', '-axo', 'comm='], stdout=subprocess.PIPE, check=True)
        return set(os.path.basename(x.strip()).lower() for x in r.stdout.decode('utf-8', 'replace').splitlines() if x.strip())

    class PROCESSENTRY32W(ctypes.Structure):
        _fields_ = [('dwSize', wintypes.DWORD), ('cntUsage', wintypes.DWORD), ('th32ProcessID', wintypes.DWORD),
                    ('th32DefaultHeapID', ctypes.c_size_t), ('th32ModuleID', wintypes.DWORD), ('cntThreads', wintypes.DWORD),
                    ('th32ParentProcessID', wintypes.DWORD), ('pcPriClassBase', wintypes.LONG), ('dwFlags', wintypes.DWORD),
                    ('szExeFile', wintypes.WCHAR * 260)]
    k32 = ctypes.WinDLL('kernel32')
    k32.CreateToolhelp32Snapshot.restype = wintypes.HANDLE
    k32.CreateToolhelp32Snapshot.argtypes = [wintypes.DWORD, wintypes.DWORD]
    k32.Process32FirstW.argtypes = [wintypes.HANDLE, ctypes.POINTER(PROCESSENTRY32W)]
    k32.Process32NextW.argtypes = [wintypes.HANDLE, ctypes.POINTER(PROCESSENTRY32W)]
    k32.CloseHandle.argtypes = [wintypes.HANDLE]
    snap = k32.CreateToolhelp32Snapshot(2, 0)
    if not snap or snap == wintypes.HANDLE(-1).value:
        raise OSError('elenco dei processi non disponibile')
    nomi = set()
    pe = PROCESSENTRY32W()
    pe.dwSize = ctypes.sizeof(PROCESSENTRY32W)
    ok = k32.Process32FirstW(snap, ctypes.byref(pe))
    while ok:
        nomi.add(pe.szExeFile.lower())
        ok = k32.Process32NextW(snap, ctypes.byref(pe))
    k32.CloseHandle(snap)
    return nomi


def avvia_mirini(gioco):
    """Avvia SOLO lo script dei mirini di quel gioco (se ce n'e' gia' uno acceso, il secondo si chiude da solo). Solo Windows."""
    script = MIRINI.get(gioco)
    if not WIN or not script or not os.path.isfile(script):
        return False
    py = os.path.join(os.path.dirname(sys.executable), 'pythonw.exe')
    if not os.path.isfile(py):
        py = sys.executable
    subprocess.Popen([py, script], cwd=os.path.dirname(script), close_fds=True,
                     creationflags=0x00000008 | 0x00000200)      # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
    return True


def impronta(dati):
    return hashlib.sha256(dati).hexdigest()


def impronta_file(f):
    with open(f, 'rb') as h:
        return impronta(h.read())


def ripara_mod(gioco):
    """Rimette la modifica dalla copia locale. Rende (codice, messaggio): 0 = fatto o gia' a posto, 2 = gioco aperto, 1 = errore.
    Tocca SOLO la cartella della modifica dentro ~mods; i file originali del gioco (pakchunk...) non vengono mai toccati."""
    m = MOD.get(gioco)
    if not m or not WIN:
        return 1, 'Per questo gioco non c\'è una modifica da rimettere.'
    if not serratura_mod.acquire(blocking=False):
        return 1, 'Sto già lavorando: aspetta un momento.'
    try:
        if processi_accesi() & set(m['processi']):
            return 2, 'Il gioco è ancora aperto: chiudilo (Torna al desktop) e premi di nuovo.'
        paks = os.path.join(m['gioco'], m['paks'])
        if not os.path.isdir(paks):
            return 1, 'Non trovo la cartella del gioco: non ho toccato niente. Chiama Claude.'

        # 1. quale zip usare: riga "attiva = nome.zip" in versione.txt (solo un nome di file dentro la cartella della copia)
        attiva, versione = '', ''
        with open(os.path.join(m['copia'], 'versione.txt'), 'r', encoding='utf-8-sig') as h:
            for riga in h:
                riga = riga.strip()
                if riga.startswith('#') or '=' not in riga:
                    continue
                k, v = [x.strip() for x in riga.split('=', 1)]
                if k == 'attiva':
                    attiva = v
                elif k == 'versione':
                    versione = v
        if not attiva or os.path.basename(attiva) != attiva or not attiva.lower().endswith('.zip'):
            return 1, 'La copia locale della modifica non è a posto (versione.txt): non ho toccato niente. Chiama Claude.'
        zip_f = os.path.join(m['copia'], attiva)
        if not os.path.isfile(zip_f):
            return 1, 'Non trovo la copia locale della modifica (' + attiva + '): non ho toccato niente. Chiama Claude.'

        # 2. legge i tre file dallo zip (in memoria, senza scompattare altro) e li controlla con le impronte dello zip
        nuovi = {}
        with zipfile.ZipFile(zip_f) as z:
            nomi = set(z.namelist())
            somme = {}
            if 'SHA256SUMS.txt' in nomi:
                for riga in z.read('SHA256SUMS.txt').decode('utf-8', 'replace').splitlines():
                    pezzi = riga.split(None, 1)
                    if len(pezzi) == 2:
                        somme[pezzi[1].strip().lstrip('*')] = pezzi[0].lower()
            for n in m['file']:
                dentro_zip = m['dentro_zip'] + n
                if dentro_zip not in nomi or z.getinfo(dentro_zip).file_size > 200 * 1024 * 1024:
                    return 1, 'Nella copia locale manca ' + n + ': non ho toccato niente. Chiama Claude.'
                dati = z.read(dentro_zip)
                if dentro_zip in somme and somme[dentro_zip] != impronta(dati):
                    return 1, 'La copia locale è rovinata (' + n + ' non corrisponde): non ho toccato niente. Chiama Claude.'
                nuovi[n] = dati

        # 3. cosa c'e' adesso nel gioco
        dest = os.path.join(m['gioco'], m['dest'])
        if not dentro(dest, paks):
            return 1, 'Percorso non valido: non ho toccato niente.'
        presenti = sorted(os.listdir(dest)) if os.path.isdir(dest) else []
        uguali = sorted(presenti) == sorted(m['file']) and all(
            impronta_file(os.path.join(dest, n)) == impronta(nuovi[n]) for n in m['file'])
        nome_v = versione.split('(')[0].strip() or attiva
        if uguali:
            return 0, 'La modifica per giocare in due c\'è già ed è a posto (' + nome_v + ', 3 file su 3): non ho cambiato niente.'

        # 4. quello che c'era (diverso o incompleto) va da parte in BEST, fuori dalla cartella Paks del gioco
        da_parte = ''
        if presenti:
            da_parte = os.path.join(m['copia'], 'tolta_dal_gioco_' + time.strftime('%Y%m%d_%H%M%S') + '.bak')
            os.makedirs(da_parte)
            for n in presenti:
                shutil.move(os.path.join(dest, n), os.path.join(da_parte, n))
        os.makedirs(dest, exist_ok=True)
        for n in m['file']:
            with open(os.path.join(dest, n), 'wb') as h:
                h.write(nuovi[n])

        # 5. controllo finale: tutti e tre, identici alla copia
        for n in m['file']:
            f = os.path.join(dest, n)
            if not os.path.isfile(f) or impronta_file(f) != impronta(nuovi[n]):
                return 1, 'Ho copiato i file ma il controllo finale non torna (' + n + '). Chiama Claude prima di giocare in due.'
        try:
            with open(m['cronologia'], 'a', encoding='utf-8') as h:
                h.write('%s|Ripara split-screen|modifica rimessa da BEST (%s)\n' % (time.strftime('%d/%m/%Y %H:%M'), nome_v))
        except OSError:
            pass
        return 0, ('Modifica per giocare in due rimessa: ' + nome_v + ', 3 file su 3 controllati.'
                   + (' I file che c\'erano prima sono da parte in BEST (' + os.path.basename(da_parte) + ').' if da_parte else '')
                   + ' Ora puoi avviare COOP.')
    except PermissionError:
        return 1, 'Windows non mi lascia scrivere nella cartella del gioco: non ho finito. Chiama Claude.'
    finally:
        serratura_mod.release()


class Server(ThreadingHTTPServer):
    allow_reuse_address = False          # regola comune: porta in esclusiva (niente SO_REUSEADDR/SO_REUSEPORT)

    def server_bind(self):
        if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):       # solo Windows
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


if __name__ == '__main__':
    try:
        s = Server(('127.0.0.1', PORTA), Ponte)
    except OSError:
        sys.exit(0)                      # gia' acceso (o porta occupata): non ne parte un secondo
    s.serve_forever()
