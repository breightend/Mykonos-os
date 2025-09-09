#!/usr/bin/env python3
"""
Script to populate test data for the purchase management system
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database
from datetime import datetime, timedelta
import random


def populate_test_data():
    db = Database()

    print("🏦 Creating payment methods...")

    # 1. Create payment methods
    payment_methods = [
        {
            "method_name": "efectivo",
            "display_name": "Efectivo",
            "description": "Pago en efectivo",
            "provider_use_it": True,
            "client_use_it": True,
        },
        {
            "method_name": "transferencia",
            "display_name": "Transferencia Bancaria",
            "description": "Transferencia electrónica",
            "provider_use_it": True,
            "client_use_it": True,
        },
        {
            "method_name": "cheque",
            "display_name": "Cheque",
            "description": "Pago con cheque",
            "provider_use_it": True,
            "client_use_it": False,
        },
        {
            "method_name": "credito",
            "display_name": "Crédito",
            "description": "Pago a crédito",
            "provider_use_it": True,
            "client_use_it": False,
        },
    ]

    payment_method_ids = []
    for method in payment_methods:
        # Check if exists first
        existing = db.get_record_by_clause(
            "payment_methods", "method_name = ?", method["method_name"]
        )
        if existing["success"] and existing["record"]:
            payment_method_ids.append(existing["record"]["id"])
            print(f"✅ Payment method '{method['method_name']}' already exists")
        else:
            result = db.add_record("payment_methods", method)
            if result["success"]:
                payment_method_ids.append(result["rowid"])
                print(f"✅ Created payment method: {method['method_name']}")
            else:
                print(f"❌ Failed to create payment method: {method['method_name']}")

    print("🏦 Creating banks...")

    # 2. Create banks
    banks = [
        {"name": "Banco Nación", "swift_code": "NACNAR01"},
        {"name": "Banco Santander", "swift_code": "BSCHERAR"},
        {"name": "Banco Galicia", "swift_code": "GABCARBAXXX"},
        {"name": "BBVA", "swift_code": "FRANCEAR"},
    ]

    bank_ids = []
    for bank in banks:
        # Check if exists first
        existing = db.get_record_by_clause("banks", "name = ?", bank["name"])
        if existing["success"] and existing["record"]:
            bank_ids.append(existing["record"]["id"])
            print(f"✅ Bank '{bank['name']}' already exists")
        else:
            result = db.add_record("banks", bank)
            if result["success"]:
                bank_ids.append(result["rowid"])
                print(f"✅ Created bank: {bank['name']}")
            else:
                print(f"❌ Failed to create bank: {bank['name']}")

    print("💳 Creating bank-payment method combinations...")

    # 3. Create bank-payment method combinations
    bank_payment_combinations = []
    for bank_id in bank_ids:
        for payment_method_id in payment_method_ids:
            # Skip some combinations for realism
            if random.choice([True, False, True]):  # 66% chance to create combination
                combination = {
                    "bank_id": bank_id,
                    "payment_method_id": payment_method_id,
                    "amount": 0.00,  # Default amount
                }

                # Check if exists first
                existing = db.get_all_records_by_clause(
                    "banks_payment_methods",
                    "bank_id = ? AND payment_method_id = ?",
                    (bank_id, payment_method_id),
                )
                if existing:
                    bank_payment_combinations.append(existing[0]["id"])
                    print(f"✅ Bank-payment combination already exists")
                else:
                    result = db.add_record("banks_payment_methods", combination)
                    if result["success"]:
                        bank_payment_combinations.append(result["rowid"])
                        print(f"✅ Created bank-payment combination")
                    else:
                        print(f"❌ Failed to create bank-payment combination")

    print("🏪 Creating providers (entities)...")

    # 4. Create some provider entities
    providers = [
        {
            "entity_name": "Proveedor ABC S.A.",
            "entity_type": "proveedor",
            "razon_social": "ABC Sociedad Anónima",
            "responsabilidad_iva": 1,
            "domicilio_comercial": "Av. Corrientes 1234, CABA",
            "cuit": "20-12345678-9",
            "contact_name": "Juan Pérez",
            "phone_number": "+54 11 1234-5678",
            "email": "contacto@proveedorabc.com.ar",
            "observations": "Proveedor principal de indumentaria",
        },
        {
            "entity_name": "Distribuidora XYZ Ltda.",
            "entity_type": "proveedor",
            "razon_social": "XYZ Limitada",
            "responsabilidad_iva": 1,
            "domicilio_comercial": "San Martín 567, Rosario",
            "cuit": "30-87654321-0",
            "contact_name": "María González",
            "phone_number": "+54 341 987-6543",
            "email": "ventas@xyz.com.ar",
            "observations": "Distribuidor regional",
        },
        {
            "entity_name": "Textiles DEF S.R.L.",
            "entity_type": "proveedor",
            "razon_social": "DEF Sociedad de Responsabilidad Limitada",
            "responsabilidad_iva": 1,
            "domicilio_comercial": "Mitre 890, La Plata",
            "cuit": "27-11223344-5",
            "contact_name": "Carlos López",
            "phone_number": "+54 221 555-0123",
            "email": "info@textilesdef.com",
            "observations": "Especialista en textiles premium",
        },
    ]

    provider_ids = []
    for provider in providers:
        # Check if exists first
        existing = db.get_record_by_clause("entities", "cuit = ?", provider["cuit"])
        if existing["success"] and existing["record"]:
            provider_ids.append(existing["record"]["id"])
            print(f"✅ Provider '{provider['entity_name']}' already exists")
        else:
            result = db.add_record("entities", provider)
            if result["success"]:
                provider_ids.append(result["rowid"])
                print(f"✅ Created provider: {provider['entity_name']}")
            else:
                print(f"❌ Failed to create provider: {provider['entity_name']}")

    print("📦 Creating sample products...")

    # 5. Create some sample products (if they don't exist)
    products = [
        {
            "product_name": "Jean Básico Azul",
            "provider_code": "JBA001",
            "description": "Jean básico color azul, tela de algodón",
            "cost": 15000.00,
            "sale_price": 25000.00,
            "provider_id": provider_ids[0] if provider_ids else None,
            "state": "activo",
        },
        {
            "product_name": "Remera Lisa Blanca",
            "provider_code": "RLB002",
            "description": "Remera lisa color blanco, 100% algodón",
            "cost": 8000.00,
            "sale_price": 14000.00,
            "provider_id": provider_ids[1] if len(provider_ids) > 1 else None,
            "state": "activo",
        },
        {
            "product_name": "Campera Deportiva",
            "provider_code": "CD003",
            "description": "Campera deportiva con capucha",
            "cost": 35000.00,
            "sale_price": 55000.00,
            "provider_id": provider_ids[2] if len(provider_ids) > 2 else None,
            "state": "activo",
        },
    ]

    product_ids = []
    for product in products:
        # Check if exists first
        existing = db.get_record_by_clause(
            "products", "provider_code = ?", product["provider_code"]
        )
        if existing["success"] and existing["record"]:
            product_ids.append(existing["record"]["id"])
            print(f"✅ Product '{product['product_name']}' already exists")
        else:
            result = db.add_record("products", product)
            if result["success"]:
                product_ids.append(result["rowid"])
                print(f"✅ Created product: {product['product_name']}")
            else:
                print(f"❌ Failed to create product: {product['product_name']}")

    print("🛒 Creating sample purchases...")

    # 6. Create sample purchases
    if provider_ids and product_ids and bank_payment_combinations:
        purchases = []

        # Create purchases with different statuses and dates
        statuses = ["Pendiente de entrega", "Recibido", "Cancelado"]
        base_date = datetime.now() - timedelta(days=90)

        for i in range(6):  # Create 6 sample purchases
            purchase_date = base_date + timedelta(days=i * 15)
            status = statuses[i % len(statuses)]
            provider_id = provider_ids[i % len(provider_ids)]
            payment_method = (
                bank_payment_combinations[i % len(bank_payment_combinations)]
                if bank_payment_combinations
                else None
            )

            # Calculate totals
            num_products = random.randint(1, 3)
            subtotal = 0
            purchase_products = []

            for j in range(num_products):
                product_id = product_ids[j % len(product_ids)]
                quantity = random.randint(5, 20)

                # Get product cost
                product = db.get_record_by_id("products", product_id)
                if product["success"] and product["record"]:
                    cost_price = product["record"]["cost"] or 10000.00
                else:
                    cost_price = 10000.00

                product_subtotal = cost_price * quantity
                subtotal += product_subtotal

                purchase_products.append(
                    {
                        "product_id": product_id,
                        "quantity": quantity,
                        "cost_price": cost_price,
                        "subtotal": product_subtotal,
                        "discount": 0.0,
                    }
                )

            discount = (
                subtotal * 0.05 if i % 3 == 0 else 0
            )  # 5% discount on some purchases
            total = subtotal - discount

            purchase_data = {
                "entity_id": provider_id,
                "purchase_date": purchase_date.isoformat(),
                "subtotal": subtotal,
                "discount": discount,
                "total": total,
                "payment_method": payment_method,
                "invoice_number": f"FAC-{2024000 + i + 1}",
                "transaction_number": f"TXN{purchase_date.strftime('%Y%m%d')}{i:03d}",
                "notes": f"Compra de prueba #{i + 1} - {status}",
                "status": status,
            }

            if status == "Recibido":
                purchase_data["delivery_date"] = (
                    purchase_date + timedelta(days=7)
                ).isoformat()

            # Create the purchase
            result = db.add_record("purchases", purchase_data)
            if result["success"]:
                purchase_id = result["rowid"]
                print(f"✅ Created purchase #{purchase_id} with status: {status}")

                # Add purchase details
                for product_detail in purchase_products:
                    product_detail["purchase_id"] = purchase_id
                    detail_result = db.add_record("purchases_detail", product_detail)
                    if detail_result["success"]:
                        print(
                            f"  ✅ Added product detail for product {product_detail['product_id']}"
                        )
                    else:
                        print(f"  ❌ Failed to add product detail: {detail_result}")
            else:
                print(f"❌ Failed to create purchase: {result}")

    print("\n🎉 Test data population completed!")
    print("You can now test the purchase management component with sample data.")


if __name__ == "__main__":
    try:
        populate_test_data()
    except Exception as e:
        print(f"❌ Error populating test data: {e}")
        import traceback

        traceback.print_exc()
