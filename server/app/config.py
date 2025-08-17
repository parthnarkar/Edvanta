"""Configuration module for Edvanta backend.

Environment variables (suggested):
- FLASK_ENV: development/production
- SECRET_KEY: Flask secret
- VERTEX_PROJECT_ID: GCP project for Vertex AI
- VERTEX_LOCATION: GCP region
- CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET: Cloudinary credentials
- ELEVENLABS_API_KEY: ElevenLabs TTS
- ALLOWED_ORIGINS: Comma separated origins for CORS (optional)
"""
from __future__ import annotations
import os
from typing import List


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    ENV = os.getenv("FLASK_ENV", "development")

    # External service credentials / settings (placeholders – do not hardcode real keys)
    VERTEX_PROJECT_ID = os.getenv("VERTEX_PROJECT_ID")
    VERTEX_LOCATION = os.getenv("VERTEX_LOCATION", "us-central1")

    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

    # CORS
    ALLOWED_ORIGINS: List[str] = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]

    # Future: database URI, caching layer, etc.
    # SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    # SQLALCHEMY_TRACK_MODIFICATIONS = False
