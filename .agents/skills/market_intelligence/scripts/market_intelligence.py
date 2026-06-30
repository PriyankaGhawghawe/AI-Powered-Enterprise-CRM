from google.adk.tools import ToolContext

from app.database import SessionLocal
from app.models import Competitor
from app.utils.audit import log_action


def get_market_intelligence(tool_context: ToolContext) -> dict:
    """Retrieve competitor research, benchmarks, and target demographics.

    Returns:
        A dictionary containing competitor matrix and market insights.
    """
    # Enforce JIT Agent-Scoped Downscoping
    caller = tool_context.state.get("active_agent") or "ceo_agent"
    if "market" not in caller and "ceo" not in caller and "cron" not in caller:
        raise PermissionError(
            f"Access Denied: Agent '{caller}' is not authorized to access market intelligence (requires Market Analyst role)."
        )

    db = SessionLocal()
    try:
        competitors = [
            {
                "name": c.name,
                "market_share": c.market_share,
                "pricing": c.pricing,
                "strengths": c.strengths,
                "weaknesses": c.weaknesses,
            }
            for c in db.query(Competitor).all()
        ]

        role = tool_context.state.get("user_role", "Employee")
        log_action(role, "Viewed market intelligence", "Market Agent", "Success")

        return {
            "competitors": competitors,
            "industry_growth_rate": "24% YoY",
            "customer_demographics": "Mid-market software companies and digital agencies",
        }
    finally:
        db.close()
