"""
GigShield — Synthetic Data Generator
Run once to populate ai/data/ with all training and mock data files.
"""

import os
import json
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# ── Indian cities used across the project ──────────────────────────────────
CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
    "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
]

ZONES_PER_CITY = {
    city: [f"{city[:3].upper()}_ZONE_{i}" for i in range(1, 4)]
    for city in CITIES
}


# ═══════════════════════════════════════════════════════════════════════════
# 1. synthetic_workers.csv  (risk scorer + fraud detector training)
# ═══════════════════════════════════════════════════════════════════════════
def generate_workers(n=200):
    rows = []
    for i in range(1, n + 1):
        city = random.choice(CITIES)
        zone_risk = round(random.uniform(0.1, 0.95), 2)
        activity = random.randint(15, 80)          # deliveries / week
        claims = random.randint(0, 12)
        seasonal = round(random.uniform(0.8, 1.2), 2)
        weeks = random.randint(4, 104)

        # FIX #3: Rebalanced tier thresholds → ~40% Bronze / 35% Silver / 25% Gold
        score = activity * 0.4 - claims * 2 + zone_risk * 8 + weeks * 0.15
        if score > 28:
            tier = 2   # Gold
        elif score > 20:
            tier = 1   # Silver
        else:
            tier = 0   # Bronze

        rows.append({
            "worker_id": f"W{i:04d}",
            "city": city,
            "zone_risk_score": zone_risk,
            "worker_activity_level": activity,
            "claim_history_count": claims,
            "seasonal_factor": seasonal,
            "weeks_active": weeks,
            "tier": tier,
        })

    df = pd.DataFrame(rows)
    dist = df["tier"].value_counts().sort_index()
    path = os.path.join(DATA_DIR, "synthetic_workers.csv")
    df.to_csv(path, index=False)
    print(f"✓ {path}  ({len(df)} workers)")
    print(f"  Tier distribution: Bronze={dist.get(0,0)} Silver={dist.get(1,0)} Gold={dist.get(2,0)}")
    return df


# ═══════════════════════════════════════════════════════════════════════════
# 2. synthetic_batch_history.csv  (income estimator training)
# ═══════════════════════════════════════════════════════════════════════════
def generate_batch_history(workers_df, days=28):
    rows = []
    start = datetime(2025, 2, 1)

    for _, w in workers_df.iterrows():
        daily_earnings_list = []
        for d in range(days):
            date = start + timedelta(days=d)
            dow = date.weekday()

            # Base earning varies by tier
            base = {0: 550, 1: 850, 2: 1200}[w["tier"]]
            demand = round(random.uniform(0.8, 1.3), 2)
            seasonal = round(random.uniform(0.8, 1.2), 2)

            # FIX #9: Weekend earnings boost (15-20%)
            weekend_mult = 1.0
            if dow in (5, 6):  # Saturday, Sunday
                weekend_mult = round(random.uniform(1.15, 1.20), 2)

            daily = round(base * demand * seasonal * weekend_mult + random.gauss(0, 50), 2)
            daily = max(daily, 100)  # floor

            # FIX #2: avg_weekly_earnings_4w uses only PREVIOUS days (exclude current day)
            # This prevents data leakage where the target is embedded in the feature
            if len(daily_earnings_list) > 0:
                window = daily_earnings_list[-28:]  # last 28 days, excluding today
                avg_4w = round(np.mean(window), 2)
            else:
                avg_4w = round(daily * 0.95, 2)  # first day: slight underestimate

            daily_earnings_list.append(daily)

            rows.append({
                "worker_id": w["worker_id"],
                "date": date.strftime("%Y-%m-%d"),
                "daily_earnings": daily,
                "tier": w["tier"],
                "day_of_week": dow,
                "zone_demand_factor": demand,
                "seasonal_multiplier": seasonal,
                "avg_weekly_earnings_4w": avg_4w,
            })

    df = pd.DataFrame(rows)
    path = os.path.join(DATA_DIR, "synthetic_batch_history.csv")
    df.to_csv(path, index=False)
    print(f"✓ {path}  ({len(df)} rows)")
    return df


