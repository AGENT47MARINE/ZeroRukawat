import uuid
from datetime import date, timedelta
from flask import request, g, current_app

from . import auth_bp
from ..extensions import db
from ..models import Worker, Policy
from ..services import auth_service, premium_service
from ..utils.response import success, error
from ..utils.auth_utils import token_required


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new delivery worker and auto-create their first weekly policy."""
    data = request.get_json() or {}

    for field in ['phone', 'name', 'city', 'zone', 'tier']:
        if not data.get(field):
            return error(f'Missing required field: {field}')

    if data['tier'] not in ('Bronze', 'Silver', 'Gold'):
        return error('tier must be Bronze, Silver, or Gold')

    if Worker.query.filter_by(phone=data['phone']).first():
        return error('Phone number already registered', 409)

    worker = Worker(
        id=str(uuid.uuid4()),
        phone=data['phone'],
        name=data['name'],
        city=data['city'],
        zone=data['zone'],
        tier=data['tier'],
        upi_id=data.get('upi_id', ''),
        risk_score=0.5,
        is_active=True,
        is_admin=False,
    )
    db.session.add(worker)

    # Auto-create first active policy
    today = date.today()
    policy = Policy(
        id=str(uuid.uuid4()),
        worker_id=worker.id,
        start_date=today,
        end_date=today + timedelta(weeks=1),
        weekly_premium=premium_service.calculate_premium(data['zone'], data['tier']),
        max_payout=premium_service.get_max_payout(data['tier']),
        status='Active',
    )
    db.session.add(policy)
    db.session.commit()

    return success({
        'worker': worker.to_dict(),
        'policy': policy.to_dict(),
        'otp_hint': 'OTP sent to your phone. Use 123456 for testing.',
    }, status=201)


@auth_bp.route('/request-otp', methods=['POST'])
def request_otp():
    """Request a login OTP for a registered phone number."""
    data = request.get_json() or {}
    phone = data.get('phone')
    if not phone:
        return error('phone is required')

    worker = Worker.query.filter_by(phone=phone, is_admin=False).first()
    if not worker:
        return error('Phone number not registered', 404)
    if not worker.is_active:
        return error('Account is inactive', 403)

    # Dev: log OTP to console. Prod: call Twilio/MSG91.
    current_app.logger.info(f"[OTP] Sending to {phone} — DEV OTP: 123456")
    return success({'message': f'OTP sent to {phone}. (Dev mode: use 123456)'})


@auth_bp.route('/login', methods=['POST'])
def login():
    """Worker login via phone + OTP. Returns JWT."""
    data = request.get_json() or {}
    phone = data.get('phone')
    otp = data.get('otp')

    if not phone or not otp:
        return error('phone and otp are required')

    worker = Worker.query.filter_by(phone=phone, is_admin=False).first()
    if not worker:
        return error('Worker not found', 404)
    if not worker.is_active:
        return error('Account is inactive', 403)

    is_dev = current_app.config.get('DEBUG', True)
    if not auth_service.verify_otp(otp, is_dev=is_dev):
        return error('Invalid OTP', 401)

    return success({
        'access_token': auth_service.create_token(worker.id),
        'worker': worker.to_dict(),
    })


@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """Admin login via phone + password. Returns JWT."""
    data = request.get_json() or {}
    phone = data.get('phone')
    password = data.get('password')

    if not phone or not password:
        return error('phone and password are required')

    admin = Worker.query.filter_by(phone=phone, is_admin=True).first()
    if not admin:
        return error('Admin account not found', 404)

    if not admin.hashed_password or not auth_service.verify_password(password, admin.hashed_password):
        return error('Invalid credentials', 401)

    return success({
        'access_token': auth_service.create_token(admin.id),
        'admin': admin.to_dict(),
    })


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me():
    """Return the authenticated user's profile."""
    return success(g.current_user.to_dict())
