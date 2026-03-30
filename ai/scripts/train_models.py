"""
GigShield — Model Training Script
Run after generate_synthetic_data.py to train and save all models to artifacts/.
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error, r2_score
from xgboost import XGBClassifier

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

# City encoding (must match models/risk_scorer.py)
CITY_ENCODING = {
    "Mumbai": 0, "Delhi": 1, "Bangalore": 2, "Hyderabad": 3, "Chennai": 4,
    "Kolkata": 5, "Pune": 6, "Ahmedabad": 7, "Jaipur": 8, "Lucknow": 9,
}


# ═══════════════════════════════════════════════════════════════════════════
# 1. Risk Scorer  (XGBoost — tier classification)
# ═══════════════════════════════════════════════════════════════════════════
def train_risk_scorer():
    print("=" * 60)
    print("Training Risk Scorer (XGBoost)")
    print("=" * 60)

    df = pd.read_csv(os.path.join(DATA_DIR, "synthetic_workers.csv"))
    df["city_code"] = df["city"].map(CITY_ENCODING)

    features = ["city_code", "zone_risk_score", "worker_activity_level",
                 "claim_history_count", "seasonal_factor", "weeks_active"]
    X = df[features].values
    y = df["tier"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # FIX #11: Removed deprecated use_label_encoder parameter
    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric="mlogloss",
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.3f}")
    print(classification_report(y_test, y_pred, target_names=["Bronze", "Silver", "Gold"]))

    path = os.path.join(ARTIFACTS_DIR, "risk_scorer.joblib")
    joblib.dump(model, path)
    print(f"✓ Saved: {path}\n")
    return acc


# ═══════════════════════════════════════════════════════════════════════════
# 2. Fraud Detector  (Isolation Forest)
# ═══════════════════════════════════════════════════════════════════════════
def train_fraud_detector():
    print("=" * 60)
    print("Training Fraud Detector (Isolation Forest)")
    print("=" * 60)

    # FIX #4: Load training data from CSV instead of hardcoding
    csv_path = os.path.join(DATA_DIR, "synthetic_fraud_training.csv")
    df = pd.read_csv(csv_path)

    feature_cols = ["gps_movement_score", "deliveries_in_window",
                     "claim_frequency_7d", "zone_traffic_clear", "is_duplicate_event"]
    X_train = df[feature_cols].values

    n_fraud = (df["label"] == "fraud").sum()
    n_total = len(df)
    contamination = n_fraud / n_total

    print(f"Training samples: {n_total} ({n_total - n_fraud} normal + {n_fraud} fraud)")
    print(f"Contamination: {contamination:.2%}")

    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
    )
    model.fit(X_train)

    # Validate on training data
    predictions = model.predict(X_train)  # 1 = normal, -1 = anomaly
    n_anomalies = (predictions == -1).sum()
    print(f"Detected {n_anomalies}/{n_total} anomalies ({n_anomalies/n_total*100:.1f}%)")

    # Sanity: score a known-good and known-bad sample
    normal_rows = df[df["label"] == "normal"]
    fraud_rows = df[df["label"] == "fraud"]
    good_score = model.decision_function(normal_rows[feature_cols].values[:1])[0]
    bad_score = model.decision_function(fraud_rows[feature_cols].values[:1])[0]
    print(f"Sample normal score: {good_score:.3f} (higher = more normal)")
    print(f"Sample fraud score:  {bad_score:.3f} (lower = more anomalous)")

    path = os.path.join(ARTIFACTS_DIR, "fraud_detector.joblib")
    joblib.dump(model, path)
    print(f"✓ Saved: {path}\n")


# ═══════════════════════════════════════════════════════════════════════════
# 3. Income Estimator  (Linear Regression)
# ═══════════════════════════════════════════════════════════════════════════
def train_income_estimator():
    print("=" * 60)
    print("Training Income Estimator (Linear Regression)")
    print("=" * 60)

    df = pd.read_csv(os.path.join(DATA_DIR, "synthetic_batch_history.csv"))

    # FIX #1: Clamp training target floor at Rs 100 to prevent negative predictions
    df["daily_earnings"] = df["daily_earnings"].clip(lower=100)

    features = ["avg_weekly_earnings_4w", "tier", "day_of_week",
                 "zone_demand_factor", "seasonal_multiplier"]
    X = df[features].values
    y = df["daily_earnings"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LinearRegression()
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print(f"MAE:  Rs {mae:.2f}")
    print(f"R²:   {r2:.3f}")

    # Sanity: check that extreme-low predictions are reasonable
    X_extreme = np.array([[100.0, 0, 0, 0.1, 0.1]])
    extreme_pred = model.predict(X_extreme)[0]
    print(f"Extreme-low test prediction: Rs {extreme_pred:.2f} (floored to 100 at runtime)")

    path = os.path.join(ARTIFACTS_DIR, "income_estimator.joblib")
    joblib.dump(model, path)
    print(f"✓ Saved: {path}\n")
    return mae, r2


# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("Training all models …\n")

    # Check data files exist
    required = ["synthetic_workers.csv", "synthetic_batch_history.csv", "synthetic_fraud_training.csv"]
    for f in required:
        if not os.path.exists(os.path.join(DATA_DIR, f)):
            print(f"❌ Missing {f} — run generate_synthetic_data.py first!")
            sys.exit(1)

    train_risk_scorer()
    train_fraud_detector()
    train_income_estimator()

    # List saved artifacts
    print("=" * 60)
    print("Saved artifacts:")
    for f in sorted(os.listdir(ARTIFACTS_DIR)):
        size = os.path.getsize(os.path.join(ARTIFACTS_DIR, f))
        print(f"  {f}  ({size:,} bytes)")
    print("\n✅ All models trained successfully!")
