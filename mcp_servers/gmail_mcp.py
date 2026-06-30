import asyncio
import os
from datetime import datetime

import mcp.types as types
from mcp.server import NotificationOptions, Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server

server = Server("gmail-mcp")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="draft_email_update",
            description="Draft and send an executive update or briefing email.",
            inputSchema={
                "type": "object",
                "properties": {
                    "recipient": {"type": "string", "description": "Target recipient email address."},
                    "subject": {"type": "string", "description": "Subject line of the email."},
                    "body": {"type": "string", "description": "Body content of the email."}
                },
                "required": ["recipient", "subject", "body"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    if name == "draft_email_update":
        recipient = arguments.get("recipient")
        subject = arguments.get("subject")
        body = arguments.get("body")

        base_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "app/outbox/emails"))
        os.makedirs(base_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_subject = "".join([c if c.isalnum() else "_" for c in subject])[:20]
        filename = f"email_{timestamp}_{safe_subject}.txt"
        file_path = os.path.join(base_dir, filename)

        email_content = f"To: {recipient}\nSubject: {subject}\nDate: {datetime.now().isoformat()}\n\n{body}"

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(email_content)
            return [types.TextContent(type="text", text=f"Success: Email saved to outbox/emails/{filename}")]
        except Exception as e:
            return [types.TextContent(type="text", text=f"Error writing email: {e!s}")]
    else:
        raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="gmail-mcp",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
