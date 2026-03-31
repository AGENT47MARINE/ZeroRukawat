from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

from . import routes  # noqa: F401, E402
