import os

import google.auth
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.cli.fast_api import get_fast_api_app

from app.skill_loader import load_skills

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

skills_dict = load_skills()
market_tools = skills_dict.get("market_intelligence", []) + skills_dict.get(
    "web_search", []
)

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
    tools=market_tools,
)

app = App(
    name="market_service",
    description="Remote A2A Market Service",
    agents=[market_agent],
    default_agent="market_agent",
)

fastapi_app = get_fast_api_app(
    agents_dir=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    web=False,
    otel_to_cloud=False,
)
