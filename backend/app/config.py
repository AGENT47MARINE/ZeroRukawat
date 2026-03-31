import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', '')
    AI_SERVER_URL = os.environ.get('AI_SERVER_URL', 'http://localhost:5001')
    INTERNAL_API_KEY = os.environ.get('INTERNAL_API_KEY', 'dev-internal-key-123')


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 'sqlite:///zerorukawat_dev.db'
    )
    MOCK_OTP = '123456'
    POLLER_INTERVAL_MINUTES = 2  # fast polling in dev for easy testing


class ProductionConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    MOCK_OTP = None  # real OTP service in production
    POLLER_INTERVAL_MINUTES = 15


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
