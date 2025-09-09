#!/usr/bin/env python3
"""
Script to create test purchases via API.
"""

import requests
from datetime import datetime, timedelta
import random

API_BASE_URL = "http://localhost:5000/api/purchases"


def create_test_purchases_via_api():
    # First, get available entities (providers)
    entities_response = requests.get("http://localhost:5000/api/provider")
    if entities_response.status_code != 200:
        print(f"Failed to get providers: {entities_response.status_code}")
        return

    providers = entities_response.json()

    if not providers:
        print("No providers found")
        return

    provider = providers[0]
    print(f"Using provider: {provider['entity_name']}")

    # Get available products
    products_response = requests.get("http://localhost:5000/api/product")
    if products_response.status_code != 200:
        print(f"Failed to get products: {products_response.status_code}")
        return

    products = products_response.json()
    if not products:
        print("No products found")
        return

    print(f"Found {len(products)} products")

    # Create test purchases
    statuses = ["Pendiente de entrega", "Recibido", "Cancelado"]

    for i in range(5):
        # Random date within last 60 days
        purchase_date = datetime.now() - timedelta(days=random.randint(1, 60))
        status = random.choice(statuses)

        # Select random products for this purchase
        num_products = random.randint(1, min(3, len(products)))
        selected_products = random.sample(products, num_products)

        purchase_products = []
        subtotal = 0

        for product in selected_products:
            quantity = random.randint(1, 5)
            cost_price = random.randint(10000, 30000)
            product_subtotal = cost_price * quantity
            subtotal += product_subtotal

            purchase_products.append(
                {
                    "product_id": product["id"],
                    "cost_price": cost_price,
                    "quantity": quantity,
                    "discount": 0,
                    "subtotal": product_subtotal,
                }
            )

        discount = random.randint(0, int(subtotal * 0.1))  # Up to 10% discount
        total = subtotal - discount

        purchase_data = {
            "entity_id": provider["id"],
            "subtotal": subtotal,
            "discount": discount,
            "total": total,
            "status": status,
            "invoice_number": f"FC-{2024}{i + 1:03d}",
            "notes": f"Compra de prueba #{i + 1}",
            "products": purchase_products,
        }

        if status == "Recibido":
            delivery_date = purchase_date + timedelta(days=random.randint(1, 7))
            purchase_data["delivery_date"] = delivery_date.isoformat()

        # Create the purchase via API
        response = requests.post(API_BASE_URL, json=purchase_data)
        if response.status_code == 201:
            result = response.json()
            print(f"Created purchase #{i + 1} with ID: {result.get('purchase_id')}")
        else:
            print(
                f"Failed to create purchase #{i + 1}: {response.status_code} - {response.text}"
            )

    # Verify the data
    purchases_response = requests.get(API_BASE_URL)
    if purchases_response.status_code == 200:
        purchases = purchases_response.json()
        print(f"\nTotal purchases in database: {len(purchases)}")
    else:
        print("Failed to verify purchases")


if __name__ == "__main__":
    create_test_purchases_via_api()
