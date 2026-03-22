# Project Roadmap

This document outlines the strategic phases and milestones for ZeroRukawat, highlighting specific success criteria and resource allocations required for a resilient fintech rollout.

## Core Objective
Deliver a fully functional parametric insurance platform guaranteeing 15-minute UPI payouts to delivery workers without requiring a manual claim form.

---

### Phase 1: Foundation & Architecture (Completed)
*   **Objective:** Define the system design, data structures, and APIs.
*   **Key Deliverables:** PRD, Architecture Diagram, Database Schema, API Contracts, AI Strategy Context.
*   **Success Metric:** Technical go-ahead and alignment on the 'zero friction' UX philosophy.

### Phase 2: Core Platform Infrastructure (Q1)
*   **Objective:** Establish the backend engine, messaging queues, and the initial worker loop.
*   **Key Resources:** Lead Backend Dev, Data Scientist (Premium Engine).
*   **Milestones:**
    *   **Backend Base:** Set up FastAPI, PostgreSQL, Redis, and Celery architecture.
    *   **Data Aggregation Tasks:** Integrate polling structure via Celery (OpenWeatherMap, Google Traffic mock APIs).
    *   **Onboarding Loop:** Develop the WhatsApp bot flow via Twilio.
    *   **Pricing Engine Base:** Train and deploy the initial XGBoost model for calculating dynamic weekly premiums (`docs/ml_pipeline.md`).
    *   **Simulated Payouts:** Integrate Razorpay sandbox for simulated UPI transfers.
*   **Success Metric:** A worker can register via WhatsApp, receive a premium quote, and agree to the TOS.
*   **Risk & Mitigation:** *Weather API Rate Limits.* Implement a robust Redis caching layer for weather states to avoid redundant outgoing calls.

### Phase 3: Fraud Defenses & Admin Tools (Q2)
*   **Objective:** Implement the ML safety nets, build the reviewer interfaces, and establish the mobile beachhead.
*   **Key Resources:** React Frontend Dev, React Native/Expo Dev, Data Scientist (Fraud Engine).
*   **Milestones:**
    *   **Fraud Pipeline (Isolation Forest):** Deploy the anomaly detection model predicting Green/Amber/Red/Block states based on GPS and IMU variance.
    *   **Ring Detector:** Implement secondary heuristic rules to prevent coordinated GPS spoofing.
    *   **Admin Dashboard:** Build the React + Tailwind web app for claim review queues and active disruption heatmaps.
    *   **Worker App Shell:** Initialize the Expo app with AsyncStorage and deep Firebase Cloud Messaging (FCM) integration for resilient push notifications.
*   **Success Metric:** The ML pipeline catches >95% of synthetic spoofing artifacts during sandbox load tests. Admin dashboard correctly filters and sorts Amber/Red claims.
*   **Risk & Mitigation:** *Push notifications failing on low-end Androids.* Enforce native background task handlers and prioritize FCM data messages over notification messages to wake the generic app states.

### Phase 4: Beta Launch & Hardening (Q3)
*   **Objective:** Initial simulation rollout in a restricted geographical zone. 
*   **Key Resources:** DevOps/Platform Engineer, QA, Full-Stack team support.
*   **Milestones:**
    *   **Closed Beta:** Target a specific cluster (e.g., 'Mumbai_Kurla' delivery zone) using real workers but simulated disruption events to test the payout rails.
    *   **Performance Tuning (Celery):** Optimize the queue structure (fan-out methodology) to process 10,000 concurrent evaluation tasks during a simulated storm.
    *   **Refinement:** Adjust the Isolation Forest thresholds (Green/Amber/Red) based on the first wave of real human telemetry to minimize False Positives.
*   **Success Metric:** The system can evaluate and queue 5,000 synthetic `Green` claims for Razorpay payout within the 15-minute SLA.
*   **Risk & Mitigation:** *Database connection exhaustion.* Ensure `PgBouncer` is correctly configured in front of PostgreSQL to handle the Celery worker spike.

### Phase 5: Production & Market Expansion (Q4+)
*   **Objective:** Full deployment and horizontal scaling across tiers and data sources.
*   **Milestones:**
    *   **General Availability:** Live Razorpay payouts activated.
    *   **New Parametric Triggers:** Add AQI/Pollution thresholds and Government Curfew advisory web scraping modules.
    *   **Localization Expansion:** General roll-out of Hindi, Tamil, Telugu, and Kannada support via WhatsApp API templates and `react-i18next` in the mobile app.
*   **Success Metric:** Process 10,000+ active subscriptions with a False Negative rate (legitimate claims rejected) of <0.5%.
