#!/usr/bin/env python3

from database.database import Database


def fix_quantity_constraint():
    """
    Fix the sales_detail quantity constraint to allow negative quantities for returns.
    Original: CHECK (quantity > 0)
    New: CHECK (quantity <> 0)  -- allows positive and negative, but not zero
    """
    db = Database()

    try:
        print("🔧 Fixing sales_detail quantity constraint...")

        # Drop the existing constraint
        drop_constraint_query = """
        ALTER TABLE sales_detail 
        DROP CONSTRAINT IF EXISTS sales_detail_quantity_check;
        """

        db.execute_query(drop_constraint_query)
        print("✅ Dropped old quantity constraint")

        # Add new constraint that allows negative quantities (for returns) but not zero
        add_constraint_query = """
        ALTER TABLE sales_detail 
        ADD CONSTRAINT sales_detail_quantity_check 
        CHECK (quantity <> 0);
        """

        db.execute_query(add_constraint_query)
        print(
            "✅ Added new quantity constraint (allows negative quantities for returns)"
        )

        # Verify the constraint was updated
        verify_query = """
        SELECT conname, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conname = 'sales_detail_quantity_check'
        """

        result = db.execute_query(verify_query)
        if result:
            for row in result:
                if isinstance(row, dict):
                    constraint_def = row.get("pg_get_constraintdef", "Unknown")
                else:
                    constraint_def = row[1] if len(row) > 1 else "Unknown"
                print(f"✅ New constraint definition: {constraint_def}")

        print("🎉 Constraint fix completed successfully!")

    except Exception as e:
        print(f"❌ Error fixing constraint: {str(e)}")
        raise


if __name__ == "__main__":
    fix_quantity_constraint()
