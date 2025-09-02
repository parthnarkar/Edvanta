"""Vertex AI helper functions (placeholders).

Potential functionality:
- init_vertex_client(project_id, location)
- summarize_text(text)
- generate_tutor_response(prompt)
- generate_images(prompts: list)
"""

import json
import os
import vertexai
from vertexai.generative_models import GenerativeModel
from app import Config


def summarize_text(text: str):  # pragma: no cover - placeholder
    """Return structured summary of input text (future Vertex AI call)."""
    raise NotImplementedError


def generate_tutor_response(prompt: str):
    """Generate a tutoring style response (future LLM call)."""
    raise NotImplementedError


def generate_images(prompts):
    """Generate images based on prompts (future image model)."""
    raise NotImplementedError
