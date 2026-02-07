$body = @{
    RE4  = 5000000
    STKL = 1
    LZZ  = 2
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3011/calculate" -Method Post -Body $body -ContentType "application/json"
$response
