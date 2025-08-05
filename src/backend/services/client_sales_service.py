from database.database import Database
from datetime import datetime


class ClientSalesService:
    """
    Service class for managing client sales history and product transactions
    """

    def __init__(self):
        self.db = Database()

    def get_client_sales_history(self, entity_id):
        """
        Gets complete sales history for a client including product details

        Args:
            entity_id (int): ID of the client

        Returns:
            list: List of sales with product information
        """
        try:
            # For now, we'll use account_movements to simulate sales
            # In a real implementation, you'd have a proper sales table
            query = """
            SELECT 
                am.id as movement_id,
                am.numero_operacion,
                am.descripcion,
                am.debe as amount,
                am.medio_pago,
                am.created_at,
                am.purchase_id,
                e.entity_name as client_name,
                e.cuit as client_cuit
            FROM account_movements am
            JOIN entities e ON am.entity_id = e.id
            WHERE am.entity_id = ? 
            AND am.debe > 0
            ORDER BY am.created_at DESC
            """

            movements = self.db.execute_query(query, (entity_id,))

            # For each movement, try to extract product information from description
            sales_history = []
            for movement in movements:
                if isinstance(movement, dict):
                    sale_info = {
                        "sale_id": movement.get("movement_id"),
                        "operation_number": movement.get("numero_operacion"),
                        "description": movement.get("descripcion", ""),
                        "total_amount": movement.get("amount", 0),
                        "payment_method": movement.get("medio_pago", ""),
                        "sale_date": movement.get("created_at", ""),
                        "purchase_id": movement.get("purchase_id"),
                        "client_name": movement.get("client_name", ""),
                        "client_cuit": movement.get("client_cuit", ""),
                        "status": "completed",  # Default status
                        "products": [],  # Will be populated if we have detailed product info
                    }
                    sales_history.append(sale_info)

            return sales_history

        except Exception as e:
            print(f"Error getting client sales history: {e}")
            return []

    def create_return_transaction(
        self,
        entity_id,
        original_sale_id,
        return_amount,
        return_reason,
        products_returned=None,
    ):
        """
        Creates a return transaction for a client

        Args:
            entity_id (int): ID of the client
            original_sale_id (int): ID of the original sale
            return_amount (float): Amount being returned
            return_reason (str): Reason for the return
            products_returned (list): List of products being returned (optional)

        Returns:
            dict: Result of the operation
        """
        try:
            # Create a credit movement for the return
            operation_number = self.generate_operation_number()

            description = f"Devolución - Venta #{original_sale_id}"
            if return_reason:
                description += f" - Motivo: {return_reason}"

            movement_data = {
                "numero_operacion": operation_number,
                "entity_id": entity_id,
                "descripcion": description,
                "medio_pago": "devolucion",
                "purchase_id": original_sale_id,
                "debe": 0.0,
                "haber": return_amount,
                "saldo": self.get_client_balance(entity_id) - return_amount,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            result = self.db.add_record("account_movements", movement_data)

            if result["success"]:
                return {
                    "success": True,
                    "message": "Devolución registrada exitosamente",
                    "movement_id": result["rowid"],
                    "new_balance": movement_data["saldo"],
                }
            else:
                return {
                    "success": False,
                    "message": f"Error al registrar devolución: {result['message']}",
                }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error en el servicio de devoluciones: {e}",
            }

    def create_exchange_transaction(
        self, entity_id, original_sale_id, exchange_details
    ):
        """
        Creates an exchange transaction for a client

        Args:
            entity_id (int): ID of the client
            original_sale_id (int): ID of the original sale
            exchange_details (dict): Details of the exchange including amounts and products

        Returns:
            dict: Result of the operation
        """
        try:
            operation_number = self.generate_operation_number()

            # Calculate the difference (positive = client owes more, negative = client gets credit)
            difference = exchange_details.get("new_amount", 0) - exchange_details.get(
                "original_amount", 0
            )

            description = f"Cambio - Venta #{original_sale_id}"
            if exchange_details.get("reason"):
                description += f" - Motivo: {exchange_details['reason']}"

            current_balance = self.get_client_balance(entity_id)

            if difference > 0:
                # Client owes more money (debit)
                movement_data = {
                    "numero_operacion": operation_number,
                    "entity_id": entity_id,
                    "descripcion": description
                    + f" - Diferencia a pagar: ${difference:.2f}",
                    "medio_pago": "cambio",
                    "purchase_id": original_sale_id,
                    "debe": difference,
                    "haber": 0.0,
                    "saldo": current_balance + difference,
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
            elif difference < 0:
                # Client gets money back (credit)
                movement_data = {
                    "numero_operacion": operation_number,
                    "entity_id": entity_id,
                    "descripcion": description
                    + f" - Diferencia a favor: ${abs(difference):.2f}",
                    "medio_pago": "cambio",
                    "purchase_id": original_sale_id,
                    "debe": 0.0,
                    "haber": abs(difference),
                    "saldo": current_balance - abs(difference),
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
            else:
                # No difference in amount, just record the exchange
                movement_data = {
                    "numero_operacion": operation_number,
                    "entity_id": entity_id,
                    "descripcion": description + " - Sin diferencia de precio",
                    "medio_pago": "cambio",
                    "purchase_id": original_sale_id,
                    "debe": 0.0,
                    "haber": 0.0,
                    "saldo": current_balance,
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }

            result = self.db.add_record("account_movements", movement_data)

            if result["success"]:
                return {
                    "success": True,
                    "message": "Cambio registrado exitosamente",
                    "movement_id": result["rowid"],
                    "new_balance": movement_data["saldo"],
                    "difference": difference,
                }
            else:
                return {
                    "success": False,
                    "message": f"Error al registrar cambio: {result['message']}",
                }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error en el servicio de cambios: {e}",
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
            movements = self.db.get_all_records_by_clause(
                "account_movements", "entity_id = ?", entity_id
            )

            if movements:
                movements.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                return float(movements[0].get("saldo", 0))
            else:
                return 0.0

        except Exception as e:
            print(f"Error getting client balance: {e}")
            return 0.0

    def generate_operation_number(self):
        """
        Generates a unique operation number

        Returns:
            int: Operation number
        """
        try:
            result = self.db.execute_query(
                "SELECT MAX(numero_operacion) as max_num FROM account_movements"
            )
            if result and result[0]["max_num"]:
                return result[0]["max_num"] + 1
            else:
                return 1

        except Exception as e:
            print(f"Error generating operation number: {e}")
            return int(datetime.now().timestamp())

    def get_sale_details(self, sale_id):
        """
        Gets detailed information about a specific sale

        Args:
            sale_id (int): ID of the sale

        Returns:
            dict: Sale details
        """
        try:
            query = """
            SELECT 
                am.*,
                e.entity_name as client_name,
                e.cuit as client_cuit
            FROM account_movements am
            JOIN entities e ON am.entity_id = e.id
            WHERE am.id = ?
            """

            result = self.db.execute_query(query, (sale_id,))

            if result and len(result) > 0:
                return result[0]
            else:
                return None

        except Exception as e:
            print(f"Error getting sale details: {e}")
            return None
