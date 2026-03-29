# ZeroRukawat Worker App

This is the React Native (Expo) application for delivery partners to manage their policies and receive automated disruption alerts.

## Key Features
1. **Policy Status**: Real-time view of active coverage and premium due dates.
2. **Payout History**: List of past UPI credits with status tracking.
3. **Disruption Alerts**: High-priority push notifications triggered by FastAPI.
4. **Offline Access**: AsyncStorage caching for policy viewing in low-connectivity areas.

## Core Screens
- `Home`: Active policy, coverage status, and premium details.
- `Payouts`: Detailed history of all claim events.
- `Alerts`: Live view of active disruptions in the current zone.
- `Settings`: Language preference and UPI configuration.

## Setup
1. Install Expo Go on your physical device.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run start`.
4. Scan the QR code to open the app.
