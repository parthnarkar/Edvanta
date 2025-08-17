"""Conversational Tutor endpoints (placeholders).

Combines AI tutoring responses with optional ElevenLabs TTS for audio feedback.
"""
from flask import Blueprint, request, jsonify

tutor_bp = Blueprint("tutor", __name__)


@tutor_bp.route("/api/tutor/ask", methods=["POST"])
def tutor_ask():
    """Receive a tutoring question / prompt and return guidance + (optional) TTS.

    Expected JSON: {"prompt": "...", "voice": optional }
    Steps (future):
      1. Validate input
      2. Call Vertex AI for tutoring / step-by-step guidance
      3. Optionally synthesize audio via ElevenLabs (store or stream)
      4. Return { text_response, audio_url? }
    """
    return jsonify({"message": "Tutor ask endpoint placeholder"})
