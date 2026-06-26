import json
import os

from google.adk.tools import ToolContext

from app.database import SessionLocal
from app.utils.audit import log_action
from app.models import BusinessState

from app.models import SalesDeal, Competitor, HistoricalPerformance, RegulatoryRisk, ComplianceChecklist, BusinessMetric

def _load_db() -> dict:
    """Helper to load or initialize the mock database from SQLite."""
    db = SessionLocal()
    try:
        state = db.query(BusinessState).filter(BusinessState.id == 1).first()
        if not state:
            # Initialize with default data if empty
            new_state = BusinessState(id=1, data=DEFAULT_BUSINESS_DATA)
            db.add(new_state)
            db.commit()
            return DEFAULT_BUSINESS_DATA
        return state.data
    except Exception as e:
        print(f"Error loading database: {e}")
        return DEFAULT_BUSINESS_DATA
    finally:
        db.close()

def _save_db(data: dict) -> None:
    """Helper to save to the mock database in SQLite."""
    db = SessionLocal()
    try:
        state = db.query(BusinessState).filter(BusinessState.id == 1).first()
        if state:
            state.data = data
        else:
            state = BusinessState(id=1, data=data)
            db.add(state)
        db.commit()
    except Exception as e:
        print(f"Error saving database: {e}")
        db.rollback()
    finally:
        db.close()


# --- Core Business Data Tools ---


def get_financial_summary(tool_context: ToolContext) -> dict:
    """Retrieve the financial summary, including MRR, cash balance, monthly expenses, and runway.

    Returns:
        A dictionary containing cash balance, MRR, individual expenses, total monthly expenses, and financial runway in months.
    """
    # Enforce JIT Agent-Scoped Downscoping
    caller = tool_context.state.get("active_agent") or "ceo_agent"
    # Allow cfo_agent and ceo_agent (or cron-bot background tasks)
    if "cfo" not in caller and "ceo" not in caller and "cron" not in caller:
        raise PermissionError(f"Access Denied: Agent '{caller}' is not authorized to access financial database details (requires CFO role).")

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


def get_sales_pipeline(tool_context: ToolContext) -> dict:
    """Retrieve the full sales pipeline with all active deals and total values.

    Returns:
        A dictionary mapping pipeline stages to deals, total value, and average deal cycle.
    """
    # Enforce JIT Agent-Scoped Downscoping
    caller = tool_context.state.get("active_agent") or "ceo_agent"
    if "sales" not in caller and "ceo" not in caller and "cron" not in caller:
        raise PermissionError(f"Access Denied: Agent '{caller}' is not authorized to access sales pipeline (requires Sales Operations role).")

    db = SessionLocal()
    try:
        deals = db.query(SalesDeal).all()
        
        stages = ["Lead", "Demo", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]
        total_active_val = sum(d.value for d in deals if d.stage not in ["Closed Won", "Closed Lost"])
        
        deals_list = [{"id": d.id, "name": d.name, "value": d.value, "stage": d.stage, "probability": float(d.probability), "owner": d.owner, "age_days": d.age_days} for d in deals]

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


def get_market_intelligence(tool_context: ToolContext) -> dict:
    """Retrieve competitor research, benchmarks, and target demographics.

    Returns:
        A dictionary containing competitor matrix and market insights.
    """
    # Enforce JIT Agent-Scoped Downscoping
    caller = tool_context.state.get("active_agent") or "ceo_agent"
    if "market" not in caller and "ceo" not in caller and "cron" not in caller:
        raise PermissionError(f"Access Denied: Agent '{caller}' is not authorized to access market intelligence (requires Market Analyst role).")

    db = SessionLocal()
    try:
        competitors = [{"name": c.name, "market_share": c.market_share, "pricing": c.pricing, "strengths": c.strengths, "weaknesses": c.weaknesses} for c in db.query(Competitor).all()]

        role = tool_context.state.get("user_role", "Employee")
        log_action(role, "Viewed market intelligence", "Market Agent", "Success")

        return {
            "competitors": competitors,
            "industry_growth_rate": "24% YoY",
            "customer_demographics": "Mid-market software companies and digital agencies"
        }
    finally:
        db.close()


