from __future__ import annotations

import os
from datetime import date, datetime, time, timezone
from pathlib import Path
from typing import Any

HIGH_INTEREST_THRESHOLD = 80
SIMILAR_BEHAVIOR_MIN_COUNT = 3
ALLOWED_CHANNELS = {"Email", "LinkedIn", "SMS"}
ALLOWED_SOURCES = {"website", "social_media", "google_search"}
ALLOWED_BEHAVIOR_TYPES = {"page_view", "download", "like", "search_interest"}


class ApiError(Exception):
    def __init__(self, message: str, status_code: int = 400, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


def load_local_env() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"\'')) 


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def to_json_compatible(value: Any) -> Any:
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: to_json_compatible(item) for key, item in value.items()}
    if isinstance(value, list):
        return [to_json_compatible(item) for item in value]
    if isinstance(value, tuple):
        return [to_json_compatible(item) for item in value]
    return value
