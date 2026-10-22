@echo off
rem Azuriranje Megija: zamijeni samo megi.jar (baza, backupi i postavke ostaju).
rem megi.jar mora biti u istom folderu kao ova skripta.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0azuriraj.ps1"
pause
