$headers = @{ "Content-Type" = "application/json" }
$body = @{
    RE4  = 544000 # 5440.00 Euro in Cent
    STKL = 1
    LZZ  = 2 # Monat
    R    = 8.0 # Kirchensteuer default in controller
    KVZ  = 1.6 # Zusatzbeitrag default in controller
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3011/calculate" -Method Post -Body $body -Headers $headers
$response

Write-Host "---"

$body2 = @{
    RE4  = 384000 # 3840.00 Euro in Cent
    STKL = 1
    LZZ  = 2
} | ConvertTo-Json
$response2 = Invoke-RestMethod -Uri "http://localhost:3011/calculate" -Method Post -Body $body2 -Headers $headers
$response2
