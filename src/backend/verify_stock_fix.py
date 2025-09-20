#!/usr/bin/env python3
"""
Script para verificar que los cálculos de stock son correctos
después de las correcciones realizadas
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from database.connection import Database

def verify_stock_calculations():
    """Verificar cálculos de stock"""
    db = Database()
    
    try:
        print("🔍 Verificando cálculos de stock corregidos...")
        
        # 1. Comparar stock desde warehouse_stock vs warehouse_stock_variants
        print("\n1. Comparando datos entre tablas...")
        
        # Stock desde warehouse_stock (método antiguo)
        old_query = """
        SELECT 
            p.id, 
            p.product_name,
            COALESCE(SUM(ws.quantity), 0) as stock_warehouse
        FROM products p
        LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
        WHERE p.state = 'active'
        GROUP BY p.id, p.product_name
        ORDER BY p.id
        LIMIT 5
        """
        old_data = db.execute_query(old_query)
        
        # Stock desde warehouse_stock_variants (método nuevo)
        new_query = """
        SELECT 
            p.id, 
            p.product_name,
            COALESCE(SUM(wsv.quantity), 0) as stock_variants
        FROM products p
        LEFT JOIN warehouse_stock_variants wsv ON p.id = wsv.product_id
        WHERE p.state = 'active'
        GROUP BY p.id, p.product_name
        ORDER BY p.id
        LIMIT 5
        """
        new_data = db.execute_query(new_query)
        
        print("🔍 Comparación de datos (primeros 5 productos):")
        print("ID | Nombre | Stock_Warehouse | Stock_Variants")
        print("-" * 60)
        
        # Crear diccionarios para comparación
        old_dict = {row[0]: row[2] for row in old_data}
        new_dict = {row[0]: row[2] for row in new_data}
        
        for row in old_data:
            product_id, name, old_stock = row
            new_stock = new_dict.get(product_id, 0)
            status = "✅" if old_stock == new_stock else "⚠️"
            print(f"{status} {product_id} | {name[:20]:<20} | {old_stock:>10} | {new_stock:>10}")
        
        # 2. Probar endpoint products-summary
        print("\n2. Probando endpoint products-summary (simulado)...")
        
        summary_query = """
        SELECT 
            p.id,
            COALESCE(p.product_name, 'Sin nombre') as producto,
            COALESCE(b.brand_name, 'Sin marca') as marca,
            COALESCE(SUM(wsv.quantity), 0) as cantidad_total,
            COUNT(DISTINCT wsv.branch_id) as sucursales_con_stock
        FROM products p
        LEFT JOIN warehouse_stock_variants wsv ON p.id = wsv.product_id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.state = 'active'
        GROUP BY p.id, p.product_name, b.brand_name
        ORDER BY p.product_name
        LIMIT 3
        """
        
        summary_data = db.execute_query(summary_query)
        
        print("🔍 Datos de resumen (primeros 3 productos):")
        print("ID | Producto | Marca | Stock Total | Sucursales")
        print("-" * 70)
        
        for row in summary_data:
            product_id, producto, marca, stock, sucursales = row
            print(f"{product_id} | {producto[:15]:<15} | {marca[:10]:<10} | {stock:>8} | {sucursales:>8}")
        
        # 3. Verificar stock por sucursal específica
        print("\n3. Probando stock por sucursal específica...")
        
        # Obtener ID de primera sucursal
        branch_query = "SELECT id, name FROM storage ORDER BY id LIMIT 1"
        branch_data = db.execute_query(branch_query)
        
        if branch_data:
            branch_id, branch_name = branch_data[0]
            print(f"Usando sucursal: {branch_name} (ID: {branch_id})")
            
            branch_stock_query = """
            SELECT 
                p.id,
                p.product_name,
                COALESCE(SUM(wsv.quantity), 0) as cantidad_total
            FROM products p
            LEFT JOIN warehouse_stock_variants wsv ON p.id = wsv.product_id AND wsv.branch_id = %s
            WHERE p.state = 'active'
            GROUP BY p.id, p.product_name
            HAVING COALESCE(SUM(wsv.quantity), 0) > 0
            ORDER BY p.product_name
            LIMIT 3
            """
            
            branch_stock = db.execute_query(branch_stock_query, (branch_id,))
            
            print("🔍 Stock en sucursal específica:")
            print("ID | Producto | Stock")
            print("-" * 40)
            
            for row in branch_stock:
                product_id, producto, stock = row
                print(f"{product_id} | {producto[:20]:<20} | {stock:>5}")
        
        print("\n✅ Verificación de cálculos de stock completada!")
        
    except Exception as e:
        print(f"❌ Error verificando cálculos: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_stock_calculations()