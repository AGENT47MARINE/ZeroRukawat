# ZeroRukawat Admin Dashboard

This dashboard now uses live backend APIs only. All previous inline mock datasets were removed.

## Run Locally

1. Start backend API from `backend/`:

```bash
python run.py
```

2. Start dashboard from `frontend/admin-dashboard/`:

```bash
npm install
npm run dev
```

## Environment Configuration

Create a `.env` file in `frontend/admin-dashboard/` if needed:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ADMIN_PHONE=9999999999
VITE_ADMIN_PASSWORD=Admin@2024
```

- `VITE_API_BASE_URL` points to Flask API base route.
- `VITE_ADMIN_PHONE` and `VITE_ADMIN_PASSWORD` are optional defaults for login form.

## Authentication

The dashboard calls authenticated admin endpoints:

- `POST /api/v1/auth/admin/login`
- `GET /api/v1/admin/dashboard/stats`
- `GET /api/v1/admin/workers`
- `GET /api/v1/admin/claims/pending`
- `GET /api/v1/claims/`
- `GET /api/v1/disruptions/`
- `GET /api/v1/disruptions/active`

It stores the JWT in local storage key `zr_admin_token`.

## Notes

- The Settings tab now reports real endpoint statuses and backend health.
- Fraud actions in dashboard call live resolution API: `PATCH /api/v1/claims/{claim_id}/resolve`.
- Disruption creation calls live API: `POST /api/v1/disruptions/`.