# ═══════════════════════════════════════════════════════════════════════════
# 3. city_disruption_history.json
# ═══════════════════════════════════════════════════════════════════════════
def generate_disruption_history():
    data = {}
    for city in CITIES:
        zones = ZONES_PER_CITY[city]
        data[city] = {
            zone: {
                "risk_score": round(random.uniform(0.2, 0.9), 2),
                "avg_disruptions_per_month": random.randint(1, 8),
                "common_types": random.sample(
                    ["heavy_rain", "extreme_heat", "dense_fog",
                     "severe_aqi", "warehouse_strike", "zone_closure", "curfew"],
                    k=random.randint(1, 3),
                ),
            }
            for zone in zones
        }

    path = os.path.join(DATA_DIR, "city_disruption_history.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"✓ {path}")


# ═══════════════════════════════════════════════════════════════════════════
# 4. mock_aqi.json
# ═══════════════════════════════════════════════════════════════════════════
def generate_mock_aqi():
    data = {
        city: {
            "aqi": random.choice([80, 120, 180, 250, 320, 400]),
            "category": "",
        }
        for city in CITIES
    }
    for city in data:
        aqi = data[city]["aqi"]
        if aqi <= 100:
            data[city]["category"] = "satisfactory"
        elif aqi <= 200:
            data[city]["category"] = "moderate"
        elif aqi <= 300:
            data[city]["category"] = "poor"
        else:
            data[city]["category"] = "severe"

    path = os.path.join(DATA_DIR, "mock_aqi.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"✓ {path}")


# ═══════════════════════════════════════════════════════════════════════════
# 5. mock_platform.json
# ═══════════════════════════════════════════════════════════════════════════
def generate_mock_platform():
    hubs = {}
    zones = {}
    batches = {}

    for city in CITIES:
        hub_id = f"HUB_{city[:3].upper()}_01"
        hubs[hub_id] = {
            "city": city,
            "status": random.choice(["ACTIVE", "ACTIVE", "ACTIVE", "CLOSED"]),
            "capacity": random.randint(200, 800),
        }

        for zone in ZONES_PER_CITY[city]:
            zones[zone] = {
                "city": city,
                "hub_id": hub_id,
                "status": random.choice(["ACTIVE", "ACTIVE", "INACTIVE"]),
                "active_workers": random.randint(10, 50),
            }

    # Sample batch assignments (20 workers get batches)
    for i in range(1, 21):
        worker_id = f"W{i:04d}"
        batches[worker_id] = {
            "batch_id": f"BATCH_{random.randint(1000, 9999)}",
            "assigned_deliveries": random.randint(5, 25),
            "completed_deliveries": random.randint(0, 15),
            "gps_movement_score": round(random.uniform(0.0, 1.0), 2),
        }

    data = {"hubs": hubs, "zones": zones, "batches": batches}
    path = os.path.join(DATA_DIR, "mock_platform.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"✓ {path}")


# ═══════════════════════════════════════════════════════════════════════════
# 6. synthetic_fraud_training.csv  (FIX #4: fraud detector training data)
# ═══════════════════════════════════════════════════════════════════════════
def generate_fraud_training():
    rows = []

    # 150 normal workers: idle during disruption
    for i in range(150):
        rows.append({
            "gps_movement_score": round(random.uniform(0.0, 0.3), 3),
            "deliveries_in_window": 0,
            "claim_frequency_7d": random.randint(0, 2),
            "zone_traffic_clear": 0,
            "is_duplicate_event": 0,
            "label": "normal",
        })

    # 50 fraudulent workers: suspicious patterns
    for i in range(50):
        rows.append({
            "gps_movement_score": round(random.uniform(0.5, 1.0), 3),
            "deliveries_in_window": random.randint(1, 10),
            "claim_frequency_7d": random.randint(3, 8),
            "zone_traffic_clear": random.choice([0, 0, 1, 1, 1]),
            "is_duplicate_event": random.choice([0, 0, 0, 1]),
            "label": "fraud",
        })

    df = pd.DataFrame(rows)
    path = os.path.join(DATA_DIR, "synthetic_fraud_training.csv")
    df.to_csv(path, index=False)
    print(f"✓ {path}  ({len(df)} samples: 150 normal + 50 fraud)")
    return df


# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("Generating synthetic data …\n")
    workers = generate_workers(200)
    generate_batch_history(workers, days=28)
    generate_disruption_history()
    generate_mock_aqi()
    generate_mock_platform()
    generate_fraud_training()
    print("\n✅ All data files generated in", DATA_DIR)
