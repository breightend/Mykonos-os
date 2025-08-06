#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database


def fix_inventory_movements_table():
    """Add variant information fields to inventory_movements table"""
    try:
        db = Database()

        print("🔧 === FIXING INVENTORY_MOVEMENTS TABLE ===")

        # Check current structure
        print("\n📋 Current inventory_movements structure:")
        try:
            result = db.execute_query("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'inventory_movements' 
                ORDER BY ordinal_position
            """)
            current_columns = [col["column_name"] for col in result]
            print("Current columns:", current_columns)
        except Exception as e:
            print(f"❌ Error checking structure: {e}")
            return

        # Add missing columns if they don't exist
        columns_to_add = [
            ("variant_id", "INTEGER"),
            ("size_id", "INTEGER"),
            ("color_id", "INTEGER"),
            ("variant_barcode", "TEXT"),
        ]

        for column_name, column_type in columns_to_add:
            if column_name not in current_columns:
                print(f"\n➕ Adding column {column_name} ({column_type})")
                try:
                    db.execute_query(f"""
                        ALTER TABLE inventory_movements 
                        ADD COLUMN {column_name} {column_type}
                    """)
                    print(f"✅ Column {column_name} added successfully")
                except Exception as e:
                    print(f"❌ Error adding column {column_name}: {e}")
            else:
                print(f"✅ Column {column_name} already exists")

        # Add foreign key constraints if they don't exist
        print("\n🔗 Adding foreign key constraints...")

        # Check existing constraints
        constraints_query = """
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'inventory_movements' 
            AND constraint_type = 'FOREIGN KEY'
        """
        existing_constraints = db.execute_query(constraints_query)
        constraint_names = [c["constraint_name"] for c in existing_constraints]

        foreign_keys = [
            (
                "fk_inventory_movements_variant",
                "variant_id",
                "warehouse_stock_variants(id)",
            ),
            ("fk_inventory_movements_size", "size_id", "sizes(id)"),
            ("fk_inventory_movements_color", "color_id", "colors(id)"),
        ]

        for fk_name, column, reference in foreign_keys:
            if fk_name not in constraint_names:
                try:
                    db.execute_query(f"""
                        ALTER TABLE inventory_movements 
                        ADD CONSTRAINT {fk_name} 
                        FOREIGN KEY ({column}) REFERENCES {reference}
                    """)
                    print(f"✅ Foreign key {fk_name} added")
                except Exception as e:
                    print(f"⚠️ Could not add foreign key {fk_name}: {e}")
            else:
                print(f"✅ Foreign key {fk_name} already exists")

        # Verify final structure
        print("\n📋 Final inventory_movements structure:")
        result = db.execute_query("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'inventory_movements' 
            ORDER BY ordinal_position
        """)
        for col in result:
            print(f"  - {col['column_name']}: {col['data_type']}")

        print("\n✅ Table structure updated successfully!")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    fix_inventory_movements_table()
