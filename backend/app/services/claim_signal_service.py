from datetime import datetime, timedelta

from ..models import Policy, Claim
from . import fraud_service


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def derive_disrupted_days(start_time: datetime, end_time: datetime | None = None) -> int:
    if not start_time:
        return 1

    effective_end = end_time or datetime.utcnow()
    days = (effective_end.date() - start_time.date()).days + 1
    return max(1, min(7, days))


def build_fraud_features(worker) -> dict:
    policy_ids = [p.id for p in Policy.query.filter_by(worker_id=worker.id).all()]
    if not policy_ids:
        return {
            'gps_movement_score': 0.5,
            'deliveries_in_window': 0,
            'claim_frequency_7d': 0,
            'zone_traffic_clear': True,
        }

    window_start = datetime.utcnow() - timedelta(days=7)
    claim_frequency_7d = Claim.query.filter(
        Claim.policy_id.in_(policy_ids),
        Claim.created_at >= window_start,
    ).count()
    deliveries_in_window = Claim.query.filter(
        Claim.policy_id.in_(policy_ids),
        Claim.status == 'Approved',
        Claim.created_at >= window_start,
    ).count()

    risk_score = float(worker.risk_score if worker.risk_score is not None else 0.5)
    gps_movement_score = _clamp(
        0.8
        - (risk_score * 0.5)
        - (min(claim_frequency_7d, 5) * 0.06)
        + (min(deliveries_in_window, 3) * 0.03),
        0.05,
        0.95,
    )

    disruption_state = fraud_service.get_disruption_status(worker.zone)
    disruptions = disruption_state.get('disruptions') or []
    zone_traffic_clear = not any(d.get('triggered') for d in disruptions)

    return {
        'gps_movement_score': round(gps_movement_score, 3),
        'deliveries_in_window': deliveries_in_window,
        'claim_frequency_7d': claim_frequency_7d,
        'zone_traffic_clear': zone_traffic_clear,
    }
