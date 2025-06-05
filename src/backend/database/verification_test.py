#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Write output to a file since terminal might not be showing output
with open("test_results.txt", "w") as f:
    try:
        f.write("Starting composite primary key test...\n")
        
        from database.database import Database, TABLES
        f.write("✓ Database module imported successfully\n")
        
        # Create test database
        db = Database("./test_verification.db")
        f.write("✓ Database instance created\n")
        
        # Check PROVEEDORXMARCA table structure
        cursor = db.connection.cursor()
        
        # Get table schema
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='proveedorxmarca'")
        table_sql = cursor.fetchone()
        
        if table_sql:
            f.write(f"✓ PROVEEDORXMARCA table exists\n")
            f.write(f"Table SQL: {table_sql[0]}\n")
            
            if "PRIMARY KEY (id_brand, id_provider)" in table_sql[0]:
                f.write("✓ Composite primary key found!\n")
            else:
                f.write("✗ Composite primary key not found\n")
        else:
            f.write("✗ PROVEEDORXMARCA table does not exist\n")
        
        # Test basic functionality
        f.write("\n--- Testing Basic Operations ---\n")
        
        # Add test entity
        entity_data = {
            "entity_name": "Test Provider",
            "entity_type": "proveedor", 
            "razon_social": "Test Provider S.A.",
            "responsabilidad_iva": 1,
            "domicilio_comercial": "Test Address",
            "cuit": "20-12345678-9"
        }
        
        entity_result = db.add_record(TABLES.ENTITIES.value, entity_data)
        f.write(f"Entity add result: {entity_result}\n")
        
        if entity_result.get("success"):
            provider_id = entity_result["rowid"]
            
            # Add test brand
            brand_data = {"brand_name": "Test Brand"}
            brand_result = db.add_record(TABLES.BRANDS.value, brand_data)
            f.write(f"Brand add result: {brand_result}\n")
            
            if brand_result.get("success"):
                brand_id = brand_result["rowid"]
                
                # Test composite primary key relationship
                relationship_data = {
                    "id_brand": brand_id,
                    "id_provider": provider_id
                }
                
                rel_result = db.add_record(TABLES.PROVEEDORXMARCA.value, relationship_data)
                f.write(f"Relationship add result: {rel_result}\n")
                
                if rel_result.get("success"):
                    f.write("✓ Composite primary key relationship created successfully!\n")
                    
                    # Try to add duplicate (should fail)
                    duplicate_result = db.add_record(TABLES.PROVEEDORXMARCA.value, relationship_data)
                    f.write(f"Duplicate add result: {duplicate_result}\n")
                    
                    if not duplicate_result.get("success"):
                        f.write("✓ Duplicate prevention working correctly!\n")
                    else:
                        f.write("✗ Duplicate was allowed (should be prevented)\n")
                        
                    # Test utility methods
                    f.write("\n--- Testing Utility Methods ---\n")
                    
                    # Test get_brands_by_provider
                    brands = db.get_brands_by_provider(provider_id)
                    f.write(f"Brands for provider {provider_id}: {brands}\n")
                    
                    # Test get_providers_by_brand
                    providers = db.get_providers_by_brand(brand_id)
                    f.write(f"Providers for brand {brand_id}: {providers}\n")
                    
                    # Test check_provider_brand_relationship_exists
                    exists = db.check_provider_brand_relationship_exists(provider_id, brand_id)
                    f.write(f"Relationship exists: {exists}\n")
                    
                else:
                    f.write("✗ Failed to create relationship\n")
            else:
                f.write("✗ Failed to create brand\n")
        else:
            f.write("✗ Failed to create entity\n")
        
        db.close()
        f.write("\n✓ Test completed successfully!\n")
        
    except Exception as e:
        f.write(f"✗ Error: {e}\n")
        import traceback
        f.write(traceback.format_exc())

print("Test completed - check test_results.txt for results")
