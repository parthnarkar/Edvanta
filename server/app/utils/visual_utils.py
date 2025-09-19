"""Utilities for generating short videos from text/pdf/audio using Google GenAI (Vertex AI backend).

This follows the pipeline demonstrated in demo.py:
- Generate key moments with scripts and image prompts via Vertex AI (Gemini)
- Generate images for each moment via Imagen
- Synthesize voiceover via gTTS
- Render caption overlays with PIL
- Compose video with MoviePy

Environment requirements (see .env.example):
- GOOGLE_CREDENTIALS_JSON_BASE64: base64-encoded GCP service account JSON
- GOOGLE_PROJECT_ID: GCP project for Vertex AI text model
- GOOGLE_LOCATION: Vertex region (e.g., us-central1)
- Optional override for image generation project:
  - GCP_IMAGE_PROJECT_ID (defaults to GOOGLE_PROJECT_ID)
"""
from __future__ import annotations

# Suppress Vertex AI SDK deprecation warnings to keep logs clean
import warnings
warnings.filterwarnings(
    "ignore",
    category=UserWarning,
    message=r".*This feature is deprecated as of June 24, 2025.*genai-vertexai-sdk.*",
)

import base64
import json
import os
import re
import tempfile
from typing import Any, List, Tuple

import requests
try:
    from gtts import gTTS
except Exception:  # pragma: no cover - optional
    gTTS = None

try:
    from PIL import Image, ImageDraw, ImageFont
except Exception:  # pragma: no cover - optional
    Image = ImageDraw = ImageFont = None

try:
    from moviepy import (
        AudioFileClip,
        CompositeVideoClip,
        ImageClip,
        concatenate_videoclips,
    )
except Exception:  # pragma: no cover - optional
    AudioFileClip = CompositeVideoClip = ImageClip = concatenate_videoclips = None

try:
    from google import genai
    from google.genai import types as genai_types
except Exception:  # pragma: no cover - optional
    genai = None
    genai_types = None
from app.config import Config
from .cloudinary_utils import upload_video_to_cloudinary


# Canvas size (16:9)
WIDTH, HEIGHT = 1280, 720
DEFAULT_FONT_PATHS = [
    # macOS (Homebrew cask installs to user fonts)
    os.path.expanduser("~/Library/Fonts/DejaVuSans-Bold.ttf"),
    # macOS system-wide (if manually copied)
    "/Library/Fonts/DejaVuSans-Bold.ttf",
    # Fallbacks (system fonts)
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]
FONT_SIZE = 44


AI_PROMPT = (
    "You will be given a list of sentences from a script. For EACH sentence, produce EXACTLY ONE vivid, concrete "
    "image prompt that best visualizes that sentence. Return ONLY JSON in the form:\n\n"
    "{\n  \"image_prompts_per_sentence\": [\n    \"prompt for sentence 1\",\n    \"prompt for sentence 2\",\n    ...\n  ]\n}\n\n"
    "- The number of prompts MUST equal the number of input sentences.\n"
    "- Keep the same order as the provided sentences.\n"
    "- Do NOT include any other keys or commentary.\n"
)


def _load_font(size: int) -> Any:
    for path in DEFAULT_FONT_PATHS:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    # Fallback to PIL default
    return ImageFont.load_default()


_GENAI_TEXT_CLIENT = None
_GENAI_IMAGE_CLIENT = None


def _ensure_google_credentials() -> None:
    """Materialize GOOGLE_APPLICATION_CREDENTIALS from base64 env, if provided."""
    # If already set and file exists, do nothing
    existing = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if existing and os.path.exists(existing):
        return

    raw = Config.VERTEX_DEFAULT_CREDENTIALS
    if not raw:
        return  # Nothing to materialize

    # Allow either base64-encoded JSON or the literal JSON string
    service_account_json = None
    candidate = raw.strip().strip('"').strip("'")
    try:
        if candidate.startswith("{"):
            # Literal JSON
            json.loads(candidate)  # validate
            service_account_json = candidate
        else:
            decoded = base64.b64decode(candidate).decode("utf-8")
            json.loads(decoded)  # validate
            service_account_json = decoded
    except Exception as e:  # pragma: no cover - best effort
        print(f"[warn] Failed to decode GOOGLE_CREDENTIALS_JSON_BASE64: {e}")
        return

    try:
        # Stable file name derived from hash to avoid rewriting unnecessarily
        import hashlib
        digest = hashlib.sha1(service_account_json.encode("utf-8")).hexdigest()[:10]
        key_file_path = os.path.join(tempfile.gettempdir(), f"gcp_key_{digest}.json")
        if not os.path.exists(key_file_path):
            with open(key_file_path, "w") as f:
                f.write(service_account_json)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file_path
    except Exception as e:  # pragma: no cover
        print(f"[warn] Could not write service account file: {e}")


