"""Resume Builder & Analysis endpoints (placeholders).

Handles resume upload (Cloudinary) and analysis vs job description using AI.
"""
from flask import Blueprint, request, jsonify
from app.utils.cloudinary_utils import upload_file_to_cloudinary, fetch_file_from_cloudinary
from app.utils.pdf_utils import extract_text_from_pdf, extract_text_from_docx
import os
import requests
import tempfile
import json
import base64
import vertexai
from vertexai.generative_models import GenerativeModel
from google.oauth2 import service_account
from ..config import Config

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
    if 'resume' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    allowed_extensions = {'pdf', 'docx'}
    ext = os.path.splitext(file.filename)[1][1:].lower()
    if ext not in allowed_extensions:
        return jsonify({"error": "Invalid file type. Only PDF and DOCX allowed."}), 400

    try:
        result = upload_file_to_cloudinary(file)
        return jsonify({
            "secure_url": result.get("secure_url"),
            "url": result.get("url"),
            "public_id": result.get("public_id")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@resume_bp.route("/api/resume/analyze", methods=["POST"])
def analyze_resume():
    """Analyze resume against provided job description.

    Expected JSON: {"resume_url": "...", "job_description": "..."}
    Steps (future):
      1. Fetch resume text (OCR / parsing if needed)
      2. Call Vertex AI for semantic comparison & gap analysis
      3. Return suggestions: { strengths: [], improvements: [], score }
    """


    data = request.get_json()
    public_id = data.get("public_id")
    job_description = data.get("job_description")
    file_format = data.get("file_format", "pdf")  # default to pdf if not provided

    if not public_id or not job_description:
        return jsonify({"error": "Missing public_id or job_description"}), 400

    # Download resume file from Cloudinary (private)
    try:
        file_bytes = fetch_file_from_cloudinary(public_id, resource_type="raw", file_format=file_format)
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_format}") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        if file_format == "pdf":
            resume_text = extract_text_from_pdf(tmp_path)
        elif file_format == "docx":
            resume_text = extract_text_from_docx(tmp_path)
        else:
            return jsonify({"error": "Unsupported resume file type"}), 400
        os.remove(tmp_path)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch or parse resume: {str(e)}"}), 500

    # Vertex AI Gemini setup (same as roadmap.py)
    try:
        project_id = Config.GOOGLE_CLOUD_PROJECT
        location = Config.GOOGLE_CLOUD_LOCATION
        credentials_base64 = Config.VERTEX_DEFAULT_CREDENTIALS
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(base64.b64decode(credentials_base64))
        )
        vertexai.init(project=project_id, location=location, credentials=credentials)
        model_name = "gemini-2.5-pro"
        model = GenerativeModel(model_name=model_name)
        prompt = (
            "You are an expert career coach and resume analyst. "
            "Given the following resume and job description, analyze them and respond ONLY with a JSON object containing: "
            "'strengths' (list of strong points in the resume relevant to the job), "
            "'improvements' (list of specific suggestions to improve the resume for this job), "
            "'match_score' (number between 0-100 indicating how well the resume matches the job), "
            "and 'summary' (a concise summary of the analysis). "
            "Do not include any extra text or explanation outside the JSON object.\n\n"
            f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
        )
        response = model.generate_content(prompt)
        analysis = response.text
        return jsonify({"analysis": analysis})
    except Exception as e:
        return jsonify({"error": f"Gemini analysis failed: {str(e)}"}), 500
