# ZeroRukawat AI / ML

This directory contains the machine learning research and training pipeline for ZeroRukawat.

## Core Models
1. **XGBoost (Pricing Engine)**: Dynamic weekly premium calculation based on zonal risk.
2. **Isolation Forest (Fraud Guard)**: Anomaly detection for individual claim telemetry.
3. **Ring Detector**: Statistical density analysis for coordinated spoofing rings.

## Structure
- `data/`: Local copies of historical weather and platform logs (git ignored).
- `models/`: Exported `.joblib` files for backend integration.
- `scripts/`: Python training and evaluation scripts.

## Getting Started
1. Create a virtualenv: `python -m venv venv`
2. Install dependencies: `pip install -r requirements-ml.txt`
3. Begin with `scripts/sourcing_weather.py`.
