# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import logging
import os
import asyncio
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

import google.auth
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from google.adk.cli.fast_api import get_fast_api_app
from google.cloud import logging as google_cloud_logging
from pydantic import BaseModel

from app.app_utils.telemetry import setup_telemetry
from app.app_utils.typing import Feedback
from app.utils.audit import get_audit_logs, log_action
from app.utils.pii import mask_pii
from app.database import engine, Base, SessionLocal
from app import models
from app.models import User, AuditLog, Integration
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user_token, get_token_for_reset
from app.encryption import encrypt_data, decrypt_data
from fastapi import Depends, HTTPException, status
import datetime

# Create all tables
Base.metadata.create_all(bind=engine)

def seed_normalized_db(db):
    from app.models import SalesDeal, Competitor, HistoricalPerformance, RegulatoryRisk, ComplianceChecklist, BusinessMetric
    from app.mock_data import DEFAULT_BUSINESS_DATA

    if db.query(BusinessMetric).first() is None:
        # Seed Metrics
        for key, value in DEFAULT_BUSINESS_DATA["financials"].items():
            if not isinstance(value, dict) and not isinstance(value, list):
                db.add(BusinessMetric(key=f"financials.{key}", value=str(value)))
        
        for key, value in DEFAULT_BUSINESS_DATA["financials"].get("expenses", {}).items():
            db.add(BusinessMetric(key=f"financials.expenses.{key}", value=str(value)))
        db.add(BusinessMetric(key="company_name", value=DEFAULT_BUSINESS_DATA["company_name"]))
        db.add(BusinessMetric(key="industry", value=DEFAULT_BUSINESS_DATA["industry"]))
        
        # Seed Deals
        for deal in DEFAULT_BUSINESS_DATA["sales_pipeline"]["deals"]:
            db.add(SalesDeal(**deal))
        
        # Seed Competitors
        for comp in DEFAULT_BUSINESS_DATA["market_intelligence"]["competitors"]:
            db.add(Competitor(**comp))

        # Seed Historical Performance
        for hp in DEFAULT_BUSINESS_DATA["financials"]["historical_performance"]:
            db.add(HistoricalPerformance(**hp))
        
        # Seed Risks
        for risk in DEFAULT_BUSINESS_DATA["compliance"]["regulatory_risks"]:
            db.add(RegulatoryRisk(**risk))

        # Seed Checklist
        for item in DEFAULT_BUSINESS_DATA["compliance"]["checklist"]:
            db.add(ComplianceChecklist(**item))

        db.commit()

def init_db_data():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(username="admin", password_hash=get_password_hash("admin"), role="Owner", requires_password_reset=False))
        if not db.query(User).filter(User.username == "manager").first():
            db.add(User(username="manager", password_hash=get_password_hash("manager"), role="Manager", requires_password_reset=False))
        if not db.query(User).filter(User.username == "employee").first():
            db.add(User(username="employee", password_hash=get_password_hash("employee"), role="Employee", requires_password_reset=False))
        

        # Seed Integrations
        default_integrations = ['Stripe', 'Salesforce', 'Jira', 'Slack', 'HubSpot']
        for name in default_integrations:
            if not db.query(Integration).filter(Integration.name == name).first():
                db.add(Integration(name=name, status='disconnected'))
        
        db.commit()
        seed_normalized_db(db)
    finally:
        db.close()

init_db_data()

setup_telemetry()

# Setup robust logging
try:
    _, project_id = google.auth.default()
    logging_client = google_cloud_logging.Client()
    logger = logging_client.logger(__name__)
except Exception:
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("business_os")

allow_origins = ["*"]

# Artifact bucket for ADK
logs_bucket_name = os.environ.get("LOGS_BUCKET_NAME")

AGENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
session_service_uri = None
artifact_service_uri = f"gs://{logs_bucket_name}" if logs_bucket_name else None

app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    web=True,
    artifact_service_uri=artifact_service_uri,
    allow_origins=allow_origins,
    session_service_uri=session_service_uri,
    otel_to_cloud=True,
)
app.title = "business-os"

# === CRON JOB SETUP ===
from apscheduler.schedulers.asyncio import AsyncIOScheduler

async def run_weekly_report():
    print("CRON: Triggered weekly report generation...")
    from app.agent import app as adk_app
    from google.adk.runners import InMemoryRunner
    runner = InMemoryRunner(app=adk_app)
    
    # We give the cron job Owner role so it has permission to generate reports
    state_delta = {"user_role": "Owner"} 
    
    try:
        # We ask the CEO to draft a report and save it to the filesystem.
        # This will test the write_document tool automatically in the background.
        from google.genai import types
        cron_msg = types.Content(
            role="user",
            parts=[types.Part.from_text(text="You are running as an automated background cron job. Please read the financial summary and sales pipeline, and write a concise weekly executive summary document. Save it using the write_document tool as 'weekly_cron_summary.md'. Keep it under 100 words.")]
        )
        
        session = await runner.session_service.get_session(
            app_name=adk_app.name, user_id="cron-bot", session_id="cron-weekly"
        )
        if not session:
            await runner.session_service.create_session(
                app_name=adk_app.name, user_id="cron-bot", session_id="cron-weekly"
            )

        async for event in runner.run_async(
            user_id="cron-bot",
            session_id="cron-weekly",
            new_message=cron_msg,
            state_delta=state_delta
        ):
            pass
        print("CRON: Successfully completed weekly report generation.")
    except Exception as e:
        print(f"CRON: Error running background agent: {e}")

from apscheduler.schedulers.background import BackgroundScheduler
import asyncio

