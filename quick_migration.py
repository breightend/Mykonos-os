#!/usr/bin/env python3

import sys
import os

# Add the src/backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from database.database import Database

def run_migration():
    db = Database()
    
    print("🔧 Running database migration for variant support...")
    
    # Check if columns already exist
    try:
        result = db.execute_query("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'purchases_detail' 
            AND column_name IN ('variant_id', 'size_id', 'color_id', 'variant_barcode')
        """)
        
        existing_columns = [row['column_name'] for row in result]
        print(f"📋 Existing variant columns: {existing_columns}")
        
        if len(existing_columns) >= 4:
            print("✅ All variant columns already exist!")
            return True
            
    except Exception as e:
        print(f"❌ Error checking existing columns: {e}")
    
    # Run the migration
    migration_sql = """
    -- Add variant support columns to purchases_detail table
    ALTER TABLE purchases_detail 
    ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES warehouse_stock_variants(id),
    ADD COLUMN IF NOT EXISTS size_id INTEGER REFERENCES sizes(id),
    ADD COLUMN IF NOT EXISTS color_id INTEGER REFERENCES colors(id),
    ADD COLUMN IF NOT EXISTS variant_barcode VARCHAR(50);
    
    -- Add index for better performance
    CREATE INDEX IF NOT EXISTS idx_purchases_detail_variant_id ON purchases_detail(variant_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_detail_size_id ON purchases_detail(size_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_detail_color_id ON purchases_detail(color_id);
    """
    
    try:
        db.execute_query(migration_sql)
        print("✅ Migration completed successfully!")
        
        # Verify the columns were added
        result = db.execute_query("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'purchases_detail' 
            ORDER BY ordinal_position
        """)
        
        columns = [row['column_name'] for row in result]
        print(f"📋 Current purchases_detail columns: {columns}")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)