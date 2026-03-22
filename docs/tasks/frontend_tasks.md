# Frontend & Mobile Engineer Task List

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

## Phase 3 Focus: Worker Mobile App (React Native/Expo)
- [ ] **Project Setup (Alpha Shell)**
  - [ ] Initialize the project: `npx create-expo-app worker-app`.
  - [ ] Install `zustand` (state) and `@react-native-async-storage/async-storage` (offline capability).
- [ ] **UI Implementation (High Contrast, Low Bandwidth)**
  - [ ] Implement Home Screen displaying current Zone Risk / Premium status.
  - [ ] Build the Alert Screen (Big bold text/colors when a disruption triggers in their zone).
  - [ ] Payout History Screen parsing `GET /workers/{worker_id}/payouts`.
- [ ] **Offline Resilience (AsyncStorage)**
  - [ ] Save the latest known Premium/Policy status locally so the app opens instantly without network calls.
  - [ ] Build an offline queuing system for the GPS telemetry loop (cache internally if `POST` fails, retry later).
- [ ] **Firebase Cloud Messaging (FCM)**
  - [ ] Configure `expo-notifications` for Android.
  - [ ] Ensure background handlers are capable of waking the app to display a Custom 'Disruption Alert' modal even when closed.
- [ ] **Localization**
  - [ ] Add `i18next` parsing for Hindi, Tamil, Telugu based on the device's default locale.
