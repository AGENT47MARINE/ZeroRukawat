from flask import Blueprint

admin_bp = Blueprint('admin', __name__, url_prefix='/api/v1/admin')

from . import routes  # noqa: F401, E402
