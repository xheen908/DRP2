# Verify DRP2 Tax Engine Microservice
# Hits http://localhost:3011/calculate
# Cases: 5440, 3840, 2720 (StKl 1, 1 Child, 9% Church Tax)

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$salaries = @(5440, 3840, 2720)
$url = "http://localhost:3011/calculate"

function Test-Salary-Service ($brutto) {
    # Payload matches main.cpp expectation
    $payload = @{
        "RE4"  = $brutto * 100
        "LZZ"  = 2
        "STKL" = 1
        "ZKF"  = 1.0
        "R"    = 9.0
        "KVZ"  = 1.6
        "PVZ"  = 0
        "PVS"  = 0
        "PKV"  = 0
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType "application/json"
        
        $lohnsteuer = $response.LSTLZZ / 100.0
        $soli = $response.SOLZLZZ / 100.0
        # KiSt in C++ response is not calculated directly as tax amount, but as BK (Base).
        # We need to calculate 9% of BK.
        # Wait, usually the API returns the tax amount if it's part of the calc?
        # Lohnsteuer2026.hpp output: BK, BKS. 
        # The engine returns BK. Client must calculate Tax = BK * R / 100.
        
        $bk = $response.BK / 100.0
        $kist = $bk * 0.09
        
        Write-Host "--------------------------------------------------" -ForegroundColor Cyan
        Write-Host ("Brutto:          {0,10:N2} EUR" -f $brutto)
        Write-Host "--------------------------------------------------"
        Write-Host ("Lohnsteuer:      {0,10:N2} EUR" -f $lohnsteuer)
        Write-Host ("Soli:            {0,10:N2} EUR" -f $soli)
        Write-Host ("Kirchensteuer:   {0,10:N2} EUR" -f $kist)
        Write-Host ("(Basis BK:       {0,10:N2} EUR)" -f $bk)
        Write-Host "--------------------------------------------------"
    }
    catch {
        Write-Host "Error connecting to service: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Testing DRP2 Tax Engine at $url" -ForegroundColor Yellow
foreach ($s in $salaries) {
    Test-Salary-Service $s
}
