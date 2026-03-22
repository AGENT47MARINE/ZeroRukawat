# Backend Engineer Task List

This document outlines the Execution Plan for the core platform infrastructure of ZeroRukawat.

## Local Environment Setup
- [ ] Ensure local PostgreSQL and Redis are installed and running on default ports.
- [ ] Establish a Python `virtualenv` and generate a `requirements.txt` incorporating: FastAPI, Uvicorn, SQLAlchemy, Alembic, Celery, Redis, Pydantic, and Scikit-learn (for loading ML models).

## Phase 2 Focus: Database & API Foundations
- [ ] **Database Setup (PostgreSQL)**
  - [ ] Initialize Alembic (`alembic init`).
  - [ ] Translate the schema from `docs/database.md` into SQLAlchemy models (`workers`, `policies`, `disruptions`, `claims`).
  - [ ] Run the first migration.
- [ ] **API Architecture (FastAPI)**
  - [ ] Setup standard project flow (`/app/main.py`, `/app/api`, `/app/models`, `/app/schemas`).
  - [ ] Build dependency injection for DB sessions (`get_db`).
  - [ ] Implement Worker endpoints:
    - [ ] `POST /api/v1/workers/register` (Handle Twilio payload).
    - [ ] `GET /api/v1/workers/{worker_id}/policy`
- [ ] **Asynchronous Infrastructure (Celery & Redis)**
  - [ ] Configure `celery_app.py` pointing correctly to the local Redis instance.
  - [ ] Build the `weather_poll_task`: Runs every 15 mins, pings a mock API, and inserts an active disruption into the DB if triggered.

## Phase 3 Focus: High Concurrency ML Pipeline
- [ ] **Integration of ML Models**
  - [ ] Create a service layer that loads the ML team's serialized XGBoost (premium) and Isolation Forest (fraud) models into memory upon worker boot.
- [ ] **The Evaluation Fan-Out**
  - [ ] Build the `claim_eval_task`: Given a `disruption_id`, fan out sub-tasks to evaluate every active worker in that zone through the Isolation forest model.
  - [ ] Implement the rule engine routing the result to the DB (Green/Amber/Red/Block states).
- [ ] **Payment Simulation**
  - [ ] Build the `payout_task` to send mocked API calls to the Razorpay sandbox for 'Green' claims.
