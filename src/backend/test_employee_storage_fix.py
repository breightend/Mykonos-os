#!/usr/bin/env python3
"""
Test script to verify that employee-storage relationships work properly
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"


def test_employee_storage_assignment():
    """Test the complete employee-storage assignment workflow"""

    print("🧪 Testing Employee-Storage Assignment Fix")
    print("=" * 50)

    try:
        # 1. Get all employees
        print("1. Fetching all employees...")
        response = requests.get(f"{BASE_URL}/user/employees")
        if response.status_code == 200:
            employees = response.json()
            print(f"   ✓ Found {len(employees)} employees")
            if employees:
                test_employee = employees[0]
                employee_id = test_employee["id"]
                print(
                    f"   ✓ Using employee: {test_employee['fullname']} (ID: {employee_id})"
                )
            else:
                print("   ❌ No employees found. Please create an employee first.")
                return
        else:
            print(f"   ❌ Failed to fetch employees: {response.status_code}")
            return

        # 2. Get all storages
        print("\n2. Fetching all storages...")
        response = requests.get(f"{BASE_URL}/storage")
        if response.status_code == 200:
            storages = response.json()
            print(f"   ✓ Found {len(storages)} storages")
            if storages:
                test_storage = storages[0]
                storage_id = test_storage["id"]
                print(f"   ✓ Using storage: {test_storage['name']} (ID: {storage_id})")
            else:
                print("   ❌ No storages found. Please create a storage first.")
                return
        else:
            print(f"   ❌ Failed to fetch storages: {response.status_code}")
            return

        # 3. Test getting employee by ID with storage information
        print(f"\n3. Fetching employee {employee_id} with storage information...")
        response = requests.get(f"{BASE_URL}/user/employee/{employee_id}")
        if response.status_code == 200:
            employee_data = response.json()
            print(f"   ✓ Employee data retrieved successfully")
            if "assigned_storages" in employee_data.get("record", {}):
                assigned_storages = employee_data["record"]["assigned_storages"]
                print(f"   ✓ Employee has {len(assigned_storages)} assigned storages")
                for storage in assigned_storages:
                    print(
                        f"     - {storage.get('name', 'Unknown')} (ID: {storage.get('id', 'Unknown')})"
                    )
            else:
                print("   ⚠️ assigned_storages field not found in response")
        else:
            print(f"   ❌ Failed to fetch employee: {response.status_code}")

        # 4. Test assigning storage to employee
        print(f"\n4. Testing storage assignment...")
        response = requests.post(
            f"{BASE_URL}/user/employee/{employee_id}/storages",
            json={"storage_id": storage_id},
        )
        if response.status_code == 200:
            print(f"   ✓ Storage assigned successfully")
        else:
            result = response.json()
            if "ya existe" in result.get("mensaje", "").lower():
                print(f"   ✓ Storage already assigned (expected)")
            else:
                print(f"   ⚠️ Assignment response: {response.status_code} - {result}")

        # 5. Verify assignment by fetching employee again
        print(f"\n5. Verifying assignment...")
        response = requests.get(f"{BASE_URL}/user/employee/{employee_id}")
        if response.status_code == 200:
            employee_data = response.json()
            assigned_storages = employee_data.get("record", {}).get(
                "assigned_storages", []
            )
            print(f"   ✓ Employee now has {len(assigned_storages)} assigned storages")

            # Check if our test storage is in the list
            storage_found = any(s.get("id") == storage_id for s in assigned_storages)
            if storage_found:
                print(
                    f"   ✓ Test storage '{test_storage['name']}' is properly assigned"
                )
            else:
                print(
                    f"   ❌ Test storage '{test_storage['name']}' not found in assignments"
                )
        else:
            print(f"   ❌ Failed to verify assignment: {response.status_code}")

        # 6. Test getting employee storages directly
        print(f"\n6. Testing direct storage endpoint...")
        response = requests.get(f"{BASE_URL}/user/employee/{employee_id}/storages")
        if response.status_code == 200:
            storages = response.json()
            print(f"   ✓ Direct endpoint returned {len(storages)} storages")
        else:
            print(f"   ❌ Direct endpoint failed: {response.status_code}")

        print("\n" + "=" * 50)
        print("✅ Employee-Storage Assignment Test Complete!")

    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")


if __name__ == "__main__":
    test_employee_storage_assignment()
