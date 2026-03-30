"""
GigShield — Fraud Detector
Isolation Forest: scores claim legitimacy (0–1). Score > 0.7 = flagged.
Includes duplicate event prevention via in-memory store.
"""

import os
import time
import numpy as np
import joblib

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")

FRAUD_THRESHOLD = 0.7
DUPLICATE_TTL = 86400  # 24 hours in seconds


class FraudDetector:
    def __init__(self):
        self.model = None
        # In-memory duplicate store: {key: timestamp}
        # Replace with Redis in production
        self._duplicate_store: dict[str, float] = {}

    def load(self):
        path = os.path.join(ARTIFACTS_DIR, "fraud_detector.joblib")
        self.model = joblib.load(path)
        return self

    # ── Duplicate prevention ────────────────────────────────────────────
    def _cleanup_expired(self):
        """Remove expired entries from the duplicate store."""
        now = time.time()
        expired = [k for k, ts in self._duplicate_store.items() if now - ts > DUPLICATE_TTL]
        for k in expired:
            del self._duplicate_store[k]

    def check_duplicate(self, event_id: str, worker_id: str) -> bool:
        """Returns True if this event+worker combo was already processed."""
        self._cleanup_expired()
        key = f"{event_id}:{worker_id}"
        return key in self._duplicate_store

    def record_event(self, event_id: str, worker_id: str):
        """Mark event+worker as processed."""
        key = f"{event_id}:{worker_id}"
        self._duplicate_store[key] = time.time()

    # ── Fraud scoring ───────────────────────────────────────────────────
    def predict(self, features: dict) -> dict:
        """
        features: {gps_movement_score, deliveries_in_window,
                    claim_frequency_7d, zone_traffic_clear, is_duplicate_event}

        returns:  {fraud_score, is_flagged, reasons}
        """
        X = np.array([[
            features["gps_movement_score"],
            features["deliveries_in_window"],
            features["claim_frequency_7d"],
            int(features.get("zone_traffic_clear", False)),
            int(features.get("is_duplicate_event", False)),
        ]])

        # Isolation Forest: decision_function returns anomaly score
        # More negative = more anomalous.  We normalise to 0–1 (1 = most fraudulent).
        raw_score = self.model.decision_function(X)[0]
        # Base ML score: map from [-0.5, 0.5] → [0, 1]
        ml_score = float(np.clip(0.5 - raw_score, 0, 1))

        # Heuristic boost: suspicious signals add to score
        heuristic = 0.0
        if features["gps_movement_score"] > 0.5:
            heuristic += 0.2
        if features["deliveries_in_window"] > 0:
            heuristic += 0.15 * min(features["deliveries_in_window"], 5)
        if features["claim_frequency_7d"] > 3:
            heuristic += 0.1
        if features.get("zone_traffic_clear"):
            heuristic += 0.1

        # Combine: weighted average of ML + heuristic
        fraud_score = round(float(np.clip(0.4 * ml_score + 0.6 * heuristic, 0, 1)), 3)

        reasons = []
        if features["gps_movement_score"] > 0.5:
            reasons.append("Worker appears active during disruption")
        if features["deliveries_in_window"] > 0:
            reasons.append(f"Made {features['deliveries_in_window']} deliveries during disruption window")
        if features["claim_frequency_7d"] > 3:
            reasons.append(f"High claim frequency: {features['claim_frequency_7d']} in 7 days")
        if features.get("zone_traffic_clear"):
            reasons.append("Zone traffic is clear — disruption claim suspicious")
        if features.get("is_duplicate_event"):
            reasons.append("Duplicate event detected")

        return {
            "fraud_score": fraud_score,
            "is_flagged": fraud_score > FRAUD_THRESHOLD,
            "reasons": reasons,
        }

    def validate_claim(self, event_id: str, worker_id: str, features: dict) -> dict:
        """Full validation: duplicate check + fraud scoring."""
        # Step 1: duplicate check
        if self.check_duplicate(event_id, worker_id):
            return {
                "fraud_score": 1.0,
                "is_flagged": True,
                "blocked_reason": "duplicate_event",
                "reasons": ["Duplicate claim for same event"],
            }

        # Step 2: fraud scoring
        features["is_duplicate_event"] = False
        result = self.predict(features)
        return result
