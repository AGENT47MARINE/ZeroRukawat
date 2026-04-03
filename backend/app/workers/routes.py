import uuid
from datetime import datetime

from flask import request, g
from . import workers_bp
from ..extensions import db
from ..models import Worker, Policy, Claim, Disruption
from ..utils.response import success, error
from ..utils.auth_utils import token_required
from ..services import fraud_service
from ..services.claim_signal_service import build_fraud_features, derive_disrupted_days
from ..services.payout_stage_service import (
    PAYOUT_STAGE_REQUESTED,
    PAYOUT_STAGE_FRAUD_CHECK,
    PAYOUT_STAGE_INCOME_ESTIMATION,
    PAYOUT_STAGE_PAYMENT_PROCESSING,
    PAYOUT_STAGE_CREDITED,
    PAYOUT_STAGE_HELD,
    PAYOUT_STAGE_BLOCKED,
    PAYOUT_STAGE_FAILED,
    append_stage,
    is_terminal,
    parse_timeline,
    stage_from_claim_status,
)


def _event_id_for(disruption: Disruption) -> str:
    return (
        f"{disruption.zone}_{disruption.start_time.strftime('%Y%m%d')}"
        f"_{disruption.type.replace(' ', '_').upper()}"
    )


def _get_or_create_ai_active_disruption(worker: Worker) -> Disruption | None:
    disruption = (
        Disruption.query
        .filter_by(zone=worker.zone, is_active=True)
        .order_by(Disruption.start_time.desc())
        .first()
    )
    if disruption:
        return disruption

    ai_state = fraud_service.get_disruption_status(worker.zone)
    active_disruption = next(
        (d for d in (ai_state.get('disruptions') or []) if d.get('triggered')),
        None,
    )
    if not active_disruption:
        return None

    actual_value = active_disruption.get('actual_value')
    threshold = active_disruption.get('threshold')
    threshold_value = (
        f"actual={actual_value}, threshold={threshold}"
        if actual_value is not None and threshold is not None
        else 'AI Triggered'
    )

    disruption = Disruption(
        id=str(uuid.uuid4()),
        zone=worker.zone,
        type=active_disruption.get('type') or 'AI Detected Disruption',
        threshold_value=threshold_value,
        start_time=datetime.utcnow(),
        is_active=True,
    )
    db.session.add(disruption)
    db.session.flush()
    return disruption


def _initiation_payload(claim: Claim, message: str):
    stage = claim.payout_stage or stage_from_claim_status(claim.status)
    return {
        'claim_id': claim.id,
        'payout': {
            'stage': stage,
            'is_terminal': is_terminal(stage),
            'transaction_id': claim.payout_transaction_id,
            'amount': claim.amount_credited or 0,
            'message': message,
        },
    }


def _mark_terminal_claim(claim: Claim, status: str, stage: str, message: str):
    claim.status = status
    claim.resolved_at = datetime.utcnow()
    claim.resolution_note = message
    append_stage(claim, stage, message)


@workers_bp.route('/me', methods=['GET'])
@token_required
def get_me():
    return success(g.current_user.to_dict())


@workers_bp.route('/<worker_id>/policy', methods=['GET'])
@token_required
def get_policy(worker_id):
    if g.current_user.id != worker_id and not g.current_user.is_admin:
        return error('Access denied', 403)

    policy = Policy.query.filter_by(worker_id=worker_id, status='Active').first()
    if not policy:
        return error('No active policy found', 404)
    return success(policy.to_dict())


@workers_bp.route('/<worker_id>/payouts', methods=['GET'])
@token_required
def get_payouts(worker_id):
    if g.current_user.id != worker_id and not g.current_user.is_admin:
        return error('Access denied', 403)

    policies = Policy.query.filter_by(worker_id=worker_id).all()
    policy_ids = [p.id for p in policies]
    if not policy_ids:
        return success([])

    claims = (
        Claim.query
        .filter(Claim.policy_id.in_(policy_ids))
        .order_by(Claim.created_at.desc())
        .all()
    )

    result = []
    for claim in claims:
        d = Disruption.query.get(claim.disruption_id)
        stage = claim.payout_stage or stage_from_claim_status(claim.status)
        result.append({
            'claim_id': claim.id,
            'date':     claim.created_at.date().isoformat(),
            'amount':   claim.amount_credited,
            'reason':   d.type if d else 'Unknown',
            'status':   claim.status,
            'payout_stage': stage,
            'is_terminal': is_terminal(stage),
            'transaction_id': claim.payout_transaction_id,
            'payout_error_reason': claim.payout_error_reason,
            'stage_timeline': parse_timeline(claim.payout_stage_timeline),
            'created_at': claim.created_at.isoformat(),
            'resolved_at': claim.resolved_at.isoformat() if claim.resolved_at else None,
        })
    return success(result)


