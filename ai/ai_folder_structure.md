# GigShield — AI Folder Structure

```
ai/
├── main.py                          # FastAPI app entry point, loads all models at startup
│
├── models/
│   ├── risk_scorer.py               # XGBoost — tier classification, premium adjustment
│   ├── disruption_detector.py       # Threshold rules — fires event_id per zone
│   ├── fraud_detector.py            # Isolation Forest — fraud score + duplicate check
│   └── income_estimator.py          # Linear Regression — daily income in Rs
│
├── services/
│   ├── payout_service.py            # Orchestrates full pipeline: detect → validate → pay
│   ├── weather_service.py           # OpenWeatherMap API calls (live)
│   ├── traffic_service.py           # Google Traffic API mock
│   ├── platform_service.py          # Mock Amazon/Flipkart API (hub/zone/batch status)
│   └── notification_service.py      # WhatsApp + FCM stubs
│
├── data/
│   ├── synthetic_workers.csv        # Training data: worker features + tier labels
│   ├── synthetic_batch_history.csv  # Training data: batch earnings per worker per day
│   ├── city_disruption_history.json # Zone risk scores by city (feeds risk scorer)
│   ├── mock_aqi.json                # Static AQI lookup by city
│   └── mock_platform.json           # hub_status, zone_status, batch assignments
│
├── scripts/
│   ├── generate_synthetic_data.py   # Run once — generates all data/ files
│   ├── train_models.py              # Run once — trains + saves all models to artifacts/
│   └── demo_pipeline.py             # End-to-end demo script for hackathon presentation
│
├── artifacts/                       # Saved trained models (git-ignored if large)
│   ├── risk_scorer.joblib
│   ├── fraud_detector.joblib
│   └── income_estimator.joblib
│
├── tests/
│   ├── test_disruption_detector.py
│   ├── test_fraud_detector.py
│   └── test_payout_pipeline.py
│
├── requirements.txt
└── README.md                        # Points to ai_context.md
```

## Startup order
1. Run `scripts/generate_synthetic_data.py` → populates `data/`
2. Run `scripts/train_models.py` → saves models to `artifacts/`
3. Run `main.py` → FastAPI loads artifacts, exposes endpoints

## Notes
- `disruption_detector.py` has no artifact — it's pure logic, no training
- `payout_service.py` is the only file that calls all 4 models in sequence
- `demo_pipeline.py` simulates a Mumbai monsoon scenario end-to-end for the pitch
