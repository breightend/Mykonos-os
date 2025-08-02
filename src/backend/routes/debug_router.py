from flask import Blueprint, jsonify
import sqlite3
import os

debug_router = Blueprint('debug', __name__)

@debug_router.route('/debug/variant-barcodes', methods=['GET'])
def debug_variant_barcodes():
    """Endpoint de debugging para verificar códigos de barras de variantes"""
    try:
        # Conectar a la base de datos
        db_path = os.path.join('database', 'mykonos.db')
        
        if not os.path.exists(db_path):
            return jsonify({
                'status': 'error',
                'message': f'Base de datos no encontrada en {db_path}'
            }), 500
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Estadísticas generales
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NULL")
        null_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode = ''")
        empty_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ''")
        valid_count = cursor.fetchone()[0]
        
        # 2. Obtener un producto de ejemplo
        cursor.execute("SELECT DISTINCT product_id FROM warehouse_stock_variants LIMIT 1")
        product_result = cursor.fetchone()
        
        sample_data = None
        if product_result:
            product_id = product_result[0]
            
            # Simular exactamente la consulta del endpoint product-details
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
                wsv.color_id,
                wsv.variant_barcode
            FROM warehouse_stock_variants wsv
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            JOIN storage st ON wsv.branch_id = st.id
            WHERE wsv.product_id = ?
            ORDER BY s.size_name, c.color_name, st.name
            LIMIT 3
            """
            
            cursor.execute(variants_query, (product_id,))
            variants_data = cursor.fetchall()
            
            # Convertir a formato JSON (igual que el endpoint real)
            sample_variants = []
            for variant in variants_data:
                variant_item = {
                    "id": variant[0],
                    "size_name": variant[1],
                    "color_name": variant[2],
                    "color_hex": variant[3],
                    "sucursal_nombre": variant[4],
                    "sucursal_id": variant[5],
                    "quantity": variant[6],
                    "last_updated": variant[7],
                    "size_id": variant[8],
                    "color_id": variant[9],
                    "variant_barcode": variant[10],
                }
                sample_variants.append(variant_item)
            
            sample_data = {
                "product_id": product_id,
                "variants_count": len(variants_data),
                "sample_variants": sample_variants
            }
        
        # 3. Verificación directa de la tabla
        cursor.execute("""
            SELECT id, product_id, variant_barcode, 
                   CASE 
                       WHEN variant_barcode IS NULL THEN 'NULL'
                       WHEN variant_barcode = '' THEN 'EMPTY'
                       ELSE 'HAS_VALUE'
                   END as barcode_status
            FROM warehouse_stock_variants 
            LIMIT 10
        """)
        direct_check = cursor.fetchall()
        
        direct_data = []
        for record in direct_check:
            direct_data.append({
                "id": record[0],
                "product_id": record[1],
                "variant_barcode": record[2],
                "barcode_status": record[3]
            })
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'timestamp': str(__import__('datetime').datetime.now()),
            'database_path': db_path,
            'statistics': {
                'total_variants': total,
                'null_barcodes': null_count,
                'empty_barcodes': empty_count,
                'valid_barcodes': valid_count
            },
            'sample_product_data': sample_data,
            'direct_table_check': direct_data
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'traceback': str(__import__('traceback').format_exc())
        }), 500
