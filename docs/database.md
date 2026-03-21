# Database Schema

This document outlines the core PostgreSQL schema design for ZeroRukawat.

## Tables

### 1. `workers`
Stores delivery partner details and their risk profiling.
- `id` (UUID, Primary Key)
- `phone` (VARCHAR, Unique)
- `name` (VARCHAR)
- `city` (VARCHAR)
- `zone` (VARCHAR) — Primary delivery zone
- `tier` (ENUM: 'Bronze', 'Silver', 'Gold')
- `upi_id` (VARCHAR)
- `risk_score` (FLOAT) — Calculated dynamically by XGBoost
- `created_at` (TIMESTAMP)

### 2. `policies`
Tracks the weekly insurance coverage for a worker.
- `id` (UUID, Primary Key)
- `worker_id` (UUID, Foreign Key -> `workers.id`)
- `start_date` (DATE)
- `end_date` (DATE)
- `weekly_premium` (DECIMAL) — Base premium adjusted by risk score
- `max_payout` (DECIMAL)
- `status` (ENUM: 'Active', 'Lapsed', 'Cancelled')

### 3. `disruptions`
Logs external systemic events (rain, heat, strikes) detected by APIs.
- `id` (UUID, Primary Key)
- `zone` (VARCHAR)
- `type` (VARCHAR) — e.g., 'Heavy Rain', 'Curfew'
- `threshold_value` (VARCHAR) — e.g., '18mm/hr'
- `start_time` (TIMESTAMP)
- `end_time` (TIMESTAMP, Nullable)
- `is_active` (BOOLEAN)

### 4. `claims`
Records individual payout events triggered by a disruption.
- `id` (UUID, Primary Key)
- `policy_id` (UUID, Foreign Key -> `policies.id`)
- `disruption_id` (UUID, Foreign Key -> `disruptions.id`)
- `amount_credited` (DECIMAL)
- `ml_fraud_score` (FLOAT) — Output from Isolation Forest
- `status` (ENUM: 'Processing', 'Amber', 'Red', 'Approved', 'Blocked')
- `created_at` (TIMESTAMP)
- `resolved_at` (TIMESTAMP, Nullable)

## Redis Caching layer
- **Event ID Deduping:** Redis is used to store `ZONE_DATE` combinations to ensure a worker is only paid *once* per calendar day for a disruption, preventing double-billing on overlapping weather events.
- **API Polling state:** Temporarily stores the last fetched OpenWeatherMap / traffic data to avoid hitting rate limits.
