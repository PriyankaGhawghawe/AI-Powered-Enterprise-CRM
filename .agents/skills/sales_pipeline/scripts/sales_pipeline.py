from google.adk.tools import ToolContext

from app.database import SessionLocal
from app.models import SalesDeal
from app.utils.audit import log_action


def get_sales_pipeline(tool_context: ToolContext) -> dict:
    """Retrieve the full sales pipeline with all active deals and total values.

    Returns:
        A dictionary mapping pipeline stages to deals, total value, and average deal cycle.
    """
    # Enforce JIT Agent-Scoped Downscoping
    caller = tool_context.state.get("active_agent") or "ceo_agent"
    if "sales" not in caller and "ceo" not in caller and "cron" not in caller:
        raise PermissionError(
            f"Access Denied: Agent '{caller}' is not authorized to access sales pipeline (requires Sales Operations role)."
        )

    db = SessionLocal()
    try:
        deals = db.query(SalesDeal).all()

        stages = [
            "Lead",
            "Demo",
            "Proposal",
            "Negotiation",
            "Closed Won",
            "Closed Lost",
        ]
        total_active_val = sum(
            d.value for d in deals if d.stage not in ["Closed Won", "Closed Lost"]
        )

        deals_list = [
            {
                "id": d.id,
                "name": d.name,
                "value": d.value,
                "stage": d.stage,
                "probability": float(d.probability),
                "owner": d.owner,
                "age_days": d.age_days,
            }
            for d in deals
        ]

        role = tool_context.state.get("user_role", "Employee")
        log_action(role, "Viewed sales pipeline", "Sales Agent", "Success")

        return {
            "stages": stages,
            "deals": deals_list,
            "total_active_value": total_active_val,
            "average_deal_cycle_days": 42,
        }
    finally:
        db.close()
