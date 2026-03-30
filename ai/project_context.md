# GigShield — Project Context

## What it is
Parametric income insurance for Amazon/Flipkart delivery partners in India.
Workers pay Rs 49–99/week. When an external disruption (rain, heat, fog, AQI, strike, zone closure) hits their delivery zone, they automatically receive 70% of their lost daily income via UPI — no claim filing required.

## Who it's for
Amazon and Flipkart e-commerce delivery partners only. Not food delivery. Not multi-segment.

## How it works (end to end)
1. Worker onboards via WhatsApp or mobile app (Aadhaar KYC, mock)
2. AI risk scorer assigns them Bronze / Silver / Gold tier → sets weekly premium
3. Background job polls weather + traffic + AQI + platform APIs every 15 min
4. If a disruption threshold is crossed → system checks worker is actually idle (GPS + delivery logs)
5. Fraud model validates the claim (5 layers)
6. Income estimator calculates exact payout amount
7. Razorpay sandbox credits UPI within 15 minutes, WhatsApp notification sent

## Disruption triggers (7 total)
| Type | Threshold |
|------|-----------|
| Heavy rain | > 15mm/hr |
| Extreme heat | > 43°C |
| Dense fog | visibility < 100m |
| Severe AQI | > 300 |
| Local curfew / bandh | zone movement restriction declared |
| Warehouse / hub strike | hub_status = CLOSED |
| Sudden zone closure | zone_status = INACTIVE |

## Payout tiers
- Bronze (≤ Rs 4,000/week): Rs 49/week premium, max Rs 2,450/week payout
- Silver (Rs 4,000–7,000/week): Rs 79/week, max Rs 3,850/week
- Gold (> Rs 7,000/week): Rs 99/week, max Rs 6,300/week
- Formula: `(weekly_baseline / 5) × 0.70 × disrupted_days`

## Tech stack (non-AI parts)
- Backend: FastAPI (Python)
- DB: PostgreSQL
- Cache / duplicate store: Redis
- Task queue: Celery + Redis
- Payments: Razorpay sandbox (UPI)
- Notifications: WhatsApp Business API (Twilio sandbox) + Firebase FCM
- Frontend: React Native (worker app), React + Tailwind (admin dashboard)
- KYC: Aadhaar / DigiLocker API (mock)

## External APIs
| API | Purpose | Status |
|-----|---------|--------|
| OpenWeatherMap (free) | Rain, temp, fog, visibility | Live |
| Google Maps Traffic API | Zone congestion, road closures | Live |
| CPCB India | AQI | Mock |
| Google Maps Platform | GPS / zone validation | Live |
| Amazon / Flipkart Partner API | Batch data, delivery logs, zone status | Mock / simulated |
| Razorpay | UPI payout | Sandbox |

## What is mocked vs real (hackathon scope)
- **Real**: OpenWeatherMap calls, all 4 ML models running, FastAPI endpoints, Razorpay sandbox
- **Mock**: CPCB AQI (static lookup), Google Traffic (rule-based), Platform batch/GPS data (synthetic generator), Aadhaar KYC
