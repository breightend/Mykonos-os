# Test script to verify stock update synchronization

Write-Host "Testing stock update synchronization..." -ForegroundColor Green

# First, get current product details
Write-Host "Getting current product details..." -ForegroundColor Yellow
$response1 = Invoke-RestMethod -Uri "http://localhost:5000/api/inventory/product-details/3" -Method GET -ContentType "application/json"
Write-Host "Current stock_total: $($response1.data.stock_total)" -ForegroundColor Cyan
Write-Host "Current variants:" -ForegroundColor Cyan
foreach ($variant in $response1.data.stock_variants) {
    Write-Host "  - Size: $($variant.size_name), Color: $($variant.color_name), Quantity: $($variant.quantity)" -ForegroundColor White
}

# Update variants with new quantities
Write-Host "`nUpdating stock variants..." -ForegroundColor Yellow
$updateData = @{
    stock_variants = @(
        @{
            size_id = 2
            color_id = 3
            sucursal_id = 1
            quantity = 20
            is_new = $false
        },
        @{
            size_id = 3
            color_id = 4
            sucursal_id = 1
            quantity = 10
            is_new = $false
        }
    )
} | ConvertTo-Json -Depth 3

$response2 = Invoke-RestMethod -Uri "http://localhost:5000/api/inventory/products/3" -Method PUT -ContentType "application/json" -Body $updateData
Write-Host "Update response: $($response2.message)" -ForegroundColor Green

# Get updated product details
Write-Host "`nGetting updated product details..." -ForegroundColor Yellow
$response3 = Invoke-RestMethod -Uri "http://localhost:5000/api/inventory/product-details/3" -Method GET -ContentType "application/json"
Write-Host "New stock_total: $($response3.data.stock_total)" -ForegroundColor Cyan
Write-Host "New variants:" -ForegroundColor Cyan
foreach ($variant in $response3.data.stock_variants) {
    Write-Host "  - Size: $($variant.size_name), Color: $($variant.color_name), Quantity: $($variant.quantity)" -ForegroundColor White
}

# Check if synchronization worked
$expectedTotal = 30 # 20 + 10
if ($response3.data.stock_total -eq $expectedTotal) {
    Write-Host "`nSUCCESS: Stock synchronization is working! Expected $expectedTotal, got $($response3.data.stock_total)" -ForegroundColor Green
} else {
    Write-Host "`nFAILED: Stock synchronization issue. Expected $expectedTotal, got $($response3.data.stock_total)" -ForegroundColor Red
}
