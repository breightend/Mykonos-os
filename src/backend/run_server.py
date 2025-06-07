#!/usr/bin/env python3
"""
Script to run the Flask server
"""

from main import app

if __name__ == "__main__":
    print("Starting Flask server...")
    print("Server will be available at: http://127.0.0.1:5000")
    print("API endpoints will be available at: http://127.0.0.1:5000/api/storage")
    app.run(debug=True, host="127.0.0.1", port=5000)
