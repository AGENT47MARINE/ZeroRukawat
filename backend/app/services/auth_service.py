from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token


def hash_password(password: str) -> str:
    """Hash a password using werkzeug (pbkdf2:sha256)."""
    return generate_password_hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against a stored werkzeug hash."""
    return check_password_hash(hashed, plain)


def create_token(worker_id: str) -> str:
    """Create a JWT access token for a given worker ID."""
    return create_access_token(identity=worker_id)


def verify_otp(otp: str, is_dev: bool = True) -> bool:
    """
    Verify OTP.
    Dev mode: 123456 always passes.
    Prod mode: Integration with Twilio/MSG91 SMS gateway (not implemented yet).
    """
    if is_dev:
        return otp == '123456'
    # TODO: integrate real OTP verification in production
    return False
