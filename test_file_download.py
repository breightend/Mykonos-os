#!/usr/bin/env python3

"""
Test script to verify file download functionality works correctly.
Tests the complete file loading system from purchase fetching to file download.
"""

import requests
import sys

BASE_URL = "http://localhost:5001"

def test_file_download_functionality():
    """Test complete file download and purchase loading workflow"""
    print("🧪 Testing File Download Functionality")
    print("=" * 50)
    
    # Test 1: Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Backend server is running: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is not running!")
        return False
    
    # Test 2: Get all providers to find one with purchases
    try:
        response = requests.get(f"{BASE_URL}/entities/providers")
        if response.status_code == 200:
            providers = response.json()
            print(f"✅ Found {len(providers)} providers")
            
            # Find a provider with purchases
            for provider in providers[:3]:  # Test first 3 providers
                provider_id = provider.get('id')
                print(f"\n🔍 Testing provider: {provider.get('entity_name', 'Unknown')} (ID: {provider_id})")
                
                # Test 3: Get purchases for this provider
                purchases_response = requests.get(f"{BASE_URL}/purchases/provider/{provider_id}")
                if purchases_response.status_code == 200:
                    purchases = purchases_response.json()
                    print(f"  📦 Found {len(purchases)} purchases")
                    
                    # Test 4: Check for purchases with file attachments
                    for purchase in purchases:
                        if purchase.get('file_id') and purchase.get('invoice_file_name'):
                            purchase_id = purchase.get('id')
                            file_name = purchase.get('invoice_file_name')
                            print(f"  📎 Purchase {purchase_id} has file: {file_name}")
                            
                            # Test 5: Get purchase attachments
                            attachments_response = requests.get(f"{BASE_URL}/purchases/{purchase_id}/attachments")
                            if attachments_response.status_code == 200:
                                attachments = attachments_response.json()
                                print(f"    📋 Found {len(attachments)} attachments")
                                
                                # Test 6: Try to download first attachment
                                if attachments:
                                    attachment = attachments[0]
                                    attachment_id = attachment.get('id')
                                    
                                    download_response = requests.get(f"{BASE_URL}/purchases/attachment/{attachment_id}")
                                    if download_response.status_code == 200:
                                        print(f"    ✅ File download successful! Size: {len(download_response.content)} bytes")
                                        print(f"    📁 Content-Type: {download_response.headers.get('Content-Type', 'Unknown')}")
                                        return True
                                    else:
                                        print(f"    ❌ File download failed: {download_response.status_code}")
                                        print(f"    📝 Error: {download_response.text}")
                            else:
                                print(f"    ❌ Get attachments failed: {attachments_response.status_code}")
                else:
                    print(f"  ❌ Get purchases failed: {purchases_response.status_code}")
        else:
            print(f"❌ Get providers failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False
    
    print("\n🔍 No files found to test download functionality")
    return False

def test_database_connectivity():
    """Test database connection and basic queries"""
    print("\n🔗 Testing Database Connectivity")
    print("=" * 40)
    
    try:
        # Test file_attachments table
        response = requests.get(f"{BASE_URL}/purchases/attachments-count")
        if response.status_code == 200:
            print("✅ Database connectivity working")
            return True
        else:
            print(f"❌ Database test failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Database test error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting File Download System Test")
    print("=" * 60)
    
    # Run tests
    db_ok = test_database_connectivity()
    file_ok = test_file_download_functionality()
    
    print("\n📊 Test Results Summary")
    print("=" * 30)
    print(f"Database Connectivity: {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"File Download System: {'✅ PASS' if file_ok else '❌ FAIL'}")
    
    if db_ok and file_ok:
        print("\n🎉 All tests passed! File loading system is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
        sys.exit(1)