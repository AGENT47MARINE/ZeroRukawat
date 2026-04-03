import json
from datetime import datetime

PAYOUT_STAGE_REQUESTED = 'requested'
PAYOUT_STAGE_FRAUD_CHECK = 'fraud_check'
PAYOUT_STAGE_INCOME_ESTIMATION = 'income_estimation'
PAYOUT_STAGE_PAYMENT_PROCESSING = 'payment_processing'
PAYOUT_STAGE_CREDITED = 'credited'
PAYOUT_STAGE_HELD = 'held'
PAYOUT_STAGE_BLOCKED = 'blocked'
PAYOUT_STAGE_FAILED = 'failed'

TERMINAL_PAYOUT_STAGES = {
    PAYOUT_STAGE_CREDITED,
    PAYOUT_STAGE_HELD,
    PAYOUT_STAGE_BLOCKED,
    PAYOUT_STAGE_FAILED,
}

DEMO_FORCE_OUTCOMES = {'approved', 'amber', 'blocked', 'ai_fail'}


def utc_now_iso() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def stage_from_claim_status(status: str) -> str:
    if status == 'Approved':
        return PAYOUT_STAGE_CREDITED
    if status in ('Amber', 'Red'):
        return PAYOUT_STAGE_HELD
    if status == 'Blocked':
        return PAYOUT_STAGE_BLOCKED
    return PAYOUT_STAGE_PAYMENT_PROCESSING


def parse_timeline(raw_timeline):
    if not raw_timeline:
        return []
    if isinstance(raw_timeline, list):
        return raw_timeline

    try:
        parsed = json.loads(raw_timeline)
        return parsed if isinstance(parsed, list) else []
    except (TypeError, ValueError):
        return []


def append_stage(claim, stage: str, message: str = None):
    timeline = parse_timeline(getattr(claim, 'payout_stage_timeline', None))
    timeline.append(
        {
            'stage': stage,
            'at': utc_now_iso(),
            'message': message,
        }
    )
    claim.payout_stage = stage
    claim.payout_stage_timeline = json.dumps(timeline)
    claim.payout_last_updated_at = datetime.utcnow()


def is_terminal(stage: str) -> bool:
    return stage in TERMINAL_PAYOUT_STAGES
