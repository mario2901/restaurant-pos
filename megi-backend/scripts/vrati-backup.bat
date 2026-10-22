@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Megi - vracanje backupa baze

rem ============================================================
rem  Vraca bazu iz backupa (C:\megi\backup\megi-*.zip).
rem  1) backend MORA biti ugasen
rem  2) trenutna baza se NE brise - preimenuje se u megi-prije-vracanja-<vrijeme>.mv.db
rem  3) odabrani zip se raspakira u C:\megi\data
rem  Nakon toga ponovno pokreni backend.
rem ============================================================

set "DATA=C:\megi\data"
set "BACKUP=C:\megi\backup"

if not "%MEGI_DB_PATH%"=="" (
  echo Napomena: postavljen je MEGI_DB_PATH=%MEGI_DB_PATH%
  echo Ova skripta radi samo s C:\megi\data - prilagodi DATA na vrhu skripte.
  pause
  exit /b 1
)

echo.
echo  VRACANJE BACKUPA BAZE
echo  =====================
echo.

rem Upaljen program = netko slusa na 8080 (sam megi.lock.db ostane i nakon
rem nestanka struje / naglog gasenja, pa nije dokaz da program radi).
netstat -ano | findstr /r /c:":8080 .*LISTENING" >nul
if not errorlevel 1 (
  echo [!] Program je upaljen ^(port 8080 je zauzet^). Zatvori ga pa pokreni skriptu ponovno.
  pause
  exit /b 1
)
if exist "%DATA%\megi.lock.db" del /q "%DATA%\megi.lock.db"

if not exist "%BACKUP%\megi-*.zip" (
  echo [!] U %BACKUP% nema backupa.
  pause
  exit /b 1
)

echo Dostupni backupi ^(najnoviji na dnu^):
echo.
set /a N=0
for /f "delims=" %%F in ('dir /b /o:d "%BACKUP%\megi-*.zip"') do (
  set /a N+=1
  call echo   %%N%%^) %%F
  call set "FILE_%%N%%=%%F"
)
echo.
set /p "IZBOR=Upisi broj backupa za vracanje (Enter = odustani): "
if "%IZBOR%"=="" exit /b 0
call set "ZIP=%%FILE_%IZBOR%%%"
if "%ZIP%"=="" (
  echo [!] Neispravan izbor.
  pause
  exit /b 1
)

echo.
echo Vratit ce se: %ZIP%
echo Trenutna baza ce se sacuvati kao megi-prije-vracanja-*.mv.db
set /p "OK=Sigurno? (da/ne): "
if /i not "%OK%"=="da" exit /b 0

for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "TS=%%T"

if not exist "%DATA%" mkdir "%DATA%"
if exist "%DATA%\megi.mv.db" (
  ren "%DATA%\megi.mv.db" "megi-prije-vracanja-%TS%.mv.db" || (
    echo [!] Ne mogu preimenovati trenutnu bazu - je li backend stvarno ugasen?
    pause
    exit /b 1
  )
)

powershell -NoProfile -Command "Expand-Archive -LiteralPath '%BACKUP%\%ZIP%' -DestinationPath '%DATA%' -Force"
if errorlevel 1 (
  echo [!] Raspakiravanje nije uspjelo. Vracam staru bazu.
  if exist "%DATA%\megi-prije-vracanja-%TS%.mv.db" ren "%DATA%\megi-prije-vracanja-%TS%.mv.db" "megi.mv.db"
  pause
  exit /b 1
)

if not exist "%DATA%\megi.mv.db" (
  echo [!] U zipu nije bilo megi.mv.db. Vracam staru bazu.
  if exist "%DATA%\megi-prije-vracanja-%TS%.mv.db" ren "%DATA%\megi-prije-vracanja-%TS%.mv.db" "megi.mv.db"
  pause
  exit /b 1
)

echo.
echo [OK] Baza vracena iz %ZIP%.
echo      Stara baza: %DATA%\megi-prije-vracanja-%TS%.mv.db
echo      Sada pokreni backend.
pause