def run_weekly_report_sync():
    try:
        import traceback
        import os
        with open("cron_debug.log", "a") as f:
            f.write("Running cron sync wrapper\n")
        asyncio.run(run_weekly_report())
    except Exception as e:
        import traceback
        with open("cron_debug.log", "a") as f:
            f.write(traceback.format_exc() + "\n")

scheduler = BackgroundScheduler()
scheduler.add_job(run_weekly_report_sync, 'interval', minutes=1)
scheduler.start()
print("CRON: BackgroundScheduler started. Background jobs will run every minute.")

app.description = "API for interacting with the Agent business-os"


# --- Models ---
class ChatRequest(BaseModel):
    message: str | None = None
    role: str = "Employee"
    session_id: str = "default_session"
    user_id: str = "default_user"
    confirmation: dict | None = None
    simulated_db: dict | None = None


class DataUpdateRequest(BaseModel):
    data: dict


GLOBAL_RUNNER = None


# --- Custom BusinessOS API Endpoints ---

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == req.username).first()
        if not user or not verify_password(req.password, user.password_hash):
            log_action(req.username, "Failed login attempt", "System", "Denied")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
        
        access_token = create_access_token(data={
            "sub": user.username, 
            "role": user.role, 
            "requires_password_reset": user.requires_password_reset,
            "token_version": user.token_version
        })
        log_action(user.username, "Successful login", "System", "Success")
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "role": user.role, 
            "username": user.username,
            "requires_password_reset": user.requires_password_reset
        }
    finally:
        db.close()

class ResetPasswordRequest(BaseModel):
    new_password: str

@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest, token_data: dict = Depends(get_token_for_reset)):
    username = token_data.get("sub")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        user.password_hash = get_password_hash(req.new_password)
        user.requires_password_reset = False
        user.token_version += 1
        db.commit()
        log_action(user.username, "User reset their own password", "System", "Success")
        
        access_token = create_access_token(data={
            "sub": user.username, 
            "role": user.role, 
            "requires_password_reset": False,
            "token_version": user.token_version
        })
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "role": user.role, 
            "username": user.username,
            "requires_password_reset": False
        }
    finally:
        db.close()
class AuditLogCreate(BaseModel):
    action: str
    target: str
    status: str = "Success"

