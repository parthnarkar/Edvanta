# Config.py 

"""Configuration module for Edvanta backend.

Environment variables (suggested):
- FLASK_ENV: development/production
- SECRET_KEY: Flask secret
- VERTEX_PROJECT_ID: GCP project for Vertex AI
- VERTEX_LOCATION: GCP region
- CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET: Cloudinary credentials
- ALLOWED_ORIGINS: Comma separated origins for CORS (optional)
"""
import os
from typing import List


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    ENV = os.getenv("FLASK_ENV", "development")

    # External service credentials / settings (placeholders – do not hardcode real keys)
    GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_PROJECT_ID")
    GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_LOCATION")
    VERTEX_DEFAULT_CREDENTIALS = os.getenv("GOOGLE_CREDENTIALS_JSON_BASE64")
    VERTEX_MODEL_NAME = os.getenv("VERTEX_MODEL_NAME")
    
    # Service-specific settings
    VERTEX_TEMPERATURE = float(os.getenv("VERTEX_TEMPERATURE", "0.7"))
    VERTEX_TOP_P = float(os.getenv("VERTEX_TOP_P", "0.95"))
    VERTEX_TOP_K = int(os.getenv("VERTEX_TOP_K", "40"))
    VERTEX_MAX_OUTPUT_TOKENS = int(os.getenv("VERTEX_MAX_OUTPUT_TOKENS", "1024"))

    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # CORS
    ALLOWED_ORIGINS: List[str] = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]

    # MongoDB Credentials
    MONGODB_URI = os.getenv("MONGODB_URI")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")
    MONGODB_QUIZ_COLLECTION = os.getenv("MONGODB_QUIZ_COLLECTION")
    MONGODB_QUIZ_HISTORY_COLLECTION = os.getenv("MONGODB_QUIZ_HISTORY_COLLECTION")
    MONGODB_CHAT_COLLECTION = os.getenv("MONGODB_CHAT_COLLECTION")