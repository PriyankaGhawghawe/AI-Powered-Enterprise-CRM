---
name: financial-summary
description: |
  Analyzes financial health, cash flow, expenses, revenue (MRR), and runway.
  Use when the user asks for financial status, burn rate, or runway forecasts.
  Do NOT use for individual sales deals or market trends.
version: 1.0.0
---

# Financial Summary Skill

## When to use
- The user asks for a financial update, runway calculation, or burn rate analysis.
- The user needs to know how much cash the company has.

## When NOT to use
- Do NOT use for pipeline deals (use sales_pipeline).
- Do NOT use for competitor intelligence (use market_intelligence).

## Workflow
1. Execute `get_financial_summary` script to retrieve current financial metrics.
2. Formulate a professional, numbers-driven executive summary.
3. If requested, highlight the highest expenses or the remaining runway in months.
