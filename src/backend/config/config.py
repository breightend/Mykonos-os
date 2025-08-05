import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecreto")  # Clave para cifrar JWT
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY", "clave_para_tokens"
    )  # Clave para firmar JWT

    # Database Configuration
    USE_POSTGRES = os.getenv("USE_POSTGRES", "true").lower() == "true"

    # PostgreSQL Configuration
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "mykonos")
    DB_USER = os.getenv("DB_USER", "mykonos_user")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "mykonos_password")

    # SQLAlchemy Configuration
    if USE_POSTGRES:
        SQLALCHEMY_DATABASE_URI = (
            f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )
    else:
        SQLALCHEMY_DATABASE_URI = "sqlite:///database.db"  # Legacy SQLite

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    @property
    def postgres_config(self):
        """Returns PostgreSQL connection parameters as a dictionary"""
        return {
            "host": self.DB_HOST,
            "port": self.DB_PORT,
            "database": self.DB_NAME,
            "user": self.DB_USER,
            "password": self.DB_PASSWORD,
        }
