import sqlite3
import sys

# Simple inline test
try:
    db_path = "c:/Users/brend/OneDrive/Desktop/BrendaDevs/mykonos-os-electron-dev/Mykonos-app/src/backend/database/mykonos.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if proveedorxmarca table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='proveedorxmarca'")
    table_exists = cursor.fetchone()
    
    if table_exists:
        print("✓ PROVEEDORXMARCA table exists")
        
        # Get table schema
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='proveedorxmarca'")
        schema = cursor.fetchone()
        print(f"Schema: {schema[0]}")
        
        # Check for composite primary key
        if "PRIMARY KEY (id_brand, id_provider)" in schema[0]:
            print("✓ Composite primary key found!")
        else:
            print("✗ Composite primary key not found")
    else:
        print("✗ PROVEEDORXMARCA table does not exist")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
