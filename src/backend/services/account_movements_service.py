from database.database import Database
from datetime import datetime


class AccountMovementsService:
    """
    Service class for managing account movements (cuenta corriente)
    """

    def __init__(self):
        self.db = Database()

    def create_debit_movement(
        self,
        entity_id,
        amount,
        description="Venta a cuenta corriente",
        medio_pago="cuenta_corriente",
        numero_operacion=None,
        purchase_id=None,
        partial_payment=0.0,
        partial_payment_method="efectivo",
    ):
        """
        Creates a debit movement for a client (when they buy on credit)

        Args:
            entity_id (int): ID of the client
            amount (float): Total amount of the debt
            description (str): Description of the movement
            medio_pago (str): Payment method for the debt (usually "cuenta_corriente")
            numero_operacion (int): Operation number (optional)
            purchase_id (int): Related purchase ID (optional)
            partial_payment (float): Amount paid upfront (optional)
            partial_payment_method (str): Payment method for partial payment (efectivo, tarjeta, etc.)

        Returns:
            dict: Result of the operation
        """
        try:
            # Get the last balance for this client
            last_balance = self.get_client_balance(entity_id)

            # Calculate actual debt (total amount minus partial payment)
            actual_debt = amount - partial_payment

            # Calculate new balance (debit increases the debt)
            new_balance = last_balance + actual_debt

            # Generate operation number if not provided
            if not numero_operacion:
                numero_operacion = self.generate_operation_number()

            # Build description with payment info
            full_description = description
            if partial_payment > 0:
                full_description += f" - Pago parcial ({partial_payment_method}): ${partial_payment:.2f} - Deuda: ${actual_debt:.2f}"

            movement_data = {
                "numero_operacion": numero_operacion,
                "entity_id": entity_id,
                "descripcion": full_description,
                "medio_pago": medio_pago,
                "purchase_id": purchase_id,
                "debe": actual_debt,  # Debit amount (what client owes after partial payment)
                "haber": 0.0,  # Credit amount (what client pays)
                "saldo": new_balance,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            result = self.db.add_record("account_movements", movement_data)

            if result["success"]:
                return {
                    "success": True,
                    "message": "Movimiento de débito creado exitosamente",
                    "movement_id": result["rowid"],
                    "new_balance": new_balance,
                    "total_amount": amount,
                    "partial_payment": partial_payment,
                    "partial_payment_method": partial_payment_method,
                    "actual_debt": actual_debt,
                }
            else:
                return {
                    "success": False,
                    "message": f"Error al crear movimiento: {result['message']}",
                }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error en el servicio de movimientos: {e}",
            }

    def create_credit_movement(
        self,
        entity_id,
        amount,
        description="Pago de cliente",
        medio_pago="efectivo",
        numero_operacion=None,
        numero_de_comprobante=None,
        bank_id=None,
        transaction_number=None,
        echeq_time=None,
        invoice_number=None,
        invoice_file=None,
    ):
        """
        Creates a credit movement for a client (when they make a payment)

        Args:
            entity_id (int): ID of the client
            amount (float): Amount of the payment
            description (str): Description of the movement
            medio_pago (str): Payment method
            numero_operacion (int): Operation number (optional)
            numero_de_comprobante (str): Receipt number (optional)
            bank_id (int): Bank ID for payment (optional)
            transaction_number (str): Transaction number (optional)
            echeq_time (str): E-cheque time for deferred payments (optional)
            invoice_number (str): Invoice number (optional)
            invoice_file: Invoice file attachment (optional)

        Returns:
            dict: Result of the operation
        """
        try:
            # Get the last balance for this client
            last_balance = self.get_client_balance(entity_id)

            # Calculate new balance (credit reduces the debt)
            new_balance = last_balance - amount

            # Generate operation number if not provided
            if not numero_operacion:
                numero_operacion = self.generate_operation_number()

            movement_data = {
                "numero_operacion": numero_operacion,
                "entity_id": entity_id,
                "descripcion": description,
                "medio_pago": medio_pago,
                "numero_de_comprobante": numero_de_comprobante,
                "debe": 0.0,  # Debit amount (what client owes)
                "haber": amount,  # Credit amount (what client pays)
                "saldo": new_balance,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            # Add optional fields if provided
            if bank_id:
                movement_data["bank_id"] = bank_id
            if transaction_number:
                movement_data["transaction_number"] = transaction_number
            if echeq_time:
                movement_data["echeq_time"] = echeq_time
            if invoice_number:
                movement_data["invoice_number"] = invoice_number
            if invoice_file:
                movement_data["invoice_file"] = invoice_file

            result = self.db.add_record("account_movements", movement_data)

            if result["success"]:
                return {
                    "success": True,
                    "message": "Movimiento de crédito creado exitosamente",
                    "movement_id": result["rowid"],
                    "new_balance": new_balance,
                }
            else:
                return {
                    "success": False,
                    "message": f"Error al crear movimiento: {result['message']}",
                }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error en el servicio de movimientos: {e}",
            }

    def get_client_balance(self, entity_id):
        """
        Gets the current balance for a client

        Args:
            entity_id (int): ID of the client

        Returns:
            float: Current balance
        """
        try:
            # Get the most recent movement for this client
            movements = self.db.get_all_records_by_clause(
                "account_movements", "entity_id = %s", entity_id
            )

            if movements:
                # Sort by creation date and get the latest
                movements.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                return float(movements[0].get("saldo", 0))
            else:
                return 0.0

        except Exception as e:
            print(f"Error getting client balance: {e}")
            return 0.0

    def get_provider_balance(self, entity_id):
        """
        Gets the current balance for a provider (provider-specific logic)

        For providers:
        - Positive balance = We owe the provider money (we need to pay them)
        - Negative balance = Provider owes us money (they have credit with us)

        Args:
            entity_id (int): ID of the provider

        Returns:
            float: Current balance
        """
        try:
            # Get the most recent movement for this provider
            movements = self.db.get_all_records_by_clause(
                "account_movements", "entity_id = %s", entity_id
            )

            if movements:
                # Sort by creation date and get the latest
                movements.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                latest_balance = float(movements[0].get("saldo", 0))

                # For providers, we return the balance as-is since the logic is already correct:
                # - When we create a debit (purchase), it increases our debt to the provider
                # - When we create a credit (payment), it decreases our debt to the provider
                return latest_balance
            else:
                return 0.0

        except Exception as e:
            print(f"Error getting provider balance: {e}")
            return 0.0

    def create_provider_credit_movement(
        self,
        entity_id,
        amount,
        description="Pago a proveedor",
        medio_pago="efectivo",
        numero_operacion=None,
        numero_de_comprobante=None,
        bank_id=None,
        transaction_number=None,
        echeq_time=None,
        invoice_number=None,
        invoice_file=None,
    ):
        """
        Creates a credit movement for a provider (when we pay them)

        Args:
            entity_id (int): ID of the provider
            amount (float): Amount of the payment
            description (str): Description of the movement
            medio_pago (str): Payment method
            numero_operacion (int): Operation number (optional)
            numero_de_comprobante (str): Receipt number (optional)
            bank_id (int): Bank ID for payment (optional)
            transaction_number (str): Transaction number (optional)
            echeq_time (str): E-cheque time for deferred payments (optional)
            invoice_number (str): Invoice number (optional)
            invoice_file: Invoice file attachment (optional)

        Returns:
            dict: Result of the operation
        """
        try:
            # Get the last balance for this provider
            last_balance = self.get_provider_balance(entity_id)

            # Calculate new balance (credit reduces our debt to the provider)
            new_balance = last_balance - amount

            # Generate operation number if not provided
            if not numero_operacion:
                numero_operacion = self.generate_operation_number()

            # Get or create default payment method
            payment_method_id = self._get_default_payment_method()

            movement_data = {
                "numero_operacion": numero_operacion,
                "entity_id": entity_id,
                "descripcion": description,
                "payment_method": payment_method_id,  # Use valid payment method ID
                "numero_de_comprobante": numero_de_comprobante,
                "debe": 0.0,  # Debit amount (we don't owe more)
                "haber": amount,  # Credit amount (we pay the provider)
                "saldo": new_balance,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            # Note: The following fields (bank_id, transaction_number, echeq_time,
            # invoice_number, invoice_file) are not in the current database schema
            # They will be ignored for now until the schema is updated

            result = self.db.add_record("account_movements", movement_data)

            if result["success"]:
                return {
                    "success": True,
                    "message": "Pago a proveedor registrado exitosamente",
                    "movement_id": result["rowid"],
                    "new_balance": new_balance,
                    "payment_id": result["rowid"],
                }
            else:
                return {"success": False, "message": "Error al insertar el movimiento"}

        except Exception as e:
            print(f"Error creating provider credit movement: {e}")
            return {"success": False, "message": f"Error interno del servidor: {e}"}

    def create_provider_debit_movement(
        self,
        entity_id,
        amount,
        description="Compra a proveedor",
        purchase_id=None,
        partial_payment=0.0,
        partial_payment_method="efectivo",
    ):
        """
        Creates a debit movement for a provider (when we buy from them and create debt)

        Args:
            entity_id (int): ID of the provider
            amount (float): Total amount of the purchase
            description (str): Description of the movement
            purchase_id (int): Related purchase ID (optional)
            partial_payment (float): Amount paid upfront (optional)
            partial_payment_method (str): Payment method for partial payment (efectivo, tarjeta, etc.)

        Returns:
            dict: Result of the operation
        """
        try:
            # Get the last balance for this provider
            last_balance = self.get_provider_balance(entity_id)

            # Calculate actual debt (total amount minus partial payment)
            actual_debt = amount - partial_payment

            # Calculate new balance (debit increases our debt to the provider)
            new_balance = last_balance + actual_debt

            # Generate operation number
            numero_operacion = self.generate_operation_number()

            # Build description with payment info
            full_description = description
            if partial_payment > 0:
                full_description += f" - Pago parcial ({partial_payment_method}): ${partial_payment:.2f} - Deuda: ${actual_debt:.2f}"

            # Get or create default payment method
            payment_method_id = self._get_default_payment_method()

            movement_data = {
                "numero_operacion": numero_operacion,
                "entity_id": entity_id,
                "descripcion": full_description,
                "payment_method": payment_method_id,  # Use valid payment method ID
                "debe": actual_debt,  # Debit amount (debt we owe to provider)
                "haber": 0.0,  # Credit amount (no payment)
                "saldo": new_balance,
                "purchase_id": purchase_id,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            result = self.db.add_record("account_movements", movement_data)

            if result["success"]:
                return {
                    "success": True,
                    "message": "Deuda a proveedor registrada exitosamente",
                    "movement_id": result["rowid"],
                    "new_balance": new_balance,
                    "pending_amount": actual_debt,
                }
            else:
                return {"success": False, "message": "Error al insertar el movimiento"}

        except Exception as e:
            print(f"Error creating provider debit movement: {e}")
            return {"success": False, "message": f"Error interno del servidor: {e}"}

    def get_client_movements(self, entity_id):
        """
        Gets all movements for a specific client with purchase and payment details if available

        Args:
            entity_id (int): ID of the client

        Returns:
            list: List of movements with purchase and payment information
        """
        try:
            # Enhanced query with LEFT JOINs to include purchase details and payment information
            query = """
            SELECT 
                am.*,
                p.id as purchase_info_id,
                p.subtotal as purchase_subtotal,
                p.discount as purchase_discount,
                p.total as purchase_total,
                p.status as purchase_status,
                p.delivery_date as purchase_delivery_date,
                p.notes as purchase_notes,
                p.invoice_number as purchase_invoice_number,
                p.purchase_date as purchase_date,
                -- Purchase payments summary
                pp_summary.total_payments,
                pp_summary.payment_count,
                pp_summary.last_payment_date,
                pp_summary.payment_methods
            FROM account_movements am
            LEFT JOIN purchases p ON am.purchase_id = p.id
            LEFT JOIN (
                SELECT 
                    purchase_id,
                    SUM(amount) as total_payments,
                    COUNT(*) as payment_count,
                    MAX(payment_date) as last_payment_date,
                    STRING_AGG(DISTINCT payment_method, ', ') as payment_methods
                FROM purchases_payments 
                GROUP BY purchase_id
            ) pp_summary ON p.id = pp_summary.purchase_id
            WHERE am.entity_id = %s
            ORDER BY am.created_at DESC
            """

            result = self.db.execute_query(query, (entity_id,))

            if result.get("success"):
                movements = result.get("data", [])
                return movements
            else:
                # Fallback to old method if query fails
                movements = self.db.get_all_records_by_clause(
                    "account_movements", "entity_id = %s", entity_id
                )
                # Sort by creation date (newest first)
                movements.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                return movements

        except Exception as e:
            print(f"Error getting client movements with purchase details: {e}")
            # Fallback to old method
            try:
                movements = self.db.get_all_records_by_clause(
                    "account_movements", "entity_id = %s", entity_id
                )
                movements.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                return movements
            except Exception as e2:
                print(f"Error in fallback method: {e2}")
                return []

    def generate_operation_number(self):
        """
        Generates a unique operation number

        Returns:
            int: Operation number
        """
        try:
            # Get the highest operation number and add 1
            result = self.db.execute_query(
                "SELECT MAX(numero_operacion) as max_num FROM account_movements"
            )
            if result and result[0]["max_num"]:
                return result[0]["max_num"] + 1
            else:
                return 1

        except Exception as e:
            print(f"Error generating operation number: {e}")
            # Fallback to timestamp-based number
            return int(datetime.now().timestamp())

    def _get_default_payment_method(self):
        """
        Get or create a default payment method for account movements.
        Returns a valid banks_payment_methods ID.

        Returns:
            int: Valid banks_payment_methods ID
        """
        try:
            # First, try to get any existing banks_payment_methods entry
            result = self.db.execute_query(
                "SELECT id FROM banks_payment_methods ORDER BY id LIMIT 1"
            )

            if result and len(result) > 0:
                return result[0]["id"]

            # If no banks_payment_methods exist, we need to create the basic structure
            print("⚠️ No banks_payment_methods found, creating default entries...")

            # Create default payment method if it doesn't exist
            payment_method_result = self.db.execute_query(
                "SELECT id FROM payment_methods WHERE method_name = 'efectivo'"
            )

            if not payment_method_result:
                # Create default payment method
                payment_method_id = self.db.execute_insert(
                    "payment_methods",
                    {
                        "method_name": "efectivo",
                        "display_name": "Efectivo",
                        "description": "Pago en efectivo",
                        "is_active": 1,
                        "requires_reference": 0,
                        "icon_name": "cash",
                        "provider_use_it": 1,
                        "client_use_it": 1,
                    },
                )
            else:
                payment_method_id = payment_method_result[0]["id"]

            # Create default bank if it doesn't exist
            bank_result = self.db.execute_query(
                "SELECT id FROM banks WHERE name = 'Banco Genérico'"
            )

            if not bank_result:
                bank_id = self.db.execute_insert(
                    "banks", {"name": "Banco Genérico", "swift_code": "GENERICO"}
                )
            else:
                bank_id = bank_result[0]["id"]

            # Create banks_payment_methods association
            banks_payment_method_id = self.db.execute_insert(
                "banks_payment_methods",
                {
                    "bank_id": bank_id,
                    "payment_method_id": payment_method_id,
                    "amount": 0.00,
                },
            )

            print(
                f"✅ Created default banks_payment_methods entry with ID: {banks_payment_method_id}"
            )
            return banks_payment_method_id

        except Exception as e:
            print(f"❌ Error getting/creating default payment method: {e}")
            # Return None to cause the foreign key to be NULL rather than invalid
            return None
