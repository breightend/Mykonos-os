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
                "account_movements", "entity_id = ?", entity_id
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

    def get_client_movements(self, entity_id):
        """
        Gets all movements for a specific client

        Args:
            entity_id (int): ID of the client

        Returns:
            list: List of movements
        """
        try:
            movements = self.db.get_all_records_by_clause(
                "account_movements", "entity_id = ?", entity_id
            )

            # Sort by creation date (newest first)
            movements.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return movements

        except Exception as e:
            print(f"Error getting client movements: {e}")
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
