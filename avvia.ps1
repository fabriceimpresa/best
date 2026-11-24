# BEST - rimette una configurazione provata e avvia il gioco da Steam.
# Lo usa l'app BEST.hta. Uscita: 0 = fatto, 2 = gioco aperto, 1 = errore.
param(
  [string]$Fonte = '',          # file buono in giochi\<gioco>\ (vuoto = non cambiare niente, solo avvio)
  [string]$Dest,                # file impostazioni del gioco (accetta %LOCALAPPDATA%)
  [string]$Processi,            # nomi processi separati da virgola
  [string]$Steam,               # AppID Steam
  [string]$Nome,                # nome del profilo (per la cronologia)
  [string]$Cronologia           # file cronologia.txt del gioco
)
$ErrorActionPreference = 'Stop'
try {
  $nomi = $Processi -split ',' | Where-Object { $_ }
  if ($nomi -and (Get-Process -Name $nomi -ErrorAction SilentlyContinue)) { exit 2 }

  if ($Fonte) {
    $Dest = [Environment]::ExpandEnvironmentVariables($Dest)
    if (-not (Test-Path $Fonte)) { exit 1 }
    if (Test-Path $Dest) {
      $uguale = (Get-FileHash $Fonte).Hash -eq (Get-FileHash $Dest).Hash
      if (-not $uguale) {
        Copy-Item $Dest ("$Dest.prima_di_BEST_{0}.bak" -f (Get-Date -Format 'yyyyMMdd_HHmmss'))
      }
    }
    Copy-Item $Fonte $Dest -Force
  }
  if ($Cronologia) {
    $cosa = if ($Nome) { $Nome } else { '(senza cambiare)' }
    Add-Content -Path $Cronologia -Value ("{0}|{1}|avviato da BEST" -f (Get-Date -Format 'dd/MM/yyyy HH:mm'), $cosa) -Encoding UTF8
  }

  if ($Steam) { Start-Process "steam://rungameid/$Steam" }
  exit 0
} catch { exit 1 }
