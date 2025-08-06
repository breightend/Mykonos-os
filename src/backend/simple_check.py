#!/usr/bin/env python3
"""
Script simple para verificar códigos de barras
"""

import psycopg2

try:
    # Conectar a PostgreSQL
    conn = psycopg2.connect(
        host="localhost", database="mykonos", user="postgres", password="password"
    )
    cur = conn.cursor()

    print("🔍 VERIFICACIÓN DE CÓDIGOS DE BARRAS")
    print("=" * 50)

    # Verificar estructura de warehouse_stock_variants
    print("\n📊 ESTRUCTURA warehouse_stock_variants:")
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'warehouse_stock_variants'
        ORDER BY ordinal_position
    """)
    columns = cur.fetchall()
    for col in columns:
        print(f"  • {col[0]}: {col[1]}")

    # Contar registros
    print("\n📈 CONTEO DE REGISTROS:")
    cur.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
    total = cur.fetchone()[0]
    print(f"  • Total variantes: {total}")

    # Verificar códigos de barras
    cur.execute(
        "SELECT COUNT(*) FROM warehouse_stock_variants WHERE barcode IS NOT NULL AND barcode != ''"
    )
    with_barcode = cur.fetchone()[0]
    print(f"  • Con código de barras: {with_barcode}")

    # Mostrar ejemplos
    print("\n🔍 EJEMPLOS DE CÓDIGOS DE BARRAS:")
    cur.execute("""
        SELECT barcode, product_id, size_id, color_id 
        FROM warehouse_stock_variants 
        WHERE barcode IS NOT NULL AND barcode != ''
        LIMIT 5
    """)
    examples = cur.fetchall()
    for ex in examples:
        print(f"  • {ex[0]} (Producto: {ex[1]}, Talla: {ex[2]}, Color: {ex[3]})")

    # Verificar productos
    print("\n📦 PRODUCTOS CON VARIANTES:")
    cur.execute("""
        SELECT p.id, p.name, COUNT(wsv.id) as variants
        FROM products p
        LEFT JOIN warehouse_stock_variants wsv ON p.id = wsv.product_id
        GROUP BY p.id, p.name
        HAVING COUNT(wsv.id) > 0
        ORDER BY variants DESC
        LIMIT 5
    """)
    products = cur.fetchall()
    for prod in products:
        print(f"  • {prod[1]} (ID: {prod[0]}) - {prod[2]} variantes")

    cur.close()
    conn.close()
    print("\n✅ Verificación completada")

except Exception as e:
    print(f"❌ Error: {e}")
