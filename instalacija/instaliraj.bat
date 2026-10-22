@echo off
rem Instalacija / nadogradnja programa Megi jednim klikom.
rem Trazi administratorska prava (vatrozid, precaci, printer).
net session >nul 2>&1
if errorlevel 1 (
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instaliraj.ps1"
pause