def _get_project_and_location(for_images: bool = False) -> tuple[str, str]:
    """Resolve project and location from environment with sensible fallbacks."""
    # Use Config values
    project = Config.GOOGLE_CLOUD_PROJECT
    location = Config.GOOGLE_CLOUD_LOCATION
    if not project:
        raise RuntimeError("Project ID not set in Config.GOOGLE_CLOUD_PROJECT")
    return project, location


def _get_genai_text_client() -> Any:
    global _GENAI_TEXT_CLIENT
    if _GENAI_TEXT_CLIENT is None:
        _ensure_google_credentials()
        project, location = _get_project_and_location()
        _GENAI_TEXT_CLIENT = genai.Client(vertexai=True, project=project, location=location)
    return _GENAI_TEXT_CLIENT


def _get_genai_image_client() -> Any:
    global _GENAI_IMAGE_CLIENT
    if _GENAI_IMAGE_CLIENT is None:
        _ensure_google_credentials()
        project, location = _get_project_and_location(for_images=True)
        _GENAI_IMAGE_CLIENT = genai.Client(vertexai=True, project=project, location=location)
    return _GENAI_IMAGE_CLIENT


def generate_content_with_vertex_ai(prompt: str) -> str:
    """Generate content using Gemini via google-genai (returns plain text)."""
    if genai is None or genai_types is None:
        # genai SDK not installed in this lightweight deployment
        raise RuntimeError("Vertex AI SDK not available in this deployment")
    client = _get_genai_text_client()
    model_id = Config.GENAI_TEXT_MODEL
    chat = client.chats.create(
        model=model_id,
        config=genai_types.GenerateContentConfig(),
    )
    response = chat.send_message(prompt)
    return getattr(response, "text", "").strip()


def _summarize_text_for_video(text: str) -> str:
    """Summarize input text into a concise narration script.

    Falls back to the original text if summarization fails or is too short.
    """
    instruction = (
        "Summarize the following text into a concise, coherent script suitable for a short narration video. "
        "Preserve key information, keep the original language, and prefer clear and short sentences. "
        "Return ONLY the summarized script as plain text without any headings or labels.\n\nText:\n"
    )
    try:
        result = generate_content_with_vertex_ai(instruction + text)
        result = (result or "").strip()
        if len(result) >= 20:
            return result
    except Exception:
        # Vertex AI not available; fall back to original text
        pass
    return text


def _split_into_sentences(text: str) -> List[str]:
    """Basic sentence splitter on ., !, ? with whitespace handling."""
    # Normalize spaces and newlines
    cleaned = re.sub(r"\s+", " ", text.strip())
    if not cleaned:
        return []
    parts = re.split(r"(?<=[.!?])\s+", cleaned)
    # Remove empty parts and super short items
    sentences = [p.strip() for p in parts if p and p.strip()]
    return sentences


def _extract_prompts_for_sentences(sentences: List[str]) -> List[str]:
    """Ask the LLM to produce 1 image prompt per sentence in order."""
    payload = {"sentences": sentences}
    prompt = (
        f"{AI_PROMPT}\nInput (JSON):\n" + json.dumps(payload, ensure_ascii=False)
    )
    result = generate_content_with_vertex_ai(prompt)
    try:
        data = json.loads(result)
        arr = data.get("image_prompts_per_sentence") if isinstance(data, dict) else data
        # Prefer a flat list of strings
        if isinstance(arr, list) and all(isinstance(x, str) for x in arr):
            return [str(p) for p in arr]
        # Accept list of lists (take first item of each)
        if isinstance(arr, list) and all(isinstance(x, list) and x for x in arr):
            return [str(x[0]) for x in arr]
    except Exception:
        pass
    # Fallback: parse any top-level JSON array of strings
    match = re.search(r"\[\s*\".*?\"\s*(?:,\s*\".*?\"\s*)*\]", result, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, list):
                # If nested, take first; else use as-is
                if all(isinstance(x, list) and x for x in parsed):
                    return [str(x[0]) for x in parsed]
                return [str(x) for x in parsed]
        except Exception:
            pass
    raise ValueError("LLM did not return image_prompts_per_sentence in expected format")


