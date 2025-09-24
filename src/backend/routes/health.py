"""
Health check and monitoring routes
"""

from flask import Blueprint, jsonify
import psycopg2
from database.database import Database
from config.config import get_config
import logging

health_bp = Blueprint("health", __name__)
logger = logging.getLogger(__name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint for monitoring
    """
    try:
        config = get_config()

        # Basic health status
        status = {
            "status": "healthy",
            "timestamp": None,
            "environment": config.ENVIRONMENT,
            "version": "1.0.0",  # You should get this from a version file
            "checks": {},
        }

        # Database connectivity check
        try:
            db = Database()
            # Simple query to test database
            if config.USE_POSTGRES:
                # Test PostgreSQL connection
                conn = psycopg2.connect(**config.postgres_config)
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                cursor.close()
                conn.close()
                status["checks"]["database"] = {
                    "status": "healthy",
                    "type": "postgresql",
                }
            else:
                # Test SQLite connection
                db.get_all_records("users", limit=1)
                status["checks"]["database"] = {"status": "healthy", "type": "sqlite"}

        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            status["status"] = "unhealthy"
            status["checks"]["database"] = {"status": "unhealthy", "error": str(e)}

        # Add timestamp
        from datetime import datetime

        status["timestamp"] = datetime.utcnow().isoformat()

        return jsonify(status), 200 if status["status"] == "healthy" else 503

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify(
            {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
        ), 503


@health_bp.route("/health/ready", methods=["GET"])
def readiness_check():
    """
    Readiness check for Kubernetes/Docker deployments
    """
    try:
        # Check if the application is ready to serve requests
        db = Database()
        config = get_config()

        # Test database connection
        if config.USE_POSTGRES:
            conn = psycopg2.connect(**config.postgres_config)
            conn.close()

        return jsonify({"status": "ready"}), 200

    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return jsonify({"status": "not ready", "error": str(e)}), 503


@health_bp.route("/health/live", methods=["GET"])
def liveness_check():
    """
    Liveness check for Kubernetes/Docker deployments
    """
    return jsonify({"status": "alive"}), 200
