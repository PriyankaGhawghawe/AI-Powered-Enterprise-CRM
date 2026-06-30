import os

from google.adk.tools import ToolContext

from app.utils.audit import log_action


def scaffold_new_skill(
    skill_name: str, description: str, python_code: str, tool_context: ToolContext
) -> dict:
    """Creates a new agent skill dynamically.

    Args:
        skill_name: The name of the new skill (snake_case).
        description: A brief description of what the skill does.
        python_code: The raw python code for the tool function to place in the scripts folder.
    """
    role = tool_context.state.get("user_role", "Employee")
    if role not in ["Owner", "Manager", "SystemAdmin"]:
        return {"status": "error", "message": "Unauthorized to create new skills."}

    base_dir = os.path.abspath(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), skill_name
        )
    )
    if os.path.exists(base_dir):
        return {"status": "error", "message": f"Skill {skill_name} already exists."}

    os.makedirs(os.path.join(base_dir, "scripts"), exist_ok=True)

    skill_md = f"---\nname: {skill_name.replace('_', '-')}\ndescription: |\n  {description}\nversion: 1.0.0\n---\n\n# {skill_name.replace('_', ' ').title()}\n\n"

    with open(os.path.join(base_dir, "SKILL.md"), "w") as f:
        f.write(skill_md)

    with open(os.path.join(base_dir, "scripts", f"{skill_name}.py"), "w") as f:
        f.write(python_code)

    log_action(role, f"Created new skill: {skill_name}", "Skill Creator", "Success")
    return {"status": "success", "message": f"Successfully created skill {skill_name}."}


def scaffold_new_skill_needs_confirmation(
    skill_name: str, description: str, python_code: str, tool_context: ToolContext
) -> bool:
    return True