def generate_images_with_vertex_ai(prompts: List[str]) -> List[str]:
    """Generate images for each prompt using Imagen via google-genai; return file paths.

    Note: aspect_ratio set to 16:9 to match output video.
    """
    client = _get_genai_image_client()
    model_id = Config.GENAI_IMAGE_MODEL

    generated_images: List[str] = []
    for i, prompt in enumerate(prompts):
        try:
            resp = client.models.generate_images(
                model=model_id,
                prompt=prompt,
                config=genai_types.GenerateImagesConfig(
                    aspect_ratio="16:9",
                    number_of_images=1,
                    image_size="2K",
                    safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
                    person_generation="ALLOW_ADULT",
                ),
            )

            image_bytes = None
            # Try expected shapes
            if hasattr(resp, "images") and resp.images:
                img0 = resp.images[0]
                image_bytes = getattr(img0, "image_bytes", None) or getattr(img0, "bytes", None)
            elif hasattr(resp, "generated_images") and resp.generated_images:
                img0 = resp.generated_images[0]
                image_bytes = getattr(img0, "image_bytes", None) or getattr(img0, "bytes", None)

            if not image_bytes:
                raise RuntimeError("No image bytes returned by Imagen")

            image_path = os.path.join(tempfile.gettempdir(), f"ai_image_{i}.png")
            print(image_path)
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            generated_images.append(image_path)
        except Exception as e:  # pragma: no cover - best-effort generation
            print(f"[warn] Failed to generate image for prompt: {prompt[:60]}... Error: {e}")
            continue

    return generated_images

def _generate_caption_clips(script: str, idx: int, total_dur: float) -> Tuple[List[Any], List[str]]:
    """Create caption overlays as short ImageClips and return (clips, temp_files)."""
    words = script.split()
    chunks = [" ".join(words[i : i + 4]) for i in range(0, len(words), 4)]  # 4-word chunks
    if not chunks:
        chunks = [script]
    dur = max(total_dur / max(1, len(chunks)), 0.1)
    font = _load_font(FONT_SIZE)

    clips: List[Any] = []
    img_files: List[str] = []

    for j, chunk in enumerate(chunks):
        img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        bbox = draw.textbbox((0, 0), chunk, font=font)
        x = (WIDTH - (bbox[2] - bbox[0])) // 2
        y = HEIGHT - (bbox[3] - bbox[1]) - 60
        # background rectangle for readability
        draw.rectangle(
            [(x - 10, y - 10), (x + (bbox[2] - bbox[0]) + 10, y + (bbox[3] - bbox[1]) + 10)],
            fill=(0, 0, 0, 180),
        )
        draw.text((x, y), chunk, font=font, fill="white")
        fname = os.path.join(tempfile.gettempdir(), f"ai_caption_{idx}_{j}.png")
        img.save(fname)
        img_files.append(fname)
        clip = (
            ImageClip(fname)
            .with_start(j * dur)
            .with_duration(dur)
            .with_position(("center", "bottom"))
        )
        clips.append(clip)

    return clips, img_files


def _create_key_moment_clip(moment: dict, idx: int) -> Tuple[Any, List[str]]:
    """Create a CompositeVideoClip for a single key moment and return (clip, temp_files)."""
    temp_files: List[str] = []

    # Voiceover
    audio_file = os.path.join(tempfile.gettempdir(), f"ai_speech_{idx}.mp3")
    tts = gTTS(text=moment["script"], lang="en")
    tts.save(audio_file)
    audio = AudioFileClip(audio_file)
    total_dur = max(audio.duration, 1.0)
    temp_files.append(audio_file)

    # Images
    image_paths = generate_images_with_vertex_ai(moment["image_prompts"])
    if not image_paths:
        audio.close()
        raise RuntimeError("No AI images could be generated")

    per_image_duration = total_dur / len(image_paths)
    image_clips: List[Any] = []
    for image_path in image_paths:
        try:
            img_clip = (
                ImageClip(image_path)
                .with_duration(per_image_duration)
                .resized((WIDTH, HEIGHT))
            )
            image_clips.append(img_clip)
            temp_files.append(image_path)
        except Exception as e:  # pragma: no cover
            print(f"[warn] Error processing image {image_path}: {e}")
            continue

    if not image_clips:
        audio.close()
        raise RuntimeError("No valid image clips could be created")

    base_video = concatenate_videoclips(image_clips).with_duration(total_dur)

    # Captions
    captions, caption_files = _generate_caption_clips(moment["script"], idx, total_dur)
    temp_files.extend(caption_files)

    final = (
        CompositeVideoClip([base_video, *captions])
        .with_audio(audio)
        .with_duration(total_dur)
    )
    # Do not write file or close audio here; caller will concatenate and write.

    return final, temp_files


