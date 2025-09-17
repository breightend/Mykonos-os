#!/usr/bin/env python3

import requests
import json


def test_purchase_api():
    """Test the purchase detail API endpoint"""

    # Test URL
    url = "http://127.0.0.1:5000/api/purchases/13"

    try:
        print(f"Testing: {url}")
        response = requests.get(url)

        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")

        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Response data:")
            print(json.dumps(data, indent=2, default=str))

            # Check if products array is populated
            if "products" in data and data["products"]:
                print(f"✅ Products array has {len(data['products'])} items")
                for i, product in enumerate(data["products"]):
                    print(
                        f"  Product {i + 1}: {product.get('name', 'Unknown')} - Qty: {product.get('quantity', 'Unknown')}"
                    )
            else:
                print("❌ Products array is empty or missing")

        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is the server running?")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    test_purchase_api()
