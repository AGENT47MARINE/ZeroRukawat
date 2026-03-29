# ZeroRukawat — Project Governance

This is the central repository for the **ZeroRukawat** parametric insurance platform. The project is organized into modular services to allow parallel development across teams.

## Repository Structure

| Directory | Team / Service | Core Tech |
|---|---|---|
| [`backend/`](./backend/) | Core Platform & APIs | FastAPI, PostgreSQL, Redis, Celery |
| [`ai-ml/`](./ai-ml/) | Data Science & Models | XGBoost, Scikit-learn, Pandas |
| [`admin-web/`](./admin-web/) | Admin UI (Reviews/Analytics) | React, TailwindCSS, Vite |
| [`mobile-app/`](./mobile-app/) | Worker App (Native) | React Native, Expo, FCM |
| [`whatsapp-bot/`](./whatsapp-bot/) | Onboarding & KYC | Twilio WhatsApp API, Python |
| [`docs/`](./docs/) | Product & Architecture | PRD, System Design, Tasks |

## Local Orchestration

The root level contains a `docker-compose.yml` to spin up the entire local infrastructure:
```bash
docker-compose up -d
```
*Required: Docker and Docker Compose installed locally.*

## Parallel Development Guide

- **Backend Devs**: Start in `backend/`. Configure the `alembic` migrations and implementing routes from `docs/api.md`.
- **Data Scientists**: Use `ai-ml/`. Focus on training the XGBoost pricing model and Isolation Forest fraud detection.
- **Frontend Devs**: Continue in `admin-web/`. Build the Review Queue and Heatmap UI.
- **App Devs**: Start in `mobile-app/`. Configure FCM and build the policy monitoring home screen.
- **Integration**: The WhatsApp bot in `whatsapp-bot/` should communicate with the `backend/` via internal network APIs defined in the Docker environment.

---

**Current Phase: 2 (Core Platform Infrastructure)**  
**Deadline: April 4, 2026**
