import os

import google.auth
from google.adk.agents import Agent
from google.adk.apps import App, ResumabilityConfig
from google.adk.models import Gemini
from google.adk.tools import ToolContext
from google.genai import types

from app.skill_loader import load_skills

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

# Load dynamic skills
skills_dict = load_skills()

# Standardized MCP Connections
# mcp_file_system = McpToolset(command="uv", args=["run", "mcp_servers/file_system_mcp.py"])

def email_needs_confirmation(
    tool_name: str, arguments: dict, tool_context: ToolContext
) -> bool:
    role = tool_context.state.get("user_role", "Employee")
    return role in ["Owner", "Manager"]

# mcp_gmail = McpToolset(
#     command="uv",
#     args=["run", "mcp_servers/gmail_mcp.py"],
#     require_confirmation=email_needs_confirmation
# )

file_system_tools = []

# Combine tools for specific agents
cfo_tools = skills_dict.get("financial_summary", []) + file_system_tools
sales_tools = skills_dict.get("sales_pipeline", []) + file_system_tools
compliance_tools = skills_dict.get("compliance_status", []) + file_system_tools
market_tools = skills_dict.get("market_research", []) + file_system_tools
ceo_tools = skills_dict.get("google_drive", []) + file_system_tools + skills_dict.get("skill_creator", [])


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
    tools=cfo_tools,
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
    tools=sales_tools,
)

# Define Market Agent
market_agent = Agent(
    name="market_agent",
    model="gemini-2.5-flash",
    description="Market Research Analyst. Investigates market intelligence, competitor pricing, market share, competitor strengths, weaknesses, and industry growth. Use get_market_intelligence tool, and use fetch_market_news to get real live data from the web.",
    instruction=(
        "You are the Market Research Analyst of the virtual executive team. "
        "Your role is to investigate market intelligence, competitor pricing, market share, competitor strengths, weaknesses, and industry growth. "
        "You have access to get_market_intelligence and fetch_market_news tools."
    ),
    tools=market_tools,
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
    tools=compliance_tools,
)

from app.commerce_agent import commerce_agent

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
        "- commerce_agent (Commerce Agent) for B2B procurement via UCP/AP2. "
        "\n"
        "Your responsibilities are:\n"
        "1. Understand user requests and delegate sub-tasks to the appropriate specialist agents by transferring control.\n"
        "2. Multi-Agent DAG Orchestration Flow: When asked for a cross-functional 'business health audit' or complex executive analysis, you MUST route execution sequentially in a Directed Acyclic Graph (DAG) pattern:\n"
        "   - Step A: Call cfo_agent to perform financial runways and cash audits.\n"
        "   - Step B: Call sales_agent to analyze the deal pipeline metrics.\n"
        "   - Step C: Call market_agent and compliance_agent for competitor landscape and compliance check variables.\n"
        "   - Step D: Collect and merge inputs from CFO and Sales. Use those inputs as pre-requisites to run the final synthesis and generate the executive report.\n"
        "3. Address general executive inquiries. Use read_report/write_document for files.\n"
        "4. Prepare Gmail drafts (email_tool) or export briefings to Drive (drive_tool) when requested. Note: these tools require user approval.\n"
        "5. IMPORTANT email rule: When asked to send or draft an email, ALWAYS call the email_tool (draft_email_update) immediately with a professionally written body. NEVER ask the user for the email body or any missing details — instead compose a suitable professional message yourself based on the context, subject, and any recent agent findings. For example, if asked to send a 'Board Update', draft a concise executive summary from what you know and call the tool right away."
    ),
    sub_agents=[cfo_agent, sales_agent, market_agent, compliance_agent, commerce_agent],
    tools=ceo_tools,
)

# Create the overarching App
app = App(
    name="business_os_agents",
    root_agent=ceo_agent,
    resumability_config=ResumabilityConfig(is_resumable=True)
)

root_agent = ceo_agent
