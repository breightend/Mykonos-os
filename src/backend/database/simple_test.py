#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from database.database import Database, TABLES
    print("✓ Database module imported successfully")
    
    # Create test database
    db = Database("./test_simple.db")
    print("✓ Database instance created")
    
    # Test creating tables with composite primary keys
    print("\n--- Testing PROVEEDORXMARCA Table Creation ---")
    
    # Check if table exists and has correct structure
    cursor = db.connection.cursor()
    
    # Get table info
    cursor.execute("PRAGMA table_info(proveedorxmarca)")
    columns = cursor.fetchall()
    
    if columns:
        print("✓ PROVEEDORXMARCA table exists")
        print("Columns:", columns)
        
        # Check primary key constraints
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='proveedorxmarca'")
        table_sql = cursor.fetchone()
        if table_sql:
            print("\nTable SQL:")
            print(table_sql[0])
            
            if "PRIMARY KEY (id_brand, id_provider)" in table_sql[0]:
                print("✓ Composite primary key found!")
            else:
                print("✗ Composite primary key not found")
    else:
        print("✗ PROVEEDORXMARCA table does not exist")
    
    print("\n--- Testing Basic CRUD Operations ---")
    
    # Add test entities first
    entity_data = {
        "entity_name": "Test Provider",
        "entity_type": "proveedor", 
        "razon_social": "Test Provider S.A.",
        "responsabilidad_iva": 1,
        "domicilio_comercial": "Test Address",
        "cuit": "20-12345678-9"
    }
    
    entity_result = db.add_record(TABLES.ENTITIES.value, entity_data)
    print(f"Entity add result: {entity_result}")
    
    if entity_result.get("success"):
        provider_id = entity_result["rowid"]
        
        # Add test brand
        brand_data = {
            "brand_name": "Test Brand"
        }
        
        brand_result = db.add_record(TABLES.BRANDS.value, brand_data)
        print(f"Brand add result: {brand_result}")
        
        if brand_result.get("success"):
            brand_id = brand_result["rowid"]
            
            # Test composite primary key relationship
            relationship_data = {
                "id_brand": brand_id,
                "id_provider": provider_id
            }
            
            rel_result = db.add_record(TABLES.PROVEEDORXMARCA.value, relationship_data)
            print(f"Relationship add result: {rel_result}")
            
            if rel_result.get("success"):
                print("✓ Composite primary key relationship created successfully!")
                
                # Try to add duplicate (should fail)
                print("\n--- Testing Duplicate Prevention ---")
                duplicate_result = db.add_record(TABLES.PROVEEDORXMARCA.value, relationship_data)
                print(f"Duplicate add result: {duplicate_result}")
                
                if not duplicate_result.get("success"):
                    print("✓ Duplicate prevention working correctly!")
                else:
                    print("✗ Duplicate was allowed (should be prevented)")
            else:
                print("✗ Failed to create relationship")
        else:
            print("✗ Failed to create brand")
    else:
        print("✗ Failed to create entity")
    
    db.close()
    print("\n✓ Test completed successfully!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
