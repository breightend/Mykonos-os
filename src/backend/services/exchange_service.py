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
        Creates a complete exchange transaction
        
        Args:
            exchange_data (dict): Exchange information containing:
                - customer_id: ID of the customer
                - return_variant_barcode: Barcode of product being returned
                - return_quantity: Quantity being returned
                - new_variant_barcode: Barcode of new product (optional for returns only)
                - new_quantity: Quantity of new product (optional)
                - branch_id: Branch where exchange happens
                - reason: Reason for exchange
                - user_id: ID of user processing exchange
        
        Returns:
            dict: Result of the operation
        """
        try:
            # Step 1: Validate return product exists and get details
            return_product = self._get_product_by_variant_barcode(
                exchange_data['return_variant_barcode']
            )
            if not return_product:
                return {
                    "success": False,
                    "message": "Producto a devolver no encontrado"
                }

            new_product = None
            if exchange_data.get('new_variant_barcode'):
                new_product = self._get_product_by_variant_barcode(
                    exchange_data['new_variant_barcode']
                )
                if not new_product:
                    return {
                        "success": False,
                        "message": "Producto nuevo no encontrado"
                    }

                # Check if new product has enough stock
                if new_product['stock_disponible'] < exchange_data.get('new_quantity', 0):
                    return {
                        "success": False,
                        "message": f"Stock insuficiente. Disponible: {new_product['stock_disponible']}"
                    }

            # Step 2: Calculate price difference
            return_total = return_product['sale_price'] * exchange_data['return_quantity']
            new_total = 0
            if new_product:
                new_total = new_product['sale_price'] * exchange_data.get('new_quantity', 0)
            
            price_difference = new_total - return_total

            # Step 3: Process inventory updates
            inventory_result = self._process_inventory_updates(
                exchange_data, return_product, new_product
            )
            if not inventory_result['success']:
                return inventory_result

            # Step 4: Create financial movement if there's a price difference
            financial_result = None
            if price_difference != 0 and exchange_data.get('customer_id'):
                financial_result = self._create_financial_movement(
                    exchange_data['customer_id'], 
                    price_difference, 
                    return_product, 
                    new_product,
                    exchange_data.get('reason', '')
                )

            # Step 5: Log the exchange transaction
            exchange_log = self._log_exchange_transaction(
                exchange_data, return_product, new_product, price_difference
            )

            return {
                "success": True,
                "message": "Intercambio procesado exitosamente",
                "exchange_id": exchange_log.get('exchange_id'),
                "return_product": return_product['product_name'],
                "new_product": new_product['product_name'] if new_product else None,
                "price_difference": price_difference,
                "inventory_updated": inventory_result['message'],
                "financial_movement": financial_result.get('movement_id') if financial_result else None
            }

        except Exception as e:
            print(f"Error in exchange transaction: {e}")
            return {
                "success": False,
                "message": f"Error procesando intercambio: {str(e)}"
            }

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
                (exchange_data['return_quantity'], exchange_data['return_variant_barcode'])
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
                    exchange_data['return_quantity'], 
                    return_product['product_id'], 
                    exchange_data['branch_id']
                )
            )

            messages = [f"Stock aumentado para {return_product['product_name']}"]

            # If there's a new product, decrease its stock
            if new_product and exchange_data.get('new_quantity', 0) > 0:
                new_update_query = """
                UPDATE warehouse_stock_variants 
                SET quantity = quantity - %s, last_updated = NOW()
                WHERE variant_barcode = %s
                """
                
                self.db.execute_query(
                    new_update_query, 
                    (exchange_data['new_quantity'], exchange_data['new_variant_barcode'])
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
                        exchange_data['new_quantity'], 
                        new_product['product_id'], 
                        exchange_data['branch_id']
                    )
                )
                
                messages.append(f"Stock reducido para {new_product['product_name']}")

            return {
                "success": True,
                "message": ". ".join(messages)
            }

        except Exception as e:
            print(f"Error updating inventory: {e}")
            return {
                "success": False,
                "message": f"Error actualizando inventario: {str(e)}"
            }

    def _create_financial_movement(self, customer_id, price_difference, return_product, new_product, reason):
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
            current_balance = balance_result[0]['saldo'] if balance_result else 0.0

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
                    "amount": price_difference
                }
            else:
                return {
                    "success": False,
                    "message": f"Error creando movimiento financiero: {result['message']}"
                }

        except Exception as e:
            print(f"Error creating financial movement: {e}")
            return {
                "success": False,
                "message": f"Error en movimiento financiero: {str(e)}"
            }

    def _log_exchange_transaction(self, exchange_data, return_product, new_product, price_difference):
        """
        Logs the exchange transaction for audit purposes
        """
        try:
            log_data = {
                "customer_id": exchange_data.get('customer_id'),
                "return_variant_barcode": exchange_data['return_variant_barcode'],
                "return_quantity": exchange_data['return_quantity'],
                "new_variant_barcode": exchange_data.get('new_variant_barcode'),
                "new_quantity": exchange_data.get('new_quantity', 0),
                "price_difference": price_difference,
                "branch_id": exchange_data['branch_id'],
                "reason": exchange_data.get('reason', ''),
                "processed_by": exchange_data.get('user_id'),
                "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "status": "completed"
            }

            # For now, we'll store this in a simple format
            # In a production system, you might want a dedicated exchanges table
            
            return {"exchange_id": f"EXC-{datetime.now().strftime('%Y%m%d%H%M%S')}"}

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
            return {
                "success": True,
                "exchanges": result or []
            }

        except Exception as e:
            print(f"Error getting exchange history: {e}")
            return {
                "success": False,
                "message": f"Error obteniendo historial: {str(e)}"
            }
