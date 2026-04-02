from flask import Blueprint

workers_bp = Blueprint('workers', __name__, url_prefix='/api/v1/workers')

from . import routes  # noqa: F401, E402
