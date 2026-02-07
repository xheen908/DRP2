$headers = @{ "Content-Type" = "application/json" }
$body = @{
    RE4  = 544000
    LZZ  = 2
    STKL = 1
    KVZ  = 1.6
    R    = 0
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3011/calculate" -Method Post -Body $body -Headers $headers
Write-Host "Sarah Manager (Local Check):"
Write-Host "Lohnsteuer (LSTLZZ): $($response.LSTLZZ/100)"
Write-Host "Soli (SOLZLZZ): $($response.SOLZLZZ/100)"
Write-Host "Kirchensteuer: $($response.BK/100)"
