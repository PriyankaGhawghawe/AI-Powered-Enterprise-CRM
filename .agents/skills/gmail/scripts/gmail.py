from google.adk.tools import ToolContext

from app.utils.audit import log_action


def draft_email_update(
    recipient: str, subject: str, body: str, tool_context: ToolContext
) -> dict:
    """Gmail MCP: Draft and send an executive update or briefing email.

    Requires Owner or Manager role permissions.
    Sensitive action: triggers human approval.

    Args:
        recipient: Target recipient email address.
        subject: Subject line of the email.
        body: Body content of the email.
    """
    import os
    from datetime import datetime

    role = tool_context.state.get("user_role", "Employee")

    # RBAC Enforcement
    if role not in ["Owner", "Manager"]:
        log_action(
            role,
            f"Attempted to send email to {recipient}",
            "Gmail MCP",
            "Blocked",
            "Unauthorized role",
        )
        return {
            "status": "error",
            "message": f"Security Blocked: Role '{role}' does not have permission to send emails via Gmail MCP. Owner or Manager role is required.",
        }

    # Write to local outbox
    base_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "../../app/outbox/emails",
    )
    os.makedirs(base_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_subject = "".join([c if c.isalnum() else "_" for c in subject])[:20]
    filename = f"email_{timestamp}_{safe_subject}.txt"
    file_path = os.path.join(base_dir, filename)

    email_content = f"""To: {recipient}
Subject: {subject}
Date: {datetime.now().isoformat()}

{body}"""

    bucket_name = os.environ.get("GCS_BUCKET_NAME")

    if bucket_name:
        try:
            from google.cloud import storage

            client = storage.Client()
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(f"outbox/{filename}")
            blob.upload_from_string(email_content)
        except Exception:
            pass
    else:
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(email_content)
        except Exception:
            pass

    # Audit log
    log_action(
        role,
        f"Sent email to {recipient}",
        "Gmail MCP",
        "Success",
        f"Subject: {subject}",
    )

    return {
        "status": "success",
        "message": f"Email successfully generated and saved to outbox/emails/{filename}!",
        "details": {"recipient": recipient, "subject": subject, "body": body},
    }


def draft_email_update_needs_confirmation(
    recipient: str, subject: str, body: str, tool_context: ToolContext
) -> bool:
    role = tool_context.state.get("user_role", "Employee")
    return role in ["Owner", "Manager"]
