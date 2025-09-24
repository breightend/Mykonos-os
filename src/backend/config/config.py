import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class BaseConfig:
    """Base configuration class with common settings"""

    SECRET_KEY = os.getenv("SECRET_KEY", "supersecreto")  # Clave para cifrar JWT
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY", "clave_para_tokens"
    )  # Clave para firmar JWT

    # Database Configuration
    USE_POSTGRES = os.getenv("USE_POSTGRES", "true").lower() == "true"

    # PostgreSQL Configuration
    DB_HOST = os.getenv("DB_HOST", "192.168.100.65")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "mykonos_db")
    DB_USER = os.getenv("DB_USER", "breightend_db")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "ñmICHIFUS156602")

    # SQLAlchemy Configuration
    if USE_POSTGRES:
        SQLALCHEMY_DATABASE_URI = (
            f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )
    else:
        SQLALCHEMY_DATABASE_URI = "sqlite:///database.db"  # Legacy SQLite

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Server Configuration
    SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT = int(os.getenv("SERVER_PORT", "5000"))
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"

    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

    # Logging Configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "logs/mykonos.log")

    # Security
    BCRYPT_LOG_ROUNDS = int(os.getenv("BCRYPT_LOG_ROUNDS", "12"))

    # CORS Configuration
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
    ).split(",")

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


class DevelopmentConfig(BaseConfig):
    """Development configuration"""

    DEBUG = True
    TESTING = False


class ProductionConfig(BaseConfig):
    """Production configuration"""

    DEBUG = False
    TESTING = False

    # Override defaults for production
    SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT = int(os.getenv("SERVER_PORT", "8080"))

    # More secure defaults for production
    SECRET_KEY = os.getenv("SECRET_KEY")  # Must be set in production
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")  # Must be set in production

    if not SECRET_KEY or not JWT_SECRET_KEY:
        raise ValueError(
            "SECRET_KEY and JWT_SECRET_KEY must be set in production environment"
        )


class TestingConfig(BaseConfig):
    """Testing configuration"""

    DEBUG = True
    TESTING = True
    USE_POSTGRES = False  # Use SQLite for tests
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


# Configuration mapping
config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}


# Get current configuration
def get_config():
    """Get the configuration class based on environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    return config.get(env, config["default"])


# Legacy compatibility - keep the old Config class
Config = get_config()
