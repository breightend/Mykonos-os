"""
Test script to add sales data with products for testing the client sales history
"""

import sqlite3
from datetime import datetime


def add_test_sales_data():
    conn = sqlite3.connect("database/mykonos.db")
    cursor = conn.cursor()

    try:
        # First, let's see what entities exist
        cursor.execute(
            "SELECT entity_id, entity_name FROM entities WHERE entity_type = 'client' LIMIT 5"
        )
        clients = cursor.fetchall()
        print("Available clients:")
        for client in clients:
            print(f"ID: {client[0]}, Name: {client[1]}")

        if not clients:
            print("No clients found!")
            return

        client_id = clients[0][0]  # Use first client

        # Check if products table exists and has data
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='products'"
        )
        if not cursor.fetchone():
            print("Products table doesn't exist, creating mock sales...")

            # Add sales with mock product data directly to account_movements
            test_sales = [
                {
                    "description": "Venta - Producto A x2",
                    "amount": 250.00,
                    "product_name": "Producto A",
                    "quantity": 2,
                    "unit_price": 125.00,
                },
                {
                    "description": "Venta - Producto B x1",
                    "amount": 180.00,
                    "product_name": "Producto B",
                    "quantity": 1,
                    "unit_price": 180.00,
                },
                {
                    "description": "Venta - Producto C x3",
                    "amount": 450.00,
                    "product_name": "Producto C",
                    "quantity": 3,
                    "unit_price": 150.00,
                },
            ]

            for sale in test_sales:
                cursor.execute(
                    """
                    INSERT INTO account_movements 
                    (entity_id, debe, haber, saldo, description, operation_type, operation_number, payment_method, created_at)
                    VALUES (?, ?, 0, ?, ?, 'sale', 
                        (SELECT COALESCE(MAX(operation_number), 0) + 1 FROM account_movements WHERE entity_id = ?),
                        'cuenta_corriente', ?)
                """,
                    (
                        client_id,
                        sale["amount"],
                        sale["amount"],
                        sale["description"],
                        client_id,
                        datetime.now(),
                    ),
                )

                # Get the last inserted movement ID
                movement_id = cursor.lastrowid
                print(
                    f"Added sale: {sale['description']} for client {client_id}, movement_id: {movement_id}"
                )

        conn.commit()
        print("Test sales data added successfully!")

        # Now test our API by showing the data
        cursor.execute(
            """
            SELECT entity_id, description, debe, created_at, operation_number
            FROM account_movements 
            WHERE entity_id = ? AND debe > 0
            ORDER BY created_at DESC
        """,
            (client_id,),
        )

        movements = cursor.fetchall()
        print(f"\nSales for client {client_id}:")
        for mov in movements:
            print(f"Op #{mov[4]}: {mov[1]} - ${mov[2]} on {mov[3]}")

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    add_test_sales_data()
