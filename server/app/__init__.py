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

    return app