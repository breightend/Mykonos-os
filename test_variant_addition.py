#!/usr/bin/env python3
"""
Test script to validate variant addition functionality
Tests the specific issue reported by the user about adding variants in editarProducto
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5000"


def test_variant_addition():
    """Test adding variants to an existing product"""

    print("🧪 Testing variant addition functionality...")

    # Step 1: Get available sizes and colors
    try:
        sizes_response = requests.get(f"{BASE_URL}/api/product/sizes")
        colors_response = requests.get(f"{BASE_URL}/api/product/colors")

        if sizes_response.status_code != 200:
            print(f"❌ Failed to get sizes: {sizes_response.status_code}")
            return False

        if colors_response.status_code != 200:
            print(f"❌ Failed to get colors: {colors_response.status_code}")
            return False

        sizes = sizes_response.json()
        colors = colors_response.json()

        print(f"✅ Available sizes: {len(sizes)}")
        for size in sizes[:3]:  # Show first 3
            print(f"   - {size.get('size_name')} (ID: {size.get('id')})")

        print(f"✅ Available colors: {len(colors)}")
        for color in colors[:3]:  # Show first 3
            print(f"   - {color.get('color_name')} (ID: {color.get('id')})")

    except Exception as e:
        print(f"❌ Error fetching sizes/colors: {e}")
        return False

    # Step 2: Get a test product to add variants to
    try:
        products_response = requests.get(f"{BASE_URL}/api/products")
        if products_response.status_code != 200:
            print(f"❌ Failed to get products: {products_response.status_code}")
            return False

        products = products_response.json()
        if not products:
            print("❌ No products found to test with")
            return False

        test_product = products[0]
        product_id = test_product.get("id")
        print(f"✅ Using test product: '{test_product.get('name')}' (ID: {product_id})")

    except Exception as e:
        print(f"❌ Error fetching products: {e}")
        return False

    # Step 3: Get current variants for the product
    try:
        product_response = requests.get(f"{BASE_URL}/api/product/{product_id}")
        if product_response.status_code != 200:
            print(f"❌ Failed to get product details: {product_response.status_code}")
            return False

        product_data = product_response.json()
        current_variants = product_data.get("stock_variants", [])
        print(f"✅ Current variants for product: {len(current_variants)}")

        for variant in current_variants[:3]:  # Show first 3
            print(
                f"   - Size: {variant.get('size_name')}, Color: {variant.get('color_name')}, Qty: {variant.get('quantity')}"
            )

    except Exception as e:
        print(f"❌ Error fetching product details: {e}")
        return False

    # Step 4: Prepare new variant data (similar to how editarProducto does it)
    if not sizes or not colors:
        print("❌ Cannot create test variant - no sizes or colors available")
        return False

    # Use first available size and color for the test
    test_size = sizes[0]
    test_color = colors[0]
    storage_id = 1  # Assuming storage ID 1 exists

    # Check if this combination already exists
    existing_variant = None
    for variant in current_variants:
        if (
            variant.get("size_id") == test_size.get("id")
            and variant.get("color_id") == test_color.get("id")
            and variant.get("sucursal_id") == storage_id
        ):
            existing_variant = variant
            break

    if existing_variant:
        print(
            f"⚠️ Variant already exists - Size: {test_size.get('size_name')}, Color: {test_color.get('color_name')}"
        )
        # Try with second color if available
        if len(colors) > 1:
            test_color = colors[1]
            # Check again
            existing_variant = None
            for variant in current_variants:
                if (
                    variant.get("size_id") == test_size.get("id")
                    and variant.get("color_id") == test_color.get("id")
                    and variant.get("sucursal_id") == storage_id
                ):
                    existing_variant = variant
                    break
            if existing_variant:
                print(
                    f"⚠️ Second variant also exists, using different quantity for existing variant"
                )

    new_variant_data = {
        "stock_variants": [
            {
                "product_id": product_id,
                "size_id": test_size.get("id"),
                "color_id": test_color.get("id"),
                "sucursal_id": storage_id,
                "quantity": 5,
                "size_name": test_size.get("size_name"),
                "color_name": test_color.get("color_name"),
                "color_hex": test_color.get("color_hex", "#ccc"),
                "sucursal_nombre": "Test Storage",
                "barcode": f"TEST{product_id}{test_size.get('id')}{test_color.get('id')}",
                "is_new": True,
            }
        ]
    }

    print(f"🧪 Testing variant addition:")
    print(f"   - Product ID: {product_id}")
    print(f"   - Size: {test_size.get('size_name')} (ID: {test_size.get('id')})")
    print(f"   - Color: {test_color.get('color_name')} (ID: {test_color.get('id')})")
    print(f"   - Storage ID: {storage_id}")
    print(f"   - Quantity: 5")

    # Step 5: Send the update request (same way editarProducto does)
    try:
        headers = {"Content-Type": "application/json"}
        update_response = requests.put(
            f"{BASE_URL}/api/product/{product_id}",
            headers=headers,
            data=json.dumps(new_variant_data),
        )

        print(f"📡 Update request sent...")
        print(f"   Response status: {update_response.status_code}")

        if update_response.status_code == 200:
            response_data = update_response.json()
            print(f"✅ Variant addition successful!")
            print(f"   Response: {response_data}")
            return True
        else:
            print(f"❌ Variant addition failed!")
            print(f"   Status: {update_response.status_code}")
            print(f"   Response: {update_response.text}")
            return False

    except Exception as e:
        print(f"❌ Error sending update request: {e}")
        return False


def main():
    print("🚀 Starting variant addition test...")

    # Check if backend is running
    try:
        health_response = requests.get(f"{BASE_URL}/")
        print("✅ Backend is running")
    except Exception as e:
        print(f"❌ Backend is not running: {e}")
        print("   Please start the backend server first")
        sys.exit(1)

    success = test_variant_addition()

    if success:
        print("\n✅ All variant addition tests passed!")
        print("   The issue might be in the frontend component logic")
    else:
        print("\n❌ Variant addition tests failed!")
        print("   The issue is likely in the backend API")

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
