"""
Premium calculation service.
Uses a zone risk table as a rule-based fallback mirroring what the
XGBoost Risk Scorer (ai/models/risk_scorer.py) will do in production.
"""

# Zone risk multipliers (0.0–1.0). Higher = riskier = higher premium.
ZONE_RISK_TABLE = {
    'Mumbai_Kurla':      0.85,
    'Mumbai_Andheri':    0.80,
    'Mumbai_Thane':      0.75,
    'Delhi_North':       0.60,
    'Delhi_South':       0.55,
    'Bangalore_South':   0.65,
    'Bangalore_North':   0.60,
    'Chennai_Central':   0.55,
    'Hyderabad_West':    0.50,
    'Kolkata_Central':   0.70,
}

# Premium range per tier (min ₹, max ₹)
TIER_PREMIUMS = {
    'Bronze': (49, 59),
    'Silver': (69, 79),
    'Gold':   (89, 99),
}

# Maximum weekly payout cap per tier
TIER_MAX_PAYOUTS = {
    'Bronze': 2450,
    'Silver': 3850,
    'Gold':   6300,
}


def calculate_premium(zone: str, tier: str) -> float:
    """
    Calculate weekly premium in ₹.
    Scales linearly between tier min/max based on zone risk score.
    Unknown zones default to risk=0.6.
    """
    risk = ZONE_RISK_TABLE.get(zone, 0.6)
    min_p, max_p = TIER_PREMIUMS.get(tier, (49, 59))
    premium = min_p + (max_p - min_p) * risk
    return round(premium, 2)


def get_max_payout(tier: str) -> float:
    """Return the weekly payout cap for a given tier."""
    return TIER_MAX_PAYOUTS.get(tier, 2450)
