from flask import request
from sqlalchemy import func
from datetime import datetime, timedelta

from . import admin_bp
from ..extensions import db
from ..models import Worker, Claim, Disruption, Policy
from ..utils.response import success, error
from ..utils.auth_utils import admin_required


@admin_bp.route('/dashboard/stats', methods=['GET'])
@admin_required
def dashboard_stats():
    week_ago = datetime.utcnow() - timedelta(days=7)
    total_claims = Claim.query.count()
    approved_claims = Claim.query.filter_by(status='Approved').count()

    total_payouts_week = db.session.query(
        func.sum(Claim.amount_credited)
    ).filter(
        Claim.status == 'Approved',
        Claim.resolved_at >= week_ago
    ).scalar() or 0

    return success({
        'total_workers':       Worker.query.filter_by(is_active=True, is_admin=False).count(),
        'active_disruptions':  Disruption.query.filter_by(is_active=True).count(),
        'pending_reviews':     Claim.query.filter(Claim.status.in_(['Amber', 'Red'])).count(),
        'total_payouts_week':  round(total_payouts_week, 2),
        'total_claims':        total_claims,
        'approved_claims':     approved_claims,
        'approval_rate':       round((approved_claims / total_claims * 100) if total_claims else 0, 1),
    })


@admin_bp.route('/workers', methods=['GET'])
@admin_required
def list_workers():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    zone     = request.args.get('zone')
    tier     = request.args.get('tier')

    query = Worker.query.filter_by(is_admin=False)
    if zone:
        query = query.filter_by(zone=zone)
    if tier:
        query = query.filter_by(tier=tier)

    paginated = query.order_by(Worker.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return success({
        'workers': [w.to_dict() for w in paginated.items],
        'total':   paginated.total,
        'page':    page,
        'pages':   paginated.pages,
    })


@admin_bp.route('/claims/pending', methods=['GET'])
@admin_required
def pending_claims():
    claims = (
        Claim.query
        .filter(Claim.status.in_(['Amber', 'Red']))
        .order_by(Claim.created_at.asc())
        .all()
    )
    result = []
    for claim in claims:
        policy     = Policy.query.get(claim.policy_id)
        worker     = Worker.query.get(policy.worker_id) if policy else None
        disruption = Disruption.query.get(claim.disruption_id)
        result.append({
            **claim.to_dict(),
            'worker':     worker.to_dict() if worker else None,
            'disruption': disruption.to_dict() if disruption else None,
        })
    return success(result)
