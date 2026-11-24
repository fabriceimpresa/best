' BEST - accende il ponte (server.py, porta 8820) se serve e apre BEST in una finestra di Chrome senza barre.
Option Explicit
Dim sh, fso, base, url, i
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
base = fso.GetParentFolderName(WScript.ScriptFullName)
url = "http://127.0.0.1:8820/"

Function Acceso()
  On Error Resume Next
  Dim x
  Set x = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  x.setTimeouts 500, 500, 800, 800
  x.open "GET", url & "giochi.js", False
  x.send
  Acceso = (Err.Number = 0 And x.status = 200)
  On Error GoTo 0
End Function

If Not Acceso() Then
  Dim py
  py = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Python\Python313\pythonw.exe"
  If Not fso.FileExists(py) Then py = "pythonw.exe"
  sh.CurrentDirectory = base
  sh.Run """" & py & """ """ & base & "\server.py""", 0, False
  For i = 1 To 40
    WScript.Sleep 150
    If Acceso() Then Exit For
  Next
End If

Dim chrome
chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
If Not fso.FileExists(chrome) Then chrome = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
sh.Run """" & chrome & """ --app=" & url & " --window-size=1300,1000 --window-position=1910,40", 1, False
