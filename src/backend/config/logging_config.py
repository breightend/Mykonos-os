"""
Logging configuration for the application
"""

import os
import logging
import logging.handlers


def setup_logging(config):
    """
    Set up logging configuration based on environment

    Args:
        config: Configuration object
    """
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)

    # Configure logging level
    log_level = getattr(logging, config.LOG_LEVEL.upper(), logging.INFO)

    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File handler (with rotation)
    if hasattr(config, "LOG_FILE") and config.LOG_FILE:
        file_handler = logging.handlers.RotatingFileHandler(
            config.LOG_FILE,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    # Error file handler (separate file for errors)
    error_handler = logging.handlers.RotatingFileHandler(
        "logs/errors.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)

    # Suppress some noisy loggers in production
    if not config.DEBUG:
        logging.getLogger("werkzeug").setLevel(logging.WARNING)
        logging.getLogger("urllib3").setLevel(logging.WARNING)

    logging.info(f"Logging configured for {config.ENVIRONMENT} environment")


def get_logger(name):
    """
    Get a logger instance

    Args:
        name (str): Logger name

    Returns:
        logging.Logger: Logger instance
    """
    return logging.getLogger(name)
