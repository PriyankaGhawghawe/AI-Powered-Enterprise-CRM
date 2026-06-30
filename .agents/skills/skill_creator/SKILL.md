---
name: skill-creator
description: |
  A meta-skill used to author new agent skills. It scaffolds a new skill directory with a SKILL.md and a scripts directory.
  Use when the user asks you to "create a new skill", "crystallize a workflow", or "save this as a skill".
version: 1.0.0
---

# Skill Creator Meta-Skill

## Workflow
1. Parse the requested skill name and description.
2. Execute `scaffold_new_skill` to create the folder structure and SKILL.md.
