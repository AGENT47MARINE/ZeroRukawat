from datetime import datetime
from flask import request
from . import claims_bp
from ..extensions import db
from ..models import Claim, Policy, Disruption, Worker
from ..utils.response import success, error
from ..utils.auth_utils import admin_required, require_internal_key
from ..services import fraud_service, notification_service
from ..services.claim_signal_service import build_fraud_features, derive_disrupted_days
from ..services.payout_stage_service import (
    PAYOUT_STAGE_FRAUD_CHECK,
    PAYOUT_STAGE_INCOME_ESTIMATION,
    PAYOUT_STAGE_PAYMENT_PROCESSING,
    PAYOUT_STAGE_CREDITED,
    PAYOUT_STAGE_HELD,
    PAYOUT_STAGE_BLOCKED,
    PAYOUT_STAGE_FAILED,
    append_stage,
)


@claims_bp.route('/evaluate', methods=['POST'])
@require_internal_key
def evaluate():
    """
    Internal endpoint (X-Internal-Key required).
    Runs fraud evaluation via AI server for all Processing claims of a disruption.
    """
    data = request.get_json() or {}
    disruption_id = data.get('disruption_id')
    if not disruption_id:
        return error('disruption_id is required')

    disruption = Disruption.query.get(disruption_id)
    if not disruption:
        return error('Disruption not found', 404)

    claims = Claim.query.filter_by(disruption_id=disruption_id, status='Processing').all()
    results = {'processed': 0, 'approved': 0, 'amber': 0, 'red': 0, 'blocked': 0, 'errors': 0}

    for claim in claims:
        try:
            policy = Policy.query.get(claim.policy_id)
            worker = Worker.query.get(policy.worker_id)
            append_stage(claim, PAYOUT_STAGE_FRAUD_CHECK, 'Running fraud checks')

            event_id = (
                f"{disruption.zone}_{disruption.start_time.strftime('%Y%m%d')}"
                f"_{disruption.type.replace(' ', '_').upper()}"
            )

            fraud_features = build_fraud_features(worker)
            fraud_result = fraud_service.validate_claim(
                worker_id=worker.id,
                event_id=event_id,
                gps_movement_score=fraud_features['gps_movement_score'],
                deliveries_in_window=fraud_features['deliveries_in_window'],
                claim_frequency_7d=fraud_features['claim_frequency_7d'],
                zone_traffic_clear=fraud_features['zone_traffic_clear'],
            )

            fraud_score = fraud_result.get('fraud_score', 0.3)
            status = fraud_service.fraud_score_to_claim_status(fraud_score)

            claim.ml_fraud_score = fraud_score
            claim.status = status

            if status == 'Approved':
                append_stage(claim, PAYOUT_STAGE_INCOME_ESTIMATION, 'Calculating eligible payout amount')
                payout_result = fraud_service.process_full_payout(
                    worker_id=worker.id,
                    zone=disruption.zone,
                    city=worker.city,
                    disrupted_days=derive_disrupted_days(disruption.start_time, disruption.end_time),
                    upi_id=worker.upi_id or 'worker@upi',
                    worker_phone=worker.phone,
                    device_token='FCM_DEV_TOKEN',
                )
                if payout_result.get('status') == 'error':
                    claim.status = 'Red'
                    claim.payout_error_reason = payout_result.get('error', 'AI payout pipeline failed')
                    claim.resolved_at = datetime.utcnow()
                    append_stage(claim, PAYOUT_STAGE_FAILED, 'Payout failed during processing')
                    results['errors'] += 1
                else:
                    append_stage(claim, PAYOUT_STAGE_PAYMENT_PROCESSING, 'Processing payout transfer')
                    payout = payout_result.get('payout_calculation', {}).get('payout', 0)
                    claim.amount_credited = payout
                    claim.payout_transaction_id = payout_result.get('payment', {}).get('transaction_id')
                    claim.resolved_at = datetime.utcnow()
                    append_stage(claim, PAYOUT_STAGE_CREDITED, 'Payout credited successfully')
                    notification_service.notify_payout_approved(worker, payout, disruption.type)
                    results['approved'] += 1
            elif status == 'Amber':
                append_stage(claim, PAYOUT_STAGE_HELD, 'Claim held for additional review')
                notification_service.notify_claim_amber(worker)
                results['amber'] += 1
            elif status == 'Red':
                append_stage(claim, PAYOUT_STAGE_HELD, 'Claim held for manual review')
                results['red'] += 1
            else:
                append_stage(claim, PAYOUT_STAGE_BLOCKED, 'Blocked by fraud controls')
                notification_service.notify_claim_blocked(worker, 'Fraud detected')
                results['blocked'] += 1

            results['processed'] += 1

        except Exception as e:
            results['errors'] += 1
            from flask import current_app
            current_app.logger.error(f"[Claims] Error evaluating claim {claim.id}: {e}")

    db.session.commit()
    return success(results)


