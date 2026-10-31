Add-Type -AssemblyName System.Windows.Forms

$line = netstat -ano | Select-String -Pattern "LISTENING" | Select-String -Pattern ":8080\s" | Select-Object -First 1

if ($line) {
    $procId = ($line -split '\s+')[-1]
    Stop-Process -Id $procId -Force
    [System.Windows.Forms.MessageBox]::Show(
        "Servidor detenido. El puerto 8080 ya no esta activo.",
        "Els Panets"
    ) | Out-Null
} else {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList "serve.js" -WorkingDirectory $scriptDir
    Start-Sleep -Seconds 1

    $ips = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
        Where-Object { $_.AddressFamily -eq "InterNetwork" -and $_.ToString() -ne "127.0.0.1" } |
        ForEach-Object { $_.ToString() }

    $msg = "Servidor iniciado.`n`nAbre en tu movil (misma WiFi):`n"
    foreach ($ip in $ips) { $msg += "http://${ip}:8080`n" }
    $msg += "`nEn este PC: http://localhost:8080"

    [System.Windows.Forms.MessageBox]::Show($msg, "Els Panets") | Out-Null
}
