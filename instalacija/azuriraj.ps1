# Azuriranje Megija u restoranu: zamjenjuje samo megi.jar.
# Podaci (C:\megi\data), Java i postavke se ne diraju.
$ErrorActionPreference = 'Stop'

$noviJar = Join-Path $PSScriptRoot 'megi.jar'
if (-not (Test-Path $noviJar)) {
    Write-Host "Nema megi.jar pored skripte!" -ForegroundColor Red
    exit 1
}

# pronadji instalirani jar (preskoci stare kopije u backup folderima)
$stariJar = Get-ChildItem 'C:\megi' -Recurse -Filter 'megi.jar' -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch '\\backup' -and $_.FullName -ne $noviJar } |
            Select-Object -First 1
if (-not $stariJar) {
    Write-Host "Megi nije pronadjen u C:\megi - prvo pokreni instaliraj.bat" -ForegroundColor Red
    exit 1
}
$exe = Join-Path $stariJar.Directory.Parent.FullName 'Megi.exe'
Write-Host "Instalacija: $($stariJar.FullName)" -ForegroundColor Cyan

# 1. ugasi Megi
Write-Host "Gasim Megi..."
Get-Process -Name 'Megi' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 4

# 2. backup starog jara i baze
$stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm'
$bak = "C:\megi\backup-update\$stamp"
New-Item -ItemType Directory -Path $bak -Force | Out-Null
Copy-Item $stariJar.FullName $bak
if (Test-Path 'C:\megi\data') { Copy-Item 'C:\megi\data' "$bak\data" -Recurse }
Write-Host "Backup spremljen u $bak" -ForegroundColor Green

# 3. zamijeni jar
Copy-Item $noviJar $stariJar.FullName -Force
Write-Host "Novi megi.jar postavljen." -ForegroundColor Green

# 4. pokreni Megi
if (Test-Path $exe) {
    Start-Process $exe
    Write-Host "Megi pokrenut. Pricekaj ~30 s pa otvori 'Megi - Otvori'." -ForegroundColor Green
} else {
    Write-Host "Megi.exe nije pronadjen - pokreni 'Megi - Pokreni' rucno." -ForegroundColor Yellow
}
Write-Host "Ako novi jar ne radi: ugasi Megi i vrati megi.jar iz $bak" -ForegroundColor Gray
