import uuid
from datetime import datetime
from flask import request
from . import disruptions_bp
from ..extensions import db
from ..models import Disruption
from ..utils.response import success, error
from ..utils.auth_utils import admin_required


@disruptions_bp.route('/active', methods=['GET'])
def get_active():
    """Public — returns all currently active disruptions across all zones."""
    disruptions = Disruption.query.filter_by(is_active=True).all()
    return success([d.to_dict() for d in disruptions])


@disruptions_bp.route('/', methods=['GET'])
@admin_required
def get_all():
    """Admin — full disruption history, filterable by zone."""
    zone = request.args.get('zone')
    query = Disruption.query
    if zone:
        query = query.filter_by(zone=zone)
    disruptions = query.order_by(Disruption.start_time.desc()).all()
    return success([d.to_dict() for d in disruptions])


@disruptions_bp.route('/', methods=['POST'])
@admin_required
def create():
    """Admin — manually create a disruption event (for testing / edge cases)."""
    data = request.get_json() or {}
    for field in ('zone', 'type'):
        if not data.get(field):
            return error(f'Missing required field: {field}')

    disruption = Disruption(
        id=str(uuid.uuid4()),
        zone=data['zone'],
        type=data['type'],
        threshold_value=data.get('threshold_value', 'Manual'),
        start_time=datetime.utcnow(),
        is_active=True,
    )
    db.session.add(disruption)
    db.session.commit()
    return success(disruption.to_dict(), status=201)
