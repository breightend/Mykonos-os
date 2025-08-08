"""
Product Exchange Service
Handles product returns and exchanges with inventory and financial updates
"""

from datetime import datetime
from database.database import Database


class ExchangeService:
    """
    Service for handling product exchanges and returns
    """

    def __init__(self):
        self.db = Database()

    def create_exchange_transaction(self, exchange_data):
        """
        Creates a complete exchange transaction with multiple products

        Args:
            exchange_data (dict): Exchange information containing:
                - customer_id: ID of the customer
                - return_products: List of products being returned [
                    {
                        "variant_barcode": str,
                        "quantity": int,
                        "reason": str (optional)
                    }
                ]
                - new_products: List of new products (optional) [
                    {
                        "variant_barcode": str,
                        "quantity": int
                    }
                ]
                - branch_id: Branch where exchange happens
                - reason: General reason for exchange
                - user_id: ID of user processing exchange

        Returns:
            dict: Result of the operation
        """
        try:
            # Validate input parameters
            validation_result = self._validate_exchange_data(exchange_data)
            if not validation_result["success"]:
                return validation_result

            print("🔄 Processing multi-product exchange")

            # Step 1: Validate and get details for all return products
            return_products_details = []
            return_total = 0.0

            for return_item in exchange_data.get("return_products", []):
                product = self._get_product_by_variant_barcode(
                    return_item["variant_barcode"]
                )
                if not product:
                    return {
                        "success": False,
                        "message": f"Producto a devolver no encontrado: {return_item['variant_barcode']}",
                    }

                # Validate branch consistency
                if product["branch_id"] != exchange_data["branch_id"]:
                    return {
                        "success": False,
                        "message": f"El producto {product['product_name']} está en sucursal {product['sucursal_nombre']}, no en la sucursal actual",
                    }

                product_total = float(product["sale_price"]) * return_item["quantity"]
                return_total += product_total

                return_products_details.append(
                    {
                        **product,
                        "return_quantity": return_item["quantity"],
                        "return_reason": return_item.get("reason", ""),
                        "subtotal": product_total,
                    }
                )

            # Step 2: Validate and get details for all new products
            new_products_details = []
            new_total = 0.0

            for new_item in exchange_data.get("new_products", []):
                product = self._get_product_by_variant_barcode(
                    new_item["variant_barcode"]
                )
                if not product:
                    return {
                        "success": False,
                        "message": f"Producto nuevo no encontrado: {new_item['variant_barcode']}",
                    }

                # Check branch consistency for new product
                if product["branch_id"] != exchange_data["branch_id"]:
                    return {
                        "success": False,
                        "message": f"El producto {product['product_name']} está en sucursal {product['sucursal_nombre']}, no en la sucursal actual",
                    }

                # Check if new product has enough stock
                if product["stock_disponible"] < new_item["quantity"]:
                    return {
                        "success": False,
                        "message": f"Stock insuficiente para {product['product_name']}. Disponible: {product['stock_disponible']}, Solicitado: {new_item['quantity']}",
                    }

                product_total = float(product["sale_price"]) * new_item["quantity"]
                new_total += product_total

                new_products_details.append(
                    {
                        **product,
                        "new_quantity": new_item["quantity"],
                        "subtotal": product_total,
                    }
                )

            # Step 3: Calculate total price difference
            price_difference = new_total - return_total

            print("💰 Multi-product price calculation:")
            print(
                f"   📤 Return total: ${return_total:.2f} ({len(return_products_details)} products)"
            )
            print(
                f"   📥 New total: ${new_total:.2f} ({len(new_products_details)} products)"
            )
            print(f"   💵 Difference: ${price_difference:.2f}")

            # Step 4: Process inventory updates for all products
            inventory_result = self._process_multi_product_inventory_updates(
                exchange_data, return_products_details, new_products_details
            )
            if not inventory_result["success"]:
                return inventory_result

            # Step 5: Create financial movement if there's a price difference
            financial_result = None
            if price_difference != 0 and exchange_data.get("customer_id"):
                financial_result = self._create_multi_product_financial_movement(
                    exchange_data["customer_id"],
                    price_difference,
                    return_products_details,
                    new_products_details,
                    exchange_data.get("reason", ""),
                )

            # Step 6: Log the multi-product exchange transaction
            exchange_log = self._log_multi_product_exchange_transaction(
                exchange_data,
                return_products_details,
                new_products_details,
                price_difference,
            )

            return {
                "success": True,
                "message": "Intercambio multi-producto procesado exitosamente",
                "exchange_id": exchange_log.get("exchange_id"),
                "return_products": [p["product_name"] for p in return_products_details],
                "new_products": [p["product_name"] for p in new_products_details],
                "return_total": f"{return_total:.2f}",
                "new_total": f"{new_total:.2f}",
                "price_difference": f"{price_difference:.2f}",
                "inventory_updated": inventory_result["message"],
                "financial_movement": financial_result.get("movement_id")
                if financial_result
                else None,
            }

        except Exception as e:
            print(f"❌ Error in multi-product exchange transaction: {e}")
            return {
                "success": False,
                "message": f"Error procesando intercambio: {str(e)}",
            }

    def _validate_exchange_data(self, exchange_data):
        """
        Validates exchange data before processing (supports multiple products)

        Args:
            exchange_data (dict): Exchange data to validate

        Returns:
            dict: Validation result
        """
        required_fields = ["branch_id", "user_id"]

        # Check required fields
        for field in required_fields:
            if field not in exchange_data or exchange_data[field] is None:
                return {
                    "success": False,
                    "message": f"Campo requerido faltante: {field}",
                }

        # Check if we have either return_products list or legacy single product format
        has_return_products = (
            exchange_data.get("return_products")
            and len(exchange_data["return_products"]) > 0
        )
        has_legacy_format = exchange_data.get(
            "return_variant_barcode"
        ) and exchange_data.get("return_quantity")

        if not has_return_products and not has_legacy_format:
            return {
                "success": False,
                "message": "Debe especificar productos a devolver (return_products o return_variant_barcode)",
            }

        # Convert legacy format to new format for backwards compatibility
        if has_legacy_format and not has_return_products:
            exchange_data["return_products"] = [
                {
                    "variant_barcode": exchange_data["return_variant_barcode"],
                    "quantity": exchange_data["return_quantity"],
                    "reason": exchange_data.get("reason", ""),
                }
            ]

        # Convert legacy new product format
        if exchange_data.get("new_variant_barcode") and exchange_data.get(
            "new_quantity"
        ):
            if not exchange_data.get("new_products"):
                exchange_data["new_products"] = []
            exchange_data["new_products"].append(
                {
                    "variant_barcode": exchange_data["new_variant_barcode"],
                    "quantity": exchange_data["new_quantity"],
                }
            )

        # Validate return products
        for return_item in exchange_data.get("return_products", []):
            if not return_item.get("variant_barcode"):
                return {
                    "success": False,
                    "message": "Código de barras requerido para productos a devolver",
                }

            if not return_item.get("quantity") or return_item["quantity"] <= 0:
                return {
                    "success": False,
                    "message": "La cantidad a devolver debe ser mayor a 0",
                }

        # Validate new products
        for new_item in exchange_data.get("new_products", []):
            if not new_item.get("variant_barcode"):
                return {
                    "success": False,
                    "message": "Código de barras requerido para productos nuevos",
                }

            if not new_item.get("quantity") or new_item["quantity"] <= 0:
                return {
                    "success": False,
                    "message": "La cantidad de productos nuevos debe ser mayor a 0",
                }

        return {"success": True}

    def _get_product_by_variant_barcode(self, variant_barcode):
        """
        Gets product information by variant barcode
        """
        try:
            query = """
            SELECT 
                p.id as product_id,
                p.product_name,
                p.sale_price,
                wsv.id as variant_id,
                wsv.size_id,
                wsv.color_id,
                wsv.variant_barcode,
                wsv.branch_id,
                wsv.quantity as stock_disponible,
                s.size_name,
                c.color_name,
                c.color_hex,
                st.name as sucursal_nombre,
                b.brand_name
            FROM warehouse_stock_variants wsv
            JOIN products p ON wsv.product_id = p.id
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            LEFT JOIN storage st ON wsv.branch_id = st.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE wsv.variant_barcode = %s
            """

            result = self.db.execute_query(query, (variant_barcode,))

            if result and len(result) > 0:
                return result[0]
            return None

        except Exception as e:
            print(f"Error getting product by variant barcode: {e}")
            return None

    def _process_multi_product_inventory_updates(
        self, exchange_data, return_products, new_products
    ):
        """
        Updates inventory for multiple returned and new products
        """
        try:
            messages = []

            # Process all return products (increase stock)
            for return_item in return_products:
                # Update variant stock
                return_update_query = """
                UPDATE warehouse_stock_variants 
                SET quantity = quantity + %s, last_updated = NOW()
                WHERE variant_barcode = %s
                """

                self.db.execute_query(
                    return_update_query,
                    (return_item["return_quantity"], return_item["variant_barcode"]),
                )

                # Update general stock
                return_general_stock_query = """
                UPDATE warehouse_stock 
                SET quantity = quantity + %s, last_updated = NOW()
                WHERE product_id = %s AND branch_id = %s
                """

                self.db.execute_query(
                    return_general_stock_query,
                    (
                        return_item["return_quantity"],
                        return_item["product_id"],
                        exchange_data["branch_id"],
                    ),
                )

                messages.append(
                    f"✅ Stock aumentado: {return_item['product_name']} (+{return_item['return_quantity']})"
                )

            # Process all new products (decrease stock)
            for new_item in new_products:
                # Update variant stock
                new_update_query = """
                UPDATE warehouse_stock_variants 
                SET quantity = quantity - %s, last_updated = NOW()
                WHERE variant_barcode = %s
                """

                self.db.execute_query(
                    new_update_query,
                    (new_item["new_quantity"], new_item["variant_barcode"]),
                )

                # Update general stock
                new_general_stock_query = """
                UPDATE warehouse_stock 
                SET quantity = quantity - %s, last_updated = NOW()
                WHERE product_id = %s AND branch_id = %s
                """

                self.db.execute_query(
                    new_general_stock_query,
                    (
                        new_item["new_quantity"],
                        new_item["product_id"],
                        exchange_data["branch_id"],
                    ),
                )

                messages.append(
                    f"✅ Stock reducido: {new_item['product_name']} (-{new_item['new_quantity']})"
                )

            return {"success": True, "message": " | ".join(messages)}

        except Exception as e:
            print(f"Error updating multi-product inventory: {e}")
            return {
                "success": False,
                "message": f"Error actualizando inventario: {str(e)}",
            }

    def _create_multi_product_financial_movement(
        self, customer_id, price_difference, return_products, new_products, reason
    ):
        """
        Creates account movement for multi-product price difference
        """
        try:
            # Generate operation number
            operation_result = self.db.execute_query(
                "SELECT MAX(numero_operacion) as max_num FROM account_movements"
            )
            operation_number = 1
            if operation_result and operation_result[0]["max_num"]:
                operation_number = operation_result[0]["max_num"] + 1

            # Create detailed movement description
            description = "Intercambio multi-producto: "

            # Add return products
            return_names = [
                f"{p['product_name']} (x{p['return_quantity']})"
                for p in return_products
            ]
            description += f"Devuelve: {', '.join(return_names)}"

            # Add new products
            if new_products:
                new_names = [
                    f"{p['product_name']} (x{p['new_quantity']})" for p in new_products
                ]
                description += f" | Toma: {', '.join(new_names)}"

            if reason:
                description += f" | Motivo: {reason}"

            # Determine movement type based on price difference
            if price_difference > 0:
                description += f" | Cliente debe: ${price_difference:.2f}"
                movement_data = {
                    "numero_operacion": operation_number,
                    "entity_id": customer_id,
                    "descripcion": description,
                    "medio_pago": "intercambio",
                    "debe": price_difference,
                    "haber": 0.0,
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
            else:
                description += f" | A favor del cliente: ${abs(price_difference):.2f}"
                movement_data = {
                    "numero_operacion": operation_number,
                    "entity_id": customer_id,
                    "descripcion": description,
                    "medio_pago": "intercambio",
                    "debe": 0.0,
                    "haber": abs(price_difference),
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }

            # Get current balance and calculate new balance
            balance_query = """
            SELECT saldo FROM account_movements 
            WHERE entity_id = %s 
            ORDER BY created_at DESC LIMIT 1
            """
            balance_result = self.db.execute_query(balance_query, (customer_id,))
            current_balance = balance_result[0]["saldo"] if balance_result else 0.0

            if price_difference > 0:
                new_balance = current_balance + price_difference
            else:
                new_balance = current_balance - abs(price_difference)

            movement_data["saldo"] = new_balance

            # Insert movement
            result = self.db.add_record("account_movements", movement_data)

            if result["success"]:
                return {
                    "success": True,
                    "movement_id": result["rowid"],
                    "new_balance": new_balance,
                    "amount": price_difference,
                }
            else:
                return {
                    "success": False,
                    "message": f"Error creando movimiento financiero: {result['message']}",
                }

        except Exception as e:
            print(f"Error creating multi-product financial movement: {e}")
            return {
                "success": False,
                "message": f"Error en movimiento financiero: {str(e)}",
            }

    def _log_multi_product_exchange_transaction(
        self, exchange_data, return_products, new_products, price_difference
    ):
        """
        Logs the multi-product exchange transaction for audit purposes
        """
        try:
            # Generate unique exchange ID
            exchange_id = f"MEXC-{datetime.now().strftime('%Y%m%d%H%M%S')}"

            # Create comprehensive log
            log_info = {
                "exchange_id": exchange_id,
                "customer_id": exchange_data.get("customer_id"),
                "return_products_count": len(return_products),
                "new_products_count": len(new_products),
                "return_products": [
                    {
                        "name": p["product_name"],
                        "barcode": p["variant_barcode"],
                        "quantity": p["return_quantity"],
                        "price": p["sale_price"],
                        "subtotal": p["subtotal"],
                    }
                    for p in return_products
                ],
                "new_products": [
                    {
                        "name": p["product_name"],
                        "barcode": p["variant_barcode"],
                        "quantity": p["new_quantity"],
                        "price": p["sale_price"],
                        "subtotal": p["subtotal"],
                    }
                    for p in new_products
                ],
                "price_difference": price_difference,
                "branch_id": exchange_data["branch_id"],
                "reason": exchange_data.get("reason", ""),
                "processed_by": exchange_data.get("user_id"),
                "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "status": "completed",
            }

            print(f"📝 Multi-product exchange logged: {exchange_id}")
            print(f"   📤 Returned: {len(return_products)} products")
            print(f"   📥 New: {len(new_products)} products")
            print(f"   💵 Difference: ${price_difference:.2f}")
            print(f"   📋 Details: {len(log_info)} fields logged")

            # TODO: In production, save log_info to a dedicated exchanges table
            # Example: self.db.add_record("exchanges", log_info)

            return {"exchange_id": exchange_id}

        except Exception as e:
            print(f"Error logging multi-product exchange transaction: {e}")
            return {"exchange_id": None}

    def _process_inventory_updates(self, exchange_data, return_product, new_product):
        """
        Updates inventory for both returned and new products
        """
        try:
            # Update return product stock (increase)
            return_update_query = """
            UPDATE warehouse_stock_variants 
            SET quantity = quantity + %s, last_updated = NOW()
            WHERE variant_barcode = %s
            """

            self.db.execute_query(
                return_update_query,
                (
                    exchange_data["return_quantity"],
                    exchange_data["return_variant_barcode"],
                ),
            )

            # Update general stock for return product
            return_general_stock_query = """
            UPDATE warehouse_stock 
            SET quantity = quantity + %s, last_updated = NOW()
            WHERE product_id = %s AND branch_id = %s
            """

            self.db.execute_query(
                return_general_stock_query,
                (
                    exchange_data["return_quantity"],
                    return_product["product_id"],
                    exchange_data["branch_id"],
                ),
            )

            messages = [f"Stock aumentado para {return_product['product_name']}"]

            # If there's a new product, decrease its stock
            if new_product and exchange_data.get("new_quantity", 0) > 0:
                new_update_query = """
                UPDATE warehouse_stock_variants 
                SET quantity = quantity - %s, last_updated = NOW()
                WHERE variant_barcode = %s
                """

                self.db.execute_query(
                    new_update_query,
                    (
                        exchange_data["new_quantity"],
                        exchange_data["new_variant_barcode"],
                    ),
                )

                # Update general stock for new product
                new_general_stock_query = """
                UPDATE warehouse_stock 
                SET quantity = quantity - %s, last_updated = NOW()
                WHERE product_id = %s AND branch_id = %s
                """

                self.db.execute_query(
                    new_general_stock_query,
                    (
                        exchange_data["new_quantity"],
                        new_product["product_id"],
                        exchange_data["branch_id"],
                    ),
                )

                messages.append(f"Stock reducido para {new_product['product_name']}")

            return {"success": True, "message": ". ".join(messages)}

        except Exception as e:
            print(f"Error updating inventory: {e}")
            return {
                "success": False,
                "message": f"Error actualizando inventario: {str(e)}",
            }

    def _create_financial_movement(
        self, customer_id, price_difference, return_product, new_product, reason
    ):
        """
        Creates account movement for price difference
        """
        try:
            # Generate operation number
            operation_result = self.db.execute_query(
                "SELECT MAX(numero_operacion) as max_num FROM account_movements"
            )
            operation_number = 1
            if operation_result and operation_result[0]["max_num"]:
                operation_number = operation_result[0]["max_num"] + 1

            # Create movement description
            description = f"Intercambio: {return_product['product_name']}"
            if new_product:
                description += f" → {new_product['product_name']}"
            if reason:
                description += f" - Motivo: {reason}"

            # Determine movement type based on price difference
            if price_difference > 0:
                # Customer owes money (debit)
                description += f" - Cliente debe: ${price_difference:.2f}"
                movement_data = {
                    "numero_operacion": operation_number,
                    "entity_id": customer_id,
                    "descripcion": description,
                    "medio_pago": "intercambio",
                    "debe": price_difference,
                    "haber": 0.0,
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
            else:
                # Customer receives credit (credit)
                description += f" - A favor del cliente: ${abs(price_difference):.2f}"
                movement_data = {
                    "numero_operacion": operation_number,
                    "entity_id": customer_id,
                    "descripcion": description,
                    "medio_pago": "intercambio",
                    "debe": 0.0,
                    "haber": abs(price_difference),
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }

            # Get current balance
            balance_query = """
            SELECT saldo FROM account_movements 
            WHERE entity_id = %s 
            ORDER BY created_at DESC LIMIT 1
            """
            balance_result = self.db.execute_query(balance_query, (customer_id,))
            current_balance = balance_result[0]["saldo"] if balance_result else 0.0

            # Calculate new balance
            if price_difference > 0:
                new_balance = current_balance + price_difference
            else:
                new_balance = current_balance - abs(price_difference)

            movement_data["saldo"] = new_balance

            # Insert movement
            result = self.db.add_record("account_movements", movement_data)

            if result["success"]:
                return {
                    "success": True,
                    "movement_id": result["rowid"],
                    "new_balance": new_balance,
                    "amount": price_difference,
                }
            else:
                return {
                    "success": False,
                    "message": f"Error creando movimiento financiero: {result['message']}",
                }

        except Exception as e:
            print(f"Error creating financial movement: {e}")
            return {
                "success": False,
                "message": f"Error en movimiento financiero: {str(e)}",
            }

    def _log_exchange_transaction(
        self, exchange_data, return_product, new_product, price_difference
    ):
        """
        Logs the exchange transaction for audit purposes
        """
        try:
            # Generate unique exchange ID
            exchange_id = f"EXC-{datetime.now().strftime('%Y%m%d%H%M%S')}"

            # Log transaction details (you can extend this to save to a dedicated exchanges table)
            log_info = {
                "exchange_id": exchange_id,
                "customer_id": exchange_data.get("customer_id"),
                "return_product": return_product["product_name"],
                "new_product": new_product["product_name"] if new_product else None,
                "price_difference": price_difference,
                "branch_id": exchange_data["branch_id"],
                "reason": exchange_data.get("reason", ""),
                "processed_by": exchange_data.get("user_id"),
                "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "status": "completed",
            }

            print(f"📝 Exchange logged: {log_info}")

            # TODO: In production, save log_info to a dedicated exchanges table
            # Example: self.db.add_record("exchanges", log_info)

            return {"exchange_id": exchange_id}

        except Exception as e:
            print(f"Error logging exchange transaction: {e}")
            return {"exchange_id": None}

    def get_exchange_history(self, customer_id=None, branch_id=None, limit=50):
        """
        Gets exchange history with filters
        """
        try:
            # For now, we'll get from account_movements with 'intercambio' payment method
            query = """
            SELECT 
                am.*,
                e.entity_name as customer_name
            FROM account_movements am
            JOIN entities e ON am.entity_id = e.id
            WHERE am.medio_pago = 'intercambio'
            """
            params = []

            if customer_id:
                query += " AND am.entity_id = %s"
                params.append(customer_id)

            query += " ORDER BY am.created_at DESC LIMIT %s"
            params.append(limit)

            result = self.db.execute_query(query, params)
            return {"success": True, "exchanges": result or []}

        except Exception as e:
            print(f"Error getting exchange history: {e}")
            return {
                "success": False,
                "message": f"Error obteniendo historial: {str(e)}",
            }
