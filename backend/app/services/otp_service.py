import importlib
from datetime import datetime

from flask import current_app

try:
    twilio_rest = importlib.import_module('twilio.rest')
    Client = getattr(twilio_rest, 'Client', None)
except Exception:  # pragma: no cover
    Client = None


_otp_send_tracker: dict[str, datetime] = {}


def _dev_otp_enabled() -> bool:
    return bool(current_app.config.get('DEBUG') or current_app.config.get('TESTING'))


def _dev_otp_code() -> str:
    return str(current_app.config.get('DEV_OTP_CODE', '123456'))


def normalize_phone(phone: str) -> str | None:
    if not phone:
        return None

    cleaned = ''.join(ch for ch in phone.strip() if ch.isdigit() or ch == '+')
    if not cleaned:
        return None

    if cleaned.startswith('+'):
        digits = ''.join(ch for ch in cleaned if ch.isdigit())
        if 10 <= len(digits) <= 14:
            return f'+{digits}'
        return None

    digits = ''.join(ch for ch in cleaned if ch.isdigit())
    if len(digits) == 10:
        return f'+91{digits}'
    if len(digits) == 12 and digits.startswith('91'):
        return f'+{digits}'
    if 10 <= len(digits) <= 14:
        return f'+{digits}'
    return None


def _tracker_key(phone: str, purpose: str) -> str:
    return f'{purpose}:{phone}'


def get_resend_wait_seconds(phone: str, purpose: str, cooldown_minutes: int) -> int:
    last_sent_at = _otp_send_tracker.get(_tracker_key(phone, purpose))
    if not last_sent_at:
        return 0

    elapsed = int((datetime.utcnow() - last_sent_at).total_seconds())
    cooldown_seconds = max(0, cooldown_minutes) * 60
    wait_seconds = cooldown_seconds - elapsed
    return wait_seconds if wait_seconds > 0 else 0


def _mark_sent(phone: str, purpose: str):
    _otp_send_tracker[_tracker_key(phone, purpose)] = datetime.utcnow()


def verify_otp(phone: str, otp: str) -> bool:
    account_sid = current_app.config.get('TWILIO_ACCOUNT_SID')
    auth_token = current_app.config.get('TWILIO_AUTH_TOKEN')
    verify_service_sid = current_app.config.get('TWILIO_VERIFY_SERVICE_SID')

    if not (account_sid and auth_token and verify_service_sid):
        if _dev_otp_enabled():
            return str(otp).strip() == _dev_otp_code()
        current_app.logger.error('Twilio Verify is not configured.')
        return False
    if Client is None:
        if _dev_otp_enabled():
            return str(otp).strip() == _dev_otp_code()
        current_app.logger.error('Twilio SDK is not installed but Twilio Verify is configured.')
        return False

    try:
        client = Client(account_sid, auth_token)
        check = (
            client.verify
            .v2
            .services(verify_service_sid)
            .verification_checks
            .create(to=phone, code=otp)
        )
        return check.status == 'approved'
    except Exception as exc:
        if _dev_otp_enabled():
            current_app.logger.warning('Twilio Verify check failed, using DEV OTP fallback: %s', exc)
            return str(otp).strip() == _dev_otp_code()
        current_app.logger.exception('Twilio Verify check failed: %s', exc)
        return False


def send_otp_sms(phone: str, purpose: str) -> tuple[bool, str | None]:
    account_sid = current_app.config.get('TWILIO_ACCOUNT_SID')
    auth_token = current_app.config.get('TWILIO_AUTH_TOKEN')
    verify_service_sid = current_app.config.get('TWILIO_VERIFY_SERVICE_SID')

    if not (account_sid and auth_token and verify_service_sid):
        if _dev_otp_enabled():
            _mark_sent(phone, purpose)
            current_app.logger.warning('Twilio not configured. Using DEV OTP fallback for %s', phone)
            return True, f'dev-otp-{purpose}'
        current_app.logger.error('Twilio Verify is not configured.')
        return False, 'twilio-not-configured'
    if Client is None:
        if _dev_otp_enabled():
            _mark_sent(phone, purpose)
            return True, f'dev-otp-{purpose}'
        current_app.logger.error('Twilio SDK is not installed but Twilio Verify is configured.')
        return False, 'twilio-sdk-missing'

    try:
        client = Client(account_sid, auth_token)
        verification = (
            client.verify
            .v2
            .services(verify_service_sid)
            .verifications
            .create(to=phone, channel='sms')
        )
        _mark_sent(phone, purpose)
        return True, verification.sid
    except Exception as exc:
        if _dev_otp_enabled():
            _mark_sent(phone, purpose)
            current_app.logger.warning('Twilio Verify send failed, using DEV OTP fallback: %s', exc)
            return True, f'dev-otp-{purpose}'
        current_app.logger.exception('Twilio Verify send failed: %s', exc)
        return False, 'twilio-verify-send-failed'

    return False, 'twilio-not-configured'
