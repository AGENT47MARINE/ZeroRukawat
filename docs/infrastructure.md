# Infrastructure & Scaling Strategy

ZeroRukawat's core technical challenge is extreme "burstiness". The platform may sit idle for days and then suddenly need to validate 10,000 concurrent claims within 15 minutes when a sudden thunderstorm hits a major delivery zone (e.g., Bangalore_South). 

## 1. Cloud Architecture & Scalability

The platform runs on a containerized microservices architecture (Docker/Kubernetes).

*   **API Layer (FastAPI):** Sits behind Nginx/ALB. Scaled horizontally based on CPU utilization. Handles synchronous REST traffic (Admin dashboard, App syncing).
*   **Database Pooler (PgBouncer):** Crucial protective layer. Sits between the Celery workers and PostgreSQL to prevent connection limits from being exceeded during a claiming spike.
*   **Database (PostgreSQL):** Uses Read Replicas for the Admin Dashboard (heavy queries, heatmaps) to keep the primary node free for the high-volume `claims` and `disruptions` inserts. 

### Database Partitioning Strategy
*   To maintain query performance on the `claims` table over time, we use PostgreSQL declarative partitioning by month (`PARTITION BY RANGE (created_at)`).

## 2. High-Concurrency Asynchronous Flow (Celery & Redis)

We utilize a separated, priority-based queue design in Redis, consumed by specialized Celery worker pools.

1.  **Queue A: `weather_poll_queue` (Low Volume, High Priority)**
    *   A 'Master' scheduled process runs every 15 minutes checking 3rd party APIs (OpenWeatherMap) for active disruptions in all supported zones.
    *   *Result:* If a disruption > threshold is found, an entry is created in the `disruptions` table.
2.  **Queue B: `claim_eval_queue` (High Volume, Bursty)**
    *   The Master task queries the DB: `SELECT id FROM workers WHERE zone = X AND status = active`.
    *   For *every* worker found, it publishes an evaluation task to this queue.
    *   *Result:* Thousands of individual tasks enter the queue simultaneously.
3.  **Horizontal Worker Fan-Out:** 
    *   The Kubernetes cluster autoscales the Celery worker pods consuming `claim_eval_queue`. 
    *   Each worker pod loads the serialized *Isolation Forest* model into memory on boot to perform fast `<10ms` inference per claim based on the worker's recent GPS telemetry.
    *   Based on the ML score (Green/Amber/Red/Block), the claim status is updated.
4.  **Queue C: `payout_queue` (Rate-Limited)**
    *   Approved "Green" claims are pushed here, where a final worker pool processes Razorpay UPI transfers using batched API calls to avoid hitting the PSP (Payment Service Provider) rate limits.

## 3. Disaster Recovery (DR) & Redundancy

*   **RPO (Recovery Point Objective):** < 5 minutes for transaction/policy data via continuous WAL (Write-Ahead Logging) archiving to S3.
*   **RTO (Recovery Time Objective):** < 45 minutes for full cluster recreation using infrastructure-as-code (Terraform/Pulumi).
*   **API Fallbacks:** If the primary weather data source (e.g., IMD) fails during a known storm, the `weather_poll_queue` falls back to secondary sources (OpenWeather). If the ML Inference service fails, the system enters an automatic "Admin Review (Amber)" state—**it fails closed, meaning payouts are not blindly automated.**

## 4. Monitoring & Alerting

*   **Application Metrics (Prometheus + Grafana):** Visualizing Celery queue lengths, ML inference latency, and Razorpay success rates.
*   **Error Tracking (Sentry):** Captures unhandled FastAPI exceptions and React/React Native frontend crashes.
*   **Critical Alerts (PagerDuty):**
    *   *Sev 1:* PostgreSQL CPU > 90% for > 5 mins.
    *   *Sev 1:* `payout_queue` growing while active disruption is over (indicates payment gateway failure).
    *   *Sev 2:* `weather_poll_queue` hasn't executed successfully in 45 minutes.
