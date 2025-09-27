"""
Smart database connection manager that can handle multiple IP addresses
"""

import psycopg2
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class SmartDatabaseConnection:
    """
    Manages database connections with automatic fallback between different hosts
    """

    def __init__(self, base_config: dict):
        """
        Initialize with base configuration

        Args:
            base_config: Base database configuration
        """
        self.base_config = base_config.copy()

        # Define possible hosts in order of preference
        self.hosts = [
            {
                "host": "192.168.100.65",  # Local network IP
                "description": "Local network connection",
                "priority": 1,
            },
            {
                "host": "186.122.88.99",  # Public IP
                "description": "Public IP connection",
                "priority": 2,
            },
        ]

        # Add any additional hosts from environment
        additional_hosts = []
        import os

        env_hosts = os.getenv("DB_FALLBACK_HOSTS", "")
        if env_hosts:
            for host in env_hosts.split(","):
                if host.strip():
                    additional_hosts.append(
                        {
                            "host": host.strip(),
                            "description": f"Environment fallback: {host.strip()}",
                            "priority": 99,
                        }
                    )

        self.hosts.extend(additional_hosts)

        # Sort by priority
        self.hosts.sort(key=lambda x: x["priority"])

        self.current_host = None
        self.connection_cache = {}

    def test_connection(self, host: str, timeout: int = 5) -> bool:
        """
        Test if a database host is reachable

        Args:
            host: Host to test
            timeout: Connection timeout in seconds

        Returns:
            bool: True if connection successful
        """
        try:
            config = self.base_config.copy()
            config["host"] = host
            config["connect_timeout"] = timeout

            logger.debug(f"Testing connection to {host}...")

            # Test connection
            conn = psycopg2.connect(**config)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            conn.close()

            logger.info(f"✅ Connection successful to {host}")
            return True

        except Exception as e:
            logger.debug(f"❌ Connection failed to {host}: {str(e)}")
            return False

    def find_best_host(self) -> Optional[str]:
        """
        Find the best available host

        Returns:
            str: Best available host or None if none work
        """
        logger.info("🔍 Searching for best database host...")

        for host_info in self.hosts:
            host = host_info["host"]
            description = host_info["description"]

            if self.test_connection(host):
                logger.info(f"🎯 Selected database host: {host} ({description})")
                self.current_host = host
                return host

        logger.error("❌ No database host is reachable")
        return None

    def get_connection_config(self) -> dict:
        """
        Get the connection configuration with the best available host

        Returns:
            dict: Database configuration
        """
        if not self.current_host:
            best_host = self.find_best_host()
            if not best_host:
                raise ConnectionError("No database host is available")

        config = self.base_config.copy()
        config["host"] = self.current_host
        return config

    def get_connection(self):
        """
        Get a database connection using the best available host

        Returns:
            psycopg2.connection: Database connection
        """
        config = self.get_connection_config()
        return psycopg2.connect(**config)

    def test_all_hosts(self) -> Dict[str, bool]:
        """
        Test all configured hosts and return results

        Returns:
            dict: Host -> connection status mapping
        """
        results = {}

        logger.info("🧪 Testing all database hosts...")

        for host_info in self.hosts:
            host = host_info["host"]
            description = host_info["description"]

            status = self.test_connection(host)
            results[host] = status

            status_icon = "✅" if status else "❌"
            logger.info(f"  {status_icon} {host} - {description}")

        return results

    def get_current_host_info(self) -> Optional[dict]:
        """
        Get information about the currently selected host

        Returns:
            dict: Current host information
        """
        if not self.current_host:
            return None

        for host_info in self.hosts:
            if host_info["host"] == self.current_host:
                return host_info

        return None
