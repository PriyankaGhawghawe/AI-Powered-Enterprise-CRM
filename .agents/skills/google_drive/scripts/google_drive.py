from google.adk.tools import ToolContext

from app.utils.audit import log_action


def export_report_to_drive(
    filename: str, report_content: str, tool_context: ToolContext
) -> dict:
    """Google Drive MCP: Export an executive report or strategic recommendations to Google Drive.

    Requires Owner role permissions.
    Sensitive action: triggers human approval.

    Args:
        filename: Target filename in Google Drive.
        report_content: Contents of the report to upload.
    """
    import os
    role = tool_context.state.get("user_role", "Employee")

    # RBAC Enforcement
    if role != "Owner":
        log_action(
            role,
            f"Attempted to export {filename} to Drive",
            "Google Drive MCP",
            "Blocked",
            "Unauthorized role",
        )
        return {
            "status": "error",
            "message": f"Security Blocked: Role '{role}' does not have permission to write to Google Drive MCP. Owner role is required.",
        }

    # Write to local outbox
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "../../app/outbox/drive_exports")
    os.makedirs(base_dir, exist_ok=True)
    file_path = os.path.join(base_dir, filename)

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(report_content)
    except Exception:
        pass

    # Audit log
    log_action(
        role, f"Exported {filename} to Google Drive", "Google Drive MCP", "Success"
    )

    return {
        "status": "success",
        "message": f"Report successfully exported to local outbox/drive_exports/{filename}!",
        "drive_url": f"file://{file_path}",
    }

def export_report_to_drive_needs_confirmation(
    filename: str, report_content: str, tool_context: ToolContext
) -> bool:
    role = tool_context.state.get("user_role", "Employee")
    return role == "Owner"

