from datetime import datetime, timedelta
from flask import g

from . import ai_bp
from ..models import Policy, Claim
from ..utils.response import success
from ..utils.auth_utils import token_required
from ..services import fraud_service


def _seasonal_factor(now_utc: datetime) -> float:
    month = now_utc.month
    if month in (6, 7, 8, 9):
        return 1.2
    if month in (11, 12, 1):
        return 0.9
    return 1.0


def _weeks_active(created_at: datetime) -> int:
    if not created_at:
        return 0
    return max(0, (datetime.utcnow() - created_at).days // 7)


def _claim_stats(worker_id: str) -> tuple[int, int]:
    policy_ids = [p.id for p in Policy.query.filter_by(worker_id=worker_id).all()]
    if not policy_ids:
        return 0, 0

    claim_history_count = Claim.query.filter(Claim.policy_id.in_(policy_ids)).count()
    active_window_start = datetime.utcnow() - timedelta(days=30)
    worker_activity_level = Claim.query.filter(
        Claim.policy_id.in_(policy_ids),
        Claim.status == 'Approved',
        Claim.created_at >= active_window_start,
    ).count()

    return claim_history_count, worker_activity_level


def _build_risk_payload(worker) -> dict:
    claim_history_count, worker_activity_level = _claim_stats(worker.id)
    zone_risk_score = float(worker.risk_score if worker.risk_score is not None else 0.5)

    return {
        'city': worker.city,
        'zone_risk_score': min(max(zone_risk_score, 0.0), 1.0),
        'worker_activity_level': worker_activity_level,
        'claim_history_count': claim_history_count,
        'seasonal_factor': _seasonal_factor(datetime.utcnow()),
        'weeks_active': _weeks_active(worker.created_at),
    }


@ai_bp.route('/worker-insights', methods=['GET'])
@token_required
def worker_insights():
    worker = g.current_user

    risk_payload = _build_risk_payload(worker)
    risk_result = fraud_service.get_risk_score(worker.id, risk_payload)
    disruption_result = fraud_service.get_disruption_status(worker.zone)

    disruptions = disruption_result.get('disruptions') or []
    active_disruption = next((d for d in disruptions if d.get('triggered')), None)
    disruption_summary = active_disruption or {
        'triggered': False,
        'type': None,
        'event_id': None,
        'zone': worker.zone,
    }
    disruption_summary['zone_data'] = disruption_result.get('zone_data', {})

    fallback = bool(risk_result.get('fallback') or disruption_result.get('fallback'))

    return success({
        'worker': {
            'id': worker.id,
            'zone': worker.zone,
            'city': worker.city,
            'tier': worker.tier,
            'risk_score': worker.risk_score,
        },
        'risk': {
            'score': risk_payload['zone_risk_score'],
            'tier': risk_result.get('tier'),
            'tier_label': risk_result.get('tier_label'),
            'base_premium': risk_result.get('base_premium'),
            'adjusted_premium': risk_result.get('adjusted_premium'),
            'city_factor': risk_result.get('city_factor'),
            'source': 'ai' if not risk_result.get('fallback') else 'fallback',
        },
        'disruption': disruption_summary,
        'fallback': fallback,
    })
