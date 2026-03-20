from __future__ import annotations

import json
import os
import re
from typing import Any

from openai import OpenAI

from ..utils import ApiError, to_json_compatible
from ..validators import validate_message_payload
from .notifications import get_best_campaign_for_signal

JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


def parse_json_object(text: str) -> dict[str, Any]:
    match = JSON_BLOCK_RE.search(text or "")
    if not match:
        raise ValueError("No JSON object found in model response.")
    return json.loads(match.group(0))


def fallback_message(
    customer: dict[str, Any],
    campaign: dict[str, Any],
    behaviors: list[dict[str, Any]],
    note: str = "",
) -> dict[str, Any]:
    top_behaviors = behaviors[:3]
    first_name = customer["full_name"].split()[0] if customer.get("full_name") else "there"
    company = customer.get("company") or "your team"

    readable_points: list[str] = []
    for behavior in top_behaviors:
        details = str(behavior.get("details") or "").strip()
        if details:
            readable_points.append(details)
        else:
            readable_points.append("your recent activity")

    insight_text = ", ".join(readable_points[:2])
    if len(readable_points) >= 3:
        insight_text += f", and {readable_points[2]}"
    if not insight_text:
        insight_text = "the interest you've shown recently"

    subject = f"{first_name}, a quick idea for {company}"
    body = (
        f"Hi {first_name},\n\n"
        f"I wanted to reach out because it looks like there's growing interest from {company} lately, especially around {insight_text}. "
        f"Based on that, I thought the {campaign['name']} might be a good fit. "
        f"If it's relevant, I'd be happy to share a few ideas or walk you through the next step.\n\n"
        f"Best,\nYour CRM Team"
    )
    ai_reason = f"Campaign suggested from repeated customer interest signals. {note}".strip()
    return {
        "campaign_id": campaign["id"],
        "subject": subject,
        "message_body": body,
        "ai_reason": ai_reason,
    }


def get_openai_client() -> OpenAI:
    if not os.getenv("OPENAI_API_KEY"):
        raise ApiError("OPENAI_API_KEY is missing.", 503)
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def ai_select_campaign_and_message(
    customer: dict[str, Any],
    campaigns: list[dict[str, Any]],
    behaviors: list[dict[str, Any]],
    preferred_campaign_id: int | None = None,
) -> dict[str, Any]:
    if not campaigns:
        raise ApiError("No campaigns are available. Add at least one campaign first.", 422)
    if not behaviors:
        heuristic_campaign = campaigns[0]
        return fallback_message(customer, heuristic_campaign, [], "No behaviors were available, so the app used a default campaign.")

    client = get_openai_client()
    model_name = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")

    campaign_payload = [
        {"id": c["id"], "name": c["name"], "goal": c["goal"], "channel": c["channel"]}
        for c in campaigns
    ]
    behavior_payload = [
        {
            "id": b["id"],
            "source": b["source"],
            "behavior_type": b["behavior_type"],
            "details": b["details"],
            "summary": b["details"] or b["behavior_type"].replace("_", " "),
            "score": b["score"],
            "created_at": b["created_at"],
        }
        for b in behaviors[:3]
    ]

    prompt = {
        "customer": {
            "id": customer["id"],
            "full_name": customer["full_name"],
            "email": customer["email"],
            "company": customer.get("company"),
            "job_title": customer.get("job_title"),
            "industry": customer.get("industry"),
        },
        "behaviors": behavior_payload,
        "campaigns": campaign_payload,
        "preferred_campaign_id": preferred_campaign_id,
        "task": "Choose the best campaign for this customer and write a concise personalized outreach email that sounds natural and commercially relevant.",
    }

    instructions = (
        "You are an expert B2B CRM copilot for sales and lifecycle marketing. Analyze the customer context, choose the best matching campaign from the provided campaign list only, "
        "and draft a short, natural outreach email that feels human and commercially relevant. Return only valid JSON with keys campaign_id, subject, message_body, ai_reason. "
        "campaign_id must be one of the provided campaign IDs. message_body must be plain text without markdown. "
        "Never mention internal tracking, source names, behavior_type values, event names, scores, technical metrics, or that the message was generated from customer data. "
        "Do not use phrases such as high-intent signals, page_view, behavior_type, engagement score, recent activity score, or repeated interest from source. "
        "Instead, translate the signals into natural business language such as interest in pricing, exploring options, evaluating solutions, or looking for a better way to solve a problem. "
        "The email should sound like a real B2B marketing or sales message: warm, concise, specific, and persuasive without sounding robotic. "
        "ai_reason should briefly explain internally why the selected campaign fits the customer; it can be analytical because the user sees it inside the CRM, not in the email body."
    )

    try:
        response = client.responses.create(
            model=model_name,
            instructions=instructions,
            input=json.dumps(to_json_compatible(prompt), ensure_ascii=False),
        )
        parsed = parse_json_object(response.output_text)
        campaign_id = int(parsed.get("campaign_id"))
        campaign = next((c for c in campaigns if c["id"] == campaign_id), None)
        if not campaign:
            raise ValueError("Model selected an invalid campaign_id.")
        payload = {
            "campaign_id": campaign_id,
            "subject": str(parsed.get("subject", "")).strip(),
            "message_body": str(parsed.get("message_body", "")).strip(),
            "ai_reason": str(parsed.get("ai_reason", "")).strip(),
        }
        validation_errors = validate_message_payload(payload, require_customer_campaign=False)
        if validation_errors:
            raise ValueError(f"Invalid AI output: {validation_errors}")
        return payload
    except ApiError:
        raise
    except Exception as exc:
        fallback_campaign = next((c for c in campaigns if c["id"] == preferred_campaign_id), None) or get_best_campaign_for_signal(
            behaviors[0].get("source"), behaviors[0].get("behavior_type")
        ) or campaigns[0]
        return fallback_message(
            customer,
            fallback_campaign,
            behaviors,
            f"OpenAI fallback was used because the AI response could not be applied safely: {exc}",
        )
