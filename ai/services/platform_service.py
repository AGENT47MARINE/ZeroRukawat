"""
GigShield — Platform Service
Mock Amazon/Flipkart Partner API.
Reads data from data/mock_platform.json.
"""

import os
import json

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
_platform_data = None


def _load():
    """Lazy-load mock_platform.json."""
    global _platform_data
    if _platform_data is None:
        path = os.path.join(DATA_DIR, "mock_platform.json")
        with open(path) as f:
            _platform_data = json.load(f)
    return _platform_data


def get_hub_status(hub_id: str) -> dict:
    """Get hub operational status. Returns: {hub_id, city, status, capacity}"""
    data = _load()
    hub = data["hubs"].get(hub_id)
    if not hub:
        return {"hub_id": hub_id, "status": "UNKNOWN", "error": "Hub not found"}
    return {"hub_id": hub_id, **hub}


def get_zone_status(zone: str) -> dict:
    """Get zone operational status. Returns: {zone, city, hub_id, status, active_workers}"""
    data = _load()
    zone_data = data["zones"].get(zone)
    if not zone_data:
        return {"zone": zone, "status": "UNKNOWN", "error": "Zone not found"}
    return {"zone": zone, **zone_data}


def get_worker_batches(worker_id: str) -> dict:
    """Get worker's current batch assignments.
    Returns: {worker_id, batch_id, assigned_deliveries, completed_deliveries, gps_movement_score}
    """
    data = _load()
    batch = data["batches"].get(worker_id)
    if not batch:
        return {
            "worker_id": worker_id,
            "batch_id": None,
            "assigned_deliveries": 0,
            "completed_deliveries": 0,
            "gps_movement_score": 0.0,
            "note": "No active batch",
        }
    return {"worker_id": worker_id, **batch}


def get_all_zones() -> dict:
    """Get all zone statuses."""
    data = _load()
    return data["zones"]
