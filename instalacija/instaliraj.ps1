# ============================================================
#  Megi Dea — instalacija / nadogradnja (pokreće instaliraj.bat kao administrator)
#
#  Prvi put: instalira program, kreira C:\megi\data i C:\megi\backup,
#            prebaci bazu iz paketa (ako postoji), vatrozid, prečace.
#  Nadogradnja: zamijeni samo program — baza, backupi i postavke ostaju.
#
#  Java NIJE potrebna — ugrađena je u paket (Megi\runtime).
# ============================================================
$ErrorActionPreference = 'Stop'
$Pkg     = $PSScriptRoot
$Base    = 'C:\megi'
$AppDir  = Join-Path $Base 'app'
$DataDir = Join-Path $Base 'data'
$Exe     = Join-Path $AppDir 'Megi\Megi.exe'
$Port    = 8080

function Step($text) { Write-Host ""; Write-Host "== $text" -ForegroundColor Cyan }
function Ok($text)   { Write-Host "   OK  $text" -ForegroundColor Green }
function Warn($text) { Write-Host "   !   $text" -ForegroundColor Yellow }
function Ask($question, $default = 'da') {
    $hint = if ($default -eq 'da') { '[DA/ne]' } else { '[da/NE]' }
    $a = Read-Host "   $question $hint"
    if ([string]::IsNullOrWhiteSpace($a)) { $a = $default }
    return $a.Trim().ToLower().StartsWith('d')
}
function New-Shortcut($path, $target, $arguments = '', $minimized = $false, $workDir = $null) {
    $sh = New-Object -ComObject WScript.Shell
    $lnk = $sh.CreateShortcut($path)
    $lnk.TargetPath = $target
    if ($arguments) { $lnk.Arguments = $arguments }
    if ($workDir) { $lnk.WorkingDirectory = $workDir }
    if ($minimized) { $lnk.WindowStyle = 7 }
    $lnk.Save()
}

