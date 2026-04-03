"""
ZeroRukawat Flask Application Factory
"""
import uuid
from flask import Flask
from .config import config
from .extensions import db, migrate, cors, jwt


def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # ── Bind extensions ───────────────────────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r'/api/*': {'origins': '*'}})
    jwt.init_app(app)

    # ── Register models (must import before db.create_all) ────────────────────
    from . import models  # noqa: F401

    # ── Register blueprints ───────────────────────────────────────────────────
    from .workerAuth  import auth_bp
    from .workers     import workers_bp
    from .disruptions import disruptions_bp
    from .claims      import claims_bp
    from .admin       import admin_bp
    from .ai          import ai_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(workers_bp)
    app.register_blueprint(disruptions_bp)
    app.register_blueprint(claims_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(ai_bp)

    # ── Core routes ───────────────────────────────────────────────────────────
    @app.route('/')
    def root():
        return {'message': 'ZeroRukawat API', 'status': 'operational', 'version': '1.0.0'}

    @app.route('/health')
    def health():
        try:
            db.session.execute(db.text('SELECT 1'))
            db_status = 'healthy'
        except Exception:
            db_status = 'unhealthy'
        return {'status': 'healthy', 'db': db_status}

    # ── Global error handlers ─────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(_):
        return {'status': 'error', 'message': 'Route not found'}, 404

    @app.errorhandler(405)
    def method_not_allowed(_):
        return {'status': 'error', 'message': 'Method not allowed'}, 405

    @app.errorhandler(500)
    def server_error(_):
        return {'status': 'error', 'message': 'Internal server error'}, 500

    # ── Init DB + seed admin ──────────────────────────────────────────────────
    with app.app_context():
        db.create_all()
        _ensure_claim_payout_columns()
        _seed_admin(app)

    # ── Start background weather poller ───────────────────────────────────────
    if not app.config.get('TESTING', False):
        from .tasks.weather_poller import start_scheduler
        start_scheduler(app)

    return app


def _seed_admin(app):
    """Seed a default admin account on first startup if none exists."""
    from .models import Worker
    from .services.auth_service import hash_password

    if Worker.query.filter_by(is_admin=True).first():
        return  # already seeded

    admin = Worker(
        id=str(uuid.uuid4()),
        phone='9999999999',
        name='ZeroRukawat Admin',
        city='Mumbai',
        zone='Mumbai_Kurla',
        tier='Gold',
        upi_id='admin@upi',
        risk_score=0.0,
        is_active=True,
        is_admin=True,
        hashed_password=hash_password('Admin@2024'),
    )
    db.session.add(admin)
    db.session.commit()

    app.logger.info('=' * 55)
    app.logger.info('🔐  ADMIN ACCOUNT SEEDED')
    app.logger.info('    Phone    : 9999999999')
    app.logger.info('    Password : Admin@2024')
    app.logger.info('    Endpoint : POST /api/v1/auth/admin/login')
    app.logger.info('=' * 55)


def _ensure_claim_payout_columns():
    """Backfill new Claim payout columns for existing local databases."""
    inspector = db.inspect(db.engine)
    columns = {column['name'] for column in inspector.get_columns('claims')}

    alter_statements = []
    if 'payout_stage' not in columns:
        alter_statements.append('ALTER TABLE claims ADD COLUMN payout_stage VARCHAR(30)')
    if 'payout_transaction_id' not in columns:
        alter_statements.append('ALTER TABLE claims ADD COLUMN payout_transaction_id VARCHAR(120)')
    if 'payout_error_reason' not in columns:
        alter_statements.append('ALTER TABLE claims ADD COLUMN payout_error_reason VARCHAR(500)')
    if 'payout_stage_timeline' not in columns:
        alter_statements.append('ALTER TABLE claims ADD COLUMN payout_stage_timeline TEXT')
    if 'payout_last_updated_at' not in columns:
        alter_statements.append('ALTER TABLE claims ADD COLUMN payout_last_updated_at DATETIME')

    for statement in alter_statements:
        db.session.execute(db.text(statement))

    if alter_statements:
        db.session.commit()
