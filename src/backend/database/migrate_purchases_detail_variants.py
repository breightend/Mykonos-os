#!/usr/bin/env python3
"""
Migration script to add variant support to purchases_detail table
"""
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database.database import Database

def run_migration():
    """Run the migration to add variant fields to purchases_detail"""
    try:
        db = Database()
        
        print("🔧 Starting migration: Add variant support to purchases_detail table")
        
        # Read the migration SQL
        migration_file = os.path.join(os.path.dirname(__file__), 'add_variants_to_purchases_detail.sql')
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split SQL commands by semicolon and execute each one
        sql_commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
        
        for i, command in enumerate(sql_commands):
            if command and not command.startswith('--'):
                try:
                    print(f"📝 Executing command {i+1}/{len(sql_commands)}: {command[:50]}...")
                    result = db.execute_query(command)
                    if result:
                        print(f"✅ Command {i+1} executed successfully")
                    else:
                        print(f"⚠️ Command {i+1} returned no result")
                except Exception as e:
                    if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                        print(f"⚠️ Command {i+1} skipped (column already exists): {e}")
                    else:
                        print(f"❌ Error in command {i+1}: {e}")
                        # Continue with other commands
        
        # Verify the migration worked
        print("\n🔍 Verifying migration...")
        table_info = db.execute_query("PRAGMA table_info(purchases_detail)")
        
        variant_columns = ['variant_id', 'size_id', 'color_id', 'variant_barcode']
        found_columns = [col['name'] for col in table_info] if table_info else []
        
        print(f"📋 Current columns in purchases_detail: {found_columns}")
        
        missing_columns = [col for col in variant_columns if col not in found_columns]
        if missing_columns:
            print(f"❌ Missing columns: {missing_columns}")
            return False
        else:
            print("✅ All variant columns found!")
            return True
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    if success:
        print("\n🎉 Migration completed successfully!")
    else:
        print("\n💥 Migration failed!")
        sys.exit(1)