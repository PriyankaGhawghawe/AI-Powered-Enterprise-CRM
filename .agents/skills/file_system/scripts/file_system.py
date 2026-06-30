from google.adk.tools import ToolContext

from app.utils.audit import log_action


def read_report(filename: str, tool_context: ToolContext) -> dict:
    """FileSystem MCP: Read a business report or contract from the server filesystem.

    Args:
        filename: Name of the file to read (e.g. 'cfo_summary.txt' or 'vendor_dpa_contract.txt').
    """
    import os

    role = tool_context.state.get("user_role", "Employee")

    base_dir = os.path.abspath(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "../../app/reports",
        )
    )
    file_path = os.path.abspath(os.path.join(base_dir, filename))

    # Sandbox Egress Guard: prevent directory traversal
    if not file_path.startswith(base_dir):
        log_action(role, f"Traversal block: {filename}", "FileSystem MCP", "Denied")
        return {
            "status": "error",
            "message": "Access Denied: Path traversal detected outside sandboxed directory.",
        }

    if not os.path.exists(file_path):
        log_action(
            role,
            f"Failed to read file: {filename}",
            "FileSystem MCP",
            "Error",
            "File not found",
        )
        return {
            "status": "error",
            "message": f"File '{filename}' does not exist on the filesystem. You may need to write it first or check the name.",
        }

    try:
        with open(file_path, encoding="utf-8") as f:
            file_content = f.read()
        log_action(role, f"Read file: {filename}", "FileSystem MCP", "Success")
        return {"filename": filename, "content": file_content}
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

    base_dir = os.path.abspath(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "../../app/reports",
        )
    )
    os.makedirs(base_dir, exist_ok=True)
    file_path = os.path.abspath(os.path.join(base_dir, filename))

    # Sandbox Egress Guard: prevent directory traversal
    if not file_path.startswith(base_dir):
        log_action(
            role, f"Traversal block on write: {filename}", "FileSystem MCP", "Denied"
        )
        return {
            "status": "error",
            "message": "Access Denied: Path traversal detected outside sandboxed directory.",
        }

    # Supply Chain / Ingestion Defense: block injection of unsafe python imports or packages
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
        log_action(
            role, f"Security Injection Block: {filename}", "FileSystem MCP", "Denied"
        )
        return {
            "status": "error",
            "message": "Access Denied: Malicious dynamic code patterns or dynamic import executions detected in content.",
        }

    bucket_name = os.environ.get("GCS_BUCKET_NAME")

    if bucket_name:
        try:
            from google.cloud import storage

            client = storage.Client()
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(f"outbox/{filename}")
            blob.upload_from_string(content)
            log_action(
                role, f"Write file to GCS: {filename}", "FileSystem MCP", "Success"
            )
            return {
                "status": "success",
                "filename": filename,
                "message": f"Successfully wrote {len(content)} characters to '{filename}' in GCS Bucket.",
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    else:
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
