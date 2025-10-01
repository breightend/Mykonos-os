// Script para probar el endpoint de inventario directamente
import { API_ENDPOINTS } from './config/apiConfig.js';

async function testInventoryEndpoint() {
    console.log('🧪 Iniciando pruebas del endpoint de inventario...\n');

    const baseURL = API_ENDPOINTS.INVENTORY;

    try {
        // Probar endpoint de debug
        console.log('1. 🔍 Probando endpoint de debug...');
        const debugResponse = await fetch(`${baseURL}/debug`);
        const debugData = await debugResponse.json();
        console.log('Debug Response:', JSON.stringify(debugData, null, 2));

        // Probar endpoint principal sin filtro
        console.log('\n2. 📦 Probando endpoint principal (sin filtro)...');
        const allProductsResponse = await fetch(`${baseURL}/products-by-storage`);
        const allProductsData = await allProductsResponse.json();
        console.log('All Products Response Status:', allProductsData.status);
        console.log('All Products Data Length:', allProductsData.data ? allProductsData.data.length : 0);
        if (allProductsData.data && allProductsData.data.length > 0) {
            console.log('Sample Product:', JSON.stringify(allProductsData.data[0], null, 2));
        }

        // Probar endpoint de lista de sucursales
        console.log('\n3. 🏪 Probando endpoint de lista de sucursales...');
        const storageResponse = await fetch(`${baseURL}/storage-list`);
        const storageData = await storageResponse.json();
        console.log('Storage Response Status:', storageData.status);
        console.log('Storage Data:', JSON.stringify(storageData, null, 2));

        // Si hay sucursales, probar con una específica
        if (storageData.data && storageData.data.length > 0) {
            const firstStorageId = storageData.data[0].id;
            console.log(`\n4. 🎯 Probando endpoint con sucursal específica (ID: ${firstStorageId})...`);
            const specificStorageResponse = await fetch(`${baseURL}/products-by-storage?storage_id=${firstStorageId}`);
            const specificStorageData = await specificStorageResponse.json();
            console.log('Specific Storage Response Status:', specificStorageData.status);
            console.log('Specific Storage Data Length:', specificStorageData.data ? specificStorageData.data.length : 0);
            if (specificStorageData.data && specificStorageData.data.length > 0) {
                console.log('Sample Product from Storage:', JSON.stringify(specificStorageData.data[0], null, 2));
            }
        }

    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    }
}

// Ejecutar las pruebas
testInventoryEndpoint();
