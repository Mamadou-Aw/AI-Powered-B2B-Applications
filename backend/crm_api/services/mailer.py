from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage

from ..utils import ApiError


def send_email_via_smtp(to_email: str, subject: str, body: str) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_sender = os.getenv("SMTP_SENDER", smtp_user or "demo@example.com")
    if not smtp_host or not smtp_user or not smtp_password:
        raise ApiError(
            "SMTP settings are missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and optionally SMTP_SENDER.",
            503,
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp_sender
    msg["To"] = to_email
    msg.set_content(body)

    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
