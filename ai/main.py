"""
GigShield — AI Module FastAPI Entry Point
Loads all trained models at startup, exposes 5 API endpoints.
"""

import sys
import os
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure ai/ is on sys.path so models/ and services/ are importable
sys.path.insert(0, os.path.dirname(__file__))

from models.risk_scorer import RiskScorer
from models.fraud_detector import FraudDetector
from models.income_estimator import IncomeEstimator
from models.disruption_detector import DisruptionDetector
from services.payout_service import PayoutService
from services import weather_service, traffic_service, platform_service


# ── Global model instances (loaded at startup) ────────────────────────────
risk_scorer = RiskScorer()
fraud_detector = FraudDetector()
income_estimator = IncomeEstimator()
disruption_detector = DisruptionDetector()
payout_service: PayoutService = None  # type: ignore


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all models at startup."""
    global payout_service
    print("🚀 Loading models …")
    risk_scorer.load()
    fraud_detector.load()
    income_estimator.load()
    payout_service = PayoutService(fraud_detector, income_estimator)
    print("✅ All models loaded. Server ready.")
    yield
    print("🛑 Shutting down.")


app = FastAPI(
    title="GigShield AI",
    description="AI/ML module for parametric insurance payout",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ─────────────────────────────────────────────

class RiskScoreRequest(BaseModel):
    city: str = "Mumbai"
    zone_risk_score: float = Field(ge=0, le=1)
    worker_activity_level: int = Field(ge=0)
    claim_history_count: int = Field(ge=0)
    seasonal_factor: float = Field(ge=0.5, le=1.5)
    weeks_active: int = Field(ge=0)


class FraudCheckRequest(BaseModel):
    event_id: str
    worker_id: str
    gps_movement_score: float = Field(ge=0, le=1)
    deliveries_in_window: int = Field(ge=0)
    claim_frequency_7d: int = Field(ge=0)
    zone_traffic_clear: bool = False


class PayoutCalcRequest(BaseModel):
    avg_weekly_earnings_4w: float = Field(gt=0)
    tier: int = Field(ge=0, le=2)
    day_of_week: int = Field(ge=0, le=6)
    zone_demand_factor: float = Field(ge=0.5, le=2.0)
    seasonal_multiplier: float = Field(ge=0.5, le=2.0)
    disrupted_days: int = Field(ge=1, le=7, default=1)


class ProcessPayoutRequest(BaseModel):
    worker_id: str
    zone: str
    city: str = "Mumbai"
    disrupted_days: int = Field(ge=1, le=7, default=1)
    worker_phone: str = "+919999999999"
    device_token: str = "FCM_TOKEN_PLACEHOLDER"
    upi_id: str = "worker@upi"


# ── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"service": "GigShield AI", "status": "operational"}


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models_loaded": {
            "risk_scorer": risk_scorer.model is not None,
            "fraud_detector": fraud_detector.model is not None,
            "income_estimator": income_estimator.model is not None,
        },
    }


@app.post("/risk-score/{worker_id}")
async def risk_score(worker_id: str, req: RiskScoreRequest):
    """Risk Scorer — assigns worker to Bronze/Silver/Gold tier."""
    result = risk_scorer.predict(req.model_dump())
    return {"worker_id": worker_id, **result}


@app.get("/disruption-status/{zone}")
async def disruption_status(zone: str):
    """Disruption Detector — check if zone has active disruptions."""
    # Gather live data for the zone
    # Extract city from zone name (e.g. MUM_ZONE_1 → Mumbai)
    zone_prefix = zone.split("_")[0] if "_" in zone else zone
    city_map = {
        "MUM": "Mumbai", "DEL": "Delhi", "BAN": "Bangalore", "HYD": "Hyderabad",
        "CHE": "Chennai", "KOL": "Kolkata", "PUN": "Pune", "AHM": "Ahmedabad",
        "JAI": "Jaipur", "LUC": "Lucknow",
    }
    city = city_map.get(zone_prefix, "Mumbai")

    weather = await weather_service.get_weather(city)
    zone_info = platform_service.get_zone_status(zone)
    hub_id = zone_info.get("hub_id", f"HUB_{zone_prefix}_01")
    hub_info = platform_service.get_hub_status(hub_id)

    aqi_path = os.path.join(os.path.dirname(__file__), "data", "mock_aqi.json")
    with open(aqi_path) as f:
        aqi_data = json.load(f)
    aqi = aqi_data.get(city, {}).get("aqi", 100)

    zone_data = {
        "rainfall": weather["rainfall"],
        "temperature": weather["temperature"],
        "visibility": weather["visibility"],
        "aqi": aqi,
        "hub_status": hub_info.get("status", "ACTIVE"),
        "zone_status": zone_info.get("status", "ACTIVE"),
        "curfew_declared": False,
    }

    disruptions = disruption_detector.check(zone, zone_data)
    return {"zone": zone, "city": city, "zone_data": zone_data, "disruptions": disruptions}


@app.post("/validate-claim")
async def validate_claim(req: FraudCheckRequest):
    """Fraud Detector — validate a claim before payout."""
    result = fraud_detector.validate_claim(
        event_id=req.event_id,
        worker_id=req.worker_id,
        features={
            "gps_movement_score": req.gps_movement_score,
            "deliveries_in_window": req.deliveries_in_window,
            "claim_frequency_7d": req.claim_frequency_7d,
            "zone_traffic_clear": req.zone_traffic_clear,
            "is_duplicate_event": False,
        },
    )
    return {"worker_id": req.worker_id, "event_id": req.event_id, **result}


@app.post("/calculate-payout")
async def calculate_payout(req: PayoutCalcRequest):
    """Income Estimator — calculate exact payout amount."""
    result = income_estimator.predict(
        features={
            "avg_weekly_earnings_4w": req.avg_weekly_earnings_4w,
            "tier": req.tier,
            "day_of_week": req.day_of_week,
            "zone_demand_factor": req.zone_demand_factor,
            "seasonal_multiplier": req.seasonal_multiplier,
        },
        disrupted_days=req.disrupted_days,
    )
    return result


@app.post("/process-payout")
async def process_payout(req: ProcessPayoutRequest):
    """Full orchestration pipeline — end-to-end payout processing."""
    result = await payout_service.process_payout(
        worker_id=req.worker_id,
        zone=req.zone,
        city=req.city,
        disrupted_days=req.disrupted_days,
        worker_phone=req.worker_phone,
        device_token=req.device_token,
        upi_id=req.upi_id,
    )
    return result
