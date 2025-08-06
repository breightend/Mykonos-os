#!/usr/bin/env python3
"""
Test script for sent-shipments endpoint
"""

import requests
import json


def test_sent_shipments():
    try:
        url = "http://localhost:5000/api/inventory/sent-shipments/1"
        print(f"Testing URL: {url}")

        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")

        if response.status_code == 200:
            print("✅ Success!")
            data = response.json()
            print(f"Response Data: {json.dumps(data, indent=2)}")
        else:
            print("❌ Error!")
            print(f"Response Text: {response.text}")

    except Exception as e:
        print(f"❌ Exception: {e}")


if __name__ == "__main__":
    test_sent_shipments()
