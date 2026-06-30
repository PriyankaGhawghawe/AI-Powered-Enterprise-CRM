import importlib.util
import os

import yaml
from google.adk.tools import FunctionTool


def load_skills(skills_dir: str = ".agents/skills") -> dict[str, list[FunctionTool]]:
    """
    Dynamically loads Agent Skills from the specified directory.
    Returns a dictionary mapping skill names to a list of loaded FunctionTools.
    """
    loaded_skills = {}

    if not os.path.exists(skills_dir):
        return loaded_skills

    for skill_name in os.listdir(skills_dir):
        skill_path = os.path.join(skills_dir, skill_name)
        if not os.path.isdir(skill_path):
            continue

        skill_md_path = os.path.join(skill_path, "SKILL.md")
        if not os.path.exists(skill_md_path):
            continue

        # Parse YAML frontmatter to get description
        description = ""
        with open(skill_md_path, encoding="utf-8") as f:
            content = f.read()
            if content.startswith("---"):
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    try:
                        frontmatter = yaml.safe_load(parts[1])
                        description = frontmatter.get("description", "")
                    except Exception:
                        pass

        # Now find the python script
        scripts_dir = os.path.join(skill_path, "scripts")
        if not os.path.exists(scripts_dir):
            continue

        tools = []
        for script_name in os.listdir(scripts_dir):
            if script_name.endswith(".py") and not script_name.startswith("__"):
                script_path = os.path.join(scripts_dir, script_name)
                module_name = f"skill_{skill_name}_{script_name[:-3]}"

                spec = importlib.util.spec_from_file_location(module_name, script_path)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)

                    # Extract functions that could be tools
                    for attr_name in dir(module):
                        if attr_name.startswith("_"):
                            continue
                        attr = getattr(module, attr_name)
                        if callable(attr) and hasattr(attr, "__code__"):
                            # Simple heuristic: if it takes ToolContext, it's our tool
                            if "tool_context" in attr.__code__.co_varnames:
                                conf_hook = getattr(
                                    module, f"{attr_name}_needs_confirmation", None
                                )
                                if conf_hook:
                                    tool = FunctionTool(
                                        attr, require_confirmation=conf_hook
                                    )
                                else:
                                    tool = FunctionTool(attr)
                                tools.append(tool)

        if tools:
            loaded_skills[skill_name] = tools

    return loaded_skills