@claims_bp.route('/', methods=['GET'])
@admin_required
def get_all():
    status_filter = request.args.get('status')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    query = Claim.query
    if status_filter:
        query = query.filter_by(status=status_filter)

    paginated = query.order_by(Claim.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return success({
        'claims': [c.to_dict() for c in paginated.items],
        'total':  paginated.total,
        'page':   page,
        'pages':  paginated.pages,
    })


@claims_bp.route('/<claim_id>', methods=['GET'])
@admin_required
def get_one(claim_id):
    claim = Claim.query.get(claim_id)
    if not claim:
        return error('Claim not found', 404)
    return success(claim.to_dict())


@claims_bp.route('/<claim_id>/resolve', methods=['PATCH'])
@admin_required
def resolve(claim_id):
    """Admin manually approves or rejects an Amber/Red claim."""
    data = request.get_json() or {}
    action = data.get('action')
    reason = data.get('reason', '')

    if action not in ('APPROVE', 'REJECT'):
        return error('action must be APPROVE or REJECT')

    claim = Claim.query.get(claim_id)
    if not claim:
        return error('Claim not found', 404)
    if claim.status not in ('Amber', 'Red'):
        return error(f'Cannot resolve a claim with status: {claim.status}', 422)

    policy = Policy.query.get(claim.policy_id)
    worker = Worker.query.get(policy.worker_id)
    disruption = Disruption.query.get(claim.disruption_id)

    if action == 'APPROVE':
        claim.status = 'Approved'
        claim.resolved_at = datetime.utcnow()
        claim.resolution_note = reason or 'Manually approved by admin'
        if not claim.amount_credited:
            append_stage(claim, PAYOUT_STAGE_INCOME_ESTIMATION, 'Calculating eligible payout amount')
            payout_result = fraud_service.process_full_payout(
                worker_id=worker.id, zone=disruption.zone, city=worker.city,
                disrupted_days=derive_disrupted_days(disruption.start_time, disruption.end_time), upi_id=worker.upi_id or 'worker@upi',
                worker_phone=worker.phone, device_token='FCM_DEV_TOKEN',
            )
            if payout_result.get('status') == 'error':
                claim.payout_error_reason = payout_result.get('error', 'AI payout pipeline failed')
                append_stage(claim, PAYOUT_STAGE_FAILED, 'Payout failed during processing')
                db.session.commit()
                return error('Unable to process payout at this time', 502)
            append_stage(claim, PAYOUT_STAGE_PAYMENT_PROCESSING, 'Processing payout transfer')
            claim.amount_credited = payout_result.get('payout_calculation', {}).get('payout', 0)
            claim.payout_transaction_id = payout_result.get('payment', {}).get('transaction_id')
        append_stage(claim, PAYOUT_STAGE_CREDITED, 'Payout credited successfully')
        notification_service.notify_payout_approved(worker, claim.amount_credited, disruption.type)
    else:
        claim.status = 'Blocked'
        claim.resolved_at = datetime.utcnow()
        claim.resolution_note = reason or 'Manually rejected by admin'
        append_stage(claim, PAYOUT_STAGE_BLOCKED, 'Claim blocked by admin')
        notification_service.notify_claim_blocked(worker, reason)

    db.session.commit()
    return success({'claim': claim.to_dict(), 'payout_initiated': action == 'APPROVE'})
