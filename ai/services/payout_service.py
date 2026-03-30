"""
GigShield — Payout Service
Orchestrates the full payout pipeline:
  Disruption Detector → Fraud Detector → Income Estimator → Razorpay → Notify
"""

import os
import json
import random
import pandas as pd
from datetime import datetime

from models.disruption_detector import DisruptionDetector
from models.fraud_detector import FraudDetector
from models.income_estimator import IncomeEstimator
from services import weather_service, traffic_service, platform_service, notification_service

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def _load_mock_aqi() -> dict:
    path = os.path.join(DATA_DIR, "mock_aqi.json")
    with open(path) as f:
        return json.load(f)


def _load_worker_profiles() -> dict:
    """FIX #5: Load worker profiles from CSV for deterministic lookups."""
    path = os.path.join(DATA_DIR, "synthetic_workers.csv")
    df = pd.read_csv(path)
    return {row["worker_id"]: row.to_dict() for _, row in df.iterrows()}


def _load_latest_earnings() -> dict:
    """FIX #5: Load latest earnings per worker from batch history."""
    path = os.path.join(DATA_DIR, "synthetic_batch_history.csv")
    df = pd.read_csv(path)
    # Get the latest avg_weekly_earnings_4w per worker
    latest = df.sort_values("date").groupby("worker_id").last().reset_index()
    return {
        row["worker_id"]: {
            "avg_weekly_earnings_4w": row["avg_weekly_earnings_4w"],
            "zone_demand_factor": row["zone_demand_factor"],
            "seasonal_multiplier": row["seasonal_multiplier"],
        }
        for _, row in latest.iterrows()
    }


# ── Razorpay stub ──────────────────────────────────────────────────────
def _razorpay_payout(worker_id: str, upi_id: str, amount: float) -> dict:
    """
    Razorpay sandbox payout stub.
    In production, this calls Razorpay Payouts API.
    """
    txn_id = f"TXN_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"
    print(f"💳 [Razorpay → {upi_id}] ₹{amount:.2f} (txn: {txn_id})")

    return {
        "status": "processed",
        "transaction_id": txn_id,
        "amount": amount,
        "upi_id": upi_id,
        "worker_id": worker_id,
    }


