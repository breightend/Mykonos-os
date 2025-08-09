# Test de API de ventas con PowerShell
# Crear una venta simple para probar el endpoint

$url = "http://localhost:5000/api/sales/create-sale"
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    products = @(
        @{
            product_id = 1
            variant_id = 1
            product_name = "Test Product"
            size_name = "M"
            color_name = "Red"
            price = 50.0
            quantity = 1
            variant_barcode = "TEST001"
        }
    )
    payments = @(
        @{
            method = "Efectivo"
            amount = 50.0
        }
    )
    total = 50.0
    storage_id = 1
    employee_id = 1
    cashier_user_id = 1
} | ConvertTo-Json -Depth 4

Write-Host "🔍 Probando API de ventas..." -ForegroundColor Yellow
Write-Host "📍 URL: $url" -ForegroundColor Cyan
Write-Host "📦 Payload:" -ForegroundColor Cyan
Write-Host $body -ForegroundColor Gray
Write-Host "=" * 50 -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -Headers $headers -ErrorAction Stop
    Write-Host "✅ ¡ÉXITO! Venta creada correctamente" -ForegroundColor Green
    Write-Host "📄 Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR en la creación de venta" -ForegroundColor Red
    Write-Host "📊 Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "📄 Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Intentar obtener más detalles del error
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "🔥 Detalles del error: $responseBody" -ForegroundColor Red
    } catch {
        Write-Host "No se pudieron obtener detalles adicionales del error" -ForegroundColor Yellow
    }
}

Write-Host "🏁 Test completado" -ForegroundColor Cyan
