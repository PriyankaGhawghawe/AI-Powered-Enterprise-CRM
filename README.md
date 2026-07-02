<div align="center">
  <img src="frontend-react/src/assets/hero.png" alt="BusinessOS Hero" width="600" />
</div>

# BusinessOS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)
![Node 20](https://img.shields.io/badge/node-20-green.svg)

> **A full-stack, agentic AI CRM platform featuring a team of autonomous AI agents — CEO, CFO, Sales Director, Market Analyst, and Compliance Officer — working collaboratively.**

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
- [Setup & Installation](#-setup--installation)
- [Docker Deployment](#-docker-deployment)
- [Screenshots & UI](#-screenshots--ui)
- [Known Limitations & Roadmap](#-known-limitations--roadmap)
- [Contributing](#-contributing)
- [Acknowledgments & Contact](#-acknowledgments--contact)

---

## 🎯 Problem Statement

Modern businesses drown in operational complexity. A typical mid-market company juggles:

- **Financial dashboards** scattered across Stripe, QuickBooks, and spreadsheets.
- **CRM data** siloed in Salesforce with no real-time strategic insight.
- **Compliance audits** that are manual, error-prone, and reactive.
- **Market intelligence** that requires hours of manual research across dozens of sources.
- **Executive communication** bottlenecks — drafting board updates, investor emails, and compliance reports.

The result? **Executives spend 60% of their time gathering data instead of making decisions.** Small and mid-market companies cannot afford a full C-suite, yet they face the same strategic complexity as enterprise organizations.

**The core question:** *What if an AI system could autonomously perform complex cross-functional workflows — analyzing finances, monitoring sales pipelines, researching competitors, auditing compliance, and drafting communications — all from a single platform?*

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

**BusinessOS** is a unified command center where a team of AI agents collaborates to manage business operations. It combines:

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

BusinessOS implements advanced **Agentic Defense** beyond traditional security measures (JWT, bcrypt, RBAC):

* **Ephemeral Sandboxing (Pillar 1):** Natural language SQL execution is isolated in ephemeral, network-isolated sandboxes that self-destruct after execution.
* **Just-In-Time Downscoping (Pillar 5):** The [`CredentialBroker`](app/security/credential_broker.py) ensures agents receive fresh, hyper-restricted credentials scoped *exactly* to the active task context.
* **Vibe Diff & Cryptographic MFA (Pillar 5):** High-stakes actions require hardware MFA TOTP codes and present a translated "Vibe Diff" so users understand the exact execution trajectory before approving.
* **Agentic SecOps & ABA (Pillar 6):** [`AgentBehaviouralAnalytics`](app/security/agent_behavioural_analytics.py) acts as a Red/Blue team triad, monitoring the Runtime AgBOM for anomaly rates and enforcing **Stateful Quarantines** against hallucinating agents.
* **Supply Chain Defence:** Configured with GitHub Actions CI/CD to block hallucinated or typosquatted packages dynamically requested by the agent using `pip-audit`.
* **Zero-Trust Token Management:** Immediate JWT session revocation via dynamic token versioning upon role change or password reset.
* **PII Scrubbing:** Emails, phone numbers, and credit cards are scrubbed via regex before reaching the LLM.

---

## 📈 Evaluation-Driven Development

We employ a complete "quality flywheel" to ensure vibe-coded implementations scale safely:

* **Trajectory Evaluation:** Beyond just asserting final outputs, our [`trajectory_evaluator.py`](app/eval/trajectory_evaluator.py) scores execution trajectories using `EXACT` and `IN_ORDER` modes against `.agents/skills/eval_cases.json`.
* **Trace Mining & Clustering:** The FastAPI backend utilizes a failure sink. User corrections (e.g. "No, that's completely wrong") force a sub-2 satisfaction score, immediately dumping the full AgBOM trace to `failed_traces.jsonl`. Our [`trace_miner.py`](app/eval/trace_miner.py) then clusters these failures with Gemini to identify systematic skill gaps.

### Running Evaluations

To execute the trajectory evaluator against the local test cases, run:

```bash
uv run python -m app.eval.trajectory_evaluator
```

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

### 2. Environment Variables Configuration

Create a `.env` file in the root directory. To run the application fully locally or against production infrastructure, configure the following variables:

| Environment Variable | Description | Example / Default |
|----------------------|-------------|-------------------|
| `DATABASE_URL` | Connection string for PostgreSQL (Neon) or local SQLite. | `postgresql://user:password@host/dbname?sslmode=require` (defaults to local `sqlite:///./business_os.db`) |
| `SECRET_KEY` | Secret key used for signing JWT authentication tokens. | `super-secret-key-for-business-os` (must override in prod) |
| `GEMINI_API_KEY` | Your Google Gemini API Key (if not using Vertex AI). | `AIzaSy...` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to your GCP Service Account JSON key (required if using Vertex AI and GCP services). | `./service-account-key.json` |
| `GOOGLE_CLOUD_PROJECT` | Your Google Cloud Project ID. | `businessosproj` |
| `GCS_BUCKET_NAME` | Cloud Storage bucket for PDF report generation and artifacts. | `businessos-artifacts-123456` |

**Example `.env`:**
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
SECRET_KEY="your-secure-random-string"
GEMINI_API_KEY="AIzaSy..."
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

### 🛡️ Development Seed Accounts & RBAC

The platform features a **2-step role picker login flow** for frictionless prototype demonstrations. 
You can click any role on the login page to instantly auto-fill credentials and sign in.

| Role | Username / Password | Access Level | Tab Visibility |
|------|---------------------|--------------|----------------|
| **Owner** | `admin` / `admin` | Full Access | All tabs |
| **Manager** | `manager` / `manager` | Limited Admin | Cannot view **Users** tab |
| **Employee** | `employee` / `employee` | Restricted | Cannot view **Users**, **Integrations**, **Audit Log**, or **War Room** |

> [!WARNING]
> These seed accounts are intended **only** for sandbox development, prototyping, and demonstrations. Production accounts created via the platform enforce a **Just-In-Time Mandatory Password Reset** workflow to secure sessions.

---

## 🐳 Docker Deployment

The entire application is containerized using a **multi-stage Docker build**. The `docker-compose.yml` orchestrates both the React frontend and FastAPI backend into a seamless deployment.

### Running with Docker Compose

Ensure your `.env` file is present in the root directory (as described in the Environment Variables section) before running the containers.

```bash
# Build the images from scratch and run them detached in the background
docker-compose up --build -d
```

### Ports and Access
- **Backend API:** Exposed on `http://localhost:8000`. This serves all REST endpoints and handles agent execution.
- **Frontend App:** If using a multi-container setup, typically exposed on `http://localhost:5173`. Alternatively, if the frontend is built and served as static files via FastAPI, the entire application will be accessible directly on port `8000`.

### Environment Variables Note
- **Build Time:** Docker does *not* need your database passwords or API keys during the `docker build` phase. It only requires standard dependencies.
- **Run Time:** The containers will dynamically mount your local `.env` file at runtime. This ensures that sensitive credentials like `GEMINI_API_KEY` and `DATABASE_URL` are never baked into the Docker image itself.
---

## 📸 Screenshots & UI

> **Note:** Here is a preview of the BusinessOS platform.

- **Strategic War Room:**
  ![Strategic War Room](docs/screenshot_warroom.png)
- **Dashboard & A2UI Charts:**
  ![Dashboard](docs/screenshot_dashboard.png)
- **Database Explorer:**
  ![Database Explorer](docs/screenshot_database.png)

---

## 🚧 Known Limitations & Roadmap

While BusinessOS is fully functional, it was initially developed as a prototype for the Google AI Agents Hackathon. Current limitations and planned future enhancements include:

- **Multi-Tenancy:** The platform currently assumes a single-tenant organizational structure. Future iterations will implement strict Row-Level Security (RLS) for multi-tenant data isolation.
- **Agent Context Optimization:** For extremely long-running Strategic War Room debates, we plan to implement semantic compression on the Agentic Bill of Materials (AgBOM) to prevent context-window exhaustion.
- **Real-Time Streaming:** The chat interface currently relies on standard HTTP requests. We plan to migrate to WebSockets for real-time, token-by-token agent response streaming.
- **Dynamic Skill Ingestion:** While the `skill_creator` can generate new Python skills, we plan to expand this to allow dynamic ingestion of OpenAPI specs, allowing agents to instantly learn how to interact with new third-party tools on the fly.

---

## 🤝 Contributing

Contributions are welcome! Since this is an open-source prototype, feel free to open an issue or submit a pull request for any enhancements, new agents, or bug fixes.

---

## 🏆 Acknowledgments & Contact

This project was proudly built for the **[Google AI Agents Hackathon](https://googleaia.devpost.com/)** utilizing the Google Agent Development Kit (ADK).

**Creator:** Priyanka Ghawghawe  
**Connect:** [LinkedIn](https://www.linkedin.com/in/priyankaghawghawe/)  

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

