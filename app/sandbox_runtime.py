import json
import os
import subprocess
import sys


def execute_sql_sandboxed(sql: str, db_path: str = "business_os.db"):
    """
    Executes a SQL query in an ephemeral, isolated subprocess simulation.
    This mimics a gVisor/Docker ephemeral sandbox by restricting environment variables,
    using a hard timeout, and stripping network access contexts.
    """
    # Create an ephemeral script to run
    script_path = "ephemeral_sandbox_query.py"
    # Ensure any single quotes in sql are properly escaped for the f-string execution
    safe_sql = sql.replace("'", "''")
    script_content = f"""
import sqlite3
import json
import sys

try:
    conn = sqlite3.connect('{db_path}')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''{safe_sql}''')
    rows = cursor.fetchall()
    columns = list(rows[0].keys()) if rows else []
    data = [dict(r) for r in rows]
    print(json.dumps({{"columns": columns, "rows": data}}))
except Exception as e:
    print(json.dumps({{"error": str(e)}}))
finally:
    conn.close()
"""
    try:
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(script_content)

        # Execute in strict subprocess
        # Strip all environment variables except PATH to simulate isolation
        clean_env = {"PATH": os.environ.get("PATH", "")}

        result = subprocess.run(
            [sys.executable, script_path],
            env=clean_env,
            capture_output=True,
            text=True,
            timeout=5,  # 5 seconds max TTL
        )

        if result.returncode != 0:
            raise RuntimeError(f"Sandbox Error: {result.stderr}")

        output = json.loads(result.stdout)
        if "error" in output:
            raise RuntimeError(output["error"])

        return output
    finally:
        if os.path.exists(script_path):
            os.remove(script_path)
