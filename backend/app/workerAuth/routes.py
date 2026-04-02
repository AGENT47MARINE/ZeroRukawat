import uuid
from datetime import date, timedelta
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import request, g, current_app

from . import auth_bp
from ..extensions import db
from ..models import Worker, Policy
from ..services import auth_service, premium_service, otp_service
from ..utils.response import success, error
from ..utils.auth_utils import token_required


def _otp_expiry_seconds() -> int:
    return int(current_app.config.get('OTP_EXPIRY_MINUTES', 10)) * 60


def _otp_resend_seconds() -> int:
    return int(current_app.config.get('OTP_RESEND_COOLDOWN_MINUTES', 10)) * 60


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt='register-otp')


def _build_registration_token(payload: dict) -> str:
    return _serializer().dumps(payload)


def _read_registration_token(token: str) -> tuple[dict | None, str | None]:
    try:
        payload = _serializer().loads(token, max_age=_otp_expiry_seconds())
        return payload, None
    except SignatureExpired:
        return None, 'Expired OTP'
    except BadSignature:
        return None, 'Invalid registration token'


@auth_bp.route('/register', methods=['POST'])
def register():
    """Start worker registration by requesting Twilio Verify OTP."""
    data = request.get_json() or {}

    for field in ['phone', 'name', 'city', 'zone', 'tier']:
        if not data.get(field):
            return error(f'Missing required field: {field}')

    if data['tier'] not in ('Bronze', 'Silver', 'Gold'):
        return error('tier must be Bronze, Silver, or Gold')

    phone = otp_service.normalize_phone(data['phone'])
    if not phone:
        return error('Invalid phone number format')

    if Worker.query.filter_by(phone=phone).first():
        return error('Phone number already registered', 409)

    cooldown_minutes = int(current_app.config.get('OTP_RESEND_COOLDOWN_MINUTES', 10))
    wait_seconds = otp_service.get_resend_wait_seconds(phone, 'register', cooldown_minutes)
    if wait_seconds > 0:
        return error(
            'You can resend OTP after 10 minutes',
            429,
            details={'resend_after_seconds': wait_seconds},
        )

    sms_ok, sms_ref = otp_service.send_otp_sms(phone, purpose='register')
    if not sms_ok:
        return error('Failed to send OTP SMS. Please try again.', 500)

    registration_token = _build_registration_token({
        'phone': phone,
        'name': data['name'],
        'city': data['city'],
        'zone': data['zone'],
        'tier': data['tier'],
        'upi_id': data.get('upi_id', ''),
    })

    return success({
        'message': 'OTP sent to your phone number',
        'phone': phone,
        'expires_in_seconds': _otp_expiry_seconds(),
        'resend_after_seconds': _otp_resend_seconds(),
        'reference': sms_ref,
        'registration_token': registration_token,
    })


@auth_bp.route('/register/verify-otp', methods=['POST'])
def verify_register_otp():
    """Verify Twilio OTP and persist worker only on successful verification."""
    data = request.get_json() or {}
    phone = otp_service.normalize_phone(data.get('phone', ''))
    otp = str(data.get('otp', '')).strip()
    registration_token = data.get('registration_token', '')

    if not phone or not otp or not registration_token:
        return error('phone, otp and registration_token are required')

    payload, token_error = _read_registration_token(registration_token)
    if token_error == 'Expired OTP':
        return error('Expired OTP', 410)
    if token_error:
        return error(token_error, 400)

    if payload.get('phone') != phone:
        return error('Phone number does not match registration token', 400)

    if Worker.query.filter_by(phone=phone).first():
        return error('Phone number already registered', 409)

    if not otp_service.verify_otp(phone, otp):
        return error('Wrong OTP', 401)

    worker = Worker(
        id=str(uuid.uuid4()),
        phone=payload.get('phone', phone),
        name=payload.get('name', ''),
        city=payload.get('city', ''),
        zone=payload.get('zone', ''),
        tier=payload.get('tier', 'Bronze'),
        upi_id=payload.get('upi_id', ''),
        risk_score=0.5,
        is_active=True,
        is_admin=False,
    )
    db.session.add(worker)

    today = date.today()
    policy = Policy(
        id=str(uuid.uuid4()),
        worker_id=worker.id,
        start_date=today,
        end_date=today + timedelta(weeks=1),
        weekly_premium=premium_service.calculate_premium(worker.zone, worker.tier),
        max_payout=premium_service.get_max_payout(worker.tier),
        status='Active',
    )
    db.session.add(policy)
    db.session.commit()

    return success({
        'access_token': auth_service.create_token(worker.id),
        'worker': worker.to_dict(),
        'policy': policy.to_dict(),
    }, status=201)


