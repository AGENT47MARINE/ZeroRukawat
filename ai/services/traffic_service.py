"""
GigShield — Traffic Service
Google Traffic API mock (rule-based random data).
"""

import random


# Simulated congestion data per zone type
def get_traffic(zone: str) -> dict:
    """
    Returns mock traffic data for a zone.
    In production, this would call Google Maps Traffic API.

    Returns: {zone, congestion_level (0-1), road_clear (bool),
              avg_speed_kmh, incidents}
    """
    # Seed based on zone name for consistency within a session
    zone_hash = hash(zone) % 100

    if zone_hash < 20:
        # Heavy congestion
        congestion = round(random.uniform(0.7, 1.0), 2)
        road_clear = False
        avg_speed = random.randint(5, 15)
        incidents = random.randint(1, 3)
    elif zone_hash < 60:
        # Moderate
        congestion = round(random.uniform(0.3, 0.7), 2)
        road_clear = False
        avg_speed = random.randint(15, 35)
        incidents = random.randint(0, 1)
    else:
        # Clear roads
        congestion = round(random.uniform(0.0, 0.3), 2)
        road_clear = True
        avg_speed = random.randint(35, 60)
        incidents = 0

    return {
        "zone": zone,
        "congestion_level": congestion,
        "road_clear": road_clear,
        "avg_speed_kmh": avg_speed,
        "incidents": incidents,
        "source": "mock",
    }
