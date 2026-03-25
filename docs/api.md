# API Documentation

This document outlines the core RESTful endpoints for the ZeroRukawat backend, built with FastAPI. All endpoints return JSON.

## Base URL
`https://api.zerorukawat.com/api/v1` (Production)
`http://localhost:8000/api/v1` (Local Development)

## Authentication
Admin endpoints require a Bearer token (JWT) in the `Authorization` header. Worker endpoints (mobile app) use token-based authentication linked to their registered phone number or whatsapp.

---

### Worker Endpoints (App / WhatsApp)

#### `POST /workers/register`
- **Purpose:** Registers a new delivery partner via KYC.
- **Payload:** `{"phone": "+91...", "name": "...", "city": "...", "tier": "Bronze|Silver|Gold"}`
- **Response:** `{"worker_id": "...", "token": "..."}`

#### `GET /workers/{worker_id}/policy`
- **Purpose:** Fetches the active policy, premium due date, and coverage details.
- **Response:** `{"policy_id": "...", "status": "active", "premium_due": "YYYY-MM-DD", "max_payout": 2450}`

#### `GET /workers/{worker_id}/payouts`
- **Purpose:** Fetches the history of past payouts.
- **Response:** `[{"claim_id": "...", "date": "YYYY-MM-DD", "amount": 448, "reason": "Heavy Rain"}]`

---

### System / Trigger Endpoints

#### `GET /disruptions/active`
- **Purpose:** Returns a list of all currently active disruptions (rain, heat, etc.) across all zones.
- **Response:** `[{"zone": "Mumbai_Kurla", "type": "Heavy Rain", "severity": "High", "active_since": "YYYY-MM-DDTHH:MM:SS"}]`

#### `POST /claims/evaluate` (Internal)
- **Purpose:** Triggered by Celery tasks when a disruption hits a zone. Validates workers in that zone against the 5-layer fraud pipeline.
- **Payload:** `{"zone_id": "...", "disruption_id": "..."}`
- **Response:** `{"processed_claims": 150, "approved": 120, "amber_hold": 20, "red_flag": 5, "blocked": 5}`

---

### Admin Dashboard Endpoints

#### `GET /admin/dashboard/stats`
- **Purpose:** Aggregates stats for the admin overview (loss ratios, total payouts, active disruptions).
- **Response:** `{"total_payouts_week": 54000, "active_disruptions": 3, "pending_reviews": 25}`

#### `POST /admin/claims/{claim_id}/resolve`
- **Purpose:** Agent action to manually approve or reject an Amber/Red flagged claim.
- **Payload:** `{"action": "APPROVE|REJECT", "reason": "..."}`
- **Response:** `{"status": "success", "payout_initiated": true/false}`
