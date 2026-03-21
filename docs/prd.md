# Product Requirements Document (PRD)

## 1. Executive Summary
ZeroRukawat is an AI-powered parametric income insurance platform built exclusively for Amazon and Flipkart delivery partners in India. It guarantees automated payouts for income lost due to external, systemic disruptions (weather, strikes, curfews) without requiring the worker to file a claim. Payouts covering 70% of lost income are triggered automatically and sent via UPI within 15 minutes of validation.

## 2. Problem Statement
Delivery partners currently operate on a binary batch slot system. When external disruptions—such as heavy rain, heat waves, dense fog, or warehouse strikes—occur, their entire delivery batch is canceled. 
- **Financial Impact:** Income drops instantly to Rs 0 for that period.
- **Safety Net Void:** There are zero existing income protection products designed for this demographic's specific vulnerability.
- **Scale:** Workers typically lose 20–30% of their potential monthly income to these disruptions. Considering average savings of Rs 2,000–3,000 (less than 4 days of earnings), a single disrupted week can have catastrophic financial consequences.

## 3. Product Vision & Solution Strategy
A zero-friction parametric insurance model. 
1. **Onboarding:** Workers sign up once (via WhatsApp bot for zero friction) and pay a dynamic weekly premium (Rs 49–99) based on an AI-calculated risk profile for their city/tier.
2. **Monitoring & Triggering:** The platform silently monitors weather, traffic, and platform API statuses.
3. **Validation & Payout:** If a disruption event occurs, the system triggers a 5-layer fraud verification pipeline to ensure the worker is genuinely idle in the affected zone. Upon passing, 70% of their calculated lost daily income is credited instantly to their UPI.

## 4. Target Personas
- **Delivery Partner Segment:** Amazon and Flipkart riders (binary income loss model).
- **Worker Tiers:**
  - **Bronze:** Weekly earnings up to Rs 4,000 (Premium ~Rs 49/week).
  - **Silver:** Weekly earnings Rs 4,000–Rs 7,000 (Premium ~Rs 79/week).
  - **Gold:** Weekly earnings Rs 7,000+ (Premium ~Rs 99/week).

## 5. Scope Statement
### In Scope (Phase 2 & 3)
- Parametric weather and event triggers (Rain, Heat, Fog, Curfew, Strikes).
- Dynamic Premium engine (XGBoost).
- 5-Layer Fraud Detection pipeline (Isolation Forest + Spoofing heuristics).
- WhatsApp bot onboarding flow (Twilio).
- Worker Mobile App (React Native/Expo) with offline caching and push notifications.
- Admin Web Dashboard (React/Tailwind) for claim reviews and heatmap analytics.
- Multilingual support (Hindi, English, Tamil, Telugu, Marathi, Kannada).

### Out of Scope
- Health, accident, life, or vehicle insurance coverage.
- Payouts for non-batch workers (Swiggy/Zomato).

## 6. Functional Requirements
### Triggers and Data Sources
- **Weather Triggers:**
  - Heavy Rain (>15mm/hr via OpenWeatherMap/IMD).
  - Extreme Heat (>43°C via OpenWeatherMap/IMD).
  - Dense Fog (<100m visibility via OpenWeatherMap).
  - Severe Pollution (AQI >300 via CPCB mock API).
- **Systemic Triggers:**
  - Local Curfew/Bandh (Govt advisory + crowdsourced).
  - Warehouse Strike / Zone Closure (Platform Mock API).
- **Secondary Validation:** Google Maps Traffic API.

### Fraud Detection Pipeline & Adversarial Defense
A 5-step validation must pass for auto-payout (GPS Idle -> Platform Log -> Traffic check -> Deduplication Event ID -> ML Anomaly Score).
To protect against coordinated spoofing attacks, additional heuristic checks are required:
- IMU Sensor Data variance (motion vs static).
- GPS Signal Quality variance (perfect accuracy = fake).
- Cell Tower vs GPS Zone cross-reference.
- IP Geolocation matching.

### Payout & Resolution States
- **Green (Score 0-40):** Auto-pay in 15 minutes.
- **Amber (Score 41-60):** 2-hour soft hold for network checks.
- **Red (Score 61-85):** Human review within 4 hours; optional photo upload.
- **Block (Score 86-100):** Claim rejected with explicit reason; appeal process via WhatsApp available.

## 7. Non-Functional Requirements
- **Resilience:** The worker app must function in low-connectivity zones (AsyncStorage). Push notifications must arrive even when the app is closed on low-end Androids.
- **Speed:** API response times under 200ms. Fully automated payouts must clear Razorpay within 15 minutes of trigger validation.
- **Scalability:** System must handle up to 10,000 concurrent workers on the polling infrastructure.

---

## 8. Role-Based Execution Plan (Development Tasks)

### AI Developer (Data Science & ML)
- [ ] Train XGBoost model for dynamic weekly premium base pricing per zone risk.
- [ ] Train Isolation Forest model for individual claim anomaly detection based on GPS/Platform logs.
- [ ] Configure Heuristic "Ring Detector" (Secondary Isolation Forest) for aggregate zone spike detection.
- [ ] Develop Linear Regression model calculating worker daily income baselines.

### Backend Developer (Python, FastAPI, Celery)
- [ ] Setup FastAPI structure, secure routes, and PostgreSQL/Redis.
- [ ] Construct Celery worker pipelines to poll external APIs (Weather, Traffic, Platform) every 15 mins.
- [ ] Implement the 5-Layer Fraud Evaluation step and the Amber/Red/Block scoring logic.
- [ ] Integrate Twilio Sandbox, Razorpay test mode, and Firebase Cloud Messaging (FCM).

### Frontend Developer (React, TailwindCSS, Web Admin)
- [ ] Initialize React Admin Dashboard (Vite PWA).
- [ ] Build the manual reviewer interface for 'Amber' and 'Red' flagged claims.
- [ ] Create real-time disruption heatmap visualizations.
- [ ] Implement `react-i18next` for regional language support in the dashboard views if needed.
- [ ] Build analytics views tracking loss ratios and geographic risk pools.

### App Developer (React Native, Expo, Notifications)
- [ ] (Phase 2) Set up Twilio WhatsApp Bot flows for KYC and registration.
- [ ] (Phase 3) Initialize React Native (Expo) shell with Zustand and AsyncStorage.
- [ ] Build UI for 5 core screens: Home, Payout History, Disruption Alert, Payout Received, Settings.
- [ ] Implement deep FCM push notification logic natively on Android for low-power state awakening.
