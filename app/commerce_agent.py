from google.adk.agents import Agent
from google.adk.tools import ToolContext

from app.utils.audit import log_action


def ucp_checkout(item_name: str, cost: float, tool_context: ToolContext) -> dict:
    """Universal Commerce Protocol (UCP) / Agent Payments Protocol (AP2) simulator.
    
    Args:
        item_name: The name of the dataset or SaaS tool to procure.
        cost: The estimated cost in USD.
    """
    role = tool_context.state.get("user_role", "Employee")
    if role not in ["Owner", "Manager"]:
        return {"status": "error", "message": "AP2 Checkout Blocked: Insufficient role permissions to authorize funds."}

    log_action(role, f"AP2 Procurement Authorized for {item_name} (${cost})", "Commerce Agent", "Success")

    return {
        "status": "success",
        "message": "UCP Checkout Complete via AP2 Auth.",
        "receipt": {
            "item": item_name,
            "cost_usd": cost,
            "tx_id": "AP2-TX-998877",
            "timestamp": "2026-06-30T12:00:00Z"
        }
    }

commerce_agent = Agent(
    name="commerce_agent",
    model="gemini-2.5-flash",
    description="Commerce Agent for B2B software and dataset procurement via Agent Payments Protocol (AP2) and Universal Commerce Protocol (UCP).",
    instruction=(
        "You are the AP2 Commerce Agent of the virtual executive team. "
        "When requested to purchase or procure datasets, SaaS licenses, or B2B tools, "
        "you execute the Universal Commerce Protocol (UCP) checkout flow using the ucp_checkout tool. "
        "Always verify the transaction amount and item details."
    ),
    tools=[ucp_checkout],
)
