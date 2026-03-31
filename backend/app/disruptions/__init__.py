from flask import Blueprint

disruptions_bp = Blueprint('disruptions', __name__, url_prefix='/api/v1/disruptions')

from . import routes  # noqa: F401, E402
