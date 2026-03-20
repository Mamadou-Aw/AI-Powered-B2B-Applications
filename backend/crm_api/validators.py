from __future__ import annotations

import re
from typing import Any

from flask import request

from .utils import ALLOWED_BEHAVIOR_TYPES, ALLOWED_CHANNELS, ALLOWED_SOURCES, ApiError

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def parse_json_body() -> dict[str, Any]:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("A valid JSON object is required.", 400)
    return data


def validate_customer_payload(data: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    if len(full_name) < 2:
        errors["full_name"] = "Full name must contain at least 2 characters."
    if not EMAIL_RE.match(email):
        errors["email"] = "A valid email address is required."
    return errors


def validate_campaign_payload(data: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    name = str(data.get("name", "")).strip()
    goal = str(data.get("goal", "")).strip()
    channel = str(data.get("channel", "")).strip()
    if len(name) < 3:
        errors["name"] = "Campaign name must contain at least 3 characters."
    if len(goal) < 10:
        errors["goal"] = "Goal must contain at least 10 characters."
    if channel not in ALLOWED_CHANNELS:
        errors["channel"] = f"Channel must be one of: {', '.join(sorted(ALLOWED_CHANNELS))}."
    return errors


def validate_behavior_payload(data: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    customer_id = data.get("customer_id")
    source = str(data.get("source", "")).strip()
    behavior_type = str(data.get("behavior_type", "")).strip()
    details = str(data.get("details", "")).strip()
    score = data.get("score")
    try:
        score = int(score)
    except (TypeError, ValueError):
        errors["score"] = "Score must be a number between 0 and 100."
        score = None
    if not customer_id:
        errors["customer_id"] = "Customer is required."
    if source not in ALLOWED_SOURCES:
        errors["source"] = f"Source must be one of: {', '.join(sorted(ALLOWED_SOURCES))}."
    if behavior_type not in ALLOWED_BEHAVIOR_TYPES:
        errors["behavior_type"] = f"Behavior type must be one of: {', '.join(sorted(ALLOWED_BEHAVIOR_TYPES))}."
    if len(details) < 5:
        errors["details"] = "Details must contain at least 5 characters."
    if score is not None and not 0 <= score <= 100:
        errors["score"] = "Score must be between 0 and 100."
    return errors


def validate_message_payload(data: dict[str, Any], require_customer_campaign: bool = True) -> dict[str, str]:
    errors: dict[str, str] = {}
    if require_customer_campaign:
        if not data.get("customer_id"):
            errors["customer_id"] = "Customer is required."
        if not data.get("campaign_id"):
            errors["campaign_id"] = "Campaign is required."
    subject = str(data.get("subject", "")).strip()
    message_body = str(data.get("message_body", "")).strip()
    status = str(data.get("status", "draft")).strip() or "draft"
    if len(subject) < 3:
        errors["subject"] = "Subject must contain at least 3 characters."
    if len(message_body) < 20:
        errors["message_body"] = "Message body must contain at least 20 characters."
    if status not in {"draft", "sent"}:
        errors["status"] = "Status must be either draft or sent."
    return errors
