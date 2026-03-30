"""
Tests for the payout pipeline — integration test: disruption → fraud → income → cap.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from models.disruption_detector import DisruptionDetector
from models.fraud_detector import FraudDetector
from models.income_estimator import IncomeEstimator


@pytest.fixture
def detector():
    return DisruptionDetector()


@pytest.fixture
def fraud():
    return FraudDetector().load()


@pytest.fixture
def estimator():
    return IncomeEstimator().load()


class TestPipelineIntegration:
    def test_full_pipeline_passes(self, detector, fraud, estimator):
        """A legitimate claim should pass all stages and produce a payout."""
        # Step 1: disruption
        zone_data = {
            "rainfall": 22.0, "temperature": 30.0, "visibility": 3000,
            "aqi": 100, "hub_status": "ACTIVE", "zone_status": "ACTIVE",
            "curfew_declared": False,
        }
        disruptions = detector.check("MUM_ZONE_1", zone_data)
        triggered = [d for d in disruptions if d["triggered"]]
        assert len(triggered) > 0
        event_id = triggered[0]["event_id"]

        # Step 2: fraud check
        fraud_result = fraud.validate_claim(event_id, "W0001", {
            "gps_movement_score": 0.1,
            "deliveries_in_window": 0,
            "claim_frequency_7d": 0,
            "zone_traffic_clear": False,
        })
        assert fraud_result["is_flagged"] is False

        # Step 3: income estimation
        payout = estimator.predict({
            "avg_weekly_earnings_4w": 5000.0,
            "tier": 1,
            "day_of_week": 3,
            "zone_demand_factor": 1.0,
            "seasonal_multiplier": 1.0,
        }, disrupted_days=1)
        assert payout["payout"] > 0
        assert payout["estimated_daily_income"] > 0

    def test_pipeline_blocks_fraud(self, detector, fraud, estimator):
        """A fraudulent claim should be blocked at fraud detection."""
        zone_data = {
            "rainfall": 22.0, "temperature": 30.0, "visibility": 3000,
            "aqi": 100, "hub_status": "ACTIVE", "zone_status": "ACTIVE",
            "curfew_declared": False,
        }
        disruptions = detector.check("MUM_ZONE_1", zone_data)
        triggered = [d for d in disruptions if d["triggered"]]
        event_id = triggered[0]["event_id"]

        fraud_result = fraud.validate_claim(event_id, "W0099", {
            "gps_movement_score": 0.95,
            "deliveries_in_window": 10,
            "claim_frequency_7d": 6,
            "zone_traffic_clear": True,
        })
        assert fraud_result["is_flagged"] is True


class TestPayoutCaps:
    def test_bronze_cap(self, estimator):
        payout = estimator.predict({
            "avg_weekly_earnings_4w": 10000.0,  # Very high
            "tier": 0,  # Bronze
            "day_of_week": 1,
            "zone_demand_factor": 1.3,
            "seasonal_multiplier": 1.2,
        }, disrupted_days=5)
        assert payout["payout"] <= 2450
        assert payout["capped"] is True

    def test_silver_cap(self, estimator):
        payout = estimator.predict({
            "avg_weekly_earnings_4w": 10000.0,
            "tier": 1,  # Silver
            "day_of_week": 1,
            "zone_demand_factor": 1.3,
            "seasonal_multiplier": 1.2,
        }, disrupted_days=5)
        assert payout["payout"] <= 3850

    def test_gold_cap(self, estimator):
        payout = estimator.predict({
            "avg_weekly_earnings_4w": 10000.0,
            "tier": 2,  # Gold
            "day_of_week": 1,
            "zone_demand_factor": 1.3,
            "seasonal_multiplier": 1.2,
        }, disrupted_days=5)
        assert payout["payout"] <= 6300

    def test_payout_formula(self, estimator):
        """Verify payout = daily_income × 0.70 × disrupted_days (before cap)."""
        payout = estimator.predict({
            "avg_weekly_earnings_4w": 4000.0,
            "tier": 0,
            "day_of_week": 3,
            "zone_demand_factor": 1.0,
            "seasonal_multiplier": 1.0,
        }, disrupted_days=1)
        expected_raw = round(payout["estimated_daily_income"] * 0.70 * 1, 2)
        assert abs(payout["raw_payout"] - expected_raw) < 0.01
