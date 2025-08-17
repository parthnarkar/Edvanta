"""Vertex AI helper functions (placeholders).

Potential functionality:
- init_vertex_client(project_id, location)
- summarize_text(text)
- generate_quiz_questions(topic, difficulty)
- generate_tutor_response(prompt)
- generate_images(prompts: list)
"""

# from vertexai import init  # Placeholder import (when google-cloud-aiplatform installed)


def summarize_text(text: str):  # pragma: no cover - placeholder
    """Return structured summary of input text (future Vertex AI call)."""
    raise NotImplementedError


def generate_quiz_questions(topic: str, difficulty: str = "medium"):
    """Generate quiz questions from topic (future Vertex AI call)."""
    raise NotImplementedError


def generate_tutor_response(prompt: str):
    """Generate a tutoring style response (future LLM call)."""
    raise NotImplementedError


def generate_images(prompts):
    """Generate images based on prompts (future image model)."""
    raise NotImplementedError
