param([string]$Ip = "192.168.123.201")

function Send([byte[]]$data) {
    $c = New-Object System.Net.Sockets.TcpClient
    $c.Connect($Ip, 9100)
    $s = $c.GetStream(); $s.Write($data, 0, $data.Length); $s.Flush()
    Start-Sleep -Milliseconds 800; $c.Close()
}
function T([string]$t) { [Text.Encoding]::ASCII.GetBytes("$t`n`n`n`n`n") }

Send ((T "TEST 1: GS V 1")   + [byte[]](0x1D,0x56,0x01));      Start-Sleep 3
Send ((T "TEST 2: GS V 0")   + [byte[]](0x1D,0x56,0x00));      Start-Sleep 3
Send ((T "TEST 3: ESC i")    + [byte[]](0x1B,0x69));           Start-Sleep 3
Send ((T "TEST 4: ESC m")    + [byte[]](0x1B,0x6D));           Start-Sleep 3
Send ((T "TEST 5: GS V 66")  + [byte[]](0x1D,0x56,0x42,0x00))