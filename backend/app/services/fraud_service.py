"""
Fraud service — HTTP client that calls the AI server (ai/main.py).
If the AI server is unreachable, falls back to Amber status (fail-safe: never auto-pay on error).
"""
import requests
from flask import current_app


def _ai_url() -> str:
    return current_app.config.get('AI_SERVER_URL', 'http://localhost:5001')


def get_disruption_status(zone: str) -> dict:
    """Call AI server: GET /disruption-status/{zone}."""
    try:
        resp = requests.get(f"{_ai_url()}/disruption-status/{zone}", timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        current_app.logger.warning(f"[FraudSvc] AI disruption check failed for {zone}: {e}")
        return {
            'zone': zone,
            'zone_data': {},
            'disruptions': [{'triggered': False, 'type': None, 'event_id': None, 'zone': zone}],
            'fallback': True,
            'error': str(e),
        }


def get_risk_score(worker_id: str, payload: dict) -> dict:
    """Call AI server: POST /risk-score/{worker_id}."""
    try:
        resp = requests.post(f"{_ai_url()}/risk-score/{worker_id}", json=payload, timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        current_app.logger.warning(f"[FraudSvc] AI risk score failed for {worker_id}: {e}")
        return {
            'tier': 1,
            'tier_label': 'Silver',
            'base_premium': 79,
            'adjusted_premium': 79,
            'city_factor': 1.0,
            'fallback': True,
            'error': str(e),
        }


def check_disruption(zone: str) -> dict:
    """Call AI server: GET /disruption-status/{zone}"""
    return get_disruption_status(zone)


def validate_claim(worker_id: str, event_id: str, gps_movement_score: float,
                   deliveries_in_window: int, claim_frequency_7d: int,
                   zone_traffic_clear: bool) -> dict:
    """Call AI server: POST /validate-claim — returns fraud_score and is_flagged."""
    try:
        payload = {
            'event_id':            event_id,
            'worker_id':           worker_id,
            'gps_movement_score':  gps_movement_score,
            'deliveries_in_window': deliveries_in_window,
            'claim_frequency_7d':  claim_frequency_7d,
            'zone_traffic_clear':  zone_traffic_clear,
        }
        resp = requests.post(f"{_ai_url()}/validate-claim", json=payload, timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        current_app.logger.warning(f"[FraudSvc] AI fraud check failed — defaulting to Amber: {e}")
        # Fail-safe: return Amber (soft hold), never auto-approve on error
        return {'is_flagged': False, 'fraud_score': 0.45, 'fallback': True, 'error': str(e)}


def process_full_payout(worker_id: str, zone: str, city: str,
                        disrupted_days: int, upi_id: str,
                        worker_phone: str, device_token: str) -> dict:
    """Call AI server: POST /process-payout — full pipeline including income estimate + Razorpay stub."""
    try:
        payload = {
            'worker_id':     worker_id,
            'zone':          zone,
            'city':          city,
            'disrupted_days': disrupted_days,
            'worker_phone':  worker_phone,
            'device_token':  device_token,
            'upi_id':        upi_id,
        }
        resp = requests.post(f"{_ai_url()}/process-payout", json=payload, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        current_app.logger.error(f"[FraudSvc] AI payout pipeline failed: {e}")
        return {'status': 'error', 'error': str(e)}


def fraud_score_to_claim_status(fraud_score: float) -> str:
    """
    Map Isolation Forest fraud score (0.0–1.0) to claim status per PRD.
      0.00–0.40 → Approved (Green)
      0.41–0.60 → Amber
      0.61–0.85 → Red
      0.86–1.00 → Blocked
    """
    if fraud_score <= 0.40:
        return 'Approved'
    elif fraud_score <= 0.60:
        return 'Amber'
    elif fraud_score <= 0.85:
        return 'Red'
    return 'Blocked'
