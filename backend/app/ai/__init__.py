from flask import Blueprint

ai_bp = Blueprint('ai', __name__, url_prefix='/api/v1/ai')

from . import routes  # noqa: F401, E402
