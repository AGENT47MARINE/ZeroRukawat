from flask import Blueprint

claims_bp = Blueprint('claims', __name__, url_prefix='/api/v1/claims')

from . import routes  # noqa: F401, E402
