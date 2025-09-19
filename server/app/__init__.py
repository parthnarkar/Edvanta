"""Application factory for Edvanta backend."""

from flask import Flask
from flask_cors import CORS
import os

# Load environment variables from a .env file if present (local dev convenience)
try:  # pragma: no cover - optional dependency handling
    from dotenv import load_dotenv
    load_dotenv()
except Exception:  # noqa: BLE001 - broad except acceptable for optional import
    pass

from .config import Config


def create_app() -> Flask:
    """Create and configure the Flask application.

    - Loads configuration from Config class / environment variables
    - Enables CORS for /api/* endpoints
    - Registers all feature blueprints
    """

    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS to allow all origins
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # Import blueprints (local imports to avoid circular dependencies)
    from .routes.visual import visual_bp
    from .routes.chatbot import chatbot_bp
    from .routes.quizzes import quizzes_bp
    from .routes.tutor import tutor_bp
    from .routes.roadmap import roadmap_bp
    from .routes.resume import resume_bp

    # Register blueprints with the app
    app.register_blueprint(visual_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(quizzes_bp)
    app.register_blueprint(tutor_bp)
    app.register_blueprint(roadmap_bp)
    app.register_blueprint(resume_bp)

    @app.route("/", methods=["GET"])  # Simple health check
    def health():  # pragma: no cover - trivial
        return {"status": "ok", "service": "edvanta-backend"}

    @app.route("/api/runtime-features", methods=["GET"])
    def runtime_features():
        """Report which optional libraries are available at runtime."""
        features = {}
        try:
            import importlib

            optional_libs = [
                "vertexai",
                "google.genai",
                "moviepy",
                "gtts",
                "PIL",
                "whisper",
                "PyPDF2",
            ]
            for lib in optional_libs:
                try:
                    features[lib] = importlib.util.find_spec(lib) is not None
                except Exception:
                    features[lib] = False
        except Exception:
            features = {"error": "runtime check failed"}

        return {"status": "ok", "features": features}

    # Ensure CORS headers are present on every response. This complements
    # flask_cors and guarantees headers are attached even for error pages
    # or responses generated before blueprint handlers run.
    from flask import request

    @app.after_request
    def ensure_cors_headers(response):
        """Attach permissive CORS headers.

        - If `ALLOWED_ORIGINS` contains '*' we echo the request Origin when
          present (to allow credentials) and fall back to '*' otherwise.
        - Otherwise only echo allowed origins.
        """
        origin = request.headers.get("Origin")
        allowed = getattr(Config, "ALLOWED_ORIGINS", ["*"])

        try:
            if isinstance(allowed, str):
                allowed_list = [o.strip() for o in allowed.split(",")]
            else:
                allowed_list = list(allowed)
        except Exception:
            allowed_list = ["*"]

        if "*" in allowed_list:
            if origin:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Vary"] = "Origin"
                response.headers["Access-Control-Allow-Credentials"] = "true"
            else:
                response.headers["Access-Control-Allow-Origin"] = "*"
        else:
            if origin and origin in allowed_list:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Vary"] = "Origin"
                response.headers["Access-Control-Allow-Credentials"] = "true"

        # Common preflight and CORS headers
        response.headers.setdefault(
            "Access-Control-Allow-Headers", "Content-Type,Authorization"
        )
        response.headers.setdefault(
            "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH"
        )

        return response

    return app