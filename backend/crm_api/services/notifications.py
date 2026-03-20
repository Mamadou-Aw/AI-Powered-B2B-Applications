from __future__ import annotations

from typing import Any

from ..db import fetch_all
from ..utils import HIGH_INTEREST_THRESHOLD, SIMILAR_BEHAVIOR_MIN_COUNT

HEURISTIC_KEYWORDS: dict[tuple[str, str], list[str]] = {
    ("website", "page_view"): ["pricing", "demo", "follow up"],
    ("website", "download"): ["guide", "demo", "follow up"],
    ("google_search", "search_interest"): ["outreach", "demo", "follow up"],
    ("social_media", "like"): ["linkedin", "social", "follow up"],
}


def get_best_campaign_for_signal(source: str | None, behavior_type: str | None) -> dict[str, Any] | None:
    campaigns = fetch_all("SELECT * FROM campaigns ORDER BY id ASC")
    if not campaigns:
        return None
    source_lower = (source or "").lower()
    behavior_lower = (behavior_type or "").lower()
    keywords = HEURISTIC_KEYWORDS.get((source_lower, behavior_lower), [behavior_lower, source_lower])
    for keyword in keywords:
        for campaign in campaigns:
            haystack = f"{campaign['name']} {campaign['goal']} {campaign['channel']}".lower()
            if keyword and keyword in haystack:
                return campaign
    return campaigns[0]


def fetch_notification_alerts() -> list[dict[str, Any]]:
    raw_alerts = fetch_all(
        """
        SELECT
            c.id AS customer_id,
            c.full_name,
            c.company,
            c.email,
            cb.source,
            cb.behavior_type,
            COUNT(cb.id) AS similar_behavior_count,
            MAX(cb.score) AS max_score,
            ROUND(AVG(cb.score)::numeric, 1) AS avg_score,
            MAX(cb.created_at) AS latest_activity
        FROM customers c
        JOIN customer_behaviors cb ON c.id = cb.customer_id
        WHERE cb.score >= %s
        GROUP BY c.id, c.full_name, c.company, c.email, cb.source, cb.behavior_type
        HAVING COUNT(cb.id) >= %s
        ORDER BY latest_activity DESC, avg_score DESC
        """,
        (HIGH_INTEREST_THRESHOLD, SIMILAR_BEHAVIOR_MIN_COUNT),
    )

    alerts: list[dict[str, Any]] = []
    for alert in raw_alerts:
        related_behaviors = fetch_all(
            """
            SELECT *
            FROM customer_behaviors
            WHERE customer_id = %s AND source = %s AND behavior_type = %s AND score >= %s
            ORDER BY score DESC, created_at DESC, id DESC
            LIMIT 3
            """,
            (alert["customer_id"], alert["source"], alert["behavior_type"], HIGH_INTEREST_THRESHOLD),
        )
        alert["behaviors"] = related_behaviors
        alert["suggested_campaign"] = get_best_campaign_for_signal(alert["source"], alert["behavior_type"])
        alerts.append(alert)
    return alerts
