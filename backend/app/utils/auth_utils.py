from functools import wraps
from flask import g, request, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from .response import error


def token_required(f):
    """Decorator: validates JWT and injects current worker into g.current_user."""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            worker_id = get_jwt_identity()
            from ..models import Worker
            worker = Worker.query.get(worker_id)
            if not worker:
                return error('Worker not found', 401)
            if not worker.is_active:
                return error('Account is inactive', 403)
            g.current_user = worker
        except Exception as e:
            return error(f'Invalid or expired token: {str(e)}', 401)
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator: validates JWT and ensures the user is an admin."""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            worker_id = get_jwt_identity()
            from ..models import Worker
            worker = Worker.query.get(worker_id)
            if not worker:
                return error('User not found', 401)
            if not worker.is_admin:
                return error('Admin access required', 403)
            g.current_user = worker
        except Exception as e:
            return error(f'Invalid or expired token: {str(e)}', 401)
        return f(*args, **kwargs)
    return decorated


def require_internal_key(f):
    """Decorator: checks X-Internal-Key header for internal service calls."""
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get('X-Internal-Key')
        if not key or key != current_app.config.get('INTERNAL_API_KEY'):
            return error('Invalid or missing internal API key', 403)
        return f(*args, **kwargs)
    return decorated
