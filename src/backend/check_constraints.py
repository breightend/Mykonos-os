#!/usr/bin/env python3

from database.database import Database


def check_constraints():
    db = Database()

    # Check all constraints on sales_detail table
    query = """
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'sales_detail')
    """

    result = db.execute_query(query)
    print("Constraints on sales_detail table:")
    print("=" * 50)

    if not result:
        print("No constraints found")
        return

    for row in result:
        if isinstance(row, dict):
            constraint_name = row.get("conname", "Unknown")
            constraint_def = row.get("pg_get_constraintdef", "Unknown")
        else:
            constraint_name = row[0] if len(row) > 0 else "Unknown"
            constraint_def = row[1] if len(row) > 1 else "Unknown"

        print(f"Name: {constraint_name}")
        print(f"Definition: {constraint_def}")
        print("-" * 30)


if __name__ == "__main__":
    check_constraints()
