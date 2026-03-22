# Frontend Engineer Task List

This document outlines the UI workflows and mobile application infrastructure for ZeroRukawat.

## Phase 3 Focus: Admin Web Dashboard (React)
- [ ] **Initialization**
  - [ ] Initialize the project: `npm init vite@latest admin-web -- --template react-ts`.
  - [ ] Install and configure TailwindCSS, `react-router-dom`, and `axios`.
- [ ] **Core Components**
  - [ ] Build the layout skeleton: Sidebar navigation (Dashboard, Claims Queue, Analytics, Settings).
  - [ ] Implement a reusable Data Table component for displaying `claims` and `disruptions`.
- [ ] **Reviewer Queue Integration**
  - [ ] Fetch the 'Amber' and 'Red' flagged claims from `GET /admin/claims/review`.
  - [ ] Build the Action Panel (Approve/Reject buttons) sending data to `POST /admin/claims/{claim_id}/resolve`.
  - [ ] Display obfuscated worker data (e.g., `+91 ****** 4321`) to comply with DPDP.
- [ ] **Visual Data (Heatmaps)**
  - [ ] Integrate a mapping library (e.g., `react-leaflet`) to visualize active disruptions and corresponding worker claim density.

