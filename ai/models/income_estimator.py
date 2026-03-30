"""
GigShield — Income Estimator
Linear Regression: estimates daily income to calculate payout.
Runs after fraud check passes.
"""

import os
import numpy as np
import joblib

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")

# Payout caps per tier (Rs/week) — from project_context.md
WEEKLY_CAPS = {0: 2450, 1: 3850, 2: 6300}

COVERAGE_RATE = 0.70  # 70% of lost daily income


class IncomeEstimator:
    def __init__(self):
        self.model = None

    def load(self):
        path = os.path.join(ARTIFACTS_DIR, "income_estimator.joblib")
        self.model = joblib.load(path)
        return self

    def predict(self, features: dict, disrupted_days: int = 1) -> dict:
        """
        features: {avg_weekly_earnings_4w, tier, day_of_week,
                    zone_demand_factor, seasonal_multiplier}

        returns:  {estimated_daily_income, payout, capped, weekly_cap}
        """
        tier = features["tier"]

        X = np.array([[
            features["avg_weekly_earnings_4w"],
            tier,
            features["day_of_week"],
            features["zone_demand_factor"],
            features["seasonal_multiplier"],
        ]])

        estimated_daily = float(self.model.predict(X)[0])
        estimated_daily = max(estimated_daily, 100)  # floor at Rs 100

        # Payout formula: daily_income × 0.70 × disrupted_days
        raw_payout = round(estimated_daily * COVERAGE_RATE * disrupted_days, 2)

        # Apply weekly cap
        weekly_cap = WEEKLY_CAPS.get(tier, 2450)
        capped = raw_payout > weekly_cap
        final_payout = min(raw_payout, weekly_cap)

        return {
            "estimated_daily_income": round(estimated_daily, 2),
            "coverage_rate": COVERAGE_RATE,
            "disrupted_days": disrupted_days,
            "raw_payout": raw_payout,
            "weekly_cap": weekly_cap,
            "capped": capped,
            "payout": round(final_payout, 2),
        }
