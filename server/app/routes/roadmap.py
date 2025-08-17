"""Roadmap generation endpoints (placeholders).

Generates a learning roadmap with milestones, resources, and estimated durations.
"""
from flask import Blueprint, request, jsonify

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
    return jsonify({"message": "Roadmap generation endpoint placeholder"})
