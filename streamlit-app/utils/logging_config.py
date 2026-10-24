"""Safe terminal logging configuration for the Streamlit application."""

from __future__ import annotations

import logging
import os


LOGGER_NAME = "cv_generator"


def configure_logging() -> logging.Logger:
    """Configure one terminal handler and return the application logger."""
    logger = logging.getLogger(LOGGER_NAME)
    if logger.handlers:
        return logger

    level_name = os.getenv("CV_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logger.setLevel(level)
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))
    logger.addHandler(handler)
    logger.propagate = False
    return logger


logger = configure_logging()
