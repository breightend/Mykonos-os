#!/usr/bin/env python3
"""
Quick test script to verify file upload/download functionality
"""

import requests

BASE_URL = "http://localhost:5000"

def test_files_router():
    """Test the files router is working"""
    try:
        response = requests.get(f"{BASE_URL}/api/files/test")
        print(f"📁 Files router test: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ Files router working: {response.json()}")
            return True
        else:
            print(f"❌ Files router error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Files router test failed: {e}")
        return False

def test_database_tables():
    """Test database connection and check file_attachments table"""
    try:
        # Test if we can query the file_attachments table
        response = requests.get(f"{BASE_URL}/api/purchases/test-file-system")
        print(f"🗄️ Database test: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Database test successful:")
            print(f"   📎 Total attachments: {result['data']['total_attachments']}")
            print(f"   📦 Purchases with files: {result['data']['purchases_with_files']}")
            return True, result['data']
        else:
            print(f"❌ Database test error: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False, None

def test_file_download(comprobante_number):
    """Test file download by comprobante number"""
    try:
        response = requests.get(f"{BASE_URL}/api/files/comprobante/{comprobante_number}")
        print(f"⬇️ File download test for comprobante {comprobante_number}: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ File download successful!")
            print(f"   📁 Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
            print(f"   📏 File size: {len(response.content)} bytes")
            return True
        else:
            print(f"❌ File download failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ File download test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing File System Functionality")
    print("=" * 50)
    
    # Test 1: Files router
    files_ok = test_files_router()
    
    # Test 2: Database and file attachments
    db_ok, data = test_database_tables()
    
    # Test 3: File download (if we have sample data)
    download_ok = False
    if db_ok and data and data['sample_purchases']:
        # Try to download a file from a sample purchase
        try:
            sample_purchase = data['sample_purchases'][0]
            comprobante_num = sample_purchase.get('invoice_number') or '55615616'  # fallback to test number
            download_ok = test_file_download(comprobante_num)
        except Exception:
            print("⚠️ No sample data available for file download test")
    else:
        print("⚠️ Testing with fallback comprobante number...")
        download_ok = test_file_download('55615616')
    
    print("\n📊 Test Results Summary")
    print("=" * 30)
    print(f"Files Router: {'✅ PASS' if files_ok else '❌ FAIL'}")
    print(f"Database: {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"File Download: {'✅ PASS' if download_ok else '❌ FAIL'}")
    
    if files_ok and db_ok:
        print("\n🎉 File system is properly configured!")
        if not download_ok:
            print("💡 File download failed - this is expected if no files are uploaded yet.")
            print("   Try uploading a file through the purchase creation form to test download.")
    else:
        print("\n⚠️ Some components need attention.")