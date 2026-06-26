import os

import google.auth
from google.adk.agents import Agent
from google.adk.apps import App, ResumabilityConfig
from google.adk.models import Gemini
from google.adk.tools import FunctionTool, ToolContext
from google.genai import types

from app.tools import (
    draft_email_update,
    export_report_to_drive,
    get_compliance_status,
    get_financial_summary,
    get_market_intelligence,
    get_sales_pipeline,
    read_report,
    write_document,
    fetch_market_news,
)

# Setup GCP environment variables for local credentials
try:
    _, project_id = google.auth.default()
    os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
except Exception:
    project_id = os.environ.get(
        "GOOGLE_CLOUD_PROJECT", "project-6a0d9149-305b-4141-899"
    )
    os.environ["GOOGLE_CLOUD_PROJECT"] = project_id

os.environ["GOOGLE_CLOUD_LOCATION"] = "global"
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

# Define shared LLM model
model_inst = Gemini(
    model="gemini-2.5-flash",
    retry_options=types.HttpRetryOptions(attempts=3),
)


def email_needs_confirmation(
    recipient: str, subject: str, body: str, tool_context: ToolContext
) -> bool:
    role = tool_context.state.get("user_role", "Employee")
    return role in ["Owner", "Manager"]


def drive_needs_confirmation(
    filename: str, report_content: str, tool_context: ToolContext
) -> bool:
    role = tool_context.state.get("user_role", "Employee")
    return role == "Owner"


# Wrap sensitive tools that require user confirmation
email_tool = FunctionTool(
    draft_email_update, require_confirmation=email_needs_confirmation
)
drive_tool = FunctionTool(
    export_report_to_drive, require_confirmation=drive_needs_confirmation
)

# Define CFO Agent
cfo_agent = Agent(
    name="cfo_agent",
    model="gemini-2.5-flash",
    description="Chief Financial Officer (CFO). Analyzes financial health, cash flow, expenses, revenue (MRR), and runway. Use get_financial_summary tool.",
    instruction=(
        "You are the CFO (Chief Financial Officer) of the virtual executive team. "
        "Your role is to analyze the company's financial status. You have access to the get_financial_summary, read_report, and write_document tools. "
        "Assess MRR, expenses, burn rate, and runway, then provide financial alerts and recommendations. "
        "Always maintain professional, numbers-driven financial executive tone."
    ),
    tools=[get_financial_summary, read_report, write_document],
)

# Define Sales Agent
sales_agent = Agent(
    name="sales_agent",
    model="gemini-2.5-flash",
    description="Sales Operations Manager. Monitors active pipeline deals, deal cycles, win rates, conversion bottlenecks, and opportunity sizing. Use get_sales_pipeline tool.",
    instruction=(
        "You are the Sales Operations Manager of the virtual executive team. "
        "Your role is to analyze sales funnel performance, deals cycle lengths, win rates, and deal bottlenecks. "
        "You have access to get_sales_pipeline, read_report, and write_document tools. "
        "Provide insights on sales performance and identify deals at risk."
    ),
    tools=[get_sales_pipeline, read_report, write_document],
)

# Define Market Agent
market_agent = Agent(
    name="market_agent",
    model="gemini-2.5-flash",
    description="Market Research Analyst. Investigates market intelligence, competitor pricing, market share, competitor strengths, weaknesses, and industry growth. Use get_market_intelligence tool, and use fetch_market_news to get real live data from the web.",
    instruction=(
        "You are the Market Research Analyst of the virtual executive team. "
        "Your role is to evaluate competitive market landscapes, pricing strategies, market trends, and benchmarking. "
        "You have access to get_market_intelligence, read_report, write_document, and fetch_market_news tools. "
        "IMPORTANT: When asked for live data, real-world events, or real-time competitor news, ALWAYS use the fetch_market_news tool to query the live web. "
        "Formulate market strategies, competitive reports, and strategic growth recommendations using both internal database and external live data."
    ),
    tools=[get_market_intelligence, read_report, write_document, fetch_market_news],
)

# Define Compliance Agent
compliance_agent = Agent(
    name="compliance_agent",
    model="gemini-2.5-flash",
    description="Compliance Officer. Evaluates contract reviews, GDPR compliance audit checklist, policy validation, and regulatory risk registries. Use get_compliance_status tool.",
    instruction=(
        "You are the Compliance Officer of the virtual executive team. "
        "Your role is to oversee compliance, GDPR audits, contract terms, and regulatory risks. "
        "You have access to get_compliance_status, read_report, and write_document tools. "
        "Flag active compliance gaps, audit checklists, and security risks, recommending mitigation protocols."
    ),
    tools=[get_compliance_status, read_report, write_document],
)

# Define CEO Agent (Root orchestrator)
ceo_agent = Agent(
    name="ceo_agent",
    model="gemini-2.5-flash",
    instruction=(
        "You are the Chief Executive Officer (CEO) of BusinessOS. "
        "You lead and coordinate the virtual executive team consisting of: "
        "- cfo_agent (CFO) for financial summaries, runway audits, and burn rates. "
        "- sales_agent (Sales Operations) for sales pipeline, deals, and funnel metrics. "
        "- market_agent (Market Analyst) for competitor benchmarks and industry trends. "
        "- compliance_agent (Compliance Officer) for contracts, GDPR checklists, and regulatory risks. "
        "\n"
        "Your responsibilities are:\n"
        "1. Understand user requests and delegate sub-tasks to the appropriate specialist agents by mentioning them or transferring control.\n"
        "2. Coordinate collaboration between agents. For example, if a user requests a 'business health audit', ask the CFO for financial status, the Sales Agent for sales pipeline, the Market Agent for competitor updates, and the Compliance Agent for risks, then aggregate their findings into a board-level report.\n"
        "3. Address general executive inquiries. Use read_report/write_document for files.\n"
        "4. Prepare Gmail drafts (email_tool) or export briefings to Drive (drive_tool) when requested. Note: these tools require user approval.\n"
        "5. IMPORTANT email rule: When asked to send or draft an email, ALWAYS call the email_tool (draft_email_update) immediately with a professionally written body. NEVER ask the user for the email body or any missing details — instead compose a suitable professional message yourself based on the context, subject, and any recent agent findings. For example, if asked to send a 'Board Update', draft a concise executive summary from what you know and call the tool right away."
    ),
    sub_agents=[cfo_agent, sales_agent, market_agent, compliance_agent],
    tools=[email_tool, drive_tool, read_report, write_document],
)

app = App(
    root_agent=ceo_agent,
    name="app",
    resumability_config=ResumabilityConfig(is_resumable=True)
)

root_agent = ceo_agent

