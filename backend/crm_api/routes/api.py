from __future__ import annotations

from flask import Blueprint, jsonify
from psycopg.errors import ForeignKeyViolation, UniqueViolation

from ..db import execute_returning, fetch_all, fetch_one, ensure_entity_exists, get_campaigns, get_customer_behaviors
from ..services.ai_service import ai_select_campaign_and_message
from ..services.mailer import send_email_via_smtp
from ..services.notifications import fetch_notification_alerts
from ..utils import ApiError, utc_now_iso
from ..validators import (
    parse_json_body,
    validate_behavior_payload,
    validate_campaign_payload,
    validate_customer_payload,
    validate_message_payload,
)

api_bp = Blueprint("api", __name__)


@api_bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@api_bp.get("/api/dashboard")
def dashboard():
    summary = {
        "customers": fetch_one("SELECT COUNT(*) AS count FROM customers")["count"],
        "campaigns": fetch_one("SELECT COUNT(*) AS count FROM campaigns")["count"],
        "behaviors": fetch_one("SELECT COUNT(*) AS count FROM customer_behaviors")["count"],
        "generated_messages": fetch_one("SELECT COUNT(*) AS count FROM generated_messages")["count"],
        "notifications": len(fetch_notification_alerts()),
    }
    recent_behaviors = fetch_all(
        """
        SELECT cb.*, c.full_name
        FROM customer_behaviors cb
        JOIN customers c ON c.id = cb.customer_id
        ORDER BY cb.created_at DESC, cb.id DESC
        LIMIT 5
        """
    )
    recent_messages = fetch_all(
        """
        SELECT gm.*, c.full_name, cp.name AS campaign_name, cp.channel
        FROM generated_messages gm
        JOIN customers c ON c.id = gm.customer_id
        JOIN campaigns cp ON cp.id = gm.campaign_id
        ORDER BY gm.created_at DESC, gm.id DESC
        LIMIT 5
        """
    )
    return jsonify({"summary": summary, "recent_behaviors": recent_behaviors, "recent_messages": recent_messages})


@api_bp.get("/api/customers")
def list_customers():
    return jsonify(fetch_all("SELECT * FROM customers ORDER BY id DESC"))


@api_bp.post("/api/customers")
def create_customer():
    data = parse_json_body()
    errors = validate_customer_payload(data)
    if errors:
        raise ApiError("Validation failed.", 422, errors)

    try:
        row = execute_returning(
            """
            INSERT INTO customers (full_name, email, company, job_title, industry, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                str(data["full_name"]).strip(),
                str(data["email"]).strip().lower(),
                str(data.get("company", "")).strip() or None,
                str(data.get("job_title", "")).strip() or None,
                str(data.get("industry", "")).strip() or None,
                utc_now_iso(),
            ),
        )
        return jsonify(row), 201
    except UniqueViolation:
        raise ApiError("A customer with that email already exists.", 409)


@api_bp.get("/api/campaigns")
def list_campaigns():
    return jsonify(fetch_all("SELECT * FROM campaigns ORDER BY id DESC"))


@api_bp.post("/api/campaigns")
def create_campaign():
    data = parse_json_body()
    errors = validate_campaign_payload(data)
    if errors:
        raise ApiError("Validation failed.", 422, errors)
    row = execute_returning(
        """
        INSERT INTO campaigns (name, goal, channel, created_at)
        VALUES (%s, %s, %s, %s)
        RETURNING *
        """,
        (
            str(data["name"]).strip(),
            str(data["goal"]).strip(),
            str(data["channel"]).strip(),
            utc_now_iso(),
        ),
    )
    return jsonify(row), 201


@api_bp.get("/api/behaviors")
def list_behaviors():
    behaviors = fetch_all(
        """
        SELECT cb.*, c.full_name
        FROM customer_behaviors cb
        JOIN customers c ON c.id = cb.customer_id
        ORDER BY cb.created_at DESC, cb.id DESC
        """
    )
    return jsonify(behaviors)


@api_bp.post("/api/behaviors")
def create_behavior():
    data = parse_json_body()
    errors = validate_behavior_payload(data)
    if errors:
        raise ApiError("Validation failed.", 422, errors)

    customer_id = int(data["customer_id"])
    ensure_entity_exists("customers", customer_id, "Customer")
    try:
        row = execute_returning(
            """
            INSERT INTO customer_behaviors (customer_id, source, behavior_type, details, score, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                customer_id,
                str(data["source"]).strip(),
                str(data["behavior_type"]).strip(),
                str(data["details"]).strip(),
                int(data["score"]),
                utc_now_iso(),
            ),
        )
    except ForeignKeyViolation:
        raise ApiError("Customer not found.", 404)

    alerts = fetch_notification_alerts()
    triggered = any(
        alert["customer_id"] == customer_id and alert["source"] == row["source"] and alert["behavior_type"] == row["behavior_type"]
        for alert in alerts
    )
    return jsonify({"behavior": row, "triggered_notification": triggered}), 201


