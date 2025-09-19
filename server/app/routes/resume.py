"""Resume Builder & Analysis endpoints (placeholders).

Handles resume upload (Cloudinary) and analysis vs job description using AI.
"""
from flask import Blueprint, request, jsonify, Response
from app.utils.cloudinary_utils import upload_file_to_cloudinary, fetch_file_from_cloudinary
from app.utils.pdf_utils import extract_text_from_pdf, extract_text_from_docx, render_resume_pdf_bytes
import os
import requests
import tempfile
import json
import base64
import vertexai
from vertexai.generative_models import GenerativeModel
from google.oauth2 import service_account
from ..config import Config
import re
import uuid
from datetime import datetime
from app.utils.mongo_utils import connect_to_mongodb

resume_bp = Blueprint("resume", __name__)


def _safe_extract_json(text: str):
    if not text:
        raise ValueError("Empty text")
    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        pass

    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]
        try:
            return json.loads(candidate)
        except Exception:
            cleaned = candidate.replace("\n", " ")
            if cleaned.startswith('```'):
                cleaned = cleaned.strip('`')
            try:
                return json.loads(cleaned)
            except Exception as e:
                raise ValueError(f"Failed to parse JSON candidate: {e}")

    raise ValueError("No JSON object found in text")


def _normalize_analysis(obj: dict) -> dict:
    def to_list(val):
        if val is None:
            return []
        if isinstance(val, list):
            return [str(x).strip() for x in val if str(x).strip()]
        if isinstance(val, str):
            parts = [p.strip(" -•\t") for p in re.split(r"[\n;]+", val) if p.strip()]
            return parts
        return [str(val).strip()]

    def to_score(val):
        try:
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

