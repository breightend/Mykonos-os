#!/usr/bin/env python3
"""
Script para poblar warehouse_stock_variants con datos de ejemplo
"""

from database.database import Database
from datetime import datetime

def populate_test_data():
    db = Database()
    
    try:
        print("🔄 Poblando datos de ejemplo...")
        
        # Obtener datos base
        products = db.execute_query("SELECT id, product_name FROM products LIMIT 3")
        sizes = db.execute_query("SELECT id, size_name FROM sizes LIMIT 3")
        colors = db.execute_query("SELECT id, color_name FROM colors LIMIT 3")
        storage = db.execute_query("SELECT id, name FROM storage LIMIT 1")
        
        if not (products and sizes and colors and storage):
            print("❌ No hay suficientes datos base para crear ejemplos")
            return
        
        # Limpiar tabla existente
        db.execute_query("DELETE FROM warehouse_stock_variants")
        print("🧹 Tabla limpiada")
        
        # Crear registros para cada producto
        for product in products:
            product_id = product["id"]
            branch_id = storage[0]["id"]
            
            print(f"\n📦 Creando variantes para producto: {product['product_name']} (ID: {product_id})")
            
            # Crear todas las combinaciones de talle x color
            for size in sizes:
                for color in colors:
                    variant_data = {
                        "product_id": product_id,
                        "branch_id": branch_id,
                        "size_id": size["id"],
                        "color_id": color["id"],
                        "quantity": 5,  # Cantidad fija para prueba
                        "last_updated": datetime.now().isoformat()
                    }
                    
                    result = db.add_record("warehouse_stock_variants", variant_data)
                    if result.get("success"):
                        print(f"  ✅ {size['size_name']} + {color['color_name']}: 5 unidades")
                    else:
                        print(f"  ❌ Error: {result.get('message')}")
        
        # Verificar los datos creados
        count = db.execute_query("SELECT COUNT(*) as count FROM warehouse_stock_variants")[0]["count"]
        print(f"\n📊 Total de registros creados: {count}")
        
        # Probar el query del endpoint con el primer producto
        product_id = products[0]["id"]
        variants_query = """
        SELECT 
            wsv.id,
            s.size_name,
            c.color_name,
            c.color_hex,
            st.name as sucursal_nombre,
            st.id as sucursal_id,
            wsv.quantity,
            wsv.last_updated,
            wsv.size_id,
            wsv.color_id
        FROM warehouse_stock_variants wsv
        LEFT JOIN sizes s ON wsv.size_id = s.id
        LEFT JOIN colors c ON wsv.color_id = c.id
        JOIN storage st ON wsv.branch_id = st.id
        WHERE wsv.product_id = ?
        ORDER BY s.size_name, c.color_name, st.name
        """
        
        variants_result = db.execute_query(variants_query, (product_id,))
        print(f"\n🔍 Verificación query endpoint para producto {product_id}:")
        print(f"   Registros encontrados: {len(variants_result) if variants_result else 0}")
        
        if variants_result:
            for v in variants_result:
                print(f"   - {v.get('size_name')} + {v.get('color_name')}: {v.get('quantity')} unidades")
        
        print("\n✅ Datos de ejemplo creados exitosamente")
        print("🎯 Ahora puedes probar el frontend con datos reales")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    populate_test_data()
