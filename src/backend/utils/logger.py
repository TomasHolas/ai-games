import logging


def setup_logger(name: str = "ai_games", level: int = logging.INFO) -> logging.Logger:
    """
    Sets up and returns a configured logger instance.

    Args:
        name: Logger name (default: "ai_games")
        level: Logging level (default: INFO)

    Returns:
        Configured Logger instance
    """
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )
    return logging.getLogger(name)
