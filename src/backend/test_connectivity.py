#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
import json


def test_backend_connectivity():
    print("=== TESTING BACKEND CONNECTIVITY ===")

    # Test 1: Backend general
    try:
        print("\n1. Testing backend base URL...")
        response = requests.get("http://localhost:5000/", timeout=5)
        print(f"   ✅ Backend responde: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Backend no responde: {e}")
        return False

    # Test 2: Storage endpoint
    try:
        print("\n2. Testing storage endpoint...")
        response = requests.get("http://localhost:5000/api/storage/", timeout=5)
        print(f"   Status code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Storage endpoint funciona")
            print(f"   Estructura de respuesta: {type(data)}")
            print(f"   Contenido: {json.dumps(data, indent=2, default=str)}")
        else:
            print(f"   ❌ Storage endpoint error: {response.text}")
    except Exception as e:
        print(f"   ❌ Storage endpoint falla: {e}")

    # Test 3: Auth endpoint
    try:
        print("\n3. Testing auth endpoint...")
        response = requests.post(
            "http://localhost:5000/api/auth/validate",
            json={"session_token": "test"},
            timeout=5,
        )
        print(f"   Status code: {response.status_code}")
        print(f"   ✅ Auth endpoint responde (aunque falló la validación)")
    except Exception as e:
        print(f"   ❌ Auth endpoint falla: {e}")

    return True


if __name__ == "__main__":
    test_backend_connectivity()
