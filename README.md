# ZeroRukawat — Zero Disruption to Your Earnings

> AI-powered parametric income insurance for Amazon & Flipkart delivery partners.
> Automatic payouts when external disruptions stop them from working — no claim filing, ever.

---

## The Problem

Amazon and Flipkart delivery partners work on a **batch slot system**. When disruptions hit — rain, heat, curfews, strikes — their entire batch is cancelled. Income goes to **zero**. No compensation. No safety net.

- 20–30% of monthly income lost during disruption periods
- Average savings: Rs 2,000–3,000 (less than 4 days of earnings)
- Zero existing income protection products for this segment

---

## Our Solution

Worker signs up once. Pays a weekly premium of Rs 49–99. When a disruption threshold is crossed, ZeroRukawat automatically detects it, validates the worker was not working, and credits 70% of their lost daily income to their UPI — within 15 minutes.

**No claim form. No waiting. No friction.**

```mermaid
flowchart LR
    A([Worker Onboards]) --> B[Policy Created\nWeekly Premium Set]
    B --> C[Disruption Detected\nReal-time API monitoring]
    C --> D[Fraud Validated\n5-layer check]
    D --> E[Payout Released\nUPI within 15 min]
    E --> F([WhatsApp Alert\nin worker's language])
```

---

## Persona & Scenarios

**Persona:** Amazon & Flipkart delivery partners only — chosen because income loss is binary (batch cancelled = Rs 0), making parametric triggers clean and fraud-resistant.

| Worker | Tier | City | Disruption | Premium Paid | Payout Received |
|---|---|---|---|---|---|
| Raju | Bronze | Delhi | Heavy rain — batch cancelled | Rs 49/week | Rs 448 |
| Priya | Silver | Mumbai | Local curfew — zone deactivated | Rs 79/week | Rs 756 |
| Suresh | Gold | Bengaluru | Warehouse strike — no pickup | Rs 99/week | Rs 546 |

In each case: disruption detected → GPS idle confirmed → platform log checked → payout credited automatically. Worker did nothing after signing up.

---

## Weekly Premium Model

| Tier | Weekly Earnings | Weekly Premium | Max Payout | Coverage |
|---|---|---|---|---|
| Bronze | Up to Rs 4,000 | Rs 49 | Rs 2,450 | 70% of lost income |
| Silver | Rs 4,000–Rs 7,000 | Rs 79 | Rs 3,850 | 70% of lost income |
| Gold | Rs 7,000+ | Rs 99 | Rs 6,300 | 70% of lost income |

**Payout formula:** `(Weekly earnings ÷ 5 days) × 70% × disrupted days`

**AI adjustment:** XGBoost model adjusts premium ±20% based on city weather risk and delivery zone history. High-risk zones pay more. Low-risk zones pay less.

**Compound disruption rule:** One payout per calendar day. Same `ZONE_DATE` Event ID prevents double payment.

**Cold start:** New workers assigned city median baseline for 2 weeks, then real platform data takes over from Week 3.

---

## Parametric Triggers

All triggers are geo-fenced to the worker's delivery zone. Payout fires only when the external event AND worker inactivity are both confirmed simultaneously.

| Trigger | Threshold | Data Source |
|---|---|---|
| Heavy rain | Rainfall > 15mm/hr | OpenWeatherMap + IMD |
| Extreme heat | Temperature > 43°C | OpenWeatherMap + IMD |
| Dense fog | Visibility < 100m | OpenWeatherMap |
| Severe pollution | AQI > 300 | CPCB API (mock) |
| Local curfew / bandh | Zone movement restricted | Govt advisory + crowdsourced |
| Warehouse strike | Hub status = CLOSED | Platform API (mock) |
| Zone closure | Zone status = INACTIVE | Platform API (mock) |

Google Maps Traffic API acts as secondary validation — confirms roads are genuinely disrupted.

---

## Platform Choice

**React Native (Worker App) + React Web (Admin) + WhatsApp Bot**

- **React Native (Expo)** — Worker-facing mobile app for Android and iOS. 5 focused screens — policy status, payout history, disruption alerts, payout confirmation, settings. Built from Phase 2 onwards.
- **React Web** — Admin dashboard for desktop. Fraud review queue, disruption map, analytics, payout monitor. Complex data views are better on desktop.
- **WhatsApp Bot** — Handles all worker onboarding. Zero app download needed to sign up. Works on any Android phone in 6 regional languages. Under 5 minutes.

Both the React Native app and the React web dashboard connect to the same FastAPI backend — no duplication of business logic.

---

## AI / ML Integration

| Model | Algorithm | Purpose | Output |
|---|---|---|---|
| Risk Scorer | XGBoost | Dynamic weekly premium | Premium ±20% per worker |
| Disruption Detector | Threshold monitor | Auto-trigger monitoring | Trigger YES/NO per zone |
| Fraud Detector | Isolation Forest | Anomaly detection | Fraud score 0–1 |
| Income Estimator | Linear Regression | Calculate exact payout | Daily income baseline (Rs) |