def get_compliance_status(tool_context: ToolContext) -> dict:
    """Retrieve GDPR audit details, policy checklist, and regulatory risks.

    Returns:
        A dictionary detailing compliance checks and risk alerts.
    """
    # Enforce JIT Agent-Scoped Downscoping
    caller = tool_context.state.get("active_agent") or "ceo_agent"
    if "compliance" not in caller and "ceo" not in caller and "cron" not in caller:
        raise PermissionError(f"Access Denied: Agent '{caller}' is not authorized to access compliance status (requires Compliance Officer role).")

    db = SessionLocal()
    try:
        checklist = [{"item": c.item, "status": c.status} for c in db.query(ComplianceChecklist).all()]
        risks = [{"risk_area": r.risk_area, "description": r.description, "severity": r.severity, "mitigation": r.mitigation or ""} for r in db.query(RegulatoryRisk).all()]

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


# --- Simulated MCP Integration Tools ---


def read_report(filename: str, tool_context: ToolContext) -> dict:
    """FileSystem MCP: Read a business report or contract from the server filesystem.

    Args:
        filename: Name of the file to read (e.g. 'cfo_summary.txt' or 'vendor_dpa_contract.txt').
    """
    import os
    role = tool_context.state.get("user_role", "Employee")
    
    base_dir = os.path.join(os.path.dirname(__file__), "reports")
    file_path = os.path.join(base_dir, filename)
    
    if not os.path.exists(file_path):
        log_action(role, f"Failed to read file: {filename}", "FileSystem MCP", "Error", "File not found")
        return {
            "status": "error",
            "message": f"File '{filename}' does not exist on the filesystem. You may need to write it first or check the name."
        }
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            file_content = f.read()
        log_action(role, f"Read file: {filename}", "FileSystem MCP", "Success")
        return {
            "filename": filename,
            "content": file_content
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def write_document(filename: str, content: str, tool_context: ToolContext) -> dict:
    """FileSystem MCP: Write an executive briefing or document to the server filesystem.

    Args:
        filename: Name of the document file to save.
        content: The text content to write to the file.
    """
    import os
    role = tool_context.state.get("user_role", "Employee")
    
    base_dir = os.path.join(os.path.dirname(__file__), "reports")
    os.makedirs(base_dir, exist_ok=True)
    file_path = os.path.join(base_dir, filename)
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        log_action(role, f"Write file: {filename}", "FileSystem MCP", "Success")
        return {
            "status": "success",
            "filename": filename,
            "message": f"Successfully wrote {len(content)} characters to '{filename}' in the real local FileSystem.",
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


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
    base_dir = os.path.join(os.path.dirname(__file__), "outbox", "emails")
    os.makedirs(base_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_subject = "".join([c if c.isalnum() else "_" for c in subject])[:20]
    filename = f"email_{timestamp}_{safe_subject}.txt"
    file_path = os.path.join(base_dir, filename)
    
    email_content = f"""To: {recipient}
Subject: {subject}
Date: {datetime.now().isoformat()}

{body}"""
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(email_content)
    except Exception as e:
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
    base_dir = os.path.join(os.path.dirname(__file__), "outbox", "drive_exports")
    os.makedirs(base_dir, exist_ok=True)
    file_path = os.path.join(base_dir, filename)
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(report_content)
    except Exception as e:
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

def fetch_market_news(query: str, tool_context: ToolContext) -> list[dict]:
    """Search the live web for real-time market news and competitor intelligence.
    
    Args:
        query: The search term or topic to query on the web.
    """
    from duckduckgo_search import DDGS
    
    role = tool_context.state.get("user_role", "Employee")
    log_action(role, f"Performed live web search: {query}", "Market Agent", "Success")
    
    try:
        with DDGS() as ddgs:
            # First try news search
            results = list(ddgs.news(query, max_results=5))
            # Fallback to general text search if news is empty
            if not results:
                results = list(ddgs.text(query, max_results=5))
            return results
    except Exception as e:
        return [{"error": f"Failed to fetch live data: {str(e)}"}]
