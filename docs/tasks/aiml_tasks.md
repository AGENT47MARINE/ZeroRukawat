# AI / ML Engineer Task List

This document acts as the Execution Plan for the Machine Learning aspects of ZeroRukawat.

## Phase 2 Focus: Pricing Engine

- [ ] **Data Sourcing**
  - [ ] Retrieve 10-year historical weather/flood data for target pilot cities (e.g., from IMD or a reliable open dataset).
  - [ ] Standardize the data to extract the frequency of disruption conditions (>15mm/hr rain, >43C heat, etc.).
- [ ] **XGBoost Training (Premium Engine)**
  - [ ] Define the target variable: Expected frequency of disruptions per month in a specific zone.
  - [ ] Train the XGBoost model to output a base weekly premium multiplier.
  - [ ] Validate model using k-fold cross-validation (ensure it doesn't over or under-price radically).
  - [ ] Export the model (e.g., via `joblib`) for backend consumption.
- [ ] **API Endpoint (Drafting)**
  - [ ] Define the exact JSON schema the Backend will send your model for a risk score when a worker registers via WhatsApp.

## Phase 3 Focus: Fraud Pipeline

- [ ] **Data Generation (Synthetic)**
  - [ ] Generate a dataset mapping normal delivery worker behavior (fluctuating GPS accuracy, constant micro IMU variance).
  - [ ] Generate synthetic "Spoofing" data (perfect accuracy, zero IMU variance, sudden teleportation).
- [ ] **Isolation Forest Training (Individual Fraud)**
  - [ ] Train the Isolation Forest model on the synthetic worker telemetry.
  - [ ] Define the strict bounding thresholds for the outcome states: Green (0-40), Amber (41-60), Red (61-85), Block (>85).
- [ ] **Ring Detector (Heuristic Pipeline)**
  - [ ] Implement K-Means clustering script to flag extreme spatial density anomalies (>10 claims inside 5 meters).
- [ ] **Performance Validation**
  - [ ] Calculate the ROC-AUC and tune parameters to ensure a False Negative rate (legit claim rejected) of < 0.5%.
