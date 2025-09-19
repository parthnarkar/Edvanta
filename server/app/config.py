"""Configuration module for Edvanta backend.

This file centralizes all configuration settings and environment variables
used throughout the Edvanta backend application. Using this centralized config
helps with deployment to environments like Vercel.

Environment variables (required for deployment):
- FLASK_ENV: development/production
- SECRET_KEY: Flask secret key for session security
- MONGODB_URI: MongoDB connection string
- MONGODB_DB_NAME: MongoDB database name
- GOOGLE_PROJECT_ID: Google Cloud project ID
- GOOGLE_LOCATION: Google Cloud region (e.g., us-central1)
- GOOGLE_CREDENTIALS_JSON_BASE64: Base64-encoded GCP service account credentials
- VERTEX_MODEL_NAME: Vertex AI model name to use

Optional environment variables:
- CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET: For image uploads
- ALLOWED_ORIGINS: Comma separated origins for CORS (default: "*")
- VERTEX_TEMPERATURE/VERTEX_TOP_P/VERTEX_TOP_K: AI generation parameters
"""
import os
from typing import List


class Config:
    # Flask core settings
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = ENV == "development"

    # Server settings
    PORT = int(os.getenv("PORT"))
    HOST = os.getenv("HOST", "0.0.0.0")

    # Google Cloud / Vertex AI settings
    GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_PROJECT_ID")
    GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_LOCATION", "us-central1")
    VERTEX_DEFAULT_CREDENTIALS = os.getenv("GOOGLE_CREDENTIALS_JSON_BASE64")
    VERTEX_MODEL_NAME = os.getenv("VERTEX_MODEL_NAME", "gemini-2.5-flash")

    # AI model parameters
    VERTEX_TEMPERATURE = float(os.getenv("VERTEX_TEMPERATURE", "0.7"))
    VERTEX_TOP_P = float(os.getenv("VERTEX_TOP_P", "0.95"))
    VERTEX_TOP_K = int(os.getenv("VERTEX_TOP_K", "40"))
    VERTEX_MAX_OUTPUT_TOKENS = int(os.getenv("VERTEX_MAX_OUTPUT_TOKENS", "1024"))

    # Model IDs for specialized tasks
    GENAI_TEXT_MODEL = os.getenv("GENAI_TEXT_MODEL", "gemini-2.5-flash")
    GENAI_IMAGE_MODEL = os.getenv("GENAI_IMAGE_MODEL", "imagen-4.0-generate-preview-06-06")

    # API Keys
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    # Cloudinary settings (legacy naming)
    CLOUD_NAME = os.getenv("CLOUD_NAME")
    CLOUDINARY_APIKEY = os.getenv("CLOUDINARY_APIKEY")
    CLOUDINARY_SECRET = os.getenv("CLOUDINARY_SECRET")
    CLOUDINARY_APIENV = os.getenv("CLOUDINARY_APIENV")

    # Cloudinary settings (standard naming)
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # CORS settings
    ALLOWED_ORIGINS: List[str] = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]

    # MongoDB Credentials
    MONGODB_URI = os.getenv("MONGODB_URI")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")
    MONGODB_QUIZ_COLLECTION = os.getenv("MONGODB_QUIZ_COLLECTION", "quizzes")
    MONGODB_QUIZ_HISTORY_COLLECTION = os.getenv("MONGODB_QUIZ_HISTORY_COLLECTION", "quiz_history")
    MONGODB_CHAT_COLLECTION = os.getenv("MONGODB_CHAT_COLLECTION", "chat_sessions")
    MONGODB_VOICE_CHAT_COLLECTION = os.getenv("MONGODB_VOICE_CHAT_COLLECTION", "voice_chats")
    MONGODB_ACTIVE_SESSIONS_COLLECTION = os.getenv("MONGODB_ACTIVE_SESSIONS_COLLECTION", "active_sessions")
    MONGODB_ROADMAP_COLLECTION = os.getenv("MONGODB_ROADMAP_COLLECTION", "roadmaps")