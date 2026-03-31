"""
models.py — All SQLAlchemy ORM table definitions for ZeroRukawat.
Schema source: docs/database.md
Additions: hashed_password, is_active, is_admin (workers) + resolution_note (claims)
"""
import uuid
from datetime import datetime
from .extensions import db


def _uuid():
    return str(uuid.uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# Worker
# ─────────────────────────────────────────────────────────────────────────────
class Worker(db.Model):
    __tablename__ = 'workers'

    id               = db.Column(db.String(36),  primary_key=True, default=_uuid)
    phone            = db.Column(db.String(15),  unique=True, nullable=False, index=True)
    name             = db.Column(db.String(100), nullable=False)
    city             = db.Column(db.String(100), nullable=False)
    zone             = db.Column(db.String(100), nullable=False)
    tier             = db.Column(db.String(10),  nullable=False, default='Bronze')  # Bronze/Silver/Gold
    upi_id           = db.Column(db.String(100), nullable=True)
    risk_score       = db.Column(db.Float,       nullable=False, default=0.5)
    created_at       = db.Column(db.DateTime,    nullable=False, default=datetime.utcnow)
    # ── additions (not in docs/database.md) ──────────────────────────────────
    hashed_password  = db.Column(db.String(256), nullable=True)   # used only for admin accounts
    is_active        = db.Column(db.Boolean,     nullable=False, default=True)
    is_admin         = db.Column(db.Boolean,     nullable=False, default=False)

    policies = db.relationship('Policy', backref='worker', lazy=True)

    def to_dict(self):
        return {
            'id':         self.id,
            'phone':      self.phone,
            'name':       self.name,
            'city':       self.city,
            'zone':       self.zone,
            'tier':       self.tier,
            'upi_id':     self.upi_id,
            'risk_score': self.risk_score,
            'is_active':  self.is_active,
            'is_admin':   self.is_admin,
            'created_at': self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────────────────────────────────────
# Policy
# ─────────────────────────────────────────────────────────────────────────────
class Policy(db.Model):
    __tablename__ = 'policies'

    id               = db.Column(db.String(36),  primary_key=True, default=_uuid)
    worker_id        = db.Column(db.String(36),  db.ForeignKey('workers.id'), nullable=False)
    start_date       = db.Column(db.Date,        nullable=False)
    end_date         = db.Column(db.Date,        nullable=False)
    weekly_premium   = db.Column(db.Float,       nullable=False)
    max_payout       = db.Column(db.Float,       nullable=False)
    status           = db.Column(db.String(20),  nullable=False, default='Active')  # Active/Lapsed/Cancelled

    claims = db.relationship('Claim', backref='policy', lazy=True)

    def to_dict(self):
        return {
            'id':             self.id,
            'worker_id':      self.worker_id,
            'start_date':     self.start_date.isoformat(),
            'end_date':       self.end_date.isoformat(),
            'weekly_premium': self.weekly_premium,
            'max_payout':     self.max_payout,
            'status':         self.status,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Disruption
# ─────────────────────────────────────────────────────────────────────────────
class Disruption(db.Model):
    __tablename__ = 'disruptions'

    id              = db.Column(db.String(36),  primary_key=True, default=_uuid)
    zone            = db.Column(db.String(100), nullable=False)
    type            = db.Column(db.String(50),  nullable=False)
    threshold_value = db.Column(db.String(50),  nullable=True)
    start_time      = db.Column(db.DateTime,    nullable=False, default=datetime.utcnow)
    end_time        = db.Column(db.DateTime,    nullable=True)
    is_active       = db.Column(db.Boolean,     nullable=False, default=True)

    claims = db.relationship('Claim', backref='disruption', lazy=True)

    def to_dict(self):
        return {
            'id':              self.id,
            'zone':            self.zone,
            'type':            self.type,
            'threshold_value': self.threshold_value,
            'start_time':      self.start_time.isoformat(),
            'end_time':        self.end_time.isoformat() if self.end_time else None,
            'is_active':       self.is_active,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Claim
# ─────────────────────────────────────────────────────────────────────────────
class Claim(db.Model):
    __tablename__ = 'claims'

    id               = db.Column(db.String(36),  primary_key=True, default=_uuid)
    policy_id        = db.Column(db.String(36),  db.ForeignKey('policies.id'), nullable=False)
    disruption_id    = db.Column(db.String(36),  db.ForeignKey('disruptions.id'), nullable=False)
    amount_credited  = db.Column(db.Float,       nullable=True)
    ml_fraud_score   = db.Column(db.Float,       nullable=True)
    status           = db.Column(db.String(20),  nullable=False, default='Processing')
    created_at       = db.Column(db.DateTime,    nullable=False, default=datetime.utcnow)
    resolved_at      = db.Column(db.DateTime,    nullable=True)
    # ── addition (not in docs/database.md) ───────────────────────────────────
    resolution_note  = db.Column(db.String(500), nullable=True)

    def to_dict(self):
        return {
            'id':              self.id,
            'policy_id':       self.policy_id,
            'disruption_id':   self.disruption_id,
            'amount_credited': self.amount_credited,
            'ml_fraud_score':  self.ml_fraud_score,
            'status':          self.status,
            'created_at':      self.created_at.isoformat(),
            'resolved_at':     self.resolved_at.isoformat() if self.resolved_at else None,
            'resolution_note': self.resolution_note,
        }
