import os

class Config:
    SECRET_KEY = "supersecreto"                         # Clave para cifrar JWT
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.db"   # Base de datos SQLite
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "clave_para_tokens"                # Clave para firmar JWT