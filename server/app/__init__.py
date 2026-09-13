"""Application factory for Edvanta backend."""

from flask import Flask
from flask_cors import CORS
import logging

# Load environment variables from a .env file if present (local dev convenience)
try:  # pragma: no cover - optional dependency handling
    from dotenv import load_dotenv
    load_dotenv()
except Exception:  # noqa: BLE001 - broad except acceptable for optional import
    pass

from .config import Config


def setup_logging(app: Flask) -> None:
    """Configure logging based on environment.

    - Production/serverless: INFO level, concise formatting
    - Development: DEBUG level, detailed formatting with timestamps
    """
    config = Config()

    # Set log level based on environment
    if config.DEBUG or config.ENV == 'development':
        log_level = logging.DEBUG
        log_format = '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    else:
        log_level = logging.INFO
        log_format = '%(levelname)s: %(message)s'


    # Remove default handlers and add custom one
    handler = logging.StreamHandler()
    handler.setLevel(log_level)
    handler.setFormatter(logging.Formatter(log_format))

    # Also configure root logger for consistency
    logging.basicConfig(level=log_level, format=log_format, force=True)


def create_app() -> Flask:
    """Create and configure the Flask application.

    - Auto-detects environment (development/production) based on deployment platform
    - Loads configuration from Config class / environment variables with fallbacks
    - Enables CORS for all origins by default for maximum compatibility
    - Registers all feature blueprints with graceful error handling
    - Configures environment-appropriate logging
    - Works seamlessly in any environment: local, Vercel, AWS Lambda, Heroku, etc.
    """

    app = Flask(__name__)
    app.config.from_object(Config)

    # Setup logging first
    setup_logging(app)

    # Enable CORS using configured origins (comma-separated list)
    try:
        allowed_origins = [o.strip() for o in Config.ALLOWED_ORIGINS.split(",") if o.strip()]
    except Exception:
        allowed_origins = ["http://localhost:5173"]

    CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)

    # Import and register blueprints with error handling
    blueprints_to_register = [
        ('chatbot', lambda: __import__(
            'app.routes.chatbot', fromlist=['chatbot_bp']).chatbot_bp),
        ('quizzes', lambda: __import__(
            'app.routes.quizzes', fromlist=['quizzes_bp']).quizzes_bp),
        ('tutor', lambda: __import__(
            'app.routes.tutor', fromlist=['tutor_bp']).tutor_bp),
        ('roadmap', lambda: __import__(
            'app.routes.roadmap', fromlist=['roadmap_bp']).roadmap_bp),
        ('user_stats', lambda: __import__('app.routes.user_stats',
         fromlist=['user_stats_bp']).user_stats_bp),
        ('resume', lambda: __import__(
            'app.routes.resume', fromlist=['resume_bp']).resume_bp),
        ('videos', lambda: __import__(
            'app.routes.videos', fromlist=['videos_bp']).videos_bp),
    ]


    registered_blueprints = []
    for name, blueprint_loader in blueprints_to_register:
        try:
            blueprint = blueprint_loader()
            app.register_blueprint(blueprint)
            registered_blueprints.append(name)
            app.logger.info(f"Successfully registered blueprint: {name}")
        except Exception as e:
            app.logger.error(f"Failed to register blueprint '{name}': {str(e)}")
            # Continue with other blueprints instead of returning early

    @app.route("/", methods=["GET"])
    @app.route("/api/health", methods=["GET"])
    def health():
        """Health check endpoint with environment info."""
        from .config import Config
        from .utils.mongo_utils import is_mongodb_connected
        config = Config()
        return {
            "status": "ok",
            "service": "edvanta-backend",
            "environment": config.ENV,
            "debug": config.DEBUG,
            "is_serverless": config.IS_SERVERLESS,
            "platform": _detect_platform(config),
            "registered_blueprints": list(app.blueprints.keys()) if hasattr(app, 'blueprints') else [],
            "total_blueprints": len(registered_blueprints),
            "mongodb_uri_configured": bool(config.MONGODB_URI and config.MONGODB_URI != "mongodb://localhost:27017/"),
            "mongodb_connected": is_mongodb_connected()
        }

    def _detect_platform(config):
        """Detect which platform the app is running on."""
        if config.IS_VERCEL:
            return "vercel"
        elif config.IS_AWS_LAMBDA:
            return "aws-lambda"
        elif config.IS_HEROKU:
            return "heroku"
        elif config.IS_NETLIFY:
            return "netlify"
        elif config.IS_GOOGLE_CLOUD:
            return "google-cloud"
        elif config.IS_SERVERLESS:
            return "serverless-unknown"
        else:
            return "local"

    @app.route("/api/runtime-features", methods=["GET"])
    def runtime_features():
        """Report which optional libraries are available at runtime and configuration status."""
        features = {}
        try:
            import importlib
            from .config import Config
            config = Config()

            optional_libs = [
                "google.generativeai",
                "moviepy",
                "gtts",
                "PIL",
                "whisper",
                "pymongo"
            ]
            for lib in optional_libs:
                try:
                    features[lib] = importlib.util.find_spec(lib) is not None
                except Exception:
                    features[lib] = False

            # Configuration status
            config_status = {
                "gemini_api_configured": bool(config.GEMINI_API_KEY),
                "mongodb_configured": bool(config.MONGODB_URI and config.MONGODB_URI != "mongodb://localhost:27017/"),
                "environment": config.ENV,
                "debug_mode": config.DEBUG
            }
            features.update(config_status)

        except Exception as e:
            features = {"error": f"runtime check failed: {str(e)}"}

        return {"status": "ok", "features": features}

    # Ensure CORS headers are present on every response. This complements
    # flask_cors and guarantees headers are attached even for error pages
    # or responses generated before blueprint handlers run.
    from flask import request

    @app.before_request
    def log_request():
        """Log incoming requests in debug mode."""
        if app.config.get('DEBUG'):
            return 

    @app.after_request
    def ensure_cors_headers(response):
        """Attach permissive CORS headers.

        - If `ALLOWED_ORIGINS` contains '*' we echo the request Origin when
          present (to allow credentials) and fall back to '*' otherwise.
        - Otherwise only echo allowed origins.
        """
        origin = request.headers.get("Origin")
        allowed = Config.ALLOWED_ORIGINS

        try:
            if isinstance(allowed, str):
                allowed_list = [o.strip() for o in allowed.split(",") if o.strip()]
            else:
                allowed_list = list(allowed)
        except Exception:
            allowed_list = ["http://localhost:5173"]

        if origin and ("*" in allowed_list or origin in allowed_list):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Credentials"] = "true"
        elif "*" in allowed_list:
            response.headers["Access-Control-Allow-Origin"] = "*"

        # Common preflight and CORS headers
        response.headers.setdefault(
            "Access-Control-Allow-Headers", "Content-Type,Authorization"
        )
        response.headers.setdefault(
            "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH"
        )

        return response

    # Handle 404 errors with proper CORS headers
    @app.errorhandler(404)
    def not_found(error):
        from flask import jsonify
        return jsonify({"error": "Endpoint not found"}), 404

    # Global error handler for all unhandled exceptions
    @app.errorhandler(Exception)
    def handle_exception(error):
        from flask import jsonify

        # Log the full error with traceback in debug mode
        if app.config.get('DEBUG'):
            return jsonify({
                "error": "Internal server error",
                "message": str(error),
                "type": type(error).__name__
            }), 500
        else:
            # In production, don't leak error details
            return jsonify({
                "error": "Internal server error",
                "message": "An unexpected error occurred. Please try again later."
            }), 500

    # Handle 500 errors specifically
    @app.errorhandler(500)
    def internal_error(error):
        from flask import jsonify
        return jsonify({"error": "Internal server error"}), 500

    return app
