# Machine Learning Pipeline

This document details the Machine Learning pipeline used in ZeroRukawat, specifically focusing on dynamic premium pricing and fraud detection. Our philosophy is to prioritize explainability and bounded outputs over black-box complexity.

## Core Models

### 1. Dynamic Premium Engine (XGBoost)
The goal of this model is to calculate a fair, dynamic weekly premium for each worker based on their geographical and historical risk profile.

*   **Algorithm:** XGBoost (Extreme Gradient Boosting)
*   **Target Variable:** The expected frequency (count per month) of a disruption event (rain >15mm/hr, heatwave >43C) occurring during a worker's active hours in their assigned zone.
*   **Key Features Engineeering:**
    *   `City_Flood_Index`: A rolling 10-year historical probability of severe waterlogging in the worker's operational `Zone`, derived from IMD (Indian Meteorological Department) datasets.
    *   `Seasonal_Weighting`: A categorical multiplier (e.g., June-August for Mumbai receives a 1.8x multiplier).
    *   `Worker_Tier_Base`: (Bronze/Silver/Gold) scales the final output premium to reflect the maximum insured amount.
*   **Hyperparameter Tuning & Retraining:** Tuned via GridSearch to minimize mean squared error (MSE) against historical weather disruptions. Retrained quarterly.
*   **Edge Case:** If a new zone is added with no historical data, the model defaults to the city average premium plus a 15% uncertainty margin.

### 2. Individual Claim Anomaly Detection (Isolation Forest)
This model acts as the primary defense against individual GPS spoofing or fake claims during an active disruption.

*   **Algorithm:** Isolation Forest (unsupervised anomaly detection).
*   **Goal:** Identify claims that deviate significantly from standard, idle worker behavior during a disruption.
*   **Key Features Engineering:**
    *   `GPS_Accuracy_Variance`: Standard deviation of the GPS `accuracy` reading over a 5-minute rolling window. Spoofing apps often provide a static `accuracy` (e.g., exactly 5.0m continuously), whereas real devices fluctuate.
    *   `IMU_Variance`: The magnitude sum of accelerometer changes ($ \sqrt{x^2+y^2+z^2} $) over 5 minutes. Real workers, even when parked under a bridge, have micro-movements. Perfect stillness = high anomaly score.
    *   `Network_Transition_Count`: Number of hops between cell towers or to Wi-Fi. Zero transitions combined with high GPS movement is anomalous.
*   **Scoring & Thresholds:** The Isolation Forest outputs a normalized anomaly score (0-100), mapped to the PRD states:
    *   `0-40 (Green)`: Normal behavior. Auto-pay processed.
    *   `41-60 (Amber)`: Minor deviations (e.g., poor signal). Soft hold for 2 hours.
    *   `61-85 (Red)`: Suspicious (e.g., zero IMU variance). Requires manual admin review.
    *   `86-100 (Block)`: Obvious spoofing. Claim rejected.

### 3. "Ring Detector" (Secondary Heuristic/ML)
Defends against coordinated, zone-wide spoofing attacks (e.g., a Telegram group of workers using the same spoofing app and coordinates).

*   **Algorithms:** K-Means Clustering (for spatial density) + Heuristic Rules.
*   **Goal:** Detect unnatural spikes in claims from an identical micro-location within a short timeframe.
*   **Evaluation Metric:** Evaluated offline via Precision@k (how accurately the top *k* flagged clusters correspond to known synthetic spoofing attacks).
*   **Key Metrics Monitored:**
    *   `Spatial_Density_Extreme`: > 10 claims originating within a 5-meter radius (highly improbable in reality).
    *   `Device_Signature_Collisions`: Multiple claims from the same IP address or sharing suspicious device metadata (e.g., identical uncommon Android build props).

## Pipeline Integration & Feedback Loop
1.  **Inference (Fraud):** Triggered asynchronously by Celery workers when a disruption occurs.
2.  **Stale Data Handling:** If a worker's app fails to send fresh GPS/IMU data for >15 minutes before the disruption, their claim is automatically flagged as `Amber` pending network recovery, rather than failing the ML model due to missing features.
3.  **Human-in-the-loop:** When Admins manually review and overturn a 'Red' or 'Block' claim, this data is fed back into a supervised model (Random Forest) that runs in parallel to the Isolation Forest to help fine-tune future thresholds.
