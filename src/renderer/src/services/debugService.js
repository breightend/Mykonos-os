// Servicio de debugging para comparar backend vs frontend
class DebugService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api'
  }

  async debugVariantBarcodes() {
    try {
      console.log('🔍 DEBUGGING: Iniciando comparación backend vs frontend')

      // 1. Llamar al endpoint de debugging del backend
      const debugResponse = await fetch(`${this.baseURL}/debug/variant-barcodes`)
      const debugData = await debugResponse.json()

      console.log('📊 DATOS DEL BACKEND (debug endpoint):', debugData)

      if (debugData.status === 'success') {
        // 2. Mostrar estadísticas
        console.log('📈 ESTADÍSTICAS DE LA BASE DE DATOS:')
        console.log('   Total variantes:', debugData.statistics.total_variants)
        console.log('   Códigos NULL:', debugData.statistics.null_barcodes)
        console.log('   Códigos vacíos:', debugData.statistics.empty_barcodes)
        console.log('   Códigos válidos:', debugData.statistics.valid_barcodes)

        // 3. Mostrar datos de ejemplo
        if (debugData.sample_product_data) {
          console.log('\n📦 DATOS DE EJEMPLO DEL PRODUCTO:', debugData.sample_product_data.product_id)
          console.log('   Variantes encontradas:', debugData.sample_product_data.variants_count)

          debugData.sample_product_data.sample_variants.forEach((variant, index) => {
            console.log(`\n   Variante ${index + 1}:`)
            console.log('     ID:', variant.id)
            console.log('     Talle:', variant.size_name)
            console.log('     Color:', variant.color_name)
            console.log('     Sucursal:', variant.sucursal_nombre)
            console.log('     Cantidad:', variant.quantity)
            console.log('     VARIANT_BARCODE:', variant.variant_barcode, `(tipo: ${typeof variant.variant_barcode})`)

            if (variant.variant_barcode === null) {
              console.log('     ❌ PROBLEMA: variant_barcode es NULL')
            } else if (variant.variant_barcode === '') {
              console.log('     ❌ PROBLEMA: variant_barcode es cadena vacía')
            } else {
              console.log('     ✅ OK: variant_barcode tiene valor')
            }
          })
        }

        // 4. Verificación directa de la tabla
        console.log('\n🔬 VERIFICACIÓN DIRECTA DE LA TABLA:')
        debugData.direct_table_check.forEach(record => {
          console.log(`   ID ${record.id} (Producto ${record.product_id}): ${record.variant_barcode} [${record.barcode_status}]`)
        })

        // 5. Ahora comparar con el endpoint real
        if (debugData.sample_product_data) {
          await this.compareWithRealEndpoint(debugData.sample_product_data.product_id)
        }
      }

      return debugData

    } catch (error) {
      console.error('❌ ERROR en debugging:', error)
      throw error
    }
  }

  async compareWithRealEndpoint(productId) {
    try {
      console.log(`\n🔄 COMPARANDO CON ENDPOINT REAL (product-details para ID ${productId}):`)

      // Llamar al endpoint real que usa el frontend
      const realResponse = await fetch(`${this.baseURL}/inventory/product-details/${productId}`)
      const realData = await realResponse.json()

      console.log('📤 RESPUESTA DEL ENDPOINT REAL:', realData)

      if (realData.status === 'success' && realData.data.stock_variants) {
        console.log('\n📋 COMPARACIÓN DE VARIANTES:')
        console.log('   Cantidad de variantes del endpoint real:', realData.data.stock_variants.length)

        realData.data.stock_variants.forEach((variant, index) => {
          console.log(`\n   Variante ${index + 1} (del endpoint real):`)
          console.log('     ID:', variant.id)
          console.log('     Talle:', variant.size_name)
          console.log('     Color:', variant.color_name)
          console.log('     Sucursal:', variant.sucursal_nombre)
          console.log('     Cantidad:', variant.quantity)
          console.log('     VARIANT_BARCODE:', variant.variant_barcode, `(tipo: ${typeof variant.variant_barcode})`)

          if (variant.variant_barcode === null) {
            console.log('     ❌ PROBLEMA CONFIRMADO: El endpoint real devuelve NULL')
          } else if (variant.variant_barcode === '') {
            console.log('     ❌ PROBLEMA CONFIRMADO: El endpoint real devuelve cadena vacía')
          } else {
            console.log('     ✅ OK: El endpoint real devuelve valor válido')
          }
        })
      } else {
        console.log('❌ El endpoint real no devolvió datos válidos')
      }

    } catch (error) {
      console.error('❌ ERROR comparando con endpoint real:', error)
    }
  }

  async testInventoryService() {
    try {
      console.log('\n🧪 PROBANDO inventoryService.getProductsSummary():')

      // Importar el servicio de inventario
      const { inventoryService } = await import('./inventory/inventoryService.js')

      const summaryResponse = await inventoryService.getProductsSummary()
      console.log('📊 RESPUESTA DE getProductsSummary:', summaryResponse)

      if (summaryResponse.status === 'success' && summaryResponse.data.length > 0) {
        const firstProduct = summaryResponse.data[0]
        console.log('\n🔍 PROBANDO getProductDetails para el primer producto:', firstProduct.id)

        const detailsResponse = await inventoryService.getProductDetails(firstProduct.id)
        console.log('📋 RESPUESTA DE getProductDetails:', detailsResponse)

        if (detailsResponse.status === 'success' && detailsResponse.data.stock_variants) {
          console.log('\n📦 VARIANTES RECIBIDAS POR EL FRONTEND:')
          detailsResponse.data.stock_variants.forEach((variant, index) => {
            console.log(`   Variante ${index + 1}:`)
            console.log('     ID:', variant.id)
            console.log('     VARIANT_BARCODE:', variant.variant_barcode, `(tipo: ${typeof variant.variant_barcode})`)
          })
        }
      }

    } catch (error) {
      console.error('❌ ERROR probando inventoryService:', error)
    }
  }
}

// Crear instancia global para debugging
window.debugService = new DebugService()

// Función global para ejecutar el debugging completo
window.debugVariantBarcodes = async () => {
  console.clear()
  console.log('🚀 INICIANDO DEBUGGING COMPLETO DE VARIANT_BARCODES')
  console.log('=' * 60)

  try {
    await window.debugService.debugVariantBarcodes()
    await window.debugService.testInventoryService()

    console.log('\n🎯 DEBUGGING COMPLETADO')
    console.log('Revisa los logs anteriores para identificar dónde está el problema')

  } catch (error) {
    console.error('💥 ERROR DURANTE EL DEBUGGING:', error)
  }
}

export default DebugService
