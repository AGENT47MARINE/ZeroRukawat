# GigShield — AI/ML Context

## Overview
4 models. They run in this order on every payout cycle:
Disruption Detector → Fraud Detector → Income Estimator → (payout fires)
Risk Scorer runs separately at onboarding and weekly premium renewal.

---

## Model 1 — Risk Scorer
**File**: `models/risk_scorer.py`
**Algorithm**: XGBoost classifier
**When it runs**: On worker onboarding + weekly premium recalculation
**Input features**:
- city (encoded)
- zone_risk_score (float, derived from historical disruption frequency)
- worker_activity_level (avg deliveries/week)
- claim_history_count (int)
- seasonal_factor (float, 0.8–1.2)
- weeks_active (int)

**Output**: tier label → `0=Bronze`, `1=Silver`, `2=Gold`
**Post-processing**: apply ±20% city adjustment to base premium after tier assignment
**Training data**: synthetic worker dataset (`data/synthetic_workers.csv`)

---

## Model 2 — Disruption Detector
**File**: `models/disruption_detector.py`
**Algorithm**: Rule-based threshold monitor (no training needed)
**When it runs**: Every 15 minutes via Celery beat, per active zone
**Logic**:
```
if rainfall > 15:        trigger("heavy_rain")
if temperature > 43:     trigger("extreme_heat")
if visibility < 100:     trigger("dense_fog")
if aqi > 300:            trigger("severe_aqi")
if hub_status == "CLOSED":   trigger("warehouse_strike")
if zone_status == "INACTIVE": trigger("zone_closure")
if curfew_declared == True:  trigger("curfew")
```
**Data sources**: OpenWeatherMap API (live), CPCB mock (static dict), Platform API mock
**Output**: `{"triggered": bool, "type": str, "event_id": str, "zone": str}`
**Event ID format**: `{ZONE}_{DATE}_{TYPE}_{HHMM}` e.g. `MUM_20250315_RAIN_1420`

---

## Model 3 — Fraud Detector
**File**: `models/fraud_detector.py`
**Algorithm**: Isolation Forest (sklearn)
**When it runs**: After disruption triggers, before every payout
**Input features**:
- gps_movement_score (float — 0 = idle, 1 = active)
- deliveries_in_window (int — should be 0)
- claim_frequency_7d (int)
- zone_traffic_clear (bool — True = roads are clear = suspicious)
- is_duplicate_event (bool — checked against Redis/dict store)

**Output**: fraud_score (float 0–1). Score > 0.7 = flagged, payout blocked.
**Training data**: synthetic dataset with 150 normal + 50 fraudulent workers
**Duplicate prevention**: before scoring, check `{event_id}:{worker_id}` in duplicate store. If exists → block immediately, skip Isolation Forest.

---

## Model 4 — Income Estimator
**File**: `models/income_estimator.py`
**Algorithm**: Linear Regression (sklearn)
**When it runs**: After fraud check passes, to calculate exact payout amount
**Input features**:
- avg_weekly_earnings_4w (float — mean of last 4 weeks)
- tier (0/1/2)
- day_of_week (0–6, weekends higher)
- zone_demand_factor (float, 0.8–1.3)
- seasonal_multiplier (float, 0.8–1.2)

**Output**: `estimated_daily_income` (float, in Rs)
**Payout formula** (applied after model output):
```python
payout = estimated_daily_income * 0.70 * disrupted_days
```
**Training data**: synthetic worker batch history (`data/synthetic_batch_history.csv`)

---

## Payout orchestration (not a model, but the glue)
**File**: `services/payout_service.py`
**Sequence**:
1. Disruption Detector fires → get `event_id`
2. Check duplicate store → block if duplicate
3. Fraud Detector scores claim → block if > 0.7
4. Income Estimator returns daily income
5. Calculate payout amount
6. Call Razorpay sandbox API → credit UPI
7. Store `event_id:worker_id` in duplicate store (TTL 24h)
8. Send WhatsApp + FCM notification

---

## Data files needed
| File | Purpose |
|------|---------|
| `data/synthetic_workers.csv` | Training data for risk scorer + fraud detector |
| `data/synthetic_batch_history.csv` | Training data for income estimator |
| `data/city_disruption_history.json` | Zone risk scores for risk scorer features |
| `data/mock_aqi.json` | Static CPCB AQI lookup by city |
| `data/mock_platform.json` | Fake hub_status, zone_status, batch assignments |

---

## API endpoints (FastAPI)
| Method | Route | Model called |
|--------|-------|-------------|
| POST | `/risk-score/{worker_id}` | Risk Scorer |
| GET | `/disruption-status/{zone}` | Disruption Detector |
| POST | `/validate-claim` | Fraud Detector |
| POST | `/calculate-payout` | Income Estimator |
| POST | `/process-payout` | Full orchestration pipeline |

---

## Libraries
```
xgboost
scikit-learn
pandas
numpy
fastapi
httpx          # async API calls (OpenWeatherMap, Google)
celery
redis
```

---

## Key constraints
- Fraud score threshold is 0.7 (above = blocked)
- Payout cap: Bronze Rs 2,450 / Silver Rs 3,850 / Gold Rs 6,300 per week
- All models must be pre-trained and loaded at FastAPI startup (no training on request)
- Duplicate store is an in-memory dict for hackathon (replace with Redis in prod)
- OpenWeatherMap is the only live external API — everything else can be mocked
