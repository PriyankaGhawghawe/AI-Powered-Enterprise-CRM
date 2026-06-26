from sqlalchemy import Column, Integer, JSON, String, DateTime, Boolean
from app.database import Base
import datetime

class BusinessState(Base):
    __tablename__ = "business_state"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(JSON, nullable=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'Owner', 'Manager', 'Employee'
    requires_password_reset = Column(Boolean, default=True)
    token_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # e.g. 'stripe', 'salesforce'
    status = Column(String, default='disconnected') # 'disconnected', 'connected'
    api_key = Column(String, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)

class SalesDeal(Base):
    __tablename__ = "sales_deals"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    value = Column(Integer, nullable=False)
    stage = Column(String, nullable=False)
    probability = Column(Integer, nullable=False) # actually float but keeping it simple or we can use Float
    owner = Column(String, nullable=False)
    age_days = Column(Integer, nullable=False)

class Competitor(Base):
    __tablename__ = "competitors"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    market_share = Column(String, nullable=False)
    pricing = Column(String, nullable=False)
    strengths = Column(String, nullable=False)
    weaknesses = Column(String, nullable=False)

class HistoricalPerformance(Base):
    __tablename__ = "historical_performance"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    month = Column(String, nullable=False)
    revenue = Column(Integer, nullable=False)
    expenses = Column(Integer, nullable=False)

class RegulatoryRisk(Base):
    __tablename__ = "regulatory_risks"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    risk_area = Column(String, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    mitigation = Column(String, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    target = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Success")

class ComplianceChecklist(Base):
    __tablename__ = "compliance_checklist"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    item = Column(String, nullable=False)
    status = Column(String, nullable=False)

class BusinessMetric(Base):
    __tablename__ = "business_metrics"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False) # String can hold numbers, or we can use JSON if needed

class PinnedChart(Base):
    __tablename__ = "pinned_charts"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    sql = Column(String, nullable=False)
    chart_type = Column(String, nullable=False)
    x_axis = Column(String, nullable=False)
    y_axis = Column(String, nullable=False)
    pinned_by = Column(String, nullable=False)
    date_pinned = Column(DateTime, default=datetime.datetime.utcnow)