try {
    Write-Host "MEGI DEA - instalacija" -ForegroundColor White

    if (-not (Test-Path (Join-Path $Pkg 'Megi\Megi.exe'))) {
        throw "U paketu nema Megi\Megi.exe - raspakiraj cijeli zip pa pokreni instaliraj.bat iz njega."
    }

    # ---------- 1) zaustavi program ako radi (nadogradnja) ----------
    Step "Provjera radi li program"
    $running = Get-Process -Name 'Megi' -ErrorAction SilentlyContinue
    if ($running) {
        Warn "Program trenutno radi."
        if (-not (Ask "Zaustaviti ga za nadogradnju? (ne radi usred posla)")) { throw "Prekinuto." }
        $running | Stop-Process -Force
        Start-Sleep -Seconds 3
        Ok "Zaustavljen"
    } else { Ok "Ne radi" }

    # ---------- 2) program ----------
    Step "Kopiranje programa u $AppDir"
    New-Item -ItemType Directory -Force -Path $Base, $DataDir, (Join-Path $Base 'backup'), (Join-Path $Base 'logs') | Out-Null
    if (Test-Path (Join-Path $AppDir 'Megi')) { Remove-Item -Recurse -Force (Join-Path $AppDir 'Megi') }
    New-Item -ItemType Directory -Force -Path $AppDir | Out-Null
    Copy-Item -Recurse -Force (Join-Path $Pkg 'Megi') $AppDir
    Copy-Item -Force (Join-Path $Pkg 'vrati-backup.bat') $Base
    if (Test-Path (Join-Path $Pkg 'UPUTE.txt')) { Copy-Item -Force (Join-Path $Pkg 'UPUTE.txt') $Base }
    Get-ChildItem -Recurse $AppDir -File | Unblock-File -ErrorAction SilentlyContinue
    Ok "Program instaliran"

    # ---------- 3) baza ----------
    Step "Baza podataka"
    $dbTarget = Join-Path $DataDir 'megi.mv.db'
    $dbPkg    = Join-Path $Pkg 'data\megi.mv.db'
    if (Test-Path $dbTarget) {
        Ok "Postojeća baza ostaje ($dbTarget)"
    } elseif (Test-Path $dbPkg) {
        Copy-Item $dbPkg $dbTarget
        Ok "Baza iz paketa prebačena (meni, konobari, postavke)"
    } else {
        Warn "Nema baze - program kreće s praznom bazom (meni i konobare treba unijeti u Adminu)."
    }

    # ---------- 4) vatrozid ----------
    Step "Vatrozid (tableti pristupaju na port $Port)"
    Get-NetFirewallRule -DisplayName 'Megi Dea' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
    New-NetFirewallRule -DisplayName 'Megi Dea' -Direction Inbound -Protocol TCP -LocalPort $Port `
        -Action Allow -Profile Private,Domain | Out-Null
    Ok "Port $Port otvoren za privatnu mrežu"

    $public = Get-NetConnectionProfile | Where-Object { $_.NetworkCategory -eq 'Public' }
    if ($public) {
        Warn ("Mreža '" + ($public.Name -join ', ') + "' je postavljena kao JAVNA - tableti se tada ne mogu spojiti.")
        if (Ask "Postaviti je kao privatnu (preporučeno za Wi-Fi restorana)?") {
            $public | Set-NetConnectionProfile -NetworkCategory Private
            Ok "Mreža postavljena kao privatna"
        }
    }

    # ---------- 5) prečaci ----------
    Step "Prečaci"
    $desktop = [Environment]::GetFolderPath('CommonDesktopDirectory')
    New-Shortcut (Join-Path $desktop 'Megi - pokreni.lnk') $Exe '' $true (Split-Path $Exe)
    $url = Join-Path $desktop 'Megi - otvori.url'
    Set-Content -Path $url -Encoding ASCII -Value "[InternetShortcut]`r`nURL=http://localhost:$Port/"
    Ok "Na radnoj površini: 'Megi - pokreni' i 'Megi - otvori'"

    $startup = [Environment]::GetFolderPath('CommonStartup')
    $autoLnk = Join-Path $startup 'Megi.lnk'
    if (Ask "Pokretati program automatski kad se upali računalo?") {
        New-Shortcut $autoLnk $Exe '' $true (Split-Path $Exe)
        Ok "Automatsko pokretanje uključeno"
    } elseif (Test-Path $autoLnk) { Remove-Item $autoLnk }

    # ---------- 6) spavanje ----------
    Step "Napajanje"
    if (Ask "Isključiti spavanje računala dok je na struji? (inače tableti gube vezu)") {
        powercfg /change standby-timeout-ac 0 | Out-Null
        powercfg /change hibernate-timeout-ac 0 | Out-Null
        Ok "Računalo neće ići na spavanje (zaslon se i dalje gasi)"
    }

    # ---------- 7) printer šanka (USB) ----------
    Step "Printer šanka (USB)"
    $barName = 'SANK'
    if (Get-Printer -Name $barName -ErrorAction SilentlyContinue) {
        Ok "Printer '$barName' postoji"
    } else {
        $usb = Get-PrinterPort | Where-Object { $_.Name -like 'USB*' } | Select-Object -ExpandProperty Name
        if ($usb.Count -eq 1 -and (Ask "Napraviti printer '$barName' na portu $usb (Generic / Text Only)?")) {
            try {
                Add-PrinterDriver -Name 'Generic / Text Only' -ErrorAction SilentlyContinue
                Add-Printer -Name $barName -DriverName 'Generic / Text Only' -PortName $usb
                Ok "Printer '$barName' dodan na $usb"
            } catch { Warn "Nije uspjelo: $($_.Exception.Message)" }
        } elseif ($usb.Count -gt 1) {
            Warn ("Više USB portova (" + ($usb -join ', ') + ") - dodaj printer ručno (driver 'Generic / Text Only') i odaberi ga u Admin -> Postavke -> Postavke printera.")
        } else {
            Warn "Printer šanka nije spojen ili nije uključen. Spoji ga, pa ga odaberi u Admin -> Postavke -> Postavke printera."
        }
    }

    # ---------- 8) adresa za tablete ----------
    Step "Adresa za tablete"
    $ips = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
        Select-Object -ExpandProperty IPAddress
    $lines = $ips | ForEach-Object { "http://$($_):$Port" }
    $lines | Set-Content -Encoding UTF8 (Join-Path $Base 'adresa-za-tablete.txt')
    $lines | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    Warn "Ako se adresa promijeni (router), tableti je trebaju ponovno upisati - najbolje u routeru zadati fiksnu IP adresu ovom računalu."

    # ---------- 9) pokretanje ----------
    Step "Pokretanje"
    Start-Process -FilePath $Exe -WorkingDirectory (Split-Path $Exe) -WindowStyle Minimized
    Write-Host "   Program se pokreće (prozor je smanjen na traku). Za ~20 s otvara se u browseru..."
    Start-Sleep -Seconds 20
    Start-Process "http://localhost:$Port/"

    Write-Host ""
    Write-Host "INSTALACIJA ZAVRŠENA" -ForegroundColor Green
    Write-Host "Gašenje programa: zatvori njegov prozor na traci. Upute: $Base\UPUTE.txt"
}
catch {
    Write-Host ""
    Write-Host "GREŠKA: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Instalacija nije završena."
}
