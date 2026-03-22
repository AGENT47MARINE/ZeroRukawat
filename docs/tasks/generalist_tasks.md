# Generalist / Platform Engineer Task List

This document acts as the Execution Plan for the "Glue" – system integrity, deployments, QA, and cross-team integrations.

## Phase 2 & 3 Focus: Integration & "The Glue"

- [ ] **Worker Onboarding Loop (Twilio / WhatsApp API)**
  - [ ] Register a Twilio Sandbox for WhatsApp.
  - [ ] Build the conversational Webhook handler (`POST /api/v1/workers/register`) linking the user's phone number to their database profile.
  - [ ] Extract explicit consent (DPDP compliance) via a basic template flow ("Reply 1 to Agree").
- [ ] **Payments Orchestration (Razorpay Sandbox)**
  - [ ] Establish the Razorpay test API keys.
  - [ ] Formulate the standard `Payout` request structure utilizing the worker's registered UPI ID.
  - [ ] Build robust webhook handlers to record `payout.processed` / `payout.failed` status changes directly into the `claims` table.
- [ ] **System Integrity & Load Testing (QA)**
  - [ ] Write End-to-End integration tests (e.g., triggering a mock 'Heavy Rain' payload, ensuring Celery wakes up, runs the specific `worker_ids` through the mocked Isolation Forest, and initiates Razorpay).
  - [ ] Use `Locust` to simulate 5,000 concurrent HTTP submissions to the FastAPI endpoints to identify bottleneck points. Ensure PgBouncer effectively prevents connection drops.
- [ ] **Containerization & Deployment Architecture**
  - [ ] Write a unified `docker-compose.yml` to spin up PostgreSQL, Redis, FastAPI backend, and Celery workers locally with a single command.
  - [ ] Define the AWS Elastic Container Service (ECS) or Kubernetes (EKS) task definitions for the production target.
  - [ ] Script the Github Actions CI/CD pipeline to automate Pytest runs and Docker image pushes on PR.
- [ ] **Data Anonymization (Cron Job)**
  - [ ] Write the 72-hour `purge_raw_telemetry` script ensuring compliance with the Data Privacy rules (deleting raw GPS/IMU logs post-claim resolution).
