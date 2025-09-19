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
try:
    from google.oauth2 import service_account
except Exception:
    service_account = None
from ..config import Config
import re

resume_bp = Blueprint("resume", __name__)


def _safe_extract_json(text: str):
    """Best-effort extract a JSON object from arbitrary LLM text.

    - Tries direct json.loads.
    - If fails, attempts to find the first {...} block.
    - Returns dict or raises ValueError.
    """
    if not text:
        raise ValueError("Empty text")
    text = text.strip()
    # Quick path
    try:
        return json.loads(text)
    except Exception:
        pass

    # Attempt to locate the first JSON object in the text
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]
        try:
            return json.loads(candidate)
        except Exception:
            # Try to clean common issues like trailing commas
            cleaned = candidate.replace("\n", " ")
            # Remove code fences if present
            if cleaned.startswith('```'):
                cleaned = cleaned.strip('`')
            try:
                return json.loads(cleaned)
            except Exception as e:
                raise ValueError(f"Failed to parse JSON candidate: {e}")

    raise ValueError("No JSON object found in text")


def _normalize_analysis(obj: dict) -> dict:
    """Normalize parsed analysis into the required schema.

    Ensures keys: strengths (list[str]), improvements (list[str]),
    match_score (int 0..100), summary (str). Coerces types safely.
    """
    def to_list(val):
        if val is None:
            return []
        if isinstance(val, list):
            # stringify items
            return [str(x).strip() for x in val if str(x).strip()]
        if isinstance(val, str):
            # split on newlines or semicolons/bullets
            parts = [p.strip(" -•\t") for p in re.split(r"[\n;]+", val) if p.strip()]
            return parts
        return [str(val).strip()]

    def to_score(val):
        try:
            # Some models may return like "85%"
            if isinstance(val, str) and val.endswith('%'):
                val = val[:-1]
            score = int(round(float(val)))
            return max(0, min(100, score))
        except Exception:
            return 0

    def to_str(val):
        if val is None:
            return ""
        if isinstance(val, (dict, list)):
            try:
                return json.dumps(val, ensure_ascii=False)
            except Exception:
                return str(val)
        return str(val)

    # Allow some common aliasing
    strengths = obj.get('strengths') or obj.get('pros') or obj.get('good')
    improvements = obj.get('improvements') or obj.get('cons') or obj.get('suggestions') or obj.get('areas_to_improve')
    match_score = obj.get('match_score') or obj.get('match') or obj.get('score')
    summary = obj.get('summary') or obj.get('overview') or obj.get('notes')

    normalized = {
        'strengths': to_list(strengths),
        'improvements': to_list(improvements),
        'match_score': to_score(match_score),
        'summary': to_str(summary),
    }

    return normalized


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

    Expected JSON (one of):
      - {"public_id": "...", "file_format": "pdf|docx", "job_description": "..."}
      - {"resume_text": "...", "job_description": "..."}

    Behavior:
      - If "resume_text" provided, analyze that text directly.
      - Else require Cloudinary "public_id" and optional "file_format" (default: pdf) to fetch & parse.
    """

    data = request.get_json() or {}
    resume_text = (data.get("resume_text") or "").strip()
    public_id = data.get("public_id")
    job_description = (data.get("job_description") or "").strip()
    file_format = (data.get("file_format") or "pdf").lower()

    if not job_description:
        return jsonify({"error": "'job_description' is required"}), 400

    if not resume_text:
        if not public_id:
            return jsonify({"error": "Provide either 'resume_text' or 'public_id'"}), 400
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

    # Vertex AI Gemini setup (lazy import)
    try:
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel
        except Exception:
            return jsonify({"error": "AI service unavailable in this deployment"}), 503

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
        analysis_text = response.text or ""

        # Parse and normalize the model response into required schema
        try:
            parsed = _safe_extract_json(analysis_text)
            print(parsed)
            normalized = _normalize_analysis(parsed)
            print(normalized)
        except Exception:
            # Fallback: return defaults and include raw for troubleshooting
            normalized = {
                'strengths': [],
                'improvements': [],
                'match_score': 0,
                'summary': "",
            }
            return jsonify({
                "analysis": normalized,
                "raw": analysis_text,
                "warning": "LLM response was not valid JSON; returned defaults with raw included."
            })

        return jsonify({"analysis": normalized})
    except Exception as e:
        return jsonify({"error": f"Gemini analysis failed: {str(e)}"}), 500
