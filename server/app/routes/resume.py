"""Resume Builder & Analysis endpoints (placeholders).

Handles resume upload (Cloudinary) and analysis vs job description using AI.
"""
from flask import Blueprint, request, jsonify

resume_bp = Blueprint("resume", __name__)


@resume_bp.route("/api/resume/upload", methods=["POST"])
def upload_resume():
    """Upload a resume file to Cloudinary and return its URL / public_id.

    Expected: multipart/form-data with file field (e.g., 'resume').
    Steps (future):
      1. Validate file existence & type (PDF / DOCX)
      2. Upload to Cloudinary via helper util
      3. Return { url, public_id }
    """
    return jsonify({"message": "Resume upload endpoint placeholder"})


@resume_bp.route("/api/resume/analyze", methods=["POST"])
def analyze_resume():
    """Analyze resume against provided job description.

    Expected JSON: {"resume_url": "...", "job_description": "..."}
    Steps (future):
      1. Fetch resume text (OCR / parsing if needed)
      2. Call Vertex AI for semantic comparison & gap analysis
      3. Return suggestions: { strengths: [], improvements: [], score }
    """
    return jsonify({"message": "Resume analyze endpoint placeholder"})
