# Test family products API

Write-Host "Testing family products API..." -ForegroundColor Green

# Test GET endpoint first
Write-Host "1. Testing GET /api/product/familyProducts" -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/product/familyProducts" -Method GET -ContentType "application/json"
    Write-Host "GET Response:" -ForegroundColor Cyan
    $getResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "GET Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`n2. Testing POST /api/product/familyProducts" -ForegroundColor Yellow

# Test POST endpoint
$testData = @{
    group_name = "Test Family"
    parent_group_id = $null
    marked_as_root = 1
} | ConvertTo-Json

try {
    $postResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/product/familyProducts" -Method POST -ContentType "application/json" -Body $testData
    Write-Host "POST Response:" -ForegroundColor Green
    $postResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "POST Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n3. Testing GET again to see if family was created" -ForegroundColor Yellow
try {
    $getResponse2 = Invoke-RestMethod -Uri "http://localhost:5000/api/product/familyProducts" -Method GET -ContentType "application/json"
    Write-Host "GET Response after POST:" -ForegroundColor Cyan
    $getResponse2 | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Second GET Error: $($_.Exception.Message)" -ForegroundColor Red
}
