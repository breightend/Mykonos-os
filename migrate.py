#!/usr/bin/env python3
"""
Database migration script for Mykonos OS
"""

import os
import sys
import logging
import psycopg2
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "src" / "backend"))

from config.config import get_config
from database.database import Database

logger = logging.getLogger(__name__)


class MigrationManager:
    def __init__(self):
        self.config = get_config()
        self.db = Database()
        self.migrations_dir = Path(__file__).parent / "migrations"
        self.migrations_dir.mkdir(exist_ok=True)

    def init_migrations_table(self):
        """Create migrations table if it doesn't exist"""
        try:
            if self.config.USE_POSTGRES:
                conn = psycopg2.connect(**self.config.postgres_config)
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        id SERIAL PRIMARY KEY,
                        version VARCHAR(255) NOT NULL UNIQUE,
                        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()
                cursor.close()
                conn.close()
            else:
                # SQLite version
                self.db.execute_query("""
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        version TEXT NOT NULL UNIQUE,
                        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            logger.info("Migrations table initialized")
        except Exception as e:
            logger.error(f"Failed to initialize migrations table: {e}")
            raise

    def get_applied_migrations(self):
        """Get list of applied migrations"""
        try:
            if self.config.USE_POSTGRES:
                conn = psycopg2.connect(**self.config.postgres_config)
                cursor = conn.cursor()
                cursor.execute("SELECT version FROM schema_migrations ORDER BY version")
                applied = [row[0] for row in cursor.fetchall()]
                cursor.close()
                conn.close()
            else:
                result = self.db.execute_query(
                    "SELECT version FROM schema_migrations ORDER BY version"
                )
                applied = [row["version"] for row in result] if result else []
            return applied
        except Exception as e:
            logger.error(f"Failed to get applied migrations: {e}")
            return []

    def get_pending_migrations(self):
        """Get list of pending migrations"""
        applied = self.get_applied_migrations()
        all_migrations = []

        for migration_file in sorted(self.migrations_dir.glob("*.sql")):
            version = migration_file.stem
            if version not in applied:
                all_migrations.append(version)

        return all_migrations

    def apply_migration(self, version):
        """Apply a single migration"""
        migration_file = self.migrations_dir / f"{version}.sql"

        if not migration_file.exists():
            raise FileNotFoundError(f"Migration file not found: {migration_file}")

        try:
            with open(migration_file, "r", encoding="utf-8") as f:
                migration_sql = f.read()

            if self.config.USE_POSTGRES:
                conn = psycopg2.connect(**self.config.postgres_config)
                cursor = conn.cursor()

                # Execute migration
                cursor.execute(migration_sql)

                # Record migration
                cursor.execute(
                    "INSERT INTO schema_migrations (version) VALUES (%s)", (version,)
                )

                conn.commit()
                cursor.close()
                conn.close()
            else:
                # SQLite version
                self.db.execute_query(migration_sql)
                self.db.execute_query(
                    "INSERT INTO schema_migrations (version) VALUES (?)", (version,)
                )

            logger.info(f"Applied migration: {version}")

        except Exception as e:
            logger.error(f"Failed to apply migration {version}: {e}")
            raise

    def migrate(self):
        """Apply all pending migrations"""
        self.init_migrations_table()
        pending = self.get_pending_migrations()

        if not pending:
            logger.info("No pending migrations")
            return

        logger.info(f"Applying {len(pending)} migrations...")

        for version in pending:
            self.apply_migration(version)

        logger.info("All migrations applied successfully")

    def create_migration(self, name):
        """Create a new migration file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version = f"{timestamp}_{name}"
        migration_file = self.migrations_dir / f"{version}.sql"

        migration_template = f"""-- Migration: {name}
-- Created: {datetime.now().isoformat()}

-- Add your SQL statements here
-- Example:
-- ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

-- Remember to test your migration before applying to production!
"""

        with open(migration_file, "w", encoding="utf-8") as f:
            f.write(migration_template)

        logger.info(f"Created migration: {migration_file}")
        return migration_file


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Database migration manager")
    parser.add_argument(
        "command", choices=["migrate", "create", "status"], help="Command to execute"
    )
    parser.add_argument("--name", help="Migration name (for create command)")

    args = parser.parse_args()

    # Setup logging
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    manager = MigrationManager()

    try:
        if args.command == "migrate":
            manager.migrate()
        elif args.command == "create":
            if not args.name:
                print("Error: --name is required for create command")
                sys.exit(1)
            manager.create_migration(args.name)
        elif args.command == "status":
            applied = manager.get_applied_migrations()
            pending = manager.get_pending_migrations()

            print(f"Applied migrations: {len(applied)}")
            for migration in applied:
                print(f"  ✓ {migration}")

            print(f"\nPending migrations: {len(pending)}")
            for migration in pending:
                print(f"  - {migration}")

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
