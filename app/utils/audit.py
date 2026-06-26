import datetime
import json
import os

AUDIT_LOG_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "audit_logs.json"
)


def log_action(
    user_role: str, action: str, agent: str, status: str, details: str = ""
) -> None:
    """Logs an action performed on the platform to the audit logs file.

    Args:
        user_role: The role of the user performing the action (Owner, Manager, Employee).
        action: The description of the action.
        agent: The agent executing the action (e.g. CEO, CFO, System).
        status: The result status (e.g. Success, Blocked, Approved, Pending).
        details: Optional additional logs.
    """
    log_entry = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "user_role": user_role,
        "action": action,
        "agent": agent,
        "status": status,
        "details": details,
    }

    logs = []
    if os.path.exists(AUDIT_LOG_FILE):
        try:
            with open(AUDIT_LOG_FILE, encoding="utf-8") as f:
                logs = json.load(f)
                if not isinstance(logs, list):
                    logs = []
        except Exception:
            logs = []

    logs.insert(0, log_entry)  # Add new log to the top

    # Cap log size to 200 entries to prevent file bloat
    if len(logs) > 200:
        logs = logs[:200]

    try:
        with open(AUDIT_LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2)
    except Exception as e:
        print(f"Error writing to audit logs: {e}")


def get_audit_logs() -> list:
    """Returns the list of logged security actions."""
    if not os.path.exists(AUDIT_LOG_FILE):
        return []
    try:
        with open(AUDIT_LOG_FILE, encoding="utf-8") as f:
            logs = json.load(f)
            return logs if isinstance(logs, list) else []
    except Exception:
        return []
