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
    Simple health check endpoint for monitoring
    """
    try:
        from datetime import datetime

        # Basic health status without database dependency
        status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "mykonos-backend",
            "version": "1.0.0",
        }

        return jsonify(status), 200

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        from datetime import datetime

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
