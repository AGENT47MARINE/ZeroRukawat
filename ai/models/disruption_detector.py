"""
GigShield — Disruption Detector
Rule-based threshold monitor — no training, no artifact.
Runs every 15 min via Celery beat per active zone.
"""

from datetime import datetime


# Disruption thresholds (from ai_context.md)
THRESHOLDS = {
    "heavy_rain":       {"field": "rainfall",         "op": ">",  "value": 15},
    "extreme_heat":     {"field": "temperature",      "op": ">",  "value": 43},
    "dense_fog":        {"field": "visibility",       "op": "<",  "value": 100},
    "severe_aqi":       {"field": "aqi",              "op": ">",  "value": 300},
    "warehouse_strike": {"field": "hub_status",       "op": "==", "value": "CLOSED"},
    "zone_closure":     {"field": "zone_status",      "op": "==", "value": "INACTIVE"},
    "curfew":           {"field": "curfew_declared",  "op": "==", "value": True},
}


def _compare(actual, op, threshold):
    """Apply a comparison operator."""
    if op == ">":
        return actual > threshold
    elif op == "<":
        return actual < threshold
    elif op == "==":
        return actual == threshold
    return False


def _generate_event_id(zone: str, disruption_type: str) -> str:
    """Format: {ZONE}_{DATE}_{TYPE}_{HHMM}  e.g. MUM_ZONE_1_20250315_RAIN_1420"""
    now = datetime.now()
    type_short = {
        "heavy_rain": "RAIN",
        "extreme_heat": "HEAT",
        "dense_fog": "FOG",
        "severe_aqi": "AQI",
        "warehouse_strike": "STRIKE",
        "zone_closure": "CLOSURE",
        "curfew": "CURFEW",
    }.get(disruption_type, "UNK")

    return f"{zone}_{now.strftime('%Y%m%d')}_{type_short}_{now.strftime('%H%M')}"


class DisruptionDetector:
    """Stateless rule-based detector. No model loading needed."""

    def check(self, zone: str, zone_data: dict) -> list[dict]:
        """
        zone_data keys: rainfall, temperature, visibility, aqi,
                        hub_status, zone_status, curfew_declared

        Returns list of triggered disruptions (can be multiple).
        Each: {"triggered": True, "type": str, "event_id": str, "zone": str}
        """
        triggered = []

        for disruption_type, rule in THRESHOLDS.items():
            field = rule["field"]
            if field not in zone_data:
                continue
            actual = zone_data[field]
            if _compare(actual, rule["op"], rule["value"]):
                triggered.append({
                    "triggered": True,
                    "type": disruption_type,
                    "event_id": _generate_event_id(zone, disruption_type),
                    "zone": zone,
                    "actual_value": actual,
                    "threshold": f"{rule['op']} {rule['value']}",
                })

        if not triggered:
            return [{"triggered": False, "type": None, "event_id": None, "zone": zone}]

        return triggered

    def check_single(self, zone: str, zone_data: dict) -> dict:
        """Convenience: return the first (highest-priority) disruption or no-trigger."""
        results = self.check(zone, zone_data)
        return results[0]
