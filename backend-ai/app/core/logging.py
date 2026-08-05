"""
Minimal structured logging setup.

Kept deliberately dependency-free (no structlog) so the service stays easy
to run in a student / PFE context, while still giving you greppable,
timestamped, leveled logs with a request-scoped correlation id.
"""

from __future__ import annotations

import logging
import sys
import uuid
from contextvars import ContextVar

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get()
        return True


def new_request_id() -> str:
    rid = uuid.uuid4().hex[:12]
    request_id_ctx.set(rid)
    return rid


def setup_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | req=%(request_id)s | "
            "%(name)s | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
    )
    handler.addFilter(RequestIdFilter())

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]

    # Quiet down noisy third-party loggers.
    for noisy in ("httpx", "httpcore", "PIL", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
