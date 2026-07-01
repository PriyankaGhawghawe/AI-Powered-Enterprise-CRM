# 🚀 AI-Powered Enterprise CRM

> **A full-stack, agentic AI platform that replaces an entire C-suite with a team of autonomous AI agents — a CEO, CFO, Sales Director, Market Analyst, and Compliance Officer — all working collaboratively to run your business.**

Built with **React + Vite**, **FastAPI**, **Google ADK (Agent Development Kit)**, and **Gemini 2.5 Flash**.

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Why Agents?](#-why-agents)
- [Solution Overview](#-solution-overview)
- [Architecture](#-architecture)
- [Agent System Design](#-agent-system-design)
- [Key Features](#-key-features)
- [Advanced Security (7-Pillar Defense)](#-advanced-security-7-pillar-defense)
- [Evaluation-Driven Development](#-evaluation-driven-development)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Docker Deployment](#-docker-deployment)
- [Demo & Screenshots](#-demo--screenshots)
- [The Build Journey](#-the-build-journey)

---

## 🎯 Problem Statement

Modern businesses drown in operational complexity. A typical mid-market company juggles:

- **Financial dashboards** scattered across Stripe, QuickBooks, and spreadsheets.
- **CRM data** siloed in Salesforce with no real-time strategic insight.
- **Compliance audits** that are manual, error-prone, and reactive.
- **Market intelligence** that requires hours of manual research across dozens of sources.
- **Executive communication** bottlenecks — drafting board updates, investor emails, and compliance reports.

The result? **Executives spend 60% of their time gathering data instead of making decisions.** Small and mid-market companies cannot afford a full C-suite, yet they face the same strategic complexity as enterprise organizations.

**The core question:** *What if an AI system could autonomously perform the work of an entire executive team — analyzing finances, monitoring sales pipelines, researching competitors, auditing compliance, and drafting communications — all in real-time, all from a single platform?*

---

## 🤖 Why Agents?

Traditional AI chatbots are **reactive**: they answer one question at a time and cannot coordinate complex, multi-step workflows. This project demands something fundamentally different.

**Agents are the answer because:**

1.  **Specialization:** Each business domain (finance, sales, compliance, market research) requires deep, specialized reasoning. By creating **dedicated specialist agents** (CFO, Sales, Market, Compliance), each agent has focused instructions, domain-specific tools, and tailored system prompts that make it an expert in its field.
2.  **Orchestration:** Real business decisions are cross-functional. Our **CEO Agent** acts as a root orchestrator, delegating sub-tasks to specialists and synthesizing their findings into a unified executive-level answer.
3.  **Model Context Protocol (MCP):** Agents don't just talk — they **act**. Our agents use standardized MCP servers to read/write files (FileSystem MCP) and draft emails (Gmail MCP) without hardcoded bespoke integrations.
4.  **Agent-to-Agent (A2A) & AP2 Protocols:** The platform is equipped to orchestrate remote, domain-bound agents (e.g., our Commerce Agent) across network boundaries for Universal Commerce Procurement (UCP) tasks.
5.  **Human-in-the-Loop Safety:** Sensitive actions utilize Vibe Diffs and cryptographic MFA to ensure AI autonomy without sacrificing human oversight.

---

## 💡 Solution Overview

**AI-Powered Enterprise CRM** is a unified command center where a team of AI agents collaborates to run your business operations. It combines:

- A **real-time financial dashboard** with live KPIs (MRR, burn rate, runway).
- A **multi-agent AI chat** where you converse with a virtual C-suite.
- A **Strategic War Room** for generative AI debate on high-stakes business questions.
- A **natural-language SQL analytics engine** that converts English into executable database queries.
- A **compliance management system** with GDPR checklists and risk registries.
- **Agentic Security & GenAI Evaluation** ensuring safe, accurate, and self-improving workflows.

---

## 🏗 Architecture

![Architecture Diagram](docs/architecture_diagram.png)

The platform follows a clean three-tier architecture:

### Frontend (React + Vite)
The UI is a single-page application built with React 19, Vite 8, and Tailwind CSS. It features 10+ interactive tabs and decodes declarative **A2UI JSON** to dynamically render advanced charts directly from agent output.

### Backend (FastAPI + Python)
The FastAPI server exposes 25+ REST endpoints handling authentication, data management, AI orchestration, and audit logging. Every request passes through a strict security pipeline including JWT validation, Role Authorization, and PII Scrubbing.

### AI Agent Layer (Google ADK)
Built on the **Google Agent Development Kit (ADK)**, utilizing the `.agents/skills` framework for encapsulated Agent Skills. 

---

## 🧠 Agent System Design

### The Virtual Executive Team

| Agent | Role | Specialized Tools | Key Capability |
|-------|------|-------------------|----------------|
| **CEO Agent** | Root orchestrator. Delegates tasks, synthesizes cross-functional insights. | `email_tool`, `drive_tool`, `skill_creator` | Multi-agent coordination, meta-skill generation |
| **CFO Agent** | Financial analysis. Assesses MRR, expenses, burn rate. | `get_financial_summary`, `read_report` | Cash flow analysis, financial alerts |
| **Sales Agent** | Pipeline management. Monitors deals, win rates. | `get_sales_pipeline`, `read_report` | Deal risk identification, funnel metrics |
| **Market Agent** | Competitive intelligence. Researches competitors and industry growth. | `get_market_intelligence`, `fetch_market_news` | Real-time web intelligence |
| **Compliance Agent**| Regulatory oversight. GDPR audits, risk registries. | `get_compliance_status`, `read_report` | Compliance scoring, gap analysis |

---

## ✨ Key Features

1. **AI-Powered Chat (Multi-Agent):** Converse with the entire virtual C-suite.
2. **Strategic War Room:** A generative AI workspace for high-stakes strategic debates.
3. **Natural Language SQL Analytics:** Convert English into executable SQL and auto-generate Chart.js visualizations via **A2UI protocol**.
4. **Database Explorer:** A live interface for managing core business entities with RBAC restrictions.
5. **Integrations Hub:** Sync third-party tools with secure, AES-256 encrypted API key storage.
6. **Meta-Skills (`skill_creator`):** Agents can crystallize successful multi-turn traces into new reusable Python skills dynamically.
7. **Automated Reporting:** A background scheduler runs daily to autonomously generate executive reports.

---

## 🔒 Advanced Security (7-Pillar Defense)

The Business OS moves beyond traditional security (JWT, bcrypt, RBAC) and implements state-of-the-art **Agentic Defense**:

* **Ephemeral Sandboxing (Pillar 1):** Natural language SQL execution is isolated in ephemeral, network-isolated sandboxes that self-destruct after execution.
* **Just-In-Time Downscoping (Pillar 5):** The `CredentialBroker` ensures agents receive fresh, hyper-restricted credentials scoped *exactly* to the active task context.
* **Vibe Diff & Cryptographic MFA (Pillar 5):** High-stakes actions require hardware MFA TOTP codes and present a translated "Vibe Diff" so users understand the exact execution trajectory before approving.
* **Agentic SecOps & ABA (Pillar 6):** `AgentBehaviouralAnalytics` acts as a Red/Blue team triad, monitoring the Runtime AgBOM for anomaly rates and enforcing **Stateful Quarantines** against hallucinating agents.
* **Supply Chain Defence:** Configured with GitHub Actions CI/CD to block hallucinated or typosquatted packages dynamically requested by the agent using `pip-audit`.
* **Zero-Trust Token Management:** Immediate JWT session revocation via dynamic token versioning upon role change or password reset.
* **PII Scrubbing:** Emails, phone numbers, and credit cards are scrubbed via regex before reaching the LLM.

---

## 📈 Evaluation-Driven Development

We employ a complete "quality flywheel" to ensure vibe-coded implementations scale safely:

* **Trajectory Evaluation:** Beyond just asserting final outputs, our `trajectory_evaluator.py` scores execution trajectories using `EXACT` and `IN_ORDER` modes against `.agents/skills/eval_cases.json`.
* **Trace Mining & Clustering:** The FastAPI backend utilizes a failure sink. User corrections (e.g. "No, that's completely wrong") force a sub-2 satisfaction score, immediately dumping the full AgBOM trace to `failed_traces.jsonl`. Our `trace_miner.py` then clusters these failures with Gemini to identify systematic skill gaps.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS, Chart.js (A2UI) |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, Uvicorn |
| **Database** | Neon PostgreSQL (Production), SQLite (Local Fallback) |
| **AI / Agents** | Google ADK, Gemini 2.5 Flash, MCP |
| **Security** | PyJWT (HS256), passlib (bcrypt), Cryptographic MFA, ABA |
| **Observability/Eval**| Trace Miner, Trajectory Evaluator (`IN_ORDER`/`EXACT`) |

---

## ⚙️ Setup & Installation

### Prerequisites
- **Python 3.12+** and [uv](https://docs.astral.sh/uv/) (Python package manager)
- **Node.js 20+** and npm
- **Google Cloud Project** with Vertex AI enabled (for Gemini 2.5 Flash)

### 1. Clone the Repository
```bash
git clone https://github.com/PriyankaGhawghawe/AI-Powered-Enterprise-CRM.git
cd AI-Powered-Enterprise-CRM
```

### 2. Database Configuration
By default, the application runs using a local SQLite database (`business_os.db`). To connect to a production instance (e.g., Neon PostgreSQL):
1. Create a `.env` file in the root directory.
2. Add your database connection string:
   ```env
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   ```

### 3. Backend Setup
```bash
# Install Python dependencies
uv sync

# Start the FastAPI server (port 8000)
uv run uvicorn app.fast_api_app:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup
```bash
cd frontend-react

# Install Node dependencies
npm install

# Start the Vite dev server (port 5173)
npm run dev
```

### 🛡️ Development Seed Accounts

> [!WARNING]
> The accounts listed below are default seed credentials intended **only** for local sandbox development and testing. They should never be used or exposed in public production deployments. 
> On first login, the platform's authentication gateway enforces a **Just-In-Time Mandatory Password Reset** to secure the session.

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin` | Owner (full access) |
| `manager` | `manager` | Manager (limited admin) |
| `employee` | `employee` | Employee (restricted) |

---

## 🐳 Docker Deployment

The entire application is containerized using a **multi-stage Docker build**:

```bash
docker-compose up --build -d
# Access at http://localhost:8000
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

This project was built as part of the Google AI Agents Hackathon using the Google Agent Development Kit (ADK).

