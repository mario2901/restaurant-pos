# Promjena IP adrese Datecs EP-2000 (ESC y LAN, Programmer's Manual str. 45)
# Primjer: powershell -ExecutionPolicy Bypass -File .\datecs-ip.ps1 -NewIp 192.168.123.201 -Gateway 192.168.123.1
param(
    [string]$PrinterIp = "192.168.123.123",
    [Parameter(Mandatory = $true)][string]$NewIp,
    [Parameter(Mandatory = $true)][string]$Gateway,
    [string]$Mask = "255.255.255.0",
    [int]$Port = 9100
)

# "192.168.1.201" -> "C0A801C9" (8 heksadecimalnih znakova)
function To-Hex([string]$ip) {
    ($ip.Split('.') | ForEach-Object { '{0:X2}' -f [int]$_ }) -join ''
}

$cmd = New-Object System.Collections.Generic.List[byte]
$cmd.AddRange([byte[]](0x1B, 0x79, 0x4C, 0x41, 0x4E, 0x3A))   # ESC y "LAN:"
$cmd.Add(0x01); $cmd.AddRange([Text.Encoding]::ASCII.GetBytes((To-Hex $NewIp)))
$cmd.Add(0x02); $cmd.AddRange([Text.Encoding]::ASCII.GetBytes((To-Hex $Mask)))
$cmd.Add(0x03); $cmd.AddRange([Text.Encoding]::ASCII.GetBytes((To-Hex $Gateway)))
$cmd.Add(0x00)                                                 # kraj

try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect($PrinterIp, $Port)
    $stream = $client.GetStream()
    $stream.Write($cmd.ToArray(), 0, $cmd.Count)
    $stream.Flush()
    Start-Sleep -Milliseconds 800
    $client.Close()
    Write-Host "Poslano: $PrinterIp -> $NewIp (gw $Gateway). Ugasi/upali printer i provjeri: ping $NewIp" -ForegroundColor Green
}
catch {
    Write-Host "NIJE POSLANO: printer na ${PrinterIp}:$Port ne odgovara. Provjeri kabel, lampice i 'ping $PrinterIp'." -ForegroundColor Red
    exit 1
}
