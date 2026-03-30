"""
Tests for DisruptionDetector — all 7 threshold triggers + no-trigger + event ID format.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from models.disruption_detector import DisruptionDetector


@pytest.fixture
def detector():
    return DisruptionDetector()


def _base_data(**overrides):
    """Normal zone data with no triggers."""
    data = {
        "rainfall": 5.0,
        "temperature": 30.0,
        "visibility": 5000,
        "aqi": 100,
        "hub_status": "ACTIVE",
        "zone_status": "ACTIVE",
        "curfew_declared": False,
    }
    data.update(overrides)
    return data


class TestNoTrigger:
    def test_no_disruption(self, detector):
        result = detector.check_single("TEST_ZONE", _base_data())
        assert result["triggered"] is False
        assert result["type"] is None


class TestThresholdTriggers:
    def test_heavy_rain(self, detector):
        result = detector.check_single("MUM_ZONE_1", _base_data(rainfall=20.0))
        assert result["triggered"] is True
        assert result["type"] == "heavy_rain"

    def test_extreme_heat(self, detector):
        result = detector.check_single("DEL_ZONE_1", _base_data(temperature=45.0))
        assert result["triggered"] is True
        assert result["type"] == "extreme_heat"

    def test_dense_fog(self, detector):
        result = detector.check_single("LUC_ZONE_1", _base_data(visibility=50))
        assert result["triggered"] is True
        assert result["type"] == "dense_fog"

    def test_severe_aqi(self, detector):
        result = detector.check_single("DEL_ZONE_2", _base_data(aqi=350))
        assert result["triggered"] is True
        assert result["type"] == "severe_aqi"

    def test_warehouse_strike(self, detector):
        result = detector.check_single("MUM_ZONE_1", _base_data(hub_status="CLOSED"))
        assert result["triggered"] is True
        assert result["type"] == "warehouse_strike"

    def test_zone_closure(self, detector):
        result = detector.check_single("BAN_ZONE_1", _base_data(zone_status="INACTIVE"))
        assert result["triggered"] is True
        assert result["type"] == "zone_closure"

    def test_curfew(self, detector):
        result = detector.check_single("KOL_ZONE_1", _base_data(curfew_declared=True))
        assert result["triggered"] is True
        assert result["type"] == "curfew"


class TestMultipleTriggers:
    def test_rain_and_fog(self, detector):
        results = detector.check("MUM_ZONE_1", _base_data(rainfall=20.0, visibility=50))
        triggered = [r for r in results if r["triggered"]]
        types = {r["type"] for r in triggered}
        assert "heavy_rain" in types
        assert "dense_fog" in types
        assert len(triggered) == 2


class TestEventId:
    def test_event_id_format(self, detector):
        result = detector.check_single("MUM_ZONE_1", _base_data(rainfall=20.0))
        event_id = result["event_id"]
        # Format: MUM_ZONE_1_YYYYMMDD_RAIN_HHMMSS
        parts = event_id.split("_")
        assert parts[0] == "MUM"
        assert parts[1] == "ZONE"
        assert parts[2] == "1"
        assert len(parts[3]) == 8  # YYYYMMDD
        assert parts[4] == "RAIN"
        assert len(parts[5]) == 6  # HHMMSS

    def test_boundary_no_trigger(self, detector):
        """Exactly at threshold should NOT trigger (> not >=)."""
        result = detector.check_single("TEST_ZONE", _base_data(rainfall=15.0))
        assert result["triggered"] is False
