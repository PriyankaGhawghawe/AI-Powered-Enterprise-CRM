import asyncio
import os

import mcp.types as types
from mcp.server import NotificationOptions, Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server

# Create the MCP Server
server = Server("file-system-mcp")


@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """List available tools."""
    return [
        types.Tool(
            name="read_report",
            description="Read a business report or contract from the server filesystem.",
            inputSchema={
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Name of the file to read.",
                    }
                },
                "required": ["filename"],
            },
        ),
        types.Tool(
            name="write_document",
            description="Write an executive briefing or document to the server filesystem.",
            inputSchema={
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Name of the document file to save.",
                    },
                    "content": {
                        "type": "string",
                        "description": "The text content to write to the file.",
                    },
                },
                "required": ["filename", "content"],
            },
        ),
    ]


@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """Handle tool execution requests."""

    base_dir = os.path.abspath(
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "app/reports")
    )
    os.makedirs(base_dir, exist_ok=True)

    if name == "read_report":
        filename = arguments.get("filename")
        if not filename:
            raise ValueError("Missing filename argument")

        file_path = os.path.abspath(os.path.join(base_dir, filename))

        # Sandbox Egress Guard
        if not file_path.startswith(base_dir):
            return [
                types.TextContent(
                    type="text", text="Error: Access Denied. Path traversal detected."
                )
            ]

        if not os.path.exists(file_path):
            return [
                types.TextContent(
                    type="text", text=f"Error: File '{filename}' does not exist."
                )
            ]

        with open(file_path, encoding="utf-8") as f:
            content = f.read()

        return [types.TextContent(type="text", text=content)]

    elif name == "write_document":
        filename = arguments.get("filename")
        content = arguments.get("content")
        if not filename or not content:
            raise ValueError("Missing filename or content argument")

        file_path = os.path.abspath(os.path.join(base_dir, filename))

        # Sandbox Egress Guard
        if not file_path.startswith(base_dir):
            return [
                types.TextContent(
                    type="text", text="Error: Access Denied. Path traversal detected."
                )
            ]

        # Supply Chain / Ingestion Defense
        unsafe_keywords = [
            "import ",
            "eval(",
            "exec(",
            "subprocess",
            "os.system",
            "shutil",
            "__import__",
        ]
        if any(keyword in content for keyword in unsafe_keywords):
            return [
                types.TextContent(
                    type="text",
                    text="Error: Access Denied. Malicious dynamic code patterns detected.",
                )
            ]

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        return [
            types.TextContent(
                type="text",
                text=f"Success: Wrote {len(content)} characters to {filename}.",
            )
        ]

    else:
        raise ValueError(f"Unknown tool: {name}")


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="file-system-mcp",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    asyncio.run(main())
