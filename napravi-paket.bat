@echo off
setlocal EnableExtensions
title Megi - izrada instalacijskog paketa
rem ============================================================
rem  Pokreni na RAZVOJNOM racunalu (tvom). Napravi:
rem    paket\Megi\           program + ugradjena Java (nista ne treba instalirati)
rem    paket\instaliraj.bat  instalacija jednim klikom u restoranu
rem    Megi-paket.zip        sve zajedno, za USB
rem  Potrebno: Node.js (npm) i JDK 17+ (jpackage je dio JDK-a; IntelliJ JDK je dovoljan).
rem ============================================================
cd /d "%~dp0"
set "ROOT=%CD%"

echo.
echo [1/5] Frontend build...
pushd "%ROOT%\megi-frontend"
if not exist node_modules (
  call npm ci || goto :fail
)
call npm run build || goto :fail
popd

echo.
echo [2/5] Backend build + testovi + JAR...
pushd "%ROOT%\megi-backend"
call gradlew.bat clean build || goto :fail
popd
if not exist "%ROOT%\megi-backend\build\libs\megi.jar" (
  echo [!] Nema megi-backend\build\libs\megi.jar
  goto :fail
)

echo.
echo [3/5] Trazim jpackage...
set "JPACKAGE="
where jpackage >nul 2>nul && set "JPACKAGE=jpackage"
if not defined JPACKAGE if defined JAVA_HOME if exist "%JAVA_HOME%\bin\jpackage.exe" set "JPACKAGE=%JAVA_HOME%\bin\jpackage.exe"
if not defined JPACKAGE (
  for /d %%D in ("%USERPROFILE%\.jdks\*") do if exist "%%D\bin\jpackage.exe" set "JPACKAGE=%%D\bin\jpackage.exe"
)
if not defined JPACKAGE (
  echo [!] jpackage nije pronadjen. Instaliraj JDK 17+ ili postavi JAVA_HOME.
  goto :fail
)
echo     %JPACKAGE%

echo.
echo [4/5] Pakiram program s ugradjenom Javom...
if exist "%ROOT%\paket" rmdir /s /q "%ROOT%\paket"
mkdir "%ROOT%\paket"
"%JPACKAGE%" --type app-image --name Megi --app-version 1.0.0 ^
  --vendor "Megi Dea" --description "Megi Dea - narudzbe" ^
  --input "%ROOT%\megi-backend\build\libs" --main-jar megi.jar ^
  --java-options "-Dfile.encoding=UTF-8" ^
  --win-console --dest "%ROOT%\paket" || goto :fail

copy /y "%ROOT%\instalacija\instaliraj.bat" "%ROOT%\paket\" >nul
copy /y "%ROOT%\instalacija\instaliraj.ps1" "%ROOT%\paket\" >nul
copy /y "%ROOT%\instalacija\UPUTE.txt" "%ROOT%\paket\" >nul
copy /y "%ROOT%\megi-backend\scripts\vrati-backup.bat" "%ROOT%\paket\" >nul

echo.
set "DB=C:\megi\data\megi.mv.db"
if exist "%DB%" (
  set /p "WITHDB=Ukljuciti trenutnu bazu (meni, konobari, postavke) u paket? Backend MORA biti ugasen. (da/ne): "
) else (
  set "WITHDB=ne"
)
if /i "%WITHDB%"=="da" (
  rem Upaljen backend = netko slusa na 8080. Sam lock file nije dokaz: kad IntelliJ
  rem "Stop" ubije proces, H2 ne stigne obrisati megi.lock.db pa on ostane.
  netstat -ano | findstr /r /c:":8080 .*LISTENING" >nul
  if not errorlevel 1 (
    echo [!] Backend je upaljen ^(port 8080 je zauzet^). Ugasi ga i pokreni ponovno.
    goto :fail
  )
  if exist "C:\megi\data\megi.lock.db" del /q "C:\megi\data\megi.lock.db"
  mkdir "%ROOT%\paket\data"
  copy /y "%DB%" "%ROOT%\paket\data\megi.mv.db" >nul || goto :fail
  echo     Baza ukljucena.
)

echo.
echo     Folder za azuriranje (samo novi jar + skripte)...
if exist "%ROOT%\azuriranje" rmdir /s /q "%ROOT%\azuriranje"
mkdir "%ROOT%\azuriranje"
copy /y "%ROOT%\megi-backend\build\libs\megi.jar" "%ROOT%\azuriranje\" >nul || goto :fail
copy /y "%ROOT%\instalacija\azuriraj.bat" "%ROOT%\azuriranje\" >nul
copy /y "%ROOT%\instalacija\azuriraj.ps1" "%ROOT%\azuriranje\" >nul

echo.
echo [5/5] Zip za USB...
if exist "%ROOT%\Megi-paket.zip" del /q "%ROOT%\Megi-paket.zip"
powershell -NoProfile -Command "Compress-Archive -Path '%ROOT%\paket\*' -DestinationPath '%ROOT%\Megi-paket.zip'" || goto :fail

echo.
echo ============================================================
echo  GOTOVO: %ROOT%\Megi-paket.zip
echo  U restoranu: raspakiraj i pokreni instaliraj.bat
echo  Azuriranje postojece instalacije: %ROOT%\azuriranje\
echo    (kopiraj folder u restoran i pokreni azuriraj.bat)
echo ============================================================
pause
exit /b 0

:fail
echo.
echo [!] Izrada paketa NIJE uspjela - pogledaj poruku iznad.
pause
exit /b 1
