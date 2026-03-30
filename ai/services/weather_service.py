"""
GigShield — Weather Service
OpenWeatherMap API (live). Falls back to mock data if no API key.
"""

import os
import httpx

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

# Fallback mock data when API key is not set
MOCK_WEATHER = {
    "Mumbai":    {"rainfall": 22.0, "temperature": 31.5, "visibility": 2500, "humidity": 85},
    "Delhi":     {"rainfall": 0.0,  "temperature": 44.2, "visibility": 800,  "humidity": 30},
    "Bangalore": {"rainfall": 5.0,  "temperature": 28.0, "visibility": 8000, "humidity": 60},
    "Hyderabad": {"rainfall": 0.0,  "temperature": 38.0, "visibility": 5000, "humidity": 45},
    "Chennai":   {"rainfall": 18.0, "temperature": 35.0, "visibility": 3000, "humidity": 80},
    "Kolkata":   {"rainfall": 10.0, "temperature": 33.0, "visibility": 4000, "humidity": 75},
    "Pune":      {"rainfall": 3.0,  "temperature": 30.0, "visibility": 7000, "humidity": 55},
    "Ahmedabad": {"rainfall": 0.0,  "temperature": 42.0, "visibility": 6000, "humidity": 25},
    "Jaipur":    {"rainfall": 0.0,  "temperature": 41.0, "visibility": 3500, "humidity": 20},
    "Lucknow":   {"rainfall": 2.0,  "temperature": 36.0, "visibility": 900,  "humidity": 50},
}


async def get_weather(city: str) -> dict:
    """
    Returns: {rainfall (mm/hr), temperature (°C), visibility (m), humidity (%)}
    Uses live API if OPENWEATHER_API_KEY is set, else mock data.
    """
    if not OPENWEATHER_API_KEY:
        data = MOCK_WEATHER.get(city, MOCK_WEATHER["Mumbai"])
        return {**data, "source": "mock"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(OPENWEATHER_URL, params={
                "q": f"{city},IN",
                "appid": OPENWEATHER_API_KEY,
                "units": "metric",
            })
            resp.raise_for_status()
            d = resp.json()

            rainfall = d.get("rain", {}).get("1h", 0.0)
            temperature = d["main"]["temp"]
            visibility = d.get("visibility", 10000)
            humidity = d["main"]["humidity"]

            return {
                "rainfall": rainfall,
                "temperature": temperature,
                "visibility": visibility,
                "humidity": humidity,
                "source": "openweathermap",
            }
    except Exception as e:
        # Fallback to mock on any API error
        data = MOCK_WEATHER.get(city, MOCK_WEATHER["Mumbai"])
        return {**data, "source": "mock_fallback", "error": str(e)}
