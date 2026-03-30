"""
Tests for FraudDetector — normal passes, fraud flagged, duplicate blocked.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from models.fraud_detector import FraudDetector


@pytest.fixture
def detector():
    fd = FraudDetector().load()
    return fd


class TestFraudScoring:
    def test_normal_worker_passes(self, detector):
        """Idle worker during disruption should pass."""
        result = detector.predict({
            "gps_movement_score": 0.1,
            "deliveries_in_window": 0,
            "claim_frequency_7d": 1,
            "zone_traffic_clear": False,
            "is_duplicate_event": False,
        })
        assert result["is_flagged"] is False
        assert result["fraud_score"] < 0.7

    def test_suspicious_worker_flagged(self, detector):
        """Active worker making deliveries during disruption should be flagged."""
        result = detector.predict({
            "gps_movement_score": 0.9,
            "deliveries_in_window": 8,
            "claim_frequency_7d": 5,
            "zone_traffic_clear": True,
            "is_duplicate_event": False,
        })
        assert result["is_flagged"] is True
        assert result["fraud_score"] > 0.7

    def test_fraud_reasons_populated(self, detector):
        """Suspicious activity should produce human-readable reasons."""
        result = detector.predict({
            "gps_movement_score": 0.8,
            "deliveries_in_window": 5,
            "claim_frequency_7d": 4,
            "zone_traffic_clear": True,
            "is_duplicate_event": False,
        })
        assert len(result["reasons"]) > 0


class TestDuplicatePrevention:
    def test_no_duplicate_initially(self, detector):
        assert detector.check_duplicate("EVT_001", "W0001") is False

    def test_duplicate_after_record(self, detector):
        detector.record_event("EVT_002", "W0001")
        assert detector.check_duplicate("EVT_002", "W0001") is True

    def test_different_worker_not_duplicate(self, detector):
        detector.record_event("EVT_003", "W0001")
        assert detector.check_duplicate("EVT_003", "W0002") is False


class TestValidateClaim:
    def test_duplicate_blocked(self, detector):
        detector.record_event("EVT_DUP", "W0001")
        result = detector.validate_claim("EVT_DUP", "W0001", {
            "gps_movement_score": 0.1,
            "deliveries_in_window": 0,
            "claim_frequency_7d": 1,
            "zone_traffic_clear": False,
        })
        assert result["is_flagged"] is True
        assert result["blocked_reason"] == "duplicate_event"

    def test_new_claim_passes(self, detector):
        result = detector.validate_claim("EVT_NEW", "W0099", {
            "gps_movement_score": 0.1,
            "deliveries_in_window": 0,
            "claim_frequency_7d": 0,
            "zone_traffic_clear": False,
        })
        assert result["is_flagged"] is False
