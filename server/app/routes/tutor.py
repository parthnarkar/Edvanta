"""Conversational Tutor endpoints.

Combines AI tutoring responses with Vertex AI
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import os
import json
from app.utils.ai_utils import get_vertex_response

tutor_bp = Blueprint("tutor", __name__)


@tutor_bp.route("/api/tutor/ask", methods=["POST"])
def tutor_ask():
    """Receive a tutoring question/prompt and return guidance.

    Expected JSON: {"prompt": "...", "mode": "...", "subject": "...", "isVoiceInput": optional }
    Returns: { success: bool, response: str, timestamp: str }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    prompt = data.get('prompt', '').strip()
    mode = data.get('mode', 'tutor')
    subject = data.get('subject', 'general')
    is_voice_input = data.get('isVoiceInput', True)  # Default to True as per requirements

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    print(f"🎓 Tutor request - Mode: {mode}, Subject: {subject}, Voice Input: {is_voice_input}, Prompt: {prompt}")

    # Create context for the AI based on mode and subject
    context = {
        "mode": mode,
        "subject": subject,
        "is_voice_input": is_voice_input
    }
    
    # Call Vertex AI for the response
    response = get_vertex_response(prompt, context)

    result = {
        "success": True,
        "response": response,
        "mode": mode,
        "subject": subject,
        "isVoiceInput": is_voice_input,
        "timestamp": datetime.utcnow().isoformat()
    }

    print(f"✅ Tutor response generated successfully")
    return jsonify(result)


@tutor_bp.route("/api/tutor/session/start", methods=["POST"])
def start_session():
    """Start a new tutoring session.

    Expected JSON: {"mode": "...", "subject": "...", "userEmail": "..."}
    Returns: { success: bool, session_id: str, message: str, timestamp: str }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    mode = data.get('mode', 'tutor')
    subject = data.get('subject', 'general')
    user_email = data.get('userEmail')

    if not user_email:
        return jsonify({"error": "User email is required"}), 400

    if not subject.strip():
        return jsonify({"error": "Subject is required"}), 400

    # Generate a unique session ID
    session_id = f"tutor_{mode}_{subject.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    print(f"🎓 Starting tutor session - ID: {session_id}, Mode: {mode}, Subject: {subject}, User: {user_email}")

    # Create context for Vertex AI welcome message
    welcome_context = {
        "mode": mode,
        "subject": subject,
        "session_id": session_id,
        "is_welcome": True
    }
    
    # Get personalized welcome message from Vertex AI
    welcome_prompt = f"Generate a welcoming message for a {mode} session about {subject}"
    welcome_message = get_vertex_response(welcome_prompt, welcome_context)

    result = {
        "success": True,
        "session_id": session_id,
        "mode": mode,
        "subject": subject,
        "message": welcome_message,
        "user_email": user_email,
        "timestamp": datetime.utcnow().isoformat()
    }

    print(f"✅ Tutor session started successfully")
    return jsonify(result)


@tutor_bp.route("/api/tutor/session/end", methods=["POST"])
def end_session():
    """End a tutoring session.

    Expected JSON: {"session_id": "..."}
    Returns: { success: bool, message: str }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    session_id = data.get('session_id')

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    print(f"🎓 Ending tutor session: {session_id}")

    # Create context for Vertex AI goodbye message
    goodbye_context = {
        "mode": session_id.split('_')[1] if '_' in session_id else 'tutor',
        "session_id": session_id,
        "is_goodbye": True
    }
    
    # Get personalized goodbye message from Vertex AI
    goodbye_prompt = "Generate a brief goodbye message for ending an educational session"
    goodbye_message = get_vertex_response(goodbye_prompt, goodbye_context)

    result = {
        "success": True,
        "message": goodbye_message,
        "session_id": session_id,
        "timestamp": datetime.utcnow().isoformat()
    }

    print(f"✅ Tutor session ended successfully")
    return jsonify(result)


@tutor_bp.route("/api/tutor/voice/toggle", methods=["POST"])
def toggle_voice():
    """Toggle voice output on/off.

    Expected JSON: {"enabled": bool, "session_id": "..."}
    Returns: { success: bool, voice_enabled: bool }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    enabled = data.get('enabled', False)
    session_id = data.get('session_id')

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    print(f"🎓 Voice toggle - Session: {session_id}, Enabled: {enabled}")

    # Create context for Vertex AI voice toggle message
    voice_context = {
        "mode": session_id.split('_')[1] if '_' in session_id else 'tutor',
        "session_id": session_id,
        "voice_enabled": enabled
    }
    
    # Get personalized voice toggle message from Vertex AI
    voice_prompt = f"Generate a brief message indicating that voice output is {'enabled' if enabled else 'disabled'}"
    voice_message = get_vertex_response(voice_prompt, voice_context)

    result = {
        "success": True,
        "voice_enabled": enabled,
        "message": voice_message,
        "session_id": session_id,
        "timestamp": datetime.utcnow().isoformat()
    }

    print(f"✅ Voice toggle successful")
    return jsonify(result)
