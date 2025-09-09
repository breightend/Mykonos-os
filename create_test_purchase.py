#!/usr/bin/env python3
"""
Script to create test purchases for demonstration purposes.
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database
from datetime import datetime, timedelta
import random


def create_test_purchases():
    db = Database()

    # First, let's check if we have any entities (providers)
    entities = db.get_all_records("entities")
    print(f"Found {len(entities)} entities")

    if not entities:
        print("No entities found. Creating test provider...")
        # Create a test provider
        provider_data = {
            "entity_name": "Proveedor Test SA",
            "entity_type": "proveedor",
            "razon_social": "Proveedor Test Sociedad Anónima",
            "responsabilidad_iva": 1,
            "domicilio_comercial": "Av. Corrientes 1234, CABA",
            "cuit": "30-12345678-9",
            "phone_number": "+54 11 1234-5678",
            "email": "contacto@proveedortest.com.ar",
            "observations": "Proveedor de prueba para demostración",
        }
        result = db.add_record("entities", provider_data)
        if result.get("success"):
            provider_id = result.get("rowid")
            print(f"Created test provider with ID: {provider_id}")
        else:
            print("Failed to create test provider")
            return
    else:
        provider_id = entities[0]["id"]
        print(f"Using existing provider with ID: {provider_id}")

    # Check if we have products
    products = db.get_all_records("products")
    print(f"Found {len(products)} products")

    if not products:
        print("No products found. Creating test products...")
        # Create test products
        test_products = [
            {
                "product_name": "Jean Clásico",
                "description": "Jean de corte clásico, color azul",
                "cost": 15000,
                "sale_price": 25000,
                "provider_id": provider_id,
                "state": "activo",
            },
            {
                "product_name": "Remera Básica",
                "description": "Remera de algodón 100%",
                "cost": 8000,
                "sale_price": 15000,
                "provider_id": provider_id,
                "state": "activo",
            },
            {
                "product_name": "Zapatillas Deportivas",
                "description": "Zapatillas para running",
                "cost": 35000,
                "sale_price": 60000,
                "provider_id": provider_id,
                "state": "activo",
            },
        ]

        product_ids = []
        for product_data in test_products:
            result = db.add_record("products", product_data)
            if result.get("success"):
                product_ids.append(result.get("rowid"))
                print(f"Created product: {product_data['product_name']}")
            else:
                print(f"Failed to create product: {product_data['product_name']}")
    else:
        product_ids = [p["id"] for p in products[:3]]  # Use first 3 products
        print(f"Using existing products: {product_ids}")

    # Check if we have payment methods
    payment_methods = db.execute_query("SELECT id FROM banks_payment_methods LIMIT 1")
    if not payment_methods:
        print(
            "No payment methods found. Creating a basic payment method combination..."
        )
        # First check if we have banks and payment methods
        banks = db.get_all_records("banks")
        basic_methods = db.get_all_records("payment_methods")

        if banks and basic_methods:
            # Create a combination of cash payment method
            payment_combo = {
                "bank_id": banks[0]["id"],
                "payment_method_id": 1,  # Assuming 1 is cash/efectivo
                "amount": 0,
            }
            result = db.add_record("banks_payment_methods", payment_combo)
            if result.get("success"):
                payment_method_id = result.get("rowid")
                print(
                    f"Created payment method combination with ID: {payment_method_id}"
                )
            else:
                payment_method_id = None
                print("Failed to create payment method combination")
        else:
            payment_method_id = None
            print("No banks or payment methods available")
    else:
        payment_method_id = payment_methods[0]["id"]
        print(f"Using existing payment method ID: {payment_method_id}")

    # Create test purchases
    statuses = ["Pendiente de entrega", "Recibido", "Cancelado"]

    for i in range(5):  # Create 5 test purchases
        # Random date within last 60 days
        purchase_date = datetime.now() - timedelta(days=random.randint(1, 60))
        status = random.choice(statuses)

        # Calculate totals
        subtotal = random.randint(20000, 100000)
        discount = random.randint(0, 5000)
        total = subtotal - discount

        purchase_data = {
            "entity_id": provider_id,
            "purchase_date": purchase_date.isoformat(),
            "subtotal": subtotal,
            "discount": discount,
            "total": total,
            "status": status,
            "invoice_number": f"FC-{2024}{i + 1:03d}",
            "notes": f"Compra de prueba #{i + 1}",
        }

        # Add payment method if available
        if payment_method_id:
            purchase_data["payment_method"] = payment_method_id

        if status == "Recibido":
            purchase_data["delivery_date"] = (
                purchase_date + timedelta(days=random.randint(1, 7))
            ).isoformat()

        result = db.add_record("purchases", purchase_data)
        if result.get("success"):
            purchase_id = result.get("rowid")
            print(f"Created purchase #{i + 1} with ID: {purchase_id}")

            # Add purchase details
            num_products = random.randint(1, 3)
            selected_products = random.sample(
                product_ids, min(num_products, len(product_ids))
            )

            for product_id in selected_products:
                quantity = random.randint(1, 5)
                cost_price = random.randint(10000, 30000)
                product_subtotal = cost_price * quantity

                detail_data = {
                    "purchase_id": purchase_id,
                    "product_id": product_id,
                    "cost_price": cost_price,
                    "quantity": quantity,
                    "discount": 0,
                    "subtotal": product_subtotal,
                }

                detail_result = db.add_record("purchases_detail", detail_data)
                if detail_result.get("success"):
                    print(f"  Added product {product_id} x{quantity} to purchase")
                else:
                    print(f"  Failed to add product {product_id} to purchase")
        else:
            print(f"Failed to create purchase #{i + 1}")

    print("\nTest purchases created successfully!")

    # Verify the data
    purchases = db.get_all_records("purchases")
    print(f"\nTotal purchases in database: {len(purchases)}")


if __name__ == "__main__":
    create_test_purchases()