@auth_bp.route('/register/resend-otp', methods=['POST'])
def resend_register_otp():
    """Resend registration OTP only after the 10-minute resend window."""
    data = request.get_json() or {}
    phone = otp_service.normalize_phone(data.get('phone', ''))
    if not phone:
        return error('Valid phone is required')

    if Worker.query.filter_by(phone=phone).first():
        return error('Phone number already registered', 409)

    cooldown_minutes = int(current_app.config.get('OTP_RESEND_COOLDOWN_MINUTES', 10))
    wait_seconds = otp_service.get_resend_wait_seconds(phone, 'register', cooldown_minutes)
    if wait_seconds > 0:
        return error(
            'You can resend OTP after 10 minutes',
            429,
            details={'resend_after_seconds': wait_seconds},
        )

    sms_ok, sms_ref = otp_service.send_otp_sms(phone, purpose='register')
    if not sms_ok:
        return error('Failed to resend OTP SMS. Please try again.', 500)

    return success({
        'message': 'OTP resent to your phone number',
        'phone': phone,
        'expires_in_seconds': _otp_expiry_seconds(),
        'resend_after_seconds': _otp_resend_seconds(),
        'reference': sms_ref,
    })


@auth_bp.route('/request-otp', methods=['POST'])
def request_otp():
    """Request a login OTP for a registered phone number."""
    data = request.get_json() or {}
    phone = otp_service.normalize_phone(data.get('phone', ''))
    if not phone:
        return error('Valid phone is required')

    worker = Worker.query.filter_by(phone=phone, is_admin=False).first()
    if not worker:
        return error('Phone number not registered', 404)
    if not worker.is_active:
        return error('Account is inactive', 403)

    cooldown_minutes = int(current_app.config.get('OTP_RESEND_COOLDOWN_MINUTES', 10))
    wait_seconds = otp_service.get_resend_wait_seconds(phone, 'login', cooldown_minutes)
    if wait_seconds > 0:
        return error(
            'You can resend OTP after 10 minutes',
            429,
            details={'resend_after_seconds': wait_seconds},
        )

    sms_ok, sms_ref = otp_service.send_otp_sms(phone, purpose='login')
    if not sms_ok:
        return error('Failed to send OTP SMS. Please try again.', 500)

    return success({
        'message': f'OTP sent to {phone}',
        'phone': phone,
        'expires_in_seconds': _otp_expiry_seconds(),
        'resend_after_seconds': _otp_resend_seconds(),
        'reference': sms_ref,
    })


@auth_bp.route('/login', methods=['POST'])
def login():
    """Worker login via phone + OTP. Returns JWT."""
    data = request.get_json() or {}
    phone = otp_service.normalize_phone(data.get('phone', ''))
    otp = str(data.get('otp', '')).strip()

    if not phone or not otp:
        return error('phone and otp are required')

    worker = Worker.query.filter_by(phone=phone, is_admin=False).first()
    if not worker:
        return error('Worker not found', 404)
    if not worker.is_active:
        return error('Account is inactive', 403)

    if not otp_service.verify_otp(phone, otp):
        return error('Wrong OTP', 401)

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