@api_bp.get("/api/messages")
def list_messages():
    messages = fetch_all(
        """
        SELECT gm.*, c.full_name, c.company, c.email, cp.name AS campaign_name, cp.channel
        FROM generated_messages gm
        JOIN customers c ON c.id = gm.customer_id
        JOIN campaigns cp ON cp.id = gm.campaign_id
        ORDER BY gm.created_at DESC, gm.id DESC
        """
    )
    return jsonify(messages)


@api_bp.get("/api/messages/<int:message_id>")
def get_message(message_id: int):
    row = fetch_one(
        """
        SELECT gm.*, c.full_name, c.email, cp.name AS campaign_name, cp.channel
        FROM generated_messages gm
        JOIN customers c ON c.id = gm.customer_id
        JOIN campaigns cp ON cp.id = gm.campaign_id
        WHERE gm.id = %s
        """,
        (message_id,),
    )
    if not row:
        raise ApiError("Message not found.", 404)
    return jsonify(row)


@api_bp.post("/api/messages")
def create_message():
    data = parse_json_body()
    errors = validate_message_payload(data, require_customer_campaign=True)
    if errors:
        raise ApiError("Validation failed.", 422, errors)
    customer_id = int(data["customer_id"])
    campaign_id = int(data["campaign_id"])
    ensure_entity_exists("customers", customer_id, "Customer")
    ensure_entity_exists("campaigns", campaign_id, "Campaign")

    row = execute_returning(
        """
        INSERT INTO generated_messages (customer_id, campaign_id, subject, message_body, ai_reason, status, created_at, sent_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """,
        (
            customer_id,
            campaign_id,
            str(data["subject"]).strip(),
            str(data["message_body"]).strip(),
            str(data.get("ai_reason", "")).strip() or None,
            str(data.get("status", "draft")).strip() or "draft",
            utc_now_iso(),
            None,
        ),
    )
    return jsonify(row), 201


@api_bp.put("/api/messages/<int:message_id>")
def update_message(message_id: int):
    data = parse_json_body()
    errors = validate_message_payload(data, require_customer_campaign=False)
    if errors:
        raise ApiError("Validation failed.", 422, errors)
    existing = ensure_entity_exists("generated_messages", message_id, "Message")
    row = execute_returning(
        """
        UPDATE generated_messages
        SET subject = %s, message_body = %s, ai_reason = %s, status = %s
        WHERE id = %s
        RETURNING *
        """,
        (
            str(data["subject"]).strip(),
            str(data["message_body"]).strip(),
            str(data.get("ai_reason", "")).strip() or existing.get("ai_reason"),
            str(data.get("status", existing.get("status") or "draft")).strip() or "draft",
            message_id,
        ),
    )
    return jsonify(row)


@api_bp.post("/api/messages/<int:message_id>/send")
def send_message(message_id: int):
    row = fetch_one(
        """
        SELECT gm.*, c.email, c.full_name, cp.channel
        FROM generated_messages gm
        JOIN customers c ON c.id = gm.customer_id
        JOIN campaigns cp ON cp.id = gm.campaign_id
        WHERE gm.id = %s
        """,
        (message_id,),
    )
    if not row:
        raise ApiError("Message not found.", 404)
    if (row.get("channel") or "").lower() != "email":
        raise ApiError("Only email sending is enabled in this demo.", 400)
    try:
        send_email_via_smtp(row["email"], row["subject"], row["message_body"])
    except ApiError:
        raise
    except Exception as exc:
        raise ApiError(f"Email sending failed: {exc}", 502)

    sent_at = utc_now_iso()
    execute_returning(
        """
        UPDATE generated_messages
        SET status = %s, sent_at = %s
        WHERE id = %s
        RETURNING *
        """,
        ("sent", sent_at, message_id),
    )
    return jsonify({"message": f"Email sent successfully to {row['full_name']}", "sent_at": sent_at})


