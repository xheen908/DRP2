# 1. Login to get token
$loginBody = @{
    email    = "admin@drp2.de"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $userId = $loginResponse.user.id
    Write-Host "Login successful. User ID: $userId"
}
catch {
    Write-Error "Login failed: $_"
    exit 1
}

# 2. Create Payroll Run
$createRunBody = @{
    month           = 5
    year            = 2026
    createdByUserId = $userId
    employeeIds     = @(1, 2) # Assuming these exist
} | ConvertTo-Json

$headers = @{
    Authorization  = "Bearer $token"
    "X-User-ID"    = "$userId"
    "X-User-Roles" = "admin"
}

try {
    $runResponse = Invoke-RestMethod -Uri "http://localhost:3009/api/payroll/runs" -Method Post -Body $createRunBody -ContentType "application/json" -Headers $headers
    $runId = $runResponse.id
    Write-Host "Payroll Run created. ID: $runId"
}
catch {
    Write-Error "Create Run failed: $_"
    exit 1
}

# 3. Calculate Payroll Run
try {
    Invoke-RestMethod -Uri "http://localhost:3009/api/payroll/runs/$runId/calculate" -Method Post -Headers $headers
    Write-Host "Payroll Run calculated."
}
catch {
    Write-Error "Calculate Run failed: $_"
    exit 1
}

# 4. Check Logs (simulated by user checking docker logs)
Write-Host "Please check 'docker logs drp_payroll_service' to see if Tax Engine was called."
