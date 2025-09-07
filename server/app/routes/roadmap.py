"""Roadmap generation endpoints (placeholders).

Generates a learning roadmap with milestones, resources, and estimated durations.
"""
from flask import Blueprint, request, jsonify
import os
import json
import base64
import vertexai
from vertexai.generative_models import GenerativeModel
from google.oauth2 import service_account
from ..config import Config

roadmap_bp = Blueprint("roadmap", __name__)


@roadmap_bp.route("/api/roadmap/generate", methods=["POST"])
def generate_roadmap():
    """Generate roadmap for a target skill or goal.

    Expected JSON: {"goal": "Become a ML Engineer", "duration_weeks": 12 }
    Steps (future):
      1. Validate request
      2. Call Vertex AI to outline milestones & sequencing
      3. Enrich with external curated resources (future integration)
      4. Return { goal, milestones: [ {title, weeks, resources[]} ] }
    """
    data = request.get_json()
    goal = data.get("goal")
    background = data.get("background")  # user's current knowledge/skills
    duration_weeks = data.get("duration_weeks")
    if not goal or not background:
      return jsonify({"error": "Missing goal or background"}), 400

    # Vertex AI Gemini setup (same as chatbot.py)
    try:
      print(1)
      project_id = Config.GOOGLE_CLOUD_PROJECT
      print(2)
      location = Config.GOOGLE_CLOUD_LOCATION
      print(3)
      credentials_base64 = Config.VERTEX_DEFAULT_CREDENTIALS
      print(4)
      credentials = service_account.Credentials.from_service_account_info(
        json.loads(base64.b64decode(credentials_base64))
      )
      print(5)
      vertexai.init(project=project_id, location=location, credentials=credentials)
      print(6)
      model_name = "gemini-2.5-pro"
      print(model_name)
      model = GenerativeModel(model_name=model_name)
      print(8)
      prompt = (
        "You are a career roadmap assistant. Given a user's goal and background, "
        "generate a learning roadmap as a directed graph in JSON. "
        "Each node should represent a milestone or skill, with edges showing dependencies. "
        "Each node must have: id, title, description, recommended_weeks, resources (list of links or names). "
        "The graph should have a start node and an end node (the goal). "
        "Respond ONLY with a JSON object with keys: nodes (list), edges (list of {from, to}).\n\n"
        f"Goal: {goal}\n"
        f"Background: {background}\n"
        f"Target Duration (weeks): {duration_weeks if duration_weeks else 'Not specified'}"
      )
      print(9)
      response = model.generate_content(prompt)
      print(10)
      roadmap_json = response.text
      return jsonify({"roadmap": roadmap_json})
    except Exception as e:
      return jsonify({"error": f"Roadmap generation failed: {str(e)}"}), 500
