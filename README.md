# Business OS: Enterprise Financial & CRM Platform

Business OS is a state-of-the-art enterprise management platform built for modern organizations. It features a complete CRM, Financial War Room, interactive AI Assistant, multi-source Data Integrations (Stripe, Salesforce, etc.), and strict SOC-2 compliant Role-Based Access Control.

## Architecture

The project uses a monolithic repo with a modern decoupled frontend and backend:

- **Frontend:** React + Vite (`/frontend-react`). Built with Tailwind CSS and dynamic Chart.js visualizations.
- **Backend:** FastAPI + Python (`/app`). Handles REST API, JWT Authentication, SQLite database via SQLAlchemy, and AI orchestration.
- **AI Agent Engine:** Google Advanced Agentic Code (ADK) powers the AI War Room and SQL Generation engines.

## Core Features

- **Dashboard:** At-a-glance financial metrics (MRR, Burn Rate, Runway).
- **Users & Roles:** Granular RBAC (Owner, Manager, Employee) with encrypted JWT tokens and instant revocation.
- **Security & Audit Logs:** Every sensitive action (logins, role changes, AI prompts) is immutably logged and exportable to CSV.
- **AI Assistant:** A secure AI that scrubs PII and respects your RBAC boundaries before answering questions about your database.
- **War Room:** A generative AI workspace that debates strategic business decisions based on real data.
- **Data Integrations:** Secure, AES-256 encrypted storage for API keys allowing seamless syncing with third-party tools.
- **Database Explorer:** A live spreadsheet-like interface for managing core business entities (Sales, Compliance, Competitors).

## Quick Start

### 1. Development (Local)

**Backend:**
```bash
# Install dependencies using UV
uv sync

# Run the FastAPI server (starts on http://localhost:8080)
uv run uvicorn app.fast_api_app:app --reload --host 0.0.0.0 --port 8080
```

**Frontend:**
```bash
cd frontend-react
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

### 2. Production (Docker)

The platform is fully containerized using a multi-stage Docker build.

```bash
# Build and start the container
docker-compose up --build -d
```
The application will be accessible at `http://localhost:8080`. Your local `business_os.db` SQLite database is mounted as a volume so data persists across restarts.

## Compliance & Security

This platform implements enterprise-grade security protocols:
- **AES-256 Encryption:** All third-party API keys are symmetrically encrypted at rest using `cryptography.fernet`.
- **Zero-Trust AI:** The AI chatbot is fully aware of JWT `token_version` and dynamically injects `Owner`/`Manager` constraints to prevent employees from extracting unauthorized financials.
- **BCrypt:** Passwords are mathematically salted and hashed. Plaintext passwords are never saved.

## Default Accounts
Upon initial run, the database is seeded with the following accounts (Password is the same as the Username):
- `admin` (Role: Owner)
- `manager` (Role: Manager)
- `employee` (Role: Employee)
