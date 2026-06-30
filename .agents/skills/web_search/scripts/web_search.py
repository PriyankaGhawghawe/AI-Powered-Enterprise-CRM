from google.adk.tools import ToolContext

from app.utils.audit import log_action


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
        return [{"error": f"Failed to fetch live data: {e!s}"}]
