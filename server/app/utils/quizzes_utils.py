# Quiz AI Help Utils 


import json
import os
import base64
import tempfile
import vertexai
from vertexai.generative_models import GenerativeModel
from google.oauth2 import service_account
from app import Config


def create_quiz(topic: str, difficulty: str = "medium", num_questions: int = 10):
    """
    Simple function to create quizzes - tries AI first, falls back to hardcoded if it fails.
    """
    print(
        f"Creating quiz for topic: '{topic}', difficulty: '{difficulty}', questions: {num_questions}")

    # Try AI generation first
    try:
        print("🤖 Attempting AI generation...")

        # Set up credentials
        project_id = Config.GOOGLE_CLOUD_PROJECT
        location = Config.GOOGLE_CLOUD_LOCATION
        credentials_base64 = Config.VERTEX_DEFAULT_CREDENTIALS

        # Convert base64 to credentials
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(base64.b64decode(credentials_base64))
        )

        vertexai.init(project=project_id, location=location, credentials=credentials)

        model_name = Config.VERTEX_MODEL_NAME
        model = GenerativeModel(model_name=model_name)

        prompt = f"""Generate a quiz about "{topic}" with {num_questions} multiple choice questions.
Difficulty: {difficulty}

Return ONLY valid JSON in this exact format:

{{
  "topic": "{topic}",
  "difficulty": "{difficulty}",
  "questions": [
    {{
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }}
  ]
}}

Requirements:
- Return ONLY the JSON, no markdown, no extra text
- Exactly {num_questions} questions
- Each question has exactly 4 options
- correctAnswer must match exactly one of the options"""

        print("🔄 Sending request to AI model...")
        response = model.generate_content(prompt)

        # Clean response text
        response_text = response.text.strip()

        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        # Parse JSON
        quiz_data = json.loads(response_text.strip())

        # Basic validation
        if (isinstance(quiz_data, dict) and
            "topic" in quiz_data and
            "difficulty" in quiz_data and
            "questions" in quiz_data and
                len(quiz_data["questions"]) == num_questions):

            print("✅ AI generation successful!")
            return quiz_data
    except Exception as e:
        print(f"❌ AI generation failed: {e}")

    # Fallback to hardcoded quiz
    print("🔄 Using hardcoded quiz")
    return {
        "topic": topic,
        "difficulty": difficulty,
        "questions": [
            {
                "id": i + 1,
                "question": f"Sample question {i + 1} for {topic}?",
                "options": [f"Option A {i + 1}", f"Option B {i + 1}", f"Option C {i + 1}", f"Option D {i + 1}"],
                "correctAnswer": f"Option A {i + 1}"
            }
            for i in range(num_questions)
        ]
    }
