"""Doubt Solving Chatbot API endpoints (placeholders).

Handles conversational Q&A for student doubts using LLM (Vertex AI) context +
(optional) retrieval over stored knowledge base / vector store.
"""
from flask import Blueprint, request, jsonify

chatbot_bp = Blueprint("chatbot", __name__)


@chatbot_bp.route("/api/chat/ask", methods=["POST"])
def ask_question():
    """Answer a student's question.

    Expected JSON: {"question": "...", "context": optional }
    Steps (future):
      1. Validate input
      2. Retrieve relevant context (vector store / documents)
      3. Call Vertex AI model for answer generation (with context)
      4. Return structured answer + (maybe) sources
    """
    return jsonify({"message": "Chat ask endpoint placeholder"})