class PayoutService:
    """Orchestrates the end-to-end payout pipeline."""

    def __init__(self, fraud_detector: FraudDetector, income_estimator: IncomeEstimator):
        self.disruption_detector = DisruptionDetector()
        self.fraud_detector = fraud_detector
        self.income_estimator = income_estimator
        self.aqi_data = _load_mock_aqi()
        self.worker_profiles = _load_worker_profiles()
        self.worker_earnings = _load_latest_earnings()

    async def process_payout(self, worker_id: str, zone: str, city: str,
                              disrupted_days: int = 1,
                              worker_phone: str = "+919999999999",
                              device_token: str = "FCM_TOKEN_PLACEHOLDER",
                              upi_id: str = "worker@upi") -> dict:
        """
        Full pipeline:
        1. Gather zone data (weather + AQI + platform)
        2. Disruption Detector → get event_id
        3. Check duplicate store → block if dup
        4. Fraud Detector → block if score > 0.7
        5. Income Estimator → calculate payout
        6. Razorpay sandbox → credit UPI
        7. Store event in duplicate store
        8. Send WhatsApp + FCM notification
        """
        result = {
            "worker_id": worker_id,
            "zone": zone,
            "city": city,
            "timestamp": datetime.now().isoformat(),
            "steps": [],
        }

        # ── Step 1: Gather zone data ──────────────────────────────────
        weather = await weather_service.get_weather(city)
        zone_status = platform_service.get_zone_status(zone)
        hub_id = zone_status.get("hub_id", f"HUB_{city[:3].upper()}_01")
        hub_status = platform_service.get_hub_status(hub_id)
        aqi = self.aqi_data.get(city, {}).get("aqi", 100)

        zone_data = {
            "rainfall": weather["rainfall"],
            "temperature": weather["temperature"],
            "visibility": weather["visibility"],
            "aqi": aqi,
            "hub_status": hub_status.get("status", "ACTIVE"),
            "zone_status": zone_status.get("status", "ACTIVE"),
            "curfew_declared": False,  # No live curfew API
        }
        result["zone_data"] = zone_data
        result["steps"].append({"step": "gather_data", "status": "done"})

        # ── Step 2: Disruption detection ──────────────────────────────
        disruptions = self.disruption_detector.check(zone, zone_data)
        active_disruption = next((d for d in disruptions if d["triggered"]), None)

        if not active_disruption:
            result["status"] = "no_disruption"
            result["steps"].append({"step": "disruption_check", "status": "no_trigger"})
            return result

        event_id = active_disruption["event_id"]
        result["disruption"] = active_disruption
        result["steps"].append({"step": "disruption_check", "status": "triggered",
                                 "type": active_disruption["type"]})

        # ── Step 3: Duplicate check ───────────────────────────────────
        if self.fraud_detector.check_duplicate(event_id, worker_id):
            result["status"] = "blocked_duplicate"
            result["steps"].append({"step": "duplicate_check", "status": "blocked"})
            return result
        result["steps"].append({"step": "duplicate_check", "status": "passed"})

        # ── Step 4: Fraud scoring ─────────────────────────────────────
        worker_batch = platform_service.get_worker_batches(worker_id)
        traffic = traffic_service.get_traffic(zone)

        fraud_features = {
            "gps_movement_score": worker_batch.get("gps_movement_score", 0.0),
            "deliveries_in_window": worker_batch.get("completed_deliveries", 0),
            "claim_frequency_7d": random.randint(0, 2),  # Mock
            "zone_traffic_clear": traffic["road_clear"],
            "is_duplicate_event": False,
        }

        fraud_result = self.fraud_detector.predict(fraud_features)
        result["fraud_check"] = fraud_result

        if fraud_result["is_flagged"]:
            result["status"] = "blocked_fraud"
            result["steps"].append({"step": "fraud_check", "status": "flagged",
                                     "score": fraud_result["fraud_score"]})
            return result
        result["steps"].append({"step": "fraud_check", "status": "passed",
                                 "score": fraud_result["fraud_score"]})

        # ── Step 5: Income estimation ─────────────────────────────────
        # FIX #5: Load tier and earnings from worker profiles, not random
        worker_profile = self.worker_profiles.get(worker_id, {})
        worker_earn = self.worker_earnings.get(worker_id, {})

        tier = int(worker_profile.get("tier", 1))
        avg_earnings = float(worker_earn.get("avg_weekly_earnings_4w", 5000.0))

        income_features = {
            "avg_weekly_earnings_4w": avg_earnings,
            "tier": tier,
            "day_of_week": datetime.now().weekday(),
            "zone_demand_factor": float(worker_earn.get("zone_demand_factor", 1.0)),
            "seasonal_multiplier": float(worker_earn.get("seasonal_multiplier", 1.0)),
        }

        payout_result = self.income_estimator.predict(income_features, disrupted_days)
        result["payout_calculation"] = payout_result
        result["steps"].append({"step": "income_estimation", "status": "done",
                                 "payout": payout_result["payout"]})

        # ── Step 6: Razorpay payout ───────────────────────────────────
        payment = _razorpay_payout(worker_id, upi_id, payout_result["payout"])
        result["payment"] = payment
        result["steps"].append({"step": "razorpay_payout", "status": payment["status"]})

        # ── Step 7: Record event (duplicate prevention) ───────────────
        self.fraud_detector.record_event(event_id, worker_id)
        result["steps"].append({"step": "record_event", "status": "done"})

        # ── Step 8: Notifications ─────────────────────────────────────
        notif = notification_service.notify_payout(
            worker_phone=worker_phone,
            device_token=device_token,
            payout_amount=payout_result["payout"],
            disruption_type=active_disruption["type"],
            zone=zone,
        )
        result["notifications"] = notif
        result["steps"].append({"step": "notifications", "status": "sent"})

        result["status"] = "payout_complete"
        return result