**Fraud runs 5 layers sequentially:** GPS idle → platform delivery log → traffic check → duplicate Event ID (Redis cache) → Isolation Forest score. All 5 must pass for payout to release.

**Hyper-local pricing example:** Silver tier worker in Noida Sector 62 (low flood risk) pays Rs 67/week. Silver tier worker in Mumbai Kurla (high flood risk) pays Rs 91/week. AI makes the difference — not flat rates.

---

## Tech Stack

**Phase 1 & 2 — Web First**

| Layer | Technology |
|---|---|
| Frontend | React + TailwindCSS + Vite PWA Plugin |
| Multilingual | react-i18next (Hindi, English, Tamil, Telugu, Marathi, Kannada) |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + Redis |
| Task Queue | Celery + Redis (API polling every 15 min) |
| ML | XGBoost, scikit-learn (Isolation Forest, Linear Regression) |
| Weather / Traffic | OpenWeatherMap + IMD + Google Maps Traffic API |
| Payments | Razorpay test mode (UPI simulation) |
| WhatsApp | Twilio WhatsApp Sandbox |
| Notifications | Firebase Cloud Messaging |
| Hosting | Render (free tier) + GitHub Actions CI/CD |

**Phase 2 onwards — Worker Mobile App (React Native)**

The worker-facing app is built in React Native (Expo) starting Phase 2. Admin dashboard stays as a React web app — complex analytics are better on desktop. WhatsApp bot handles onboarding so the mobile app only needs 5 focused screens.

| Layer | Technology | Purpose |
|---|---|---|
| Mobile Framework | React Native (Expo) | Cross-platform Android + iOS worker app |
| Navigation | React Navigation | Screen routing |
| Push Notifications | Firebase Cloud Messaging + Expo Notifications | Disruption alerts + payout confirmations |
| Offline Cache | AsyncStorage | Policy status in low-connectivity areas |
| State Management | Zustand | Shared state across screens |
| API Layer | Axios | Connects to same FastAPI backend as web app |

**5 screens in scope:**
1. Home — active policy, coverage status, premium due date
2. Payout history — past payouts with date, amount, reason
3. Disruption alert — live active disruption in worker's zone
4. Payout received — confirmation when UPI credit fires
5. Settings — language, UPI ID, notification toggles

> All business logic, ML models, and API integrations live in the FastAPI backend — shared by both the web admin dashboard and the React Native worker app.

---

## Development Plan

**Phase 1 — March 4–20**
Ideation, README, system design, DB schema, API contracts, wireframes, 2-min strategy video.

**Phase 2 — March 21–April 4**
Worker registration + KYC flow, WhatsApp bot (Twilio), XGBoost premium model live, 3–5 disruption triggers firing, zero-touch claims flow, Razorpay payout simulation, 2-min demo video.

**Phase 3 — April 5–17**
Isolation Forest fraud model, GPS spoofing detection, worker + admin dashboards, PWA mobile setup, disruption simulator for demo, Tamil/Telugu/Marathi/Kannada UI, 5-min final demo video, pitch deck PDF.

---

## Additional Notes

**Regional language support:** Hindi + English from day one. Tamil, Telugu, Marathi, Kannada in Phase 2. Bengali and Gujarati on roadmap. Every touchpoint — WhatsApp, web app, notifications — respects the worker's language preference.

**Business sustainability:** At 10,000 workers across diversified cities, weekly premiums of Rs 7.4L cover expected claims of Rs 5.49L — ~15% operating margin. Geographic risk pooling, AI premium adjustment, and reinsurance for catastrophic events keep the pool viable.

**Data privacy:** GPS collected only during active disruption windows. Explicit DPDP Act 2023 consent at onboarding. Workers can delete their data via `DELETE-MY-DATA` WhatsApp command.

**Coverage scope:** Income loss only. No health, accident, life, or vehicle coverage — anywhere in the product.

---

## Team

| Name | Role | GitHub |
|---|---|---|
| | | |

---

*ZeroRukawat — Zero Rukawat. Zero Disruption.*
*Hackathon Submission — Phase 1 | March 2025*

---

## Adversarial Defense & Anti-Spoofing Strategy

> **Crisis Update — March 20, 2026:** A coordinated syndicate of 500 delivery workers exploited a beta parametric platform using GPS-spoofing apps triggered simultaneously via Telegram groups during a real weather event. Our existing 5-layer fraud detection is insufficient against this attack because the weather trigger is genuine, platform logs show zero deliveries (they actually stayed home), and coordinated mass spoofing defeats Isolation Forest's anomaly baseline. This section details our architectural response.

---

### 1. Differentiating Genuine vs Spoofed Location

GPS coordinates alone are obsolete as a verification signal. Our defense cross-validates GPS against **four independent data streams** that spoofing apps cannot simultaneously fake:

| Signal | What We Check | Why Spoofing Fails |
|---|---|---|
| **IMU Sensor Data** | Accelerometer + gyroscope motion pattern during trigger window | Spoofing apps fake GPS coordinates but never touch device motion sensors. A worker "stranded in rain" shows zero motion. A person at home shows TV-watching/resting motion signature. These are measurably different. |
| **GPS Signal Quality** | Accuracy radius variance over 15-minute window | Real GPS in heavy rain shows high variance (±50–200m). Spoofing apps output suspiciously perfect accuracy (±3–5m consistently). Perfect GPS in a storm = red flag. |
| **Cell Tower Cross-Reference** | Phone's active cell tower vs claimed GPS zone | A phone cannot fake which cell tower it connects to at the network level. GPS says Kurla zone but cell tower is in Andheri = hard contradiction. |
| **App IP Geolocation** | IP address approximate location when claim data is sent | Independent of GPS. Doesn't need to be exact — just needs to broadly match claimed zone within 10km radius. Mismatch = secondary fraud signal. |

**Scoring:** Each contradiction adds to a spoofing confidence score (0–100). Score above 60 = amber hold. Score above 85 = red review. All four contradicting simultaneously = auto-block regardless of weather genuineness.

---

### 2. Detecting a Coordinated Fraud Ring

Individual spoofing is hard to catch. Coordinated rings have a unique statistical fingerprint across these specific data points:

**Temporal Patterns**
- **Claim surge velocity:** Genuine disruptions generate claims ramping over 30–45 minutes as workers realise they cannot work. Coordinated rings generate a spike within a 2–3 minute window. Our Celery time-series monitor flags any zone where claim rate exceeds 3x baseline within 5 minutes.
- **Velocity impossibility:** GPS logs showing a worker in Zone A at 9:00am and Zone B (5km away) at 9:02am. Physically impossible. Spoofing apps generate these micro-errors when coordinate sets are switched.

**Spatial Patterns**
- **Coordinate clustering anomaly:** Real stranded workers spread naturally across a wide delivery zone. Syndicate members using the same spoofing app often cluster tightly around a specific coordinate set (the app's default target point). Statistical density analysis flags unnatural clustering — 500 workers within a 200m radius is not organic.
- **Zone-claim ratio breach:** Each delivery zone has a historical maximum claim count per disruption event. If Zone X has never exceeded 30 claims per event and suddenly shows 400, the entire zone is frozen and escalated to human review regardless of individual claim validity.

**Device and Network Patterns**
- **Device fingerprint correlation:** GPS spoofing apps leave identifiable signatures in device hardware data (same app version, same mock location provider string). Multiple claims sharing identical provider signatures = coordinated tool usage.
- **Onboarding location vs claim location:** Worker registered their home address at KYC. Claimed disruption zone is 15km from their registered address with no delivery zone assignment history there. Flagged.

**The Ring Detector Model:**
A secondary Isolation Forest instance runs exclusively on zone-level aggregate data — not individual claims. It learns normal zone-level claim patterns and fires a **Zone Compromise Alert** when aggregate behaviour deviates. This model catches the syndicate even if every individual claim looks clean in isolation.

---

### 3. UX Balance — Handling Flagged Claims Without Penalising Honest Workers

An honest worker in a genuine storm may have poor GPS signal, network drops, or a phone on low-battery mode. Our response is tiered — delay is proportional to evidence, never a silent rejection.

```
Spoofing Score 0–40    → GREEN  → Auto-pay in 15 minutes (normal flow)
Spoofing Score 41–60   → AMBER  → 2-hour soft hold, system collects more data, auto-releases if resolved
Spoofing Score 61–85   → RED    → Human review, worker notified immediately, resolved within 4 hours
Spoofing Score 86–100  → BLOCK  → Claim rejected, worker notified with reason, appeal available
```

**Worker Communication at Each Stage:**

- **Amber hold:** *"Aapka payout process ho raha hai. Thodi network issues ki wajah se 2 ghante lag sakte hain. Koi action lene ki zaroorat nahi."* (No alarm, no accusation — just a delay explanation)
- **Red review:** *"Aapka claim review mein hai. Hum 4 ghante mein update karenge. Agar aap chahein toh apni location ki ek photo bhej sakte hain."* (Optional photo proof — not mandatory)
- **Block:** *"Aapka claim approve nahi hua. Reason: [specific reason]. Appeal karne ke liye APPEAL bhejein."* (Specific reason given, appeal path provided)

**The Honest Worker Guarantee:**
- Maximum wait time for a legitimate claim: **4 hours**
- Worker is always told their claim status and expected resolution time
- No claim is ever silently rejected — every block comes with a reason and an appeal path
- Photo submission is optional not mandatory — a worker without a smartphone camera is not disadvantaged
- First-time flagged workers get benefit of the doubt — automatic appeal fast-tracked

**Appeal Process:**
Worker sends `APPEAL` via WhatsApp → human agent reviews within 2 hours → if genuine, payout released with a Rs 50 goodwill credit for the inconvenience.
