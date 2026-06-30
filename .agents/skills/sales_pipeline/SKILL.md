---
name: sales-pipeline
description: |
  Monitors active pipeline deals, deal cycles, win rates, conversion bottlenecks, and opportunity sizing.
  Use when the user asks for the sales funnel, deal tracking, pipeline metrics, or specific sales deals.
  Do NOT use for high-level financial MRR/runway analysis (use financial-summary).
version: 1.0.0
---

# Sales Pipeline Skill

## When to use
- User asks about active deals, stages of negotiation, or expected sales.
- User wants to analyze the sales funnel and pipeline metrics.

## When NOT to use
- Do NOT use for total company cash balance (use financial-summary).

## Workflow
1. Execute `get_sales_pipeline` to retrieve deals array and stage metrics.
2. Formulate an analysis of bottlenecks and deals at risk.
