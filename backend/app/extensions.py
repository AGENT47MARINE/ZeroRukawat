from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Instantiated here without app binding — bound in create_app() via init_app()
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
jwt = JWTManager()
