#!/usr/bin/env python3
"""
Test file upload functionality directly
"""

import requests

BASE_URL = "http://localhost:5000"

def test_file_upload():
    """Test file upload endpoint"""
    try:
        # Test basic file upload
        response = requests.post(f"{BASE_URL}/api/purchases/test-file-upload", json={"test": "data"})
        print(f"📤 File upload test: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ File upload test successful!")
            print(f"   � File ID: {result.get('file_id')}")
            print(f"   📊 Result: {result.get('message')}")
            return True, result.get('file_id')
        else:
            print(f"❌ File upload test failed: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ File upload test error: {e}")
        return False, None

def test_file_retrieval(file_id):
    """Test file retrieval"""
    if not file_id:
        print("⚠️ No file ID to test retrieval")
        return False
        
    try:
        response = requests.get(f"{BASE_URL}/api/purchases/test-file-system")
        print(f"📥 File retrieval test: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ File retrieval test successful!")
            print(f"   📎 Total attachments: {result['data']['total_attachments']}")
            return True
        else:
            print(f"❌ File retrieval test failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ File retrieval test error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing File Upload/Save Functionality")
    print("=" * 50)
    
    # Test file upload
    upload_ok, file_id = test_file_upload()
    
    # Test file retrieval
    retrieval_ok = test_file_retrieval(file_id)
    
    print("\n� Test Results")
    print("=" * 20)
    print(f"File Upload: {'✅ PASS' if upload_ok else '❌ FAIL'}")
    print(f"File Retrieval: {'✅ PASS' if retrieval_ok else '❌ FAIL'}")
    
    if upload_ok and retrieval_ok:
        print("\n🎉 File system is working! The issue might be in the purchase creation logic.")
    else:
        print("\n⚠️ File system has basic issues that need to be resolved.")