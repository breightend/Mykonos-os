# Clean receive_purchase function replacement

@purchase_bp.route("/<int:purchase_id>/receive", methods=["POST"])
def receive_purchase(purchase_id):
    try:
        data = request.get_json()
        storage_id = data.get("storage_id", 1)  # Default to storage ID 1

        db = Database()

        # Verificar que la compra existe y está pendiente
        purchase = db.get_record_by_id("purchases", purchase_id)
        if not purchase.get("success") or not purchase.get("record"):
            return jsonify({"status": "error", "message": "Compra no encontrada"}), 404

        purchase_data = purchase["record"]
        if purchase_data["status"] != "Pendiente de entrega":
            return jsonify(
                {"status": "error", "message": "La compra ya fue procesada"}
            ), 400

        # Obtener productos de la compra - usar estructura básica hasta que se ejecute la migración
        details_query = """
        SELECT pd.product_id, pd.quantity,
               pr.product_name, pr.barcode as product_barcode
        FROM purchases_detail pd
        LEFT JOIN products pr ON pd.product_id = pr.id
        WHERE pd.purchase_id = %s
        """
        product_details = db.execute_query(details_query, (purchase_id,))

        if not product_details:
            return jsonify(
                {"status": "error", "message": "No se encontraron productos en la compra"}
            ), 400

        # Actualizar stock para cada producto (versión básica)
        for detail in product_details:
            product_id = detail["product_id"]
            quantity = detail["quantity"]
            product_name = detail["product_name"]
            product_barcode = detail["product_barcode"]
            
            # Usar warehouse_stock tradicional por ahora
            existing_stock_query = """
            SELECT id, quantity FROM warehouse_stock 
            WHERE product_id = %s AND branch_id = %s
            """
            existing_stock = db.execute_query(
                existing_stock_query, (product_id, storage_id)
            )

            if existing_stock:
                # Actualizar stock existente
                new_quantity = existing_stock[0]["quantity"] + quantity
                update_stock_data = {
                    "id": existing_stock[0]["id"],
                    "quantity": new_quantity,
                    "last_updated": datetime.now().isoformat(),
                }
                db.update_record("warehouse_stock", update_stock_data)
                print(f"✅ Updated stock for product {product_id}: +{quantity} = {new_quantity}")
            else:
                # Crear nuevo registro de stock
                stock_data = {
                    "product_id": product_id,
                    "branch_id": storage_id,
                    "quantity": quantity,
                    "provider_id": purchase_data["entity_id"],
                    "last_updated": datetime.now().isoformat(),
                }
                result = db.add_record("warehouse_stock", stock_data)
                print(f"✅ Created new stock record for product {product_id}: {quantity}")
                
            # Registrar movimiento de inventario
            movement_data = {
                "product_id": product_id,
                "branch_id": storage_id,
                "movement_type": "Entrada",
                "quantity": quantity,
                "reason": f"Recepción de compra #{purchase_id}",
                "movement_date": datetime.now().isoformat(),
            }
            db.add_record("inventory_movements", movement_data)

        # Actualizar estado de la compra
        update_data = {
            "id": purchase_id,
            "status": "Recibido",
            "delivery_date": datetime.now().isoformat(),
        }
        db.update_record("purchases", update_data)

        return jsonify(
            {
                "status": "éxito",
                "message": "Compra recibida e inventario actualizado exitosamente",
                "products_processed": len(product_details)
            }
        ), 200

    except Exception as e:
        print(f"Error receiving purchase: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify(
            {"status": "error", "message": f"Error interno del servidor: {str(e)}"}
        ), 500