#!/usr/bin/env python3
"""
Setup script for Mykonos OS
Handles environment-specific setup and initialization
"""

import os
import sys
import argparse
from pathlib import Path


def setup_development():
    """Setup development environment"""
    print("🔧 Setting up development environment...")

    # Copy example env file if .env doesn't exist
    if not Path(".env").exists():
        if Path(".env.example").exists():
            import shutil

            shutil.copy(".env.example", ".env")
            print("✅ Created .env file from .env.example")
        else:
            print("⚠️  No .env.example found, creating basic .env file")
            with open(".env", "w") as f:
                f.write("""# Development Environment
ENVIRONMENT=development
DEBUG=true
SERVER_HOST=0.0.0.0
SERVER_PORT=5000

# Database (adjust as needed)
USE_POSTGRES=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mykonos_dev
DB_USER=postgres
DB_PASSWORD=password

# Security (change these!)
SECRET_KEY=dev_secret_key_change_me
JWT_SECRET_KEY=dev_jwt_secret_change_me
""")

    # Create logs directory
    Path("src/backend/logs").mkdir(parents=True, exist_ok=True)
    print("✅ Created logs directory")

    print("🎉 Development environment setup complete!")
    print("📝 Don't forget to:")
    print("   1. Update database credentials in .env")
    print("   2. Install dependencies: pip install -r requirements.txt")
    print("   3. Run database migrations: python migrate.py migrate")


def setup_production():
    """Setup production environment"""
    print("🚀 Setting up production environment...")

    # Check if .env.prod exists
    if not Path(".env.prod").exists():
        if Path(".env.prod.example").exists():
            print("⚠️  Please copy .env.prod.example to .env.prod and configure it")
            return False
        else:
            print("❌ No .env.prod.example found")
            return False

    # Create necessary directories
    dirs = ["logs", "backups", "migrations"]
    for dir_name in dirs:
        Path(dir_name).mkdir(exist_ok=True)
        print(f"✅ Created {dir_name} directory")

    # Check Docker
    import subprocess

    try:
        subprocess.run(["docker", "--version"], check=True, capture_output=True)
        subprocess.run(["docker-compose", "--version"], check=True, capture_output=True)
        print("✅ Docker and Docker Compose are available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Docker or Docker Compose not found")
        return False

    print("🎉 Production environment setup complete!")
    print("📝 Next steps:")
    print("   1. Configure .env.prod with your production settings")
    print("   2. Generate strong SECRET_KEY and JWT_SECRET_KEY")
    print("   3. Set up SSL certificates if using HTTPS")
    print("   4. Run: ./deploy.sh production")

    return True


def create_admin_user():
    """Create admin user"""
    print("👤 Creating admin user...")

    # Add backend to Python path
    backend_path = Path(__file__).parent / "src" / "backend"
    sys.path.insert(0, str(backend_path))

    try:
        from commons.create_admin import create_admin

        create_admin()
    except ImportError as e:
        print(f"❌ Could not import create_admin: {e}")
        print("Make sure you're running this from the project root directory")
        return False
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False

    return True


def generate_secret_keys():
    """Generate secure secret keys"""
    import secrets

    secret_key = secrets.token_urlsafe(32)
    jwt_secret = secrets.token_urlsafe(32)

    print("🔐 Generated secure keys:")
    print(f"SECRET_KEY={secret_key}")
    print(f"JWT_SECRET_KEY={jwt_secret}")
    print("\n⚠️  Save these keys securely and add them to your .env.prod file!")


def main():
    parser = argparse.ArgumentParser(description="Mykonos OS Setup Script")
    parser.add_argument(
        "command",
        choices=[
            "dev",
            "development",
            "prod",
            "production",
            "admin",
            "create-admin",
            "keys",
            "generate-keys",
        ],
        help="Setup command",
    )

    args = parser.parse_args()

    if args.command in ["dev", "development"]:
        setup_development()
    elif args.command in ["prod", "production"]:
        if setup_production():
            sys.exit(0)
        else:
            sys.exit(1)
    elif args.command in ["admin", "create-admin"]:
        if create_admin_user():
            sys.exit(0)
        else:
            sys.exit(1)
    elif args.command in ["keys", "generate-keys"]:
        generate_secret_keys()


if __name__ == "__main__":
    main()
