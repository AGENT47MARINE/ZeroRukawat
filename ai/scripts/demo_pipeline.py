"""
GigShield — Demo Pipeline
End-to-end hackathon demo: simulates a Mumbai monsoon scenario.
Run: python scripts/demo_pipeline.py
"""

import sys
import os
import asyncio

# Add ai/ to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.risk_scorer import RiskScorer
from models.disruption_detector import DisruptionDetector
from models.fraud_detector import FraudDetector
from models.income_estimator import IncomeEstimator
from services.payout_service import PayoutService


def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")


def print_step(n, text):
    print(f"\n  ▶ Step {n}: {text}")
    print(f"  {'-'*50}")


async def run_demo():
    print_header("GigShield — Mumbai Monsoon Demo")
    print("  Scenario: Heavy rainfall hits Mumbai Zone 1")
    print("  Worker W0001 is idle, expecting payout.")

    # ── Load models ───────────────────────────────────────────────
    print_step(1, "Loading trained models")
    risk_scorer = RiskScorer().load()
    fraud_detector = FraudDetector().load()
    income_estimator = IncomeEstimator().load()
    print("  ✓ All models loaded")

    # ── Risk Scoring (onboarding) ─────────────────────────────────
    print_step(2, "Risk scoring for worker W0001")
    worker_features = {
        "city": "Mumbai",
        "zone_risk_score": 0.85,
        "worker_activity_level": 45,
        "claim_history_count": 1,
        "seasonal_factor": 1.1,
        "weeks_active": 24,
    }
    tier_result = risk_scorer.predict(worker_features)
    print(f"  Tier: {tier_result['tier_label']} (tier={tier_result['tier']})")
    print(f"  Premium: ₹{tier_result['adjusted_premium']}/week")

    # ── Disruption Detection ──────────────────────────────────────
    print_step(3, "Checking disruption for MUM_ZONE_1")
    detector = DisruptionDetector()
    zone_data = {
        "rainfall": 25.0,       # Heavy rain > 15mm/hr
        "temperature": 30.0,
        "visibility": 2000,
        "aqi": 150,
        "hub_status": "ACTIVE",
        "zone_status": "ACTIVE",
        "curfew_declared": False,
    }
    disruptions = detector.check("MUM_ZONE_1", zone_data)
    for d in disruptions:
        if d["triggered"]:
            print(f"  🚨 DISRUPTION: {d['type']}  (event: {d['event_id']})")
            print(f"     Actual: {d['actual_value']}  Threshold: {d['threshold']}")
        else:
            print("  ✓ No disruption detected")

    event_id = disruptions[0]["event_id"] if disruptions[0]["triggered"] else "NONE"

    # ── Fraud Detection ───────────────────────────────────────────
    print_step(4, "Fraud check for W0001")
    fraud_features = {
        "gps_movement_score": 0.1,   # Idle — legitimate
        "deliveries_in_window": 0,
        "claim_frequency_7d": 1,
        "zone_traffic_clear": False,
        "is_duplicate_event": False,
    }
    fraud_result = fraud_detector.predict(fraud_features)
    status = "🚫 FLAGGED" if fraud_result["is_flagged"] else "✅ PASSED"
    print(f"  Fraud score: {fraud_result['fraud_score']:.3f}  → {status}")

    # ── Income Estimation & Payout ────────────────────────────────
    print_step(5, "Calculating payout")
    income_features = {
        "avg_weekly_earnings_4w": 5500.0,
        "tier": tier_result["tier"],
        "day_of_week": 2,  # Wednesday
        "zone_demand_factor": 1.1,
        "seasonal_multiplier": 1.0,
    }
    payout = income_estimator.predict(income_features, disrupted_days=1)
    print(f"  Estimated daily income: ₹{payout['estimated_daily_income']:.2f}")
    print(f"  Coverage rate: {payout['coverage_rate']*100:.0f}%")
    print(f"  Raw payout: ₹{payout['raw_payout']:.2f}")
    print(f"  Weekly cap ({['Bronze','Silver','Gold'][tier_result['tier']]}): ₹{payout['weekly_cap']}")
    print(f"  Final payout: ₹{payout['payout']:.2f}" + (" (CAPPED)" if payout["capped"] else ""))

    # ── Full Pipeline (payout_service) ────────────────────────────
    print_step(6, "Running full payout pipeline")
    payout_svc = PayoutService(fraud_detector, income_estimator)
    result = await payout_svc.process_payout(
        worker_id="W0001",
        zone="MUM_ZONE_1",
        city="Mumbai",
        disrupted_days=1,
        worker_phone="+919876543210",
        device_token="FCM_DEMO_TOKEN_12345",
        upi_id="w0001@upi",
    )
    print(f"\n  Pipeline status: {result['status']}")
    print(f"  Steps completed:")
    for step in result["steps"]:
        print(f"    {step['step']}: {step['status']}")

    if result["status"] == "payout_complete":
        print(f"\n  💰 Payment: ₹{result['payout_calculation']['payout']:.2f}")
        print(f"  🔖 Transaction: {result['payment']['transaction_id']}")

    print_header("Demo Complete ✅")


if __name__ == "__main__":
    asyncio.run(run_demo())
