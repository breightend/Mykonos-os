#!/usr/bin/env python3
"""
Complete API test for sucursales endpoints
Tests all CRUD operations and employee relationships
"""

import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000/api"

def test_get_storages():
    """Test GET /api/storage - Get all sucursales"""
    print("Testing GET /api/storage...")
    try:
        response = requests.get(f"{BASE_URL}/storage")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} sucursales")
            if data:
                print("Sample sucursal:", json.dumps(data[0], indent=2))
            return data
        else:
            print(f"Error: {response.text}")
            return []
    except Exception as e:
        print(f"Exception: {e}")
        return []

def test_create_storage():
    """Test POST /api/storage - Create new sucursal"""
    print("\nTesting POST /api/storage...")
    new_sucursal = {
        "name": "Sucursal Test API",
        "address": "Calle Test 123",
        "postal_code": "12345",
        "phone_number": "555-0123",
        "area": "Test Area",
        "description": "Sucursal creada por test automatizado"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/storage",
            json=new_sucursal,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            print("Created sucursal:", json.dumps(data, indent=2))
            return data.get('id')
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def test_get_storage_by_id(storage_id):
    """Test GET /api/storage/{id} - Get specific sucursal"""
    print(f"\nTesting GET /api/storage/{storage_id}...")
    try:
        response = requests.get(f"{BASE_URL}/storage/{storage_id}")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Sucursal details:", json.dumps(data, indent=2))
            return data
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def test_update_storage(storage_id):
    """Test PUT /api/storage/{id} - Update sucursal"""
    print(f"\nTesting PUT /api/storage/{storage_id}...")
    update_data = {
        "name": "Sucursal Test API Actualizada",
        "description": "Descripción actualizada por test automatizado"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/storage/{storage_id}",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Updated sucursal:", json.dumps(data, indent=2))
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_get_storage_employees(storage_id):
    """Test GET /api/storage/{id}/employees - Get employees for sucursal"""
    print(f"\nTesting GET /api/storage/{storage_id}/employees...")
    try:
        response = requests.get(f"{BASE_URL}/storage/{storage_id}/employees")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} employees in sucursal")
            if data:
                print("Sample employee:", json.dumps(data[0], indent=2))
            return data
        else:
            print(f"Error: {response.text}")
            return []
    except Exception as e:
        print(f"Exception: {e}")
        return []

def test_delete_storage(storage_id):
    """Test DELETE /api/storage/{id} - Delete sucursal"""
    print(f"\nTesting DELETE /api/storage/{storage_id}...")
    try:
        response = requests.delete(f"{BASE_URL}/storage/{storage_id}")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Sucursal deleted successfully")
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_server_connection():
    """Test if server is running"""
    print("Testing server connection...")
    try:
        response = requests.get(f"{BASE_URL}/storage", timeout=5)
        print("✓ Server is running and accessible")
        return True
    except requests.ConnectionError:
        print("✗ Cannot connect to server. Make sure Flask server is running on port 5000")
        return False
    except Exception as e:
        print(f"✗ Connection error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("TESTING SUCURSALES API ENDPOINTS")
    print("=" * 60)
    
    # Test server connection
    if not test_server_connection():
        print("\nPlease start the Flask server with: python main.py")
        sys.exit(1)
    
    # Test getting all storages
    storages = test_get_storages()
    
    # Test creating a new storage
    new_storage_id = test_create_storage()
    
    if new_storage_id:
        # Test getting the created storage
        test_get_storage_by_id(new_storage_id)
        
        # Test updating the storage
        test_update_storage(new_storage_id)
        
        # Test getting employees for the storage
        test_get_storage_employees(new_storage_id)
        
        # Test deleting the storage
        test_delete_storage(new_storage_id)
    
    print("\n" + "=" * 60)
    print("API TESTING COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
