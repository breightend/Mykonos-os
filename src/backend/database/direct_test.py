#!/usr/bin/env python3
import sqlite3
import os

def test_direct_sql():
    """Test composite primary key functionality directly with SQL"""
    
    with open("direct_test_results.txt", "w") as f:
        try:
            f.write("Starting direct SQL test for composite primary keys...\n")
            
            # Create test database
            db_path = "test_direct.db"
            if os.path.exists(db_path):
                os.remove(db_path)
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            f.write("✓ Database connection established\n")
            
            # Create BRANDS table
            cursor.execute('''
                CREATE TABLE brands (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    brand_name TEXT NOT NULL
                )
            ''')
            f.write("✓ BRANDS table created\n")
            
            # Create ENTITIES table
            cursor.execute('''
                CREATE TABLE entities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entity_name TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    razon_social TEXT NOT NULL,
                    responsabilidad_iva INTEGER NOT NULL,
                    domicilio_comercial TEXT NOT NULL,
                    cuit TEXT NOT NULL UNIQUE
                )
            ''')
            f.write("✓ ENTITIES table created\n")
            
            # Create PROVEEDORXMARCA table with composite primary key
            cursor.execute('''
                CREATE TABLE proveedorxmarca (
                    id_brand INTEGER NOT NULL,
                    id_provider INTEGER NOT NULL,
                    PRIMARY KEY (id_brand, id_provider),
                    FOREIGN KEY (id_brand) REFERENCES brands(id),
                    FOREIGN KEY (id_provider) REFERENCES entities(id)
                )
            ''')
            f.write("✓ PROVEEDORXMARCA table created with composite primary key\n")
            
            # Verify table structure
            cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='proveedorxmarca'")
            table_sql = cursor.fetchone()
            f.write(f"Table SQL: {table_sql[0]}\n")
            
            if "PRIMARY KEY (id_brand, id_provider)" in table_sql[0]:
                f.write("✓ Composite primary key confirmed!\n")
            else:
                f.write("✗ Composite primary key not found\n")
            
            # Insert test data
            cursor.execute("INSERT INTO brands (brand_name) VALUES (?)", ("Test Brand",))
            brand_id = cursor.lastrowid
            f.write(f"✓ Test brand inserted with ID: {brand_id}\n")
            
            cursor.execute('''
                INSERT INTO entities (entity_name, entity_type, razon_social, responsabilidad_iva, domicilio_comercial, cuit) 
                VALUES (?, ?, ?, ?, ?, ?)
            ''', ("Test Provider", "proveedor", "Test Provider S.A.", 1, "Test Address", "20-12345678-9"))
            provider_id = cursor.lastrowid
            f.write(f"✓ Test provider inserted with ID: {provider_id}\n")
            
            # Test composite primary key relationship
            cursor.execute("INSERT INTO proveedorxmarca (id_brand, id_provider) VALUES (?, ?)", (brand_id, provider_id))
            f.write("✓ Provider-Brand relationship created successfully!\n")
            
            # Test duplicate prevention
            try:
                cursor.execute("INSERT INTO proveedorxmarca (id_brand, id_provider) VALUES (?, ?)", (brand_id, provider_id))
                f.write("✗ Duplicate was allowed (should fail)\n")
            except sqlite3.IntegrityError as e:
                f.write(f"✓ Duplicate prevention working: {e}\n")
            
            # Test queries
            cursor.execute('''
                SELECT b.brand_name, e.entity_name 
                FROM proveedorxmarca pxm
                JOIN brands b ON pxm.id_brand = b.id
                JOIN entities e ON pxm.id_provider = e.id
            ''')
            results = cursor.fetchall()
            f.write(f"Query results: {results}\n")
            
            conn.commit()
            conn.close()
            f.write("✓ Direct SQL test completed successfully!\n")
            
        except Exception as e:
            f.write(f"✗ Error: {e}\n")
            import traceback
            f.write(traceback.format_exc())

if __name__ == "__main__":
    test_direct_sql()
    print("Direct SQL test completed - check direct_test_results.txt for results")
