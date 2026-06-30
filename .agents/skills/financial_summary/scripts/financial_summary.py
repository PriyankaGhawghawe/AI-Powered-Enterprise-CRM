from google.adk.tools import ToolContext

from app.database import SessionLocal
from app.models import BusinessMetric
from app.utils.audit import log_action


def get_financial_summary(tool_context: ToolContext) -> dict:
    """Retrieve the financial summary, including MRR, cash balance, monthly expenses, and runway.

    Returns:
        A dictionary containing cash balance, MRR, individual expenses, total monthly expenses, and financial runway in months.
    """
    # Enforce JIT Agent-Scoped Downscoping
    caller = tool_context.state.get("active_agent") or "ceo_agent"
    # Allow cfo_agent and ceo_agent (or cron-bot background tasks)
    if "cfo" not in caller and "ceo" not in caller and "cron" not in caller:
        raise PermissionError(
            f"Access Denied: Agent '{caller}' is not authorized to access financial database details (requires CFO role)."
        )

    db = SessionLocal()
    try:
        metrics = {m.key: m.value for m in db.query(BusinessMetric).all()}
        cash = float(metrics.get("financials.cash_balance", 0))
        mrr = float(metrics.get("financials.monthly_mrr", 0))

        expenses = {}
        for key, val in metrics.items():
            if key.startswith("financials.expenses."):
                k = key.split(".")[-1]
                expenses[k] = float(val)

        total_expenses = sum(expenses.values())
        net_monthly_burn = total_expenses - mrr

        if net_monthly_burn <= 0:
            runway = "Infinite (MRR exceeds expenses)"
        else:
            runway_months = cash / net_monthly_burn
            runway = f"{runway_months:.1f} months"

        role = tool_context.state.get("user_role", "Employee")
        log_action(role, "Viewed financial summary", "CFO", "Success")

        return {
            "company_name": metrics.get("company_name", ""),
            "cash_balance": cash,
            "monthly_mrr": mrr,
            "expenses": expenses,
            "total_monthly_expenses": total_expenses,
            "net_monthly_burn": net_monthly_burn,
            "financial_runway": runway,
        }
    finally:
        db.close()
