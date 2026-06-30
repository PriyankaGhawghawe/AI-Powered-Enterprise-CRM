from google.adk.tools import ToolContext

from app.database import SessionLocal
from app.models import ComplianceChecklist, RegulatoryRisk
from app.utils.audit import log_action


def get_compliance_status(tool_context: ToolContext) -> dict:
    """Retrieve GDPR audit details, policy checklist, and regulatory risks.

    Returns:
        A dictionary detailing compliance checks and risk alerts.
    """
    # Enforce JIT Agent-Scoped Downscoping
    caller = tool_context.state.get("active_agent") or "ceo_agent"
    if "compliance" not in caller and "ceo" not in caller and "cron" not in caller:
        raise PermissionError(
            f"Access Denied: Agent '{caller}' is not authorized to access compliance status (requires Compliance Officer role)."
        )

    db = SessionLocal()
    try:
        checklist = [
            {"item": c.item, "status": c.status}
            for c in db.query(ComplianceChecklist).all()
        ]
        risks = [
            {
                "risk_area": r.risk_area,
                "description": r.description,
                "severity": r.severity,
                "mitigation": r.mitigation or "",
            }
            for r in db.query(RegulatoryRisk).all()
        ]

        completed = sum(1 for item in checklist if item["status"] == "Completed")
        total = len(checklist)
        score = int((completed / total) * 100) if total > 0 else 100

        role = tool_context.state.get("user_role", "Employee")
        log_action(role, "Viewed compliance status", "Compliance Agent", "Success")

        return {
            "gdpr_status": "Compliant (Last Audit: May 2026)",
            "compliance_score": f"{score}%",
            "checklist": checklist,
            "regulatory_risks": risks,
        }
    finally:
        db.close()
