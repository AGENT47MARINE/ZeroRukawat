"""
weather_poller.py — APScheduler background job.

Runs every POLLER_INTERVAL_MINUTES (2 min dev / 15 min prod).
For each monitored zone:
  1. Fetch weather (OWM if API key present, else mock_weather.json)
  2. Check thresholds per PRD (rain >15mm, heat >43°C, fog <100m, AQI >300)
  3. If exceeded → create Disruption row → create Processing claims for active workers
  4. If cleared → mark existing Disruption as inactive
"""
import json
import os
import uuid
import requests as http_req
from datetime import datetime
from flask import current_app

# Zones the poller monitors
MONITORED_ZONES = [
    {'zone': 'Mumbai_Kurla',    'city': 'Mumbai'},
    {'zone': 'Delhi_North',     'city': 'Delhi'},
    {'zone': 'Bangalore_South', 'city': 'Bangalore'},
    {'zone': 'Chennai_Central', 'city': 'Chennai'},
]

# Disruption thresholds per PRD
THRESHOLDS = {
    'rainfall':    15,    # mm/hr  → Heavy Rain
    'temperature': 43,    # °C     → Extreme Heat
    'visibility':  100,   # metres → Dense Fog
    'aqi':         300,   # index  → Severe AQI
}

MOCK_WEATHER_PATH = os.path.join(os.path.dirname(__file__), 'mock_weather.json')


# ─── Weather data fetchers ────────────────────────────────────────────────────

def _fetch_live_weather(city: str, api_key: str) -> dict:
    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?q={city},IN&appid={api_key}&units=metric"
    )
    data = http_req.get(url, timeout=5).json()
    return {
        'rainfall':    data.get('rain', {}).get('1h', 0.0),
        'temperature': data['main']['temp'],
        'visibility':  data.get('visibility', 10000),
        'aqi':         100,  # OWM free tier has no AQI in this endpoint
    }


def _fetch_mock_weather(zone: str) -> dict:
    with open(MOCK_WEATHER_PATH) as f:
        mock = json.load(f)
    return mock['zones'].get(zone, {
        'rainfall': 0, 'temperature': 30, 'visibility': 5000, 'aqi': 80
    })


# ─── Threshold checker ────────────────────────────────────────────────────────

def _triggered_types(weather: dict) -> list:
    types = []
    if weather.get('rainfall', 0) > THRESHOLDS['rainfall']:
        types.append(('Heavy Rain',    f"{weather['rainfall']}mm/hr"))
    if weather.get('temperature', 0) > THRESHOLDS['temperature']:
        types.append(('Extreme Heat',  f"{weather['temperature']}°C"))
    if weather.get('visibility', 9999) < THRESHOLDS['visibility']:
        types.append(('Dense Fog',     f"{weather['visibility']}m visibility"))
    if weather.get('aqi', 0) > THRESHOLDS['aqi']:
        types.append(('Severe AQI',    f"{weather['aqi']} AQI"))
    return types


# ─── Claim creator ────────────────────────────────────────────────────────────

def _create_claims_for_zone(disruption, zone: str):
    from ..extensions import db
    from ..models import Worker, Policy, Claim

    workers = Worker.query.filter_by(zone=zone, is_active=True, is_admin=False).all()
    created = 0
    for worker in workers:
        policy = Policy.query.filter_by(worker_id=worker.id, status='Active').first()
        if not policy:
            continue
        exists = Claim.query.filter_by(
            policy_id=policy.id, disruption_id=disruption.id
        ).first()
        if exists:
            continue
        db.session.add(Claim(
            id=str(uuid.uuid4()),
            policy_id=policy.id,
            disruption_id=disruption.id,
            status='Processing',
        ))
        created += 1
    db.session.commit()
    current_app.logger.info(f"[Poller] Created {created} claims for {zone}")


# ─── Main poll function ───────────────────────────────────────────────────────

def poll_weather(app):
    """Entry point called by APScheduler — always runs inside app context."""
    with app.app_context():
        from ..extensions import db
        from ..models import Disruption

        api_key = current_app.config.get('OPENWEATHER_API_KEY', '')

        for zone_info in MONITORED_ZONES:
            zone = zone_info['zone']
            city = zone_info['city']
            try:
                weather = _fetch_live_weather(city, api_key) if api_key else _fetch_mock_weather(zone)
                current_app.logger.info(
                    f"[Poller] {zone} — rain={weather['rainfall']} "
                    f"temp={weather['temperature']} vis={weather['visibility']}"
                )

                triggered = _triggered_types(weather)
                triggered_type_names = [t[0] for t in triggered]

                # Create disruptions for newly triggered thresholds
                for d_type, threshold_val in triggered:
                    existing = Disruption.query.filter_by(
                        zone=zone, type=d_type, is_active=True
                    ).first()
                    if not existing:
                        disruption = Disruption(
                            id=str(uuid.uuid4()),
                            zone=zone,
                            type=d_type,
                            threshold_value=threshold_val,
                            start_time=datetime.utcnow(),
                            is_active=True,
                        )
                        db.session.add(disruption)
                        db.session.commit()
                        current_app.logger.info(f"[Poller] ⚡ New disruption: {d_type} in {zone}")
                        _create_claims_for_zone(disruption, zone)
                    else:
                        current_app.logger.info(f"[Poller] {d_type} already active in {zone}")

                # Deactivate disruptions that are no longer triggered
                active = Disruption.query.filter_by(zone=zone, is_active=True).all()
                for d in active:
                    if d.type not in triggered_type_names:
                        d.is_active = False
                        d.end_time = datetime.utcnow()
                        current_app.logger.info(f"[Poller] ✅ Cleared: {d.type} in {zone}")
                db.session.commit()

            except Exception as e:
                current_app.logger.error(f"[Poller] Error processing {zone}: {e}")


# ─── Scheduler starter ────────────────────────────────────────────────────────

def start_scheduler(app):
    from apscheduler.schedulers.background import BackgroundScheduler

    interval = app.config.get('POLLER_INTERVAL_MINUTES', 15)
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(
        func=poll_weather,
        args=[app],
        trigger='interval',
        minutes=interval,
        id='weather_poller',
        replace_existing=True,
    )
    scheduler.start()
    app.logger.info(f"[Poller] ⏰ Weather poller started — interval: {interval} min")
    return scheduler