def _cleanup_temp_files(files: List[str]) -> None:
    for f in files:
        try:
            if os.path.exists(f):
                os.remove(f)
        except Exception:
            pass


def generate_video_from_transcript_text(transcript_text: str, upload: bool = True) -> str:
    """Generate a single video by:
    - Summarizing the input into a concise script
    - Splitting the summarized script into sentences
    - Generating 1 image prompt per sentence via LLM
    - Creating a clip per sentence (images + TTS + captions)
    - Concatenating all clips in order
    - Optionally uploading the final MP4 to Cloudinary and returning the secure URL
    """
    summarized = _summarize_text_for_video(transcript_text)
    sentences = _split_into_sentences(summarized)
    if not sentences:
        raise ValueError("No sentences found in input text")
    
    print(sentences)

    prompts_per_sentence = _extract_prompts_for_sentences(sentences)
    # Ensure alignment; retry re-extraction if mismatch
    attempts = 1
    while len(prompts_per_sentence) != len(sentences) and attempts < 3:
        print(
            f"[info] Re-extracting prompts (attempt {attempts+1}) because got {len(prompts_per_sentence)} prompts for {len(sentences)} sentences"
        )
        prompts_per_sentence = _extract_prompts_for_sentences(sentences)
        attempts += 1
    if len(prompts_per_sentence) != len(sentences):
        raise ValueError(
            f"Mismatch between sentence count ({len(sentences)}) and prompts returned by LLM ({len(prompts_per_sentence)})"
        )
    
    print(prompts_per_sentence)

    clips: List[Any] = []
    temp_files: List[str] = []
    try:
        for idx, sentence in enumerate(sentences):
            moment = {"script": sentence, "image_prompts": [prompts_per_sentence[idx]]}
            clip, files = _create_key_moment_clip(moment, idx)
            clips.append(clip)
            temp_files.extend(files)

        # Concatenate per-sentence clips
        final_video = concatenate_videoclips(clips, method="compose")
        outdir = os.path.join(tempfile.gettempdir(), "ai_sentence_video")
        os.makedirs(outdir, exist_ok=True)
        outfile = os.path.join(outdir, "ai_sentences_compiled.mp4")
        final_video.write_videofile(outfile, fps=24, codec="libx264", audio_codec="aac")
        final_video.close()
        if upload:
            try:
                url = upload_video_to_cloudinary(outfile)
                return url
            finally:
                # Remove local video after upload attempt
                try:
                    if os.path.exists(outfile):
                        os.remove(outfile)
                except Exception:
                    pass
        return outfile  # Return local path if upload disabled
    finally:
        _cleanup_temp_files(temp_files)
        for c in clips:
            try:
                c.close()
            except Exception:
                pass


def extract_text_from_pdf_url(pdf_url: str) -> str:
    """Download a PDF from URL and extract text using PyPDF2."""
    import PyPDF2

    resp = requests.get(pdf_url, timeout=30)
    resp.raise_for_status()
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(resp.content)
        tmp_path = tmp.name

    text_parts: List[str] = []
    with open(tmp_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            try:
                text_parts.append(page.extract_text() or "")
            except Exception:
                continue
    os.remove(tmp_path)
    return "\n".join(text_parts).strip()


def extract_text_from_audio_url(audio_url: str) -> str:
    """Download audio URL and transcribe using openai-whisper.

    Requirements: `openai-whisper` and ffmpeg installed on the system.
    """
    # Lazy import to avoid hard dependency at module import time
    import whisper  # type: ignore

    resp = requests.get(audio_url, stream=True, timeout=60)
    resp.raise_for_status()
    suffix = ".mp3"
    ctype = resp.headers.get("Content-Type", "").lower()
    if "wav" in ctype:
        suffix = ".wav"
    elif "m4a" in ctype:
        suffix = ".m4a"
    elif "mpeg" in ctype or "mp3" in ctype:
        suffix = ".mp3"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                tmp.write(chunk)
        audio_path = tmp.name

    # Use a reasonable default model; adjust if needed for accuracy/speed
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    text = (result.get("text") or "").strip()
    try:
        os.remove(audio_path)
    except Exception:
        pass
    return text