@app.post("/api/audit")
def create_audit_log(req: AuditLogCreate, token_data: dict = Depends(get_current_user_token)):
    db = SessionLocal()
    try:
        new_log = AuditLog(
            user=token_data.get("sub", "Unknown"),
            action=req.action,
            target=req.target,
            status=req.status
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        return {"id": new_log.id, "message": "Audit log created"}
    finally:
        db.close()

@app.get("/api/audit")
def get_audit_logs(token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") != "Owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    db = SessionLocal()
    try:
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
        return [
            {
                "id": log.id,
                "user": log.user,
                "action": log.action,
                "target": log.target,
                "timestamp": log.timestamp.isoformat(),
                "status": log.status
            }
            for log in logs
        ]
    finally:
        db.close()

@app.get("/api/users")
def get_users(token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") != "Owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return [{"id": u.id, "username": u.username, "role": u.role, "created_at": u.created_at} for u in users]
    finally:
        db.close()

class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str

@app.post("/api/users")
def create_user(req: CreateUserRequest, token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") != "Owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == req.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already registered")
        hashed_pwd = get_password_hash(req.password)
        new_user = User(username=req.username, password_hash=hashed_pwd, role=req.role)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        log_action(token_data.get("sub"), f"Created new user {req.username} with role {req.role}", "System", "Success")
        return {"id": new_user.id, "username": new_user.username, "role": new_user.role}
    finally:
        db.close()

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") != "Owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.username == token_data.get("sub"):
            raise HTTPException(status_code=400, detail="Cannot delete yourself")
        db.delete(user)
        db.commit()
        log_action(token_data.get("sub"), f"Deleted user {user.username}", "System", "Success")
        return {"status": "success"}
    finally:
        db.close()

class AdminResetPasswordRequest(BaseModel):
    new_password: str

@app.post("/api/users/{user_id}/reset-password")
def admin_reset_password(user_id: int, req: AdminResetPasswordRequest, token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") != "Owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        hashed_pwd = get_password_hash(req.new_password)
        user.password_hash = hashed_pwd
        user.requires_password_reset = True
        user.token_version += 1
        db.commit()
        log_action(token_data.get("sub"), f"Admin reset password for {user.username}", "System", "Success")
        return {"status": "success", "message": f"Password reset for {user.username}"}
    finally:
        db.close()

class EditRoleRequest(BaseModel):
    role: str

@app.put("/api/users/{user_id}/role")
def edit_user_role(user_id: int, req: EditRoleRequest, token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") != "Owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.username == token_data.get("sub"):
            raise HTTPException(status_code=400, detail="Cannot edit your own role")
        user.role = req.role
        db.commit()
        return {"status": "success", "message": f"Role updated to {user.role} for {user.username}"}
    finally:
        db.close()

class ConfigureIntegrationRequest(BaseModel):
    api_key: str

@app.get("/api/integrations")
def get_integrations(token_data: dict = Depends(get_current_user_token)):
    db = SessionLocal()
    try:
        integrations = db.query(Integration).all()
        return [
            {
                "id": i.id,
                "name": i.name,
                "status": i.status,
                "last_synced_at": i.last_synced_at
            }
            for i in integrations
        ]
    finally:
        db.close()

@app.post("/api/integrations/{name}/configure")
def configure_integration(name: str, req: ConfigureIntegrationRequest, token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") != "Owner":
        raise HTTPException(status_code=403, detail="Only Owners can configure integrations")
    db = SessionLocal()
    try:
        integration = db.query(Integration).filter(Integration.name == name).first()
        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found")
        integration.api_key = encrypt_data(req.api_key)
        integration.status = "connected"
        db.commit()
        return {"status": "success", "message": f"{name} configured successfully."}
    finally:
        db.close()

@app.post("/api/integrations/{name}/sync")
def sync_integration(name: str, token_data: dict = Depends(get_current_user_token)):
    db = SessionLocal()
    try:
        integration = db.query(Integration).filter(Integration.name == name).first()
        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found")
        if integration.status != "connected":
            raise HTTPException(status_code=400, detail="Integration must be configured first")
        
        # Simulate syncing logic using decrypted key
        _plaintext_key = decrypt_data(integration.api_key) if integration.api_key else None
        integration.last_synced_at = datetime.datetime.utcnow()
        db.commit()
        return {"status": "success", "message": f"Successfully synced data from {name}"}
    finally:
        db.close()
@app.get("/api/data")
def get_business_data(token_data: dict = Depends(get_current_user_token)) -> dict:
    """Fetch the current editable business database state from normalized tables."""
    from app.models import SalesDeal, Competitor, HistoricalPerformance, RegulatoryRisk, ComplianceChecklist, BusinessMetric, AuditLog
    db = SessionLocal()
    try:
        metrics = {m.key: m.value for m in db.query(BusinessMetric).all()}
        
        financials = {"expenses": {}}
        for key, val in metrics.items():
            if key.startswith("financials.expenses."):
                k = key.split(".")[-1]
                if val.isdigit(): val = int(val)
                financials["expenses"][k] = val
            elif key.startswith("financials."):
                k = key.split(".")[1]
                if val.isdigit(): val = int(val)
                financials[k] = val

        historical = []
        for hp in db.query(HistoricalPerformance).all():
            historical.append({"month": hp.month, "revenue": hp.revenue, "expenses": hp.expenses})
        financials["historical_performance"] = historical

        deals = []
        user_role = token_data.get("role", "Employee")
        username = token_data.get("sub", "Unknown")
        for d in db.query(SalesDeal).all():
            # Row-level downscoping: Employees only see their own assigned deals
            if user_role == "Employee" and d.owner != username:
                continue
            deals.append({"id": d.id, "name": d.name, "value": d.value, "stage": d.stage, "probability": float(d.probability), "owner": d.owner, "age_days": d.age_days})

        competitors = []
        for c in db.query(Competitor).all():
            competitors.append({"name": c.name, "market_share": c.market_share, "pricing": c.pricing, "strengths": c.strengths, "weaknesses": c.weaknesses})
        
        risks = []
        for r in db.query(RegulatoryRisk).all():
            risks.append({"risk_area": r.risk_area, "description": r.description, "severity": r.severity, "mitigation": r.mitigation or ""})

        checklist = []
        for cl in db.query(ComplianceChecklist).all():
            checklist.append({"item": cl.item, "status": cl.status})

        return {
            "company_name": metrics.get("company_name", ""),
            "industry": metrics.get("industry", ""),
            "financials": financials,
            "sales_pipeline": {
                "stages": ["Lead", "Demo", "Proposal", "Negotiation", "Closed Won", "Closed Lost"],
                "deals": deals,
                "average_deal_cycle_days": 42
            },
            "market_intelligence": {
                "competitors": competitors,
                "industry_growth_rate": "24% YoY",
                "customer_demographics": "Mid-market software companies and digital agencies"
            },
            "compliance": {
                "gdpr_status": "Compliant (Last Audit: May 2026)",
                "checklist": checklist,
                "regulatory_risks": risks
            }
        }
    finally:
        db.close()


@app.post("/api/data")
def update_business_data(payload: DataUpdateRequest, token_data: dict = Depends(get_current_user_token)) -> dict:
    """Overwrite the current business database state with updated edits."""
    if token_data.get("role") != "Owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from app.models import SalesDeal, Competitor, HistoricalPerformance, RegulatoryRisk, ComplianceChecklist, BusinessMetric
    db = SessionLocal()
    try:
        # We wipe and recreate the tables to simulate the "save JSON" behavior for simplicity
        db.query(SalesDeal).delete()
        db.query(Competitor).delete()
        db.query(HistoricalPerformance).delete()
        db.query(RegulatoryRisk).delete()
        db.query(ComplianceChecklist).delete()
        db.query(BusinessMetric).delete()
        db.commit()

        data = payload.data
        if "financials" in data:
            for k, v in data["financials"].items():
                if not isinstance(v, dict) and not isinstance(v, list):
                    db.add(BusinessMetric(key=f"financials.{k}", value=str(v)))
            if "expenses" in data["financials"]:
                for k, v in data["financials"]["expenses"].items():
                    db.add(BusinessMetric(key=f"financials.expenses.{k}", value=str(v)))
        
        db.add(BusinessMetric(key="company_name", value=data.get("company_name", "")))
        db.add(BusinessMetric(key="industry", value=data.get("industry", "")))
        
        if "sales_pipeline" in data and "deals" in data["sales_pipeline"]:
            for d in data["sales_pipeline"]["deals"]:
                db.add(SalesDeal(**d))
        
        if "market_intelligence" in data and "competitors" in data["market_intelligence"]:
            for c in data["market_intelligence"]["competitors"]:
                db.add(Competitor(**c))

        if "financials" in data and "historical_performance" in data["financials"]:
            for hp in data["financials"]["historical_performance"]:
                db.add(HistoricalPerformance(**hp))
        
        if "compliance" in data:
            if "regulatory_risks" in data["compliance"]:
                for r in data["compliance"]["regulatory_risks"]:
                    db.add(RegulatoryRisk(**r))
            if "checklist" in data["compliance"]:
                for c in data["compliance"]["checklist"]:
                    db.add(ComplianceChecklist(**c))
        
        db.commit()
    finally:
        db.close()
    
    log_action(token_data.get("role"), "Updated business database variables natively", token_data.get("sub"), "Success")
    return {"status": "success", "message": "Database updated successfully."}



@app.post("/api/chat_test")
async def chat_test(token_data: dict = Depends(get_current_user_token)):
    print("HITTING CHAT TEST ENDPOINT", flush=True)
    return {"message": "hello"}

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest, token_data: dict = Depends(get_current_user_token)):
    print(f"HITTING CHAT ENDPOINT WITH {req}", flush=True)
    """Secure multi-agent chat endpoint with PII scrubbing, RBAC delegation, and trace capturing."""
    from google.adk.runners import InMemoryRunner
    from google.genai import types

    from app.agent import app as adk_app

    user_role = token_data.get("role", "Employee")
    username = token_data.get("sub", "Unknown")

    # 1. Mask PII in inputs
    masked_message = None
    was_rejection = False  # Tracks if user denied a pending confirmation
    if req.message:
        masked_message = mask_pii(req.message)
        # Audit log the prompt entry
        log_action(username, f"User Prompt: {masked_message}", "CEO", "Success")

    # Role-based system directive: restrict what the agent discloses per role
    ROLE_DIRECTIVES = {
        "Employee": (
            "[SYSTEM SECURITY POLICY] The current user has the 'Employee' role. "
            "You MUST enforce the following restrictions strictly:\n"
            "- DO NOT disclose specific financial figures: cash balance, runway, burn rate, MRR, payroll, or any expense amounts.\n"
            "- DO NOT perform or attempt email, Gmail, or Drive actions — these are blocked for this role.\n"
            "- DO NOT reveal audit log data or security event history.\n"
            "- You MAY discuss: general compliance status, GDPR posture, competitor landscape, market trends, and high-level sales pipeline stages.\n"
            "- For any restricted topic, politely explain that financial data requires Manager or Owner access.\n"
            "User message: "
        ),
        "Manager": None,   # Managers get full chat access
        "Owner": None,     # Owners get full chat access
    }

    new_message = None
    if masked_message:
        directive = ROLE_DIRECTIVES.get(user_role) or ""
            
        # Override req user and role with verified token data
        user_id = username
        req.role = user_role
        
        # Scenario Mode injection
        scenario_context = ""
        if getattr(req, 'simulated_db', None):
            import json
            scenario_context = (
                "\n\n[SCENARIO MODE ACTIVE] The user is currently running a 'What-If' simulation.\n"
                "DO NOT use the physical db.json for this query.\n"
                "INSTEAD, you MUST strictly use the following hypothetical business data to answer the user's prompt:\n"
                f"```json\n{json.dumps(req.simulated_db, indent=2)}\n```\n"
                "Please analyze the situation based *only* on this hypothetical scenario data.\n"
            )
            
        full_message = (directive + scenario_context + "\nUser message: " + masked_message) if (directive or scenario_context) else masked_message
        
        new_message = types.Content(
            role="user", parts=[types.Part.from_text(text=full_message)]
        )
    elif req.confirmation:
        fc_id = req.confirmation.get("id")
        confirmed = req.confirmation.get("confirmed", False)
        status_str = "Approved" if confirmed else "Rejected"
        was_rejection = not confirmed
        log_action(
            req.role,
            f"Tool Approval response: {status_str} for call {fc_id}",
            "System",
            status_str,
        )

        new_message = types.Content(
            role="user",
            parts=[
                types.Part(
                    function_response=types.FunctionResponse(
                        name="adk_request_confirmation",
                        id=fc_id,
                        response={"confirmed": confirmed},
                    )
                )
            ],
        )

    # 2. Run agent session with propagated user role state using global runner
    global GLOBAL_RUNNER
    if GLOBAL_RUNNER is None:
        GLOBAL_RUNNER = InMemoryRunner(app=adk_app)
    runner = GLOBAL_RUNNER

    # Ensure session exists in session service
    session = await runner.session_service.get_session(
        app_name=adk_app.name, user_id=req.user_id, session_id=req.session_id
    )
    if session:
        print(f"[DEBUG] Loaded existing session {session.id} with {len(session.events)} events.", flush=True)
        for idx, ev in enumerate(session.events):
            fcs_str = []
            if ev.get_function_calls():
                for fc in ev.get_function_calls():
                    fcs_str.append(f"name={fc.name}, id={fc.id}, args={fc.args}")
            frs_str = []
            if ev.get_function_responses():
                for fr in ev.get_function_responses():
                    frs_str.append(f"name={fr.name}, id={fr.id}, response={fr.response}")
            print(f"[DEBUG] Event {idx}: author={ev.author}, fcs={fcs_str}, frs={frs_str}", flush=True)
    else:
        print(f"[DEBUG] No existing session found for {req.session_id}.", flush=True)

    if not session:
        await runner.session_service.create_session(
            app_name=adk_app.name, user_id=req.user_id, session_id=req.session_id
        )
    state_delta = {"user_role": req.role}

    from opentelemetry import trace as otel_trace
    tracer = otel_trace.get_tracer("business_os_agents")

    events = []
    text_response = ""
    needs_confirmation = False
    confirmation_hint = ""
    confirmation_fc_id = ""
    trace_logs = []

    try:
        # Integrated structured OpenTelemetry spans for agent.session tracking (Pillar 6 & 7)
        with tracer.start_as_current_span("agent.session") as session_span:
            session_span.set_attribute("session_id", req.session_id)
            session_span.set_attribute("user_role", req.role)
            
            async for event in runner.run_async(
                user_id=req.user_id,
                session_id=req.session_id,
                new_message=new_message,
                state_delta=state_delta,
            ):
                events.append(event)
                author = event.author or "System"

                # Sync active agent to tool state dynamically so downscoping works
                if author and author != "System":
                    state_delta["active_agent"] = author
                    # Push state update directly to session state
                    if session and hasattr(session, "state"):
                        session.state["active_agent"] = author

                # Trace agent planning phases (agent.think span representation)
                if event.content:
                    with tracer.start_as_current_span("agent.think") as think_span:
                        think_span.set_attribute("agent.name", author)

                # Extract text parts
                event_text = ""
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.text:
                            event_text += part.text
                            text_response += part.text

            if event_text:
                trace_logs.append(
                    {"author": author, "type": "message", "text": event_text}
                )

            # Inspect for confirmation prompts
            if event.actions and event.actions.requested_tool_confirmations:
                for (
                    fc_id,
                    confirm_info,
                ) in event.actions.requested_tool_confirmations.items():
                    needs_confirmation = True
                    confirmation_hint = (
                        confirm_info.hint or "Please confirm this tool call."
                    )
                    # The ADK framework requires the function call ID of the wrapper
                    # "adk_request_confirmation" call to resume successfully.
                    # We scan all events yielded so far in this invocation to locate it.
                    wrapper_fc_id = None
                    for ev in events:
                        if ev.get_function_calls():
                            for fc in ev.get_function_calls():
                                if fc.name == "adk_request_confirmation":
                                    wrapper_fc_id = fc.id
                                    break
                            if wrapper_fc_id:
                                break
                    confirmation_fc_id = wrapper_fc_id or fc_id
                    
                    trace_logs.append(
                        {
                            "author": author,
                            "type": "confirmation_request",
                            "hint": confirmation_hint,
                            "fc_id": confirmation_fc_id,
                        }
                    )
                    log_action(
                        req.role,
                        f"Requested Tool Confirmation: {confirmation_hint}",
                        author,
                        "Pending Approval",
                        f"Call ID: {confirmation_fc_id}",
                    )

            # Capture tool executions (Pillar 6 & 7)
            if event.get_function_calls():
                for fc in event.get_function_calls():
                    with tracer.start_as_current_span("agent.tool") as tool_span:
                        tool_span.set_attribute("tool.name", fc.name)
                        tool_span.set_attribute("tool.args", str(fc.args))
                    trace_logs.append(
                        {
                            "author": author,
                            "type": "tool_call",
                            "name": fc.name,
                            "args": fc.args,
                        }
                    )
            if event.get_function_responses():
                for fr in event.get_function_responses():
                    with tracer.start_as_current_span("agent.tool_response") as response_span:
                        response_span.set_attribute("tool.name", fr.name)
                    trace_logs.append(
                        {
                            "author": author,
                            "type": "tool_response",
                            "name": fr.name,
                            "response": fr.response,
                        }
                    )

    except Exception as e:
        trace_logs.append(
            {"author": "System", "type": "error", "text": f"Error running agent: {e!s}"}
        )
        log_action(req.role, f"Agent execution error: {e!s}", "System", "Error")
        return {
            "response": f"Error during execution: {e!s}",
            "trace": trace_logs,
            "needs_confirmation": False,
        }

    if needs_confirmation:
        for ev in events:
            if ev.get_function_calls():
                for fc in ev.get_function_calls():
                    if fc.name == "adk_request_confirmation":
                        confirmation_fc_id = fc.id
                        # Update trace_logs in place
                        for step in trace_logs:
                            if step.get("type") == "confirmation_request":
                                step["fc_id"] = fc.id
                        break

    # If user explicitly denied the action, override whatever the model said
    # to give a clear, unambiguous rejection acknowledgement.
    if was_rejection:
        text_response = (
            "\u26d4 **Action Denied.** The requested sensitive operation has been "
            "blocked per your decision. No email was sent, and no external action "
            "was taken. The agent has been informed of the rejection."
        )
        log_action(
            req.role,
            "Sensitive action denied by user — no external action taken.",
            "Security System",
            "Rejected",
        )

    # Feature 4: Session Memory
    if req.session_id:
        if req.session_id not in chat_history_db:
            chat_history_db[req.session_id] = []
        if req.message:
            chat_history_db[req.session_id].append({"sender": "You", "text": masked_message, "is_user": True})
        if text_response:
            chat_history_db[req.session_id].append({"sender": "System", "text": text_response, "is_user": False})

        # Calculate and Log Session Convergence Metrics (Evaluation Quality Flywheel)
        turns_count = len(chat_history_db[req.session_id])
        user_signals = [msg["text"] for msg in chat_history_db[req.session_id] if msg["is_user"]]
        
        # GenAI-based Intent Satisfaction Evaluator (Pillar 2 Evaluation Framework)
        satisfaction_score = 5
        converged = not was_rejection
        if req.message and text_response:
            try:
                from google.genai import Client
                # Reuse vertex client setup context if valid API keys exist
                client = Client()
                eval_prompt = (
                    "You are a Quality Assurance Judge evaluating a conversation between a User and a C-Suite Agent team.\n"
                    f"User Prompt: {req.message}\n"
                    f"Agent Response: {text_response}\n"
                    "Evaluate if the Agent addressed the User prompt successfully. Respond strictly in JSON format with two keys:\n"
                    "- 'converged' (true/false)\n"
                    "- 'satisfaction_score' (integer between 1 and 5)"
                )
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=eval_prompt,
                    config={"response_mime_type": "application/json"}
                )
                import json
                eval_data = json.loads(response.text.strip())
                converged = eval_data.get("converged", converged)
                satisfaction_score = eval_data.get("satisfaction_score", satisfaction_score)
            except Exception as eval_err:
                print(f"[EVAL ERROR] GenAI Satisfaction Evaluation skipped: {eval_err}", flush=True)
                # Fallback rule of thumb satisfaction score
                if any(kw in (user_signals[-1] if user_signals else "").lower() for kw in ["no", "incorrect", "wrong", "stop"]):
                    satisfaction_score = 2
                    converged = False

        # Estimate token cost roughly
        estimated_token_cost_usd = turns_count * 0.00015
        
        log_action(
            username,
            f"Evaluation Convergence Metric - Turns: {turns_count}, Converged: {converged}, Satisfaction: {satisfaction_score}/5, Cost: ${estimated_token_cost_usd:.5f}",
            "Evaluation Engine",
            "Success"
        )
        print(f"[EVAL] Session ID: {req.session_id} | Turns: {turns_count} | Converged: {converged} | Satisfaction: {satisfaction_score}/5 | Est. Cost: ${estimated_token_cost_usd:.5f}", flush=True)

        return {
            "response": text_response,
            "trace": trace_logs,
            "needs_confirmation": needs_confirmation,
            "confirmation_hint": confirmation_hint,
            "confirmation_fc_id": confirmation_fc_id,
            "evaluation": {
                "turns_count": turns_count,
                "converged": converged,
                "satisfaction_score": satisfaction_score,
                "estimated_token_cost_usd": estimated_token_cost_usd
            }
        }

class ChartPinRequest(BaseModel):
    title: str
    sql: str
    chart_type: str
    x_axis: str
    y_axis: str

@app.post("/api/charts/pin")
def pin_chart(req: ChartPinRequest, token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") not in ["Owner", "Manager", "Employee"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from app.models import PinnedChart
    import uuid
    import datetime
    
    db = SessionLocal()
    try:
        new_chart_id = str(uuid.uuid4())
        new_chart = PinnedChart(
            id=new_chart_id,
            title=req.title,
            sql=req.sql,
            chart_type=req.chart_type,
            x_axis=req.x_axis,
            y_axis=req.y_axis,
            pinned_by=token_data.get("sub"),
            date_pinned=datetime.datetime.utcnow()
        )
        db.add(new_chart)
        db.commit()
        return {
            "status": "success", 
            "chart": {
                "id": new_chart_id,
                "title": req.title,
                "sql": req.sql,
                "chart_type": req.chart_type,
                "x_axis": req.x_axis,
                "y_axis": req.y_axis,
                "pinned_by": token_data.get("sub"),
                "date_pinned": new_chart.date_pinned.isoformat()
            }
        }
    finally:
        db.close()

@app.get("/api/charts/pinned")
def get_pinned_charts(token_data: dict = Depends(get_current_user_token)):
    from app.models import PinnedChart
    db = SessionLocal()
    try:
        charts = db.query(PinnedChart).all()
        return [
            {
                "id": c.id,
                "title": c.title,
                "sql": c.sql,
                "chart_type": c.chart_type,
                "x_axis": c.x_axis,
                "y_axis": c.y_axis,
                "pinned_by": c.pinned_by,
                "date_pinned": c.date_pinned.isoformat()
            } for c in charts
        ]
    finally:
        db.close()

class SQLGenerateRequest(BaseModel):
    query: str

class SQLExecuteRequest(BaseModel):
    sql: str

@app.post("/api/sql/generate")
async def generate_sql(req: SQLGenerateRequest, token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") not in ["Owner", "Manager", "Employee"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    import google.generativeai as genai
    import os
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    schema_prompt = """
    You are an expert SQL assistant for BusinessOS. You will generate valid SQLite queries based on the user's natural language request.
    
    The database schema has the following tables:
    1. `users` (id INTEGER, username VARCHAR, role VARCHAR, created_at DATETIME)
    2. `integrations` (id INTEGER, name VARCHAR, status VARCHAR, last_synced_at DATETIME)
    3. `sales_deals` (id VARCHAR, name VARCHAR, value FLOAT, stage VARCHAR, probability FLOAT, owner VARCHAR, age_days INTEGER)
    4. `regulatory_risks` (id INTEGER, risk_area VARCHAR, description VARCHAR, severity VARCHAR, mitigation VARCHAR)
    5. `historical_performance` (id INTEGER, month VARCHAR, revenue FLOAT, expenses FLOAT)
    6. `competitors` (id INTEGER, name VARCHAR, market_share VARCHAR, pricing VARCHAR, strengths VARCHAR, weaknesses VARCHAR)
    7. `compliance_checklist` (id INTEGER, item VARCHAR, status VARCHAR)
    
    For top-level key-value metrics, you can query:
    8. `business_metrics` (id INTEGER, key VARCHAR, value VARCHAR)
       Keys include: 'company_name', 'industry', 'financials.cash_balance', 'financials.monthly_mrr', 'financials.expenses.marketing', etc.
       Use: SELECT value FROM business_metrics WHERE key = 'financials.monthly_mrr';
    
    Return ONLY the raw SQL query string without any markdown formatting, backticks, or explanation. Ensure it is a read-only SELECT statement.
    """
    
    try:
        response = await model.generate_content_async([schema_prompt, f"User Request: {req.query}"])
        sql_query = response.text.strip().strip('`').strip('sql').strip()
        return {"sql": sql_query}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "Quota exceeded" in error_msg:
            # Try to extract the retry delay if present
            import re
            retry_match = re.search(r"retry in ([\d\.]+)s", error_msg)
            if retry_match:
                delay = round(float(retry_match.group(1)))
                friendly_msg = f"Gemini AI Quota Exceeded. You have reached the free tier limit. Please wait {delay} seconds before trying again."
            else:
                friendly_msg = "Gemini AI Quota Exceeded. You have reached the free tier limit. Please try again in a few moments or upgrade your API plan."
            raise HTTPException(status_code=429, detail=friendly_msg)
        raise HTTPException(status_code=500, detail=f"Failed to generate SQL: {error_msg}")

class SQLVisualizeRequest(BaseModel):
    columns: list
    rows: list

@app.post("/api/sql/visualize")
async def visualize_sql(req: SQLVisualizeRequest, token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") not in ["Owner", "Manager", "Employee"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not req.columns or not req.rows:
        return {"chartType": "Bar", "xAxisKey": "", "yAxisKey": ""}

    import google.generativeai as genai
    import os
    import json
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    You are a data visualization expert. I will provide you with the columns and a sample of rows from a SQL query result.
    Your task is to determine the BEST chart type (either "Bar" or "Line"), which column should be the X-axis, and which column should be the Y-axis.
    
    Columns: {req.columns}
    Sample Data (first 3 rows): {req.rows[:3]}
    
    Return the response strictly in JSON format matching exactly this schema:
    {{
        "chartType": "Bar" or "Line",
        "xAxisKey": "string (one of the columns)",
        "yAxisKey": "string (one of the columns)"
    }}
    
    Do NOT wrap in markdown blocks, just return raw JSON.
    """
    
    try:
        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        config = json.loads(text)
        return config
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "Quota exceeded" in error_msg:
            # Try to extract the retry delay if present
            import re
            retry_match = re.search(r"retry in ([\d\.]+)s", error_msg)
            if retry_match:
                delay = round(float(retry_match.group(1)))
                friendly_msg = f"Gemini AI Quota Exceeded. You have reached the free tier limit. Please wait {delay} seconds before trying again."
            else:
                friendly_msg = "Gemini AI Quota Exceeded. You have reached the free tier limit. Please try again in a few moments or upgrade your API plan."
            raise HTTPException(status_code=429, detail=friendly_msg)
            
        # Fallback to simple logic if AI fails for non-quota reasons
        return {
            "chartType": "Bar",
            "xAxisKey": req.columns[0] if len(req.columns) > 0 else "",
            "yAxisKey": req.columns[1] if len(req.columns) > 1 else (req.columns[0] if len(req.columns) > 0 else "")
        }

@app.post("/api/sql/execute")
def execute_sql(req: SQLExecuteRequest, token_data: dict = Depends(get_current_user_token)):
    user_role = token_data.get("role", "Employee")
    if user_role not in ["Owner", "Manager", "Employee"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    sql = req.sql.strip()
    # Basic security check to prevent modifications
    if not sql.upper().startswith("SELECT"):
        raise HTTPException(status_code=400, detail="Only SELECT statements are allowed for security reasons.")
        
    # Security restriction: prevent Employees from querying credentials, password hashes, or logs via raw SQL
    if user_role == "Employee":
        restricted_tables = ["users", "audit_log", "regulatory_risks", "integration"]
        if any(table in sql.lower() for table in restricted_tables):
            raise HTTPException(
                status_code=403, 
                detail="Access Denied: Your employee role is restricted from querying system credentials, compliance risks, or audit logging tables."
            )

    from sqlalchemy import text
    db = SessionLocal()
    try:
        result = db.execute(text(sql))
        # Convert rows to a list of dicts
        columns = result.keys()
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return {"columns": list(columns), "rows": rows}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL Execution Error: {str(e)}")
    finally:
        db.close()

class WarRoomRequest(BaseModel):
    query: str

@app.post("/api/warroom/debate")
async def warroom_debate(req: WarRoomRequest, token_data: dict = Depends(get_current_user_token)):
    user_role = token_data.get("role", "Employee")
    if user_role == "Employee":
        raise HTTPException(
            status_code=403,
            detail="Access Denied: The Strategic War Room is restricted to Owners and Managers due to financial sensitivity."
        )
    from fastapi.responses import StreamingResponse
    import google.generativeai as genai
    import json
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def generate_debate():
        yield f"data: {json.dumps({'agent': 'system', 'content': 'Starting War Room Session...'})}\n\n"
        await asyncio.sleep(1)
        
        # Financial Analyst
        yield f"data: {json.dumps({'agent': 'Financial Analyst', 'content': 'Analyzing financial implications...'})}\n\n"
        try:
            fin_response = await model.generate_content_async(f"You are a strict Financial Analyst. The user asks: {req.query}. Give a concise 2-sentence financial perspective.")
            yield f"data: {json.dumps({'agent': 'Financial Analyst', 'content': fin_response.text.strip()})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'agent': 'Financial Analyst', 'content': f'Error analyzing data: {repr(e)}'})}\n\n"
            fin_response = None
            
        await asyncio.sleep(1)
        
        # VP of Sales
        yield f"data: {json.dumps({'agent': 'VP of Sales', 'content': 'Reviewing sales pipeline impact...'})}\n\n"
        try:
            sales_response = await model.generate_content_async(f"You are an aggressive VP of Sales. The user asks: {req.query}. Give a concise 2-sentence sales perspective.")
            yield f"data: {json.dumps({'agent': 'VP of Sales', 'content': sales_response.text.strip()})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'agent': 'VP of Sales', 'content': f'Error analyzing data: {repr(e)}'})}\n\n"
            sales_response = None

        await asyncio.sleep(1)
            
        # Synthesizer
        yield f"data: {json.dumps({'agent': 'Synthesizer', 'content': 'Synthesizing final executive summary...'})}\n\n"
        try:
            fin_text = fin_response.text if fin_response else "No financial data."
            sales_text = sales_response.text if sales_response else "No sales data."
            synth_response = await model.generate_content_async(f"Synthesize these perspectives into a final 2-sentence executive summary. Financial: {fin_text}, Sales: {sales_text}. User Query: {req.query}")
            yield f"data: {json.dumps({'agent': 'Synthesizer', 'content': synth_response.text.strip()})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'agent': 'Synthesizer', 'content': f'Error: {repr(e)}'})}\n\n"
            
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate_debate(), media_type="text/event-stream")

@app.delete("/api/integrations/{name}")
def disconnect_integration(name: str, token_data: dict = Depends(get_current_user_token)):
    if token_data.get("role") != "Owner":
        raise HTTPException(status_code=403, detail="Only Owners can disconnect integrations")
    db = SessionLocal()
    try:
        integration = db.query(Integration).filter(Integration.name == name).first()
        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found")
        integration.api_key = None
        integration.status = "disconnected"
        db.commit()
        return {"status": "success", "message": f"{name} disconnected successfully."}
    finally:
        db.close()

@app.post("/api/integrations/sync/{integration_name}")
async def mcp_sync_integration(integration_name: str, token_data: dict = Depends(get_current_user_token)):
    from fastapi.responses import StreamingResponse
    import json
    
    db = SessionLocal()
    try:
        integration = db.query(Integration).filter(Integration.name == integration_name).first()
        if integration:
            integration.last_synced_at = datetime.datetime.utcnow()
            db.commit()
    finally:
        db.close()

    async def generate_sync_logs():
        logs = [
            f"[MCP] Initializing context for {integration_name}...",
            f"[MCP] Resolving connection protocol...",
            f"[{integration_name}] Authenticating via OAuth2...",
            f"[{integration_name}] Connection established securely.",
            f"[{integration_name}] Fetching records from endpoints...",
            f"[{integration_name}] Processing 450 records...",
            f"[MCP] Sync complete! Updating local database..."
        ]
        for log in logs:
            yield f"data: {json.dumps({'log': log})}\n\n"
            await asyncio.sleep(0.8)
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate_sync_logs(), media_type="text/event-stream")


# --- Serve Web UI (React) ---
frontend_path = os.path.join(AGENT_DIR, "frontend-react", "dist")
if os.path.exists(frontend_path):
    from fastapi.responses import FileResponse
    
    # Mount the Vite built assets directory
    assets_path = os.path.join(frontend_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    # Serve the React SPA index for specific routes
    @app.get("/login")
    @app.get("/reset-password")
    @app.get("/dashboard")
    @app.get("/dashboard/{full_path:path}")
    async def serve_react(full_path: str = ""):
        return FileResponse(os.path.join(frontend_path, "index.html"))

# Feature 2: Outbox
@app.get("/api/outbox")
async def get_outbox(token_data: dict = Depends(get_current_user_token)):
    import os
    import glob
    from datetime import datetime
    
    outbox_dir = os.path.join(os.path.dirname(__file__), "outbox")
    if not os.path.exists(outbox_dir):
        return []
        
    files = []
    for fp in glob.glob(os.path.join(outbox_dir, "*.md")):
        with open(fp, "r") as f:
            content = f.read()
        mtime = os.path.getmtime(fp)
        
        # Basic parsing
        subject_line = "Agent Report"
        to_line = "Executive Team"
        for line in content.splitlines():
            if line.startswith("Subject:"):
                subject_line = line.replace("Subject:", "").strip()
            elif line.startswith("To:"):
                to_line = line.replace("To:", "").strip()
                
        files.append({
            "filename": os.path.basename(fp),
            "content": content,
            "subject": subject_line,
            "to": to_line,
            "body": content,
            "modified": datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S"),
            "mtime": mtime
        })
    files.sort(key=lambda x: x["mtime"], reverse=True)
    return files
# Feature 4: Chat History
# Simple in-memory dict for demo purposes
chat_history_db = {}

@app.get("/api/chat/history")
async def get_chat_history(session_id: str, token_data: dict = Depends(get_current_user_token)):
    return chat_history_db.get(session_id, [])

# Patch the existing /api/chat endpoint to save to history


@app.get("/api/analytics")
async def get_analytics():
    import json
    import os
    import random
    from datetime import datetime, timedelta
    
    db_path = os.path.join(os.path.dirname(__file__), "business_data.json")
    try:
        with open(db_path, "r") as f:
            db = json.load(f)
    except FileNotFoundError:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Database not found")

    current_cash = db.get("financials", {}).get("cash_balance", 0)
    current_mrr = db.get("financials", {}).get("monthly_mrr", 0)
    
    data = {"months": [], "cash_flow": [], "mrr": [], "pipeline_value": []}
    
    # Generate 12 months backward from current live data
    # We simulate that the company grew over the past year to reach the CURRENT state
    # So we step backward and reduce the numbers
    
    cash_step = current_cash
    mrr_step = current_mrr
    
    for i in range(11, -1, -1):
        month_date = datetime.now() - timedelta(days=30*i)
        data["months"].append(month_date.strftime("%b %Y"))
        
        # Current month is the live data
        if i == 0:
            data["cash_flow"].append(current_cash)
            data["mrr"].append(current_mrr)
            # Pipeline is roughly 3x MRR
            data["pipeline_value"].append(current_mrr * 3)
        else:
            # Randomly subtract growth for historical months
            mrr_step -= random.randint(1000, 5000)
            cash_step += random.randint(10000, 40000) # cash goes up when looking back if we were burning
            
            data["cash_flow"].append(max(0, cash_step))
            data["mrr"].append(max(0, mrr_step))
            data["pipeline_value"].append(max(0, mrr_step * random.uniform(2.5, 3.5)))
            
    return {"status": "success", "data": data}

@app.post("/feedback")
def collect_feedback(feedback: Feedback) -> dict[str, str]:
    """Collect and log feedback."""
    try:
        logger.log_struct(feedback.model_dump(), severity="INFO")
    except Exception:
        pass
    return {"status": "success"}


# Main execution
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"GLOBAL EXCEPTION: {exc}")
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": str(exc)})
