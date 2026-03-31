from flask import request, g
from . import workers_bp
from ..extensions import db
from ..models import Worker, Policy, Claim, Disruption
from ..utils.response import success, error
from ..utils.auth_utils import token_required


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

    claims = (
        Claim.query
        .filter(Claim.policy_id.in_(policy_ids), Claim.status == 'Approved')
        .order_by(Claim.created_at.desc())
        .all()
    )

    result = []
    for claim in claims:
        d = Disruption.query.get(claim.disruption_id)
        result.append({
            'claim_id': claim.id,
            'date':     claim.created_at.date().isoformat(),
            'amount':   claim.amount_credited,
            'reason':   d.type if d else 'Unknown',
            'status':   claim.status,
        })
    return success(result)


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