@resume_bp.route("/api/resume/builder",methods=["POST"])
def resume_builder():
    """Build a resume from structured sections and return a RenderCV-like JSON.

    Expected JSON body:
    {
      "personal_info": {"full_name":"","email":"","phone":"","location":"","portfolio":""},
      "professional_summary": "...",
      "work_experience": [
        {"position_title":"","employment_type":"","company_name":"","start_month_year":"",
         "end_month_year":"","company_location":"","location_head":"","description":"",
         "skills":["..."]}
      ],
      "education": [
        {"school_name":"","degree":"","field_of_study":"","start_month_year":"","end_month_year":"","grade":""}
      ],
      "skills": ["..."],
      "projects": [
        {"name":"","description":"","github_url":"","deployed_url":""}
      ],
      "user_email": "optional@user.com"
    }
    """
    def build_fallback_resume(payload: dict) -> dict:
        personal = (payload.get("personal_info") or {})
        summary = (payload.get("professional_summary") or "").strip()
        work = (payload.get("work_experience") or [])
        edu = (payload.get("education") or [])
        skills = (payload.get("skills") or [])
        projects = (payload.get("projects") or [])

        basics = {
            "name": (personal.get("full_name") or "").strip(),
            "email": (personal.get("email") or "").strip(),
            "phone": (personal.get("phone") or "").strip(),
            "location": (personal.get("location") or "").strip(),
            "website": (personal.get("portfolio") or "").strip(),
        }

        work_entries = []
        for w in work:
            work_entries.append({
                "name": (w.get("company_name") or "").strip(),
                "position": (w.get("position_title") or "").strip(),
                "employmentType": (w.get("employment_type") or "").strip(),
                "location": (w.get("company_location") or "").strip(),
                "locationHead": (w.get("location_head") or "").strip(),
                "startDate": (w.get("start_month_year") or "").strip(),
                "endDate": (w.get("end_month_year") or "").strip(),
                "highlights": [h.strip() for h in ((w.get("description") or "")).split(";") if h.strip()],
                "skills": w.get("skills") or []
            })

        edu_entries = []
        for e in edu:
            edu_entries.append({
                "institution": (e.get("school_name") or "").strip(),
                "studyType": (e.get("degree") or "").strip(),
                "area": (e.get("field_of_study") or "").strip(),
                "startDate": (e.get("start_month_year") or "").strip(),
                "endDate": (e.get("end_month_year") or "").strip(),
                "score": (e.get("grade") or "").strip()
            })

        proj_entries = []
        for p in projects:
            proj_entries.append({
                "name": (p.get("name") or "").strip(),
                "description": (p.get("description") or "").strip(),
                "github": (p.get("github_url") or "").strip(),
                "url": (p.get("deployed_url") or "").strip(),
                "highlights": []
            })

        return {
            "basics": basics,
            "summary": summary,
            "work": work_entries,
            "education": edu_entries,
            "skills": skills,
            "projects": proj_entries
        }

    try:
        payload = request.get_json() or {}
        user_email = payload.get("user_email")

        # Vertex AI setup (same style as other endpoints)
        project_id = Config.GOOGLE_CLOUD_PROJECT
        location = Config.GOOGLE_CLOUD_LOCATION
        credentials_base64 = Config.VERTEX_DEFAULT_CREDENTIALS
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(base64.b64decode(credentials_base64))
        )
        vertexai.init(project=project_id, location=location, credentials=credentials)
        model_name = getattr(Config, "VERTEX_MODEL_NAME", "gemini-2.5-pro")
        model = GenerativeModel(model_name=model_name)

        personal = payload.get("personal_info") or {}
        work = payload.get("work_experience") or []
        edu = payload.get("education") or []
        skills = payload.get("skills") or []
        projects = payload.get("projects") or []
        user_summary = (payload.get("professional_summary") or "").strip()

        schema_hint = (
            "Return ONLY a JSON object with this schema (no markdown/backticks):\n"
            "{\n"
            "  \"basics\": {\n"
            "    \"name\": string,\n"
            "    \"email\": string,\n"
            "    \"phone\": string,\n"
            "    \"location\": string,\n"
            "    \"website\": string\n"
            "  },\n"
            "  \"summary\": string,\n"
            "  \"work\": [ {\n"
            "      \"name\": string,\n"
            "      \"position\": string,\n"
            "      \"employmentType\": string,\n"
            "      \"location\": string,\n"
            "      \"locationHead\": string,\n"
            "      \"startDate\": string,\n"
            "      \"endDate\": string,\n"
            "      \"highlights\": [ string, ... ],\n"
            "      \"skills\": [ string, ... ]\n"
            "  } ],\n"
            "  \"education\": [ {\n"
            "      \"institution\": string,\n"
            "      \"studyType\": string,\n"
            "      \"area\": string,\n"
            "      \"startDate\": string,\n"
            "      \"endDate\": string,\n"
            "      \"score\": string\n"
            "  } ],\n"
            "  \"skills\": [ string, ... ],\n"
            "  \"projects\": [ {\n"
            "      \"name\": string,\n"
            "      \"description\": string,\n"
            "      \"github\": string,\n"
            "      \"url\": string,\n"
            "      \"highlights\": [ string, ... ]\n"
            "  } ]\n"
            "}\n"
            "Rules:\n"
            "- Use only information provided by the user; do NOT invent employers, dates, or metrics.\n"
            "- Rewrite text for clarity and resume tone.\n"
            "- Keep highlights concise (<= 20 words) and relevant (3-6 bullets per job).\n"
            "- Keep summary 2-4 sentences and do not duplicate work details.\n"
        )

        prompt = (
            "You are a senior resume writer. Convert the following user-provided sections "
            "into a clean, structured resume JSON suitable for a RenderCV-like theme.\n\n"
            f"User Personal Info JSON:\n{json.dumps(personal, ensure_ascii=False)}\n\n"
            f"User Professional Summary:\n{user_summary}\n\n"
            f"User Work Experience JSON Array:\n{json.dumps(work, ensure_ascii=False)}\n\n"
            f"User Education JSON Array:\n{json.dumps(edu, ensure_ascii=False)}\n\n"
            f"User Skills Array:\n{json.dumps(skills, ensure_ascii=False)}\n\n"
            f"User Projects JSON Array:\n{json.dumps(projects, ensure_ascii=False)}\n\n"
            f"{schema_hint}"
        )

        llm_resp = model.generate_content(prompt)
        text = llm_resp.text or ""

        # Clean any code fences if present
        if "```" in text:
            text = text.replace("```json", "").replace("```", "").strip()
        text = text.replace("`", "")

        try:
            resume_struct = _safe_extract_json(text)
        except Exception:
            resume_struct = build_fallback_resume(payload)

        # Minimal normalization to ensure keys exist
        baseline = build_fallback_resume(payload)
        for k in ["basics", "summary", "work", "education", "skills", "projects"]:
            if k not in resume_struct or resume_struct[k] is None:
                resume_struct[k] = baseline[k]

        # Save to MongoDB using shared util
        client, db, resumes_collection = connect_to_mongodb(
            collection_config_attr="MONGODB_RESUME_COLLECTION",
            fallback_collection="resumes",
        )
        doc_id = None
        if db is not None and resumes_collection:
            try:
                doc = {
                    "id": str(uuid.uuid4()),
                    "user_email": user_email,
                    "created_at": datetime.utcnow(),
                    "resume": resume_struct,
                }
                db[resumes_collection].insert_one(doc)
                doc_id = doc["id"]
            except Exception as db_err:
                # proceed without failing the response
                pass

        # Return PDF if requested
        return_pdf = bool(payload.get("return_pdf"))
        return_pdf_base64 = bool(payload.get("return_pdf_base64"))
        include_json = bool(payload.get("include_json", False))  # default: don't include JSON

        if return_pdf or return_pdf_base64:
            pdf_bytes = render_resume_pdf_bytes(resume_struct)
            if return_pdf_base64:
                b64 = base64.b64encode(pdf_bytes).decode("utf-8")
                resp = {"id": doc_id, "pdf_base64": b64}
                if include_json:
                    resp["resume"] = resume_struct
                return jsonify(resp)
            filename = f"resume_{doc_id or 'generated'}.pdf"
            return Response(
                pdf_bytes,
                mimetype="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )

        # Default JSON response
        if doc_id:
            return jsonify({"id": doc_id, "resume": resume_struct})
        return jsonify({"resume": resume_struct})

    except Exception as e:
        return jsonify({"error": f"Resume build failed: {str(e)}"}), 500
