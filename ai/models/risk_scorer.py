"""
GigShield — Risk Scorer
XGBoost classifier: assigns worker to Bronze(0) / Silver(1) / Gold(2) tier.
Runs at onboarding + weekly premium renewal.
"""

import os
import numpy as np
import joblib

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")

# City encoding map (consistent with training data)
CITY_ENCODING = {
    "Mumbai": 0, "Delhi": 1, "Bangalore": 2, "Hyderabad": 3, "Chennai": 4,
    "Kolkata": 5, "Pune": 6, "Ahmedabad": 7, "Jaipur": 8, "Lucknow": 9,
}

# Base premiums per tier (Rs/week)
BASE_PREMIUMS = {0: 49, 1: 79, 2: 99}

# City adjustment factors for premium (±20%)
CITY_ADJUSTMENTS = {
    "Mumbai": 1.20, "Delhi": 1.15, "Bangalore": 1.05, "Hyderabad": 1.00,
    "Chennai": 1.00, "Kolkata": 0.95, "Pune": 1.05, "Ahmedabad": 0.90,
    "Jaipur": 0.85, "Lucknow": 0.80,
}

TIER_LABELS = {0: "Bronze", 1: "Silver", 2: "Gold"}


class RiskScorer:
    def __init__(self):
        self.model = None

    def load(self):
        path = os.path.join(ARTIFACTS_DIR, "risk_scorer.joblib")
        self.model = joblib.load(path)
        return self

    def predict(self, features: dict) -> dict:
        """
        features: {city, zone_risk_score, worker_activity_level,
                    claim_history_count, seasonal_factor, weeks_active}
        returns:  {tier, tier_label, base_premium, adjusted_premium, city_factor}
        """
        city = features.get("city", "Mumbai")
        city_code = CITY_ENCODING.get(city, 0)

        X = np.array([[
            city_code,
            features["zone_risk_score"],
            features["worker_activity_level"],
            features["claim_history_count"],
            features["seasonal_factor"],
            features["weeks_active"],
        ]])

        tier = int(self.model.predict(X)[0])
        base_premium = BASE_PREMIUMS[tier]
        city_factor = CITY_ADJUSTMENTS.get(city, 1.0)
        adjusted_premium = round(base_premium * city_factor, 2)

        return {
            "tier": tier,
            "tier_label": TIER_LABELS[tier],
            "base_premium": base_premium,
            "adjusted_premium": adjusted_premium,
            "city_factor": city_factor,
        }
