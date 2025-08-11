from database.database import Database
from datetime import datetime


class PaymentMethodsService:
    """
    Service class for managing payment methods
    """

    def __init__(self):
        self.db = Database()
        self.ensure_table_exists()

    def ensure_table_exists(self):
        """
        Ensures the payment_methods table exists, creates it if not
        """
        try:
            # Try to create table using raw SQL since it's not in the schema yet
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS payment_methods (
                id SERIAL PRIMARY KEY,
                method_name VARCHAR(100) NOT NULL UNIQUE,
                display_name VARCHAR(200) NOT NULL,
                description TEXT,
                is_active BOOLEAN NOT NULL DEFAULT true,
                requires_reference BOOLEAN NOT NULL DEFAULT false,
                icon_name VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """

            self.db.execute_query(create_table_sql)
            print("✅ Tabla payment_methods verificada/creada")

            # Create trigger for updated_at
            trigger_sql = """
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
            CREATE TRIGGER update_payment_methods_updated_at
                BEFORE UPDATE ON payment_methods
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            """

            self.db.execute_query(trigger_sql)
            print("✅ Trigger para payment_methods creado")

        except Exception as e:
            print(f"⚠️ Error creando tabla payment_methods: {e}")

    def create_payment_method(
        self,
        method_name,
        display_name,
        description=None,
        requires_reference=False,
        icon_name=None,
    ):
        """
        Creates a new payment method

        Args:
            method_name (str): Internal name for the payment method (lowercase, underscores)
            display_name (str): Display name for the payment method
            description (str): Optional description
            requires_reference (bool): Whether this method requires a reference number
            icon_name (str): Optional icon name for UI

        Returns:
            dict: Result of the operation
        """
        try:
            result = self.db.execute_query(
                """
                INSERT INTO payment_methods (method_name, display_name, description, requires_reference, icon_name, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    method_name,
                    display_name,
                    description,
                    requires_reference,
                    icon_name,
                    True,
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
            )

            if result and len(result) > 0:
                return {
                    "success": True,
                    "message": "Método de pago creado exitosamente",
                    "payment_method_id": result[0]["id"],
                }
            else:
                return {"success": False, "message": "Error al crear método de pago"}

        except Exception as e:
            return {
                "success": False,
                "message": f"Error en el servicio de métodos de pago: {e}",
            }

    def get_all_payment_methods(self, active_only=False):
        """
        Gets all payment methods

        Args:
            active_only (bool): If True, only returns active payment methods

        Returns:
            list: List of payment methods
        """
        try:
            if active_only:
                payment_methods = self.db.execute_query(
                    "SELECT * FROM payment_methods WHERE is_active = %s ORDER BY display_name",
                    (True,),
                )
            else:
                payment_methods = self.db.execute_query(
                    "SELECT * FROM payment_methods ORDER BY display_name"
                )

            return payment_methods or []

        except Exception as e:
            print(f"Error getting payment methods: {e}")
            return []

    def get_payment_method_by_id(self, payment_method_id):
        """
        Gets a specific payment method by ID

        Args:
            payment_method_id (int): ID of the payment method

        Returns:
            dict: Payment method data or None
        """
        try:
            result = self.db.execute_query(
                "SELECT * FROM payment_methods WHERE id = %s", (payment_method_id,)
            )
            return result[0] if result and len(result) > 0 else None
        except Exception as e:
            print(f"Error getting payment method: {e}")
            return None

    def get_payment_method_by_name(self, method_name):
        """
        Gets a specific payment method by name

        Args:
            method_name (str): Internal name of the payment method

        Returns:
            dict: Payment method data or None
        """
        try:
            result = self.db.execute_query(
                "SELECT * FROM payment_methods WHERE method_name = %s", (method_name,)
            )
            return result[0] if result and len(result) > 0 else None
        except Exception as e:
            print(f"Error getting payment method by name: {e}")
            return None

    def update_payment_method(self, payment_method_id, **kwargs):
        """
        Updates a payment method

        Args:
            payment_method_id (int): ID of the payment method
            **kwargs: Fields to update

        Returns:
            dict: Result of the operation
        """
        try:
            # Build dynamic update query
            set_clauses = []
            params = []

            for key, value in kwargs.items():
                set_clauses.append(f"{key} = %s")
                params.append(value)

            # Add updated_at timestamp
            set_clauses.append("updated_at = %s")
            params.append(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

            # Add id for WHERE clause
            params.append(payment_method_id)

            query = f"UPDATE payment_methods SET {', '.join(set_clauses)} WHERE id = %s"

            self.db.execute_query(query, tuple(params))

            return {
                "success": True,
                "message": "Método de pago actualizado exitosamente",
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error en el servicio de métodos de pago: {e}",
            }

    def delete_payment_method(self, payment_method_id):
        """
        Deactivates a payment method (soft delete)

        Args:
            payment_method_id (int): ID of the payment method

        Returns:
            dict: Result of the operation
        """
        try:
            return self.update_payment_method(payment_method_id, is_active=0)

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al desactivar método de pago: {e}",
            }

    def activate_payment_method(self, payment_method_id):
        """
        Activates a payment method

        Args:
            payment_method_id (int): ID of the payment method

        Returns:
            dict: Result of the operation
        """
        try:
            return self.update_payment_method(payment_method_id, is_active=1)

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al activar método de pago: {e}",
            }

    def initialize_default_payment_methods(self):
        """
        Creates default payment methods if they don't exist
        """
        default_methods = [
            {
                "method_name": "efectivo",
                "display_name": "Efectivo",
                "description": "Pago en efectivo",
                "requires_reference": False,
                "icon_name": "HandCoins",
            },
            {
                "method_name": "tarjeta_debito",
                "display_name": "Tarjeta de Débito",
                "description": "Pago con tarjeta de débito",
                "requires_reference": True,
                "icon_name": "CreditCard",
            },
            {
                "method_name": "tarjeta_credito",
                "display_name": "Tarjeta de Crédito",
                "description": "Pago con tarjeta de crédito",
                "requires_reference": True,
                "icon_name": "CreditCard",
            },
            {
                "method_name": "transferencia",
                "display_name": "Transferencia Bancaria",
                "description": "Transferencia bancaria",
                "requires_reference": True,
                "icon_name": "Landmark",
            },
            {
                "method_name": "cheque",
                "display_name": "Cheque",
                "description": "Pago con cheque",
                "requires_reference": True,
                "icon_name": "CheckCircle",
            },
            {
                "method_name": "cuenta_corriente",
                "display_name": "Cuenta Corriente",
                "description": "Pago a cuenta corriente",
                "requires_reference": False,
                "icon_name": "FileText",
            },
        ]

        results = []
        for method in default_methods:
            # Check if method already exists
            existing = self.get_payment_method_by_name(method["method_name"])
            if not existing:
                result = self.create_payment_method(**method)
                results.append(result)
            else:
                results.append(
                    {
                        "success": True,
                        "message": f"Método de pago '{method['display_name']}' ya existe",
                    }
                )

        return results