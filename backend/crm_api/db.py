from __future__ import annotations

import os
from typing import Any

import psycopg
from psycopg.rows import dict_row

from .utils import ApiError, HIGH_INTEREST_THRESHOLD


def get_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ApiError("DATABASE_URL is missing. Point it to your PostgreSQL database.", 503)
    return psycopg.connect(database_url, row_factory=dict_row)


def fetch_all(query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()
        return rows or []


def fetch_one(query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchone()


def execute_returning(query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(query, params)
        row = cur.fetchone()
        conn.commit()
        return row


def ensure_entity_exists(table: str, entity_id: int, label: str) -> dict[str, Any]:
    row = fetch_one(f"SELECT * FROM {table} WHERE id = %s", (entity_id,))
    if not row:
        raise ApiError(f"{label} not found.", 404)
    return row


def get_campaigns() -> list[dict[str, Any]]:
    return fetch_all("SELECT * FROM campaigns ORDER BY id ASC")


def get_customer_behaviors(
    customer_id: int,
    source: str | None = None,
    behavior_type: str | None = None,
    high_only: bool = False,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    query = ["SELECT * FROM customer_behaviors WHERE customer_id = %s"]
    params: list[Any] = [customer_id]
    if source:
        query.append("AND source = %s")
        params.append(source)
    if behavior_type:
        query.append("AND behavior_type = %s")
        params.append(behavior_type)
    if high_only:
        query.append("AND score >= %s")
        params.append(HIGH_INTEREST_THRESHOLD)
    query.append("ORDER BY score DESC, created_at DESC, id DESC")
    if limit is not None:
        query.append(f"LIMIT {int(limit)}")
    return fetch_all(" ".join(query), tuple(params))
