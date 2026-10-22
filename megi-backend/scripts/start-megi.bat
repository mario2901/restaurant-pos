@echo off
chcp 65001 >nul
title Megi Dea - restoran
rem ============================================================
rem  Pokretanje programa. Stavi megi.jar i ovu skriptu u isti folder
rem  (npr. C:\megi). Baza: C:\megi\data, backupi: C:\megi\backup.
rem  Za automatsko pokretanje: precac na ovu skriptu u
rem  shell:startup  (Win+R -> shell:startup).
rem  Gasenje: zatvori ovaj prozor (ili Ctrl+C).
rem ============================================================
cd /d "%~dp0"

if not exist "megi.jar" (
  echo [!] U ovom folderu nema megi.jar
  pause
  exit /b 1
)

where java >nul 2>nul
if errorlevel 1 (
  echo [!] Java nije instalirana ili nije na PATH-u. Potrebna je Java 17 ili novija.
  pause
  exit /b 1
)

rem otvori aplikaciju u browseru kad se backend digne (~20 s)
start "" /min cmd /c "timeout /t 20 /nobreak >nul & start http://localhost:8080"

java -Dfile.encoding=UTF-8 -jar megi.jar

echo.
echo Program je zaustavljen.
pause
