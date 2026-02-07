$headers = @{ "Content-Type" = "application/json" }

function Test-Tax ($re4, $kvz) {
    $body = @{
        RE4  = $re4
        STKL = 1
        LZZ  = 2
        R    = 8.0
        KVZ  = $kvz
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3011/calculate" -Method Post -Body $body -Headers $headers
    Write-Host "RE4: $($re4/100) | KVZ: $kvz | Lohnsteuer: $($response.LSTLZZ/100)"
}

Write-Host "--- Testing Variations ---"
Test-Tax 384000 1.6
Test-Tax 384000 1.7
Test-Tax 386000 1.6  # With 20 Euro Jobticket?
Test-Tax 386000 1.7
Test-Tax 4608000 1.6 # Annual?