@workers_bp.route('/<worker_id>/payouts/initiate', methods=['POST'])
@token_required
def initiate_payout(worker_id):
    if g.current_user.id != worker_id and not g.current_user.is_admin:
        return error('Access denied', 403)

    worker = Worker.query.get(worker_id)
    if not worker:
        return error('Worker not found', 404)

    policy = Policy.query.filter_by(worker_id=worker_id, status='Active').first()
    if not policy:
        return error('No active policy found', 404)

    if not worker.upi_id:
        return error('UPI ID is required to initiate payout', 400)

    data = request.get_json() or {}
    try:
        disrupted_days = int(data.get('disrupted_days', 1))
    except (TypeError, ValueError):
        return error('disrupted_days must be an integer between 1 and 7')
    if disrupted_days < 1 or disrupted_days > 7:
        return error('disrupted_days must be between 1 and 7')

    disruption = _get_or_create_ai_active_disruption(worker)
    if not disruption:
        return error('No active disruption in your zone. Payout can only be initiated during a disruption.', 409)

    claim = Claim(
        id=str(uuid.uuid4()),
        policy_id=policy.id,
        disruption_id=disruption.id,
        status='Processing',
        payout_transaction_id=None,
        payout_error_reason=None,
    )
    db.session.add(claim)

    append_stage(claim, PAYOUT_STAGE_REQUESTED, 'Payout request received')

    append_stage(claim, PAYOUT_STAGE_FRAUD_CHECK, 'Running fraud checks')

    fraud_features = build_fraud_features(worker)
    fraud_result = fraud_service.validate_claim(
        worker_id=worker.id,
        event_id=_event_id_for(disruption),
        gps_movement_score=fraud_features['gps_movement_score'],
        deliveries_in_window=fraud_features['deliveries_in_window'],
        claim_frequency_7d=fraud_features['claim_frequency_7d'],
        zone_traffic_clear=fraud_features['zone_traffic_clear'],
    )
    fraud_score = float(fraud_result.get('fraud_score', 0.45))
    risk_score = float(worker.risk_score if worker.risk_score is not None else fraud_score)

    # Use a conservative combined score so high risk from either AI signal triggers safer handling.
    decision_score = max(fraud_score, risk_score)

    claim.ml_fraud_score = decision_score
    status = fraud_service.fraud_score_to_claim_status(decision_score)

    if status == 'Blocked':
        _mark_terminal_claim(claim, 'Blocked', PAYOUT_STAGE_BLOCKED, 'Blocked by fraud checks')
        db.session.commit()
        return success(_initiation_payload(claim, 'Claim blocked by fraud checks'))

    if status in ('Amber', 'Red'):
        _mark_terminal_claim(claim, status, PAYOUT_STAGE_HELD, 'Claim held for additional review')
        db.session.commit()
        return success(_initiation_payload(claim, 'Claim is on temporary hold'))

    append_stage(claim, PAYOUT_STAGE_INCOME_ESTIMATION, 'Calculating eligible payout amount')

    payout_days = disrupted_days or derive_disrupted_days(disruption.start_time, disruption.end_time)

    payout_result = fraud_service.process_full_payout(
        worker_id=worker.id,
        zone=disruption.zone,
        city=worker.city,
        disrupted_days=payout_days,
        upi_id=worker.upi_id,
        worker_phone=worker.phone,
        device_token='FCM_DEV_TOKEN',
    )

    if payout_result.get('status') == 'error':
        claim.payout_error_reason = payout_result.get('error', 'AI payout pipeline failed')
        _mark_terminal_claim(claim, 'Red', PAYOUT_STAGE_FAILED, 'Payout failed during processing')
        db.session.commit()
        return success(_initiation_payload(claim, 'Payout failed during processing'))

    append_stage(claim, PAYOUT_STAGE_PAYMENT_PROCESSING, 'Processing payout transfer')
    claim.amount_credited = payout_result.get('payout_calculation', {}).get('payout', 0)
    claim.payout_transaction_id = payout_result.get('payment', {}).get('transaction_id')
    _mark_terminal_claim(claim, 'Approved', PAYOUT_STAGE_CREDITED, 'Payout credited successfully')

    db.session.commit()
    return success(_initiation_payload(claim, 'Payout credited successfully'))


@workers_bp.route('/<worker_id>', methods=['PATCH'])
@token_required
def update_worker(worker_id):
    if g.current_user.id != worker_id and not g.current_user.is_admin:
        return error('Access denied', 403)

    data = request.get_json() or {}
    worker = Worker.query.get(worker_id)
    if not worker:
        return error('Worker not found', 404)

    for field in ('upi_id', 'zone', 'city'):
        if field in data:
            setattr(worker, field, data[field])

    db.session.commit()
    return success(worker.to_dict())
