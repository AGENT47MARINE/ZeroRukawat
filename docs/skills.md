# Skills & Workflow Guidelines

This document outlines the workflow and skills/tools required across different project domains to ensure successful and unified delivery of ZeroRukawat.

## Workflow & Phases
1. **Phase 1 (Completed):** Ideation, system design, DB schema, API contracts.
2. **Phase 2 (March 21–April 4):** Worker registration, WhatsApp bot (Twilio), XGBoost premium model, Razorpay simulation, basic disruption triggers.
3. **Phase 3 (April 5–17):** Isolation Forest fraud model, advanced spoofing detection, web & mobile dashboards, PWA mobile setup, demo preparation.

## Core Tech Stack & Required Skills

### Backend / AI
- **Python:** Advanced proficiency.
- **FastAPI:** Building robust, asynchronous REST APIs.
- **Celery & Redis:** Managing background worker tasks and rate limiting/caching.
- **PostgreSQL:** Relational database management.
- **Machine Learning:** Scikit-Learn (Isolation Forest, Linear Regression), XGBoost.

### Frontend (Admin Web)
- **Javascript/Typescript:** Core understanding.
- **React.js:** Component architecture, hooks.
- **TailwindCSS:** Rapid, responsive UI styling.
- **Vite:** Fast builds and PWA plugins.
- **State & Routing:** Context/Zustand and React Router.

### Mobile App (Worker App)
- **React Native (Expo):** Cross-platform mobile development.
- **Zustand:** Mobile state management.
- **AsyncStorage:** Offline capability handling.
- **Push Notifications:** Deep understanding of Firebase FCM and Expo notification limits on low-end Android devices.

### Tooling to Remember
- `npm` / `npx` for frontend/app project initialization.
- Python `pip` or `poetry` for backend package management.
- Ensure cross-validation of requirements before implementing new packages.
