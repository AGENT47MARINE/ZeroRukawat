# ZeroRukawat WhatsApp Bot

This directory contains the logic for worker onboarding and KYC via the Twilio WhatsApp API.

## Core Flows
1. **Registration**: Name, City, Zone collection.
2. **KYC**: Image upload and validation (simulated).
3. **Policies**: Fetching current policy status and payout history.
4. **Commands**: `HELP`, `STATUS`, `DELETE-MY-DATA`.

## Setup
1. Create a `.env` with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_NUMBER`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run the webhook handler: `uvicorn app.main:app --port 5000`.

## Testing
Use `ngrok` to expose your local port 5000 and configure the Twilio Sandbox webhook URL.