@api_bp.get("/api/notifications")
def notifications():
    return jsonify(fetch_notification_alerts())


@api_bp.get("/api/customers/<int:customer_id>")
def customer_detail(customer_id: int):
    customer = ensure_entity_exists("customers", customer_id, "Customer")
    behaviors = fetch_all(
        "SELECT * FROM customer_behaviors WHERE customer_id = %s ORDER BY created_at DESC, id DESC",
        (customer_id,),
    )
    messages = fetch_all(
        """
        SELECT gm.*, cp.name AS campaign_name, cp.channel
        FROM generated_messages gm
        JOIN campaigns cp ON cp.id = gm.campaign_id
        WHERE gm.customer_id = %s
        ORDER BY gm.created_at DESC, gm.id DESC
        """,
        (customer_id,),
    )
    alerts = [alert for alert in fetch_notification_alerts() if alert["customer_id"] == customer_id]
    return jsonify({"customer": customer, "behaviors": behaviors, "messages": messages, "alerts": alerts})


@api_bp.post("/api/customers/<int:customer_id>/suggest-campaign")
def suggest_campaign(customer_id: int):
    data = parse_json_body()
    source = str(data.get("source", "")).strip() or None
    behavior_type = str(data.get("behavior_type", "")).strip() or None
    customer = ensure_entity_exists("customers", customer_id, "Customer")
    campaigns = get_campaigns()
    if source and behavior_type:
        behaviors = get_customer_behaviors(customer_id, source=source, behavior_type=behavior_type, high_only=True, limit=3)
    else:
        behaviors = get_customer_behaviors(customer_id, limit=3)
    ai_result = ai_select_campaign_and_message(customer, campaigns, behaviors, preferred_campaign_id=None)
    campaign = ensure_entity_exists("campaigns", int(ai_result["campaign_id"]), "Campaign")
    return jsonify({"suggested_campaign": campaign, "ai_reason": ai_result["ai_reason"]})


@api_bp.post("/api/customers/<int:customer_id>/generate-message")
def generate_message(customer_id: int):
    data = parse_json_body()
    source = str(data.get("source", "")).strip() or None
    behavior_type = str(data.get("behavior_type", "")).strip() or None
    campaign_id = data.get("campaign_id")

    customer = ensure_entity_exists("customers", customer_id, "Customer")
    if source and behavior_type:
        behaviors = get_customer_behaviors(customer_id, source=source, behavior_type=behavior_type, high_only=True, limit=3)
    else:
        behaviors = get_customer_behaviors(customer_id, limit=3)

    if not behaviors:
        raise ApiError("This customer has no behaviors yet. Add behaviors before generating a message.", 422)

    campaigns = get_campaigns()
    preferred_campaign_id = int(campaign_id) if campaign_id else None
    if preferred_campaign_id:
        ensure_entity_exists("campaigns", preferred_campaign_id, "Campaign")

    ai_result = ai_select_campaign_and_message(customer, campaigns, behaviors, preferred_campaign_id=preferred_campaign_id)
    selected_campaign = ensure_entity_exists("campaigns", int(ai_result["campaign_id"]), "Campaign")

    row = execute_returning(
        """
        INSERT INTO generated_messages (customer_id, campaign_id, subject, message_body, ai_reason, status, created_at, sent_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """,
        (
            customer_id,
            selected_campaign["id"],
            ai_result["subject"],
            ai_result["message_body"],
            ai_result["ai_reason"],
            "draft",
            utc_now_iso(),
            None,
        ),
    )
    row["campaign_name"] = selected_campaign["name"]
    row["channel"] = selected_campaign["channel"]
    return jsonify(row), 201
