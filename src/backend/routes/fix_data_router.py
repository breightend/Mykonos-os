from flask import Blueprint, jsonify
from database.database import Database

fix_data_bp = Blueprint("fix_data", __name__)


@fix_data_bp.route("/api/fix/variant-ids", methods=["POST"])
def fix_variant_ids():
    """
    Endpoint para arreglar automáticamente las inconsistencias de size_id en warehouse_stock_variants
    """
    try:
        db = Database()

        print("🔧 INICIANDO REPARACIÓN AUTOMÁTICA DE VARIANT IDs")

        # 1. Verificar el estado actual
        print("🔍 Verificando estado actual...")
        current_variants_query = """
            SELECT wsv.id, wsv.size_id, wsv.color_id, wsv.product_id, 
                   s.size_name, c.color_name
            FROM warehouse_stock_variants wsv
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            WHERE wsv.product_id = 6
            ORDER BY wsv.id
        """

        current_variants = db.fetch_all(current_variants_query)
        issues_found = []

        for variant in current_variants:
            if variant["size_name"] is None:
                issues_found.append(
                    {
                        "variant_id": variant["id"],
                        "current_size_id": variant["size_id"],
                        "issue": "size_id_invalid",
                    }
                )
                print(
                    f"❌ Variant ID {variant['id']} tiene size_id inválido: {variant['size_id']}"
                )

        if not issues_found:
            return jsonify(
                {
                    "status": "success",
                    "message": "No se encontraron inconsistencias de datos",
                    "fixed_count": 0,
                }
            )

        # 2. Aplicar correcciones automáticas
        print("🔧 Aplicando correcciones...")
        fixed_count = 0

        for issue in issues_found:
            variant_id = issue["variant_id"]
            current_size_id = issue["current_size_id"]

            # Mapeo de correcciones basado en el patrón observado
            size_id_mapping = {
                1: 8,  # size_id 1 -> 8 (S)
                2: 9,  # size_id 2 -> 9 (M)
            }

            if current_size_id in size_id_mapping:
                correct_size_id = size_id_mapping[current_size_id]

                # Verificar que el size_id correcto existe en la tabla sizes
                size_check_query = "SELECT id, size_name FROM sizes WHERE id = ?"
                size_exists = db.fetch_one(size_check_query, [correct_size_id])

                if size_exists:
                    # Aplicar la corrección
                    update_query = """
                        UPDATE warehouse_stock_variants 
                        SET size_id = ?
                        WHERE id = ? AND product_id = 6
                    """

                    db.execute_query(update_query, [correct_size_id, variant_id])
                    fixed_count += 1

                    print(
                        f"✅ Variant ID {variant_id}: size_id {current_size_id} -> {correct_size_id} ({size_exists['size_name']})"
                    )
                else:
                    print(
                        f"❌ No se puede corregir variant ID {variant_id}: size_id {correct_size_id} no existe en tabla sizes"
                    )
            else:
                print(
                    f"❌ No hay mapeo para size_id {current_size_id} en variant ID {variant_id}"
                )

        # 3. Verificar que las correcciones funcionaron
        print("🔍 Verificando correcciones...")
        verification_query = """
            SELECT wsv.id, wsv.size_id, wsv.color_id, wsv.quantity, wsv.variant_barcode,
                   s.size_name, c.color_name
            FROM warehouse_stock_variants wsv
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            WHERE wsv.product_id = 6
            ORDER BY wsv.id
        """

        updated_variants = db.fetch_all(verification_query)

        print("📋 ESTADO DESPUÉS DE LAS CORRECCIONES:")
        for variant in updated_variants:
            status = "✅" if variant["size_name"] is not None else "❌"
            print(
                f"  {status} Variant ID {variant['id']}: size_id={variant['size_id']} ({variant['size_name']}), color_id={variant['color_id']} ({variant['color_name']})"
            )

        return jsonify(
            {
                "status": "success",
                "message": f"Reparación completada exitosamente. Se corrigieron {fixed_count} variantes.",
                "fixed_count": fixed_count,
                "details": {
                    "issues_found": len(issues_found),
                    "fixed_variants": fixed_count,
                    "updated_variants": updated_variants,
                },
            }
        )

    except Exception as e:
        print(f"❌ Error durante la reparación: {e}")
        import traceback

        traceback.print_exc()

        return jsonify(
            {"status": "error", "message": f"Error durante la reparación: {str(e)}"}
        ), 500
