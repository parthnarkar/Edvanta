"""Visual Content Generation API endpoints.

Adds endpoints for generating short videos from text, PDF URL, and audio URL.
Implementation follows the approach outlined in demo.py, but uses utils to
keep routes lean. Each route:
  1) Generates key moments (script + image prompts) via Vertex AI
  2) Produces AI images, speech, captions, and merges into a video
  3) Uploads the final video to Cloudinary and returns the URL

Note: Audio transcription is not implemented in the utils yet; provide
`transcript` directly when using the audio route or extend utils accordingly.
"""
from flask import Blueprint, request, jsonify

from ..utils.visual_utils import (
  generate_video_from_transcript_text,
  extract_text_from_pdf_url,
  extract_text_from_audio_url,
)
from ..utils.cloudinary_utils import upload_video_to_cloudinary
from app.utils.ai_utils import _get_fallback_response


visual_bp = Blueprint("visual", __name__)


@visual_bp.route("/api/visual/text-to-video", methods=["POST"])
def text_to_video():
  """Create a video from raw text.

  Expected JSON: {"text": "..."}
  Steps:
    - Use Vertex AI to extract key moments and image prompts
    - Generate AI images, synthesize TTS, render captions, merge clips
    - Upload final video to Cloudinary and return the secure URL
  """
  data = request.get_json(silent=True) or {}
  text = data.get("text")
  if not text:
    return jsonify({"error": "'text' is required"}), 400
  try:
    outfile = generate_video_from_transcript_text(text)
    if not outfile:
      # Return a fallback message when generation not available
      fallback = _get_fallback_response(text, context={"subject": "visual generation"})
      return jsonify({"warning": "Video generation not available in this deployment", "message": fallback}), 200
    url = upload_video_to_cloudinary(outfile)
    return jsonify({"url": url})
  except NotImplementedError as nie:
    return jsonify({"error": str(nie)}), 501
  except Exception as e:
    return jsonify({"error": str(e)}), 500


@visual_bp.route("/api/visual/pdf-url-to-video", methods=["POST"])
def pdf_url_to_video():
  """Create a video from a PDF URL.

  Expected JSON: {"pdf_url": "https://..."}
  Steps:
    - Download PDF and extract text
    - Reuse the text-to-video pipeline
    - Upload final video to Cloudinary and return the secure URL
  """
  data = request.get_json(silent=True) or {}
  pdf_url = data.get("pdf_url")
  if not pdf_url:
    return jsonify({"error": "'pdf_url' is required"}), 400
  try:
    text = extract_text_from_pdf_url(pdf_url)
    outfile = generate_video_from_transcript_text(text)
    if not outfile:
      fallback = _get_fallback_response(text, context={"subject": "visual generation"})
      return jsonify({"warning": "Video generation not available in this deployment", "message": fallback}), 200
    url = upload_video_to_cloudinary(outfile)
    return jsonify({"url": url})
  except Exception as e:
    return jsonify({"error": str(e)}), 500


@visual_bp.route("/api/visual/audio-url-to-video", methods=["POST"])
def audio_url_to_video():
  """Create a video from an audio URL.

  Expected JSON: {"audio_url": "https://..."} OR {"transcript": "..."}
  Steps:
    - If transcript provided, use it directly
    - Else (future) transcribe the audio URL to text
    - Reuse the text-to-video pipeline
    - Upload final video to Cloudinary and return the secure URL
  """
  data = request.get_json(silent=True) or {}
  transcript = data.get("transcript")
  audio_url = data.get("audio_url")
  if not transcript and not audio_url:
    return jsonify({"error": "Provide either 'transcript' or 'audio_url'"}), 400
  try:
    if not transcript:
      transcript = extract_text_from_audio_url(audio_url)
      if not transcript:
        return jsonify({"error": "Transcription produced empty text"}), 422
    outfile = generate_video_from_transcript_text(transcript)
    if not outfile:
      fallback = _get_fallback_response(transcript, context={"subject": "visual generation"})
      return jsonify({"warning": "Video generation not available in this deployment", "message": fallback}), 200
    url = upload_video_to_cloudinary(outfile)
    return jsonify({"url": url})
  except Exception as e:
    return jsonify({"error": str(e)}), 500
