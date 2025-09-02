# Quiz AI Help Utils 
"""Vertex AI helper functions (placeholders).

Potential functionality:
- init_vertex_client(project_id, location)
- summarize_text(text)
- generate_quiz_questions(topic, difficulty)
- generate_tutor_response(prompt)
- generate_images(prompts: list)
"""

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
        project_id = Config.VERTEX_PROJECT_ID or "massive-graph-465922-i8"
        location = Config.VERTEX_LOCATION or "us-central1"
        credentials_base64 = Config.VERTEX_DEFAULT_CREDENTIALS

        if not credentials_base64:
            # Fallback base64 credentials
            credentials_base64 = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAibWFzc2l2ZS1ncmFwaC00NjU5MjItaTgiLAogICJwcml2YXRlX2tleV9pZCI6ICI3YWIwNWUxZTFjOTcwN2E3MGZmOTdlNTdlODk1NGQ2Y2EzYmQ1NzNhIiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdlFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLY3dnZ1NqQWdFQUFvSUJBUURFMjJxazhZNkFIaGxxXG5HNk95RExZRkJlbk9BbVRPWU5UUzFuOXRtNzhad0pPejB0ajZ0bW41MmxiOW1ldzVGSkprRjkvWGc2RVh2RXB6XG5LKzVPYjVVUW5VZHBDUzd4cW5ybUxNT0xwa0JqUDN2U1FaS3dEWm1tOHpqanlQanF3b1NyRUVyZWdKbTFlRDlMXG50ZngzYS9hTEZUVTJJeDBienhJVHY4aGZZQVkxaWhtYXJEaXEvcXIwNTk2REJBYVdiNUI2cDNpcS9ZSnhzcEtWXG5MckYvY1hxczlmcDdVNEljaFMraDJvQlNzWHFwY1pIcUlibjNEUzhRTlVBTTd2WW5uYklhc0ZkUlE5R2N1enFhXG52WjRIMnFSRmUyUnZUaFVrN0ovMFdHMmliTCtWRVdkd0xvOWd1djExWUV1VWFiVUN2SUNPY24zem5YRUhWem1rXG5jdHF2dWJYakFnTUJBQUVDZ2dFQUlNdUUrckdiVWRDeDN6RjNsZVAwTnVZRFMyU3Vzb3NES1pTK2FkNDJlZTNSXG5MWFlFMjgrajNCSDV5QW5xaHAvY3Uzd1d1R3FmWGJycWxFRlBWQlhXdVl2YUo2OTErS0MwRk1DRVd6RjVMSStZXG42ekF0WmRMK05BZjFCRTJvMmtOSm9zMzJDeGRWaEJ2aVA1U3oySmxOMjJIUEdaUEQ5NndKa085MFR0OUthWVNyXG5icEtXYjdpaTFHUGRyNlFVb2ZrWThobUZWbk5TTlFpOUZOQVZhOXFuY3A4Z2FjVkg0RlRHaWl1YngzSzV6andXXG5ZeExYSjFUUzRSY0gwK3RkclUwdjNrNDErNWgrbnh3UEpzMzRmQkpFY2FwUEQvQjhaSEVMcVFqczNtVHlDRkc3XG4wK2xraXF2NVBZczBqVDhIZTEyUnJQZ25penR1L2NpRWh2RXRKNTJPZ1FLQmdRRGlJS2prc1dpWkRLRGludnJoXG4veHFBQVhLL2hQNHFUVjZ5SzFoWlBIRFJIM2lObWlrbUZjVkF1K2E4Ylhac2d1Zllic203Lzk0UGRHRE9WeVVZXG4veFZ3V3JEaFJhRGg0Nk9OOGJsY2xQUDJ6enBJMlJIMk81am9aVjNTZkF5T21nKzdyanlTZ0MzNmJQZWFWdW05XG5nV1pVckdMOVFzVE5Ub3pjdUVod0JwOEVRd0tCZ1FEZTNONEYxeS9mYkpsSWIxM0lOT2ZyQmUxUXRyODVMczlaXG5PYjRZTkY2Y0JGcjY1MURlVzFWR0FjM3NEMGlnSEwxTFpGWWNaWHRTcmU3M0dxMjhnUFMrbUxLdjZ5Q0VKN083XG5LRGR2VDZwUHhHa2ptWjh6d2dySytKNmxxNXZnOHFvcFRjMzJOMjlzVXRJb004MXJtNnErNHVpZFc2bDFPR2RFXG5PTFNSTUpFOTRRS0JnQWh0QXg0U1pqMWR0Umo4cDRpSVF1cUdJMHB6b0N6ZldTbjJaNEpidURCeXBjRlEvenVHXG5FQ1dMV3R1bWtJVVdrNkVDNzgxcmlWQzJHMjFVM2ZNQ2ZrQURnUmZEeW16Z1dKWFBiZ0svSWlBT05MUEdNdDhqXG45VnlqZWsxL2hkQkNlVmVhOUhMWkI5Mk85ZUx3WGlGTGt3NlFwZGVlQjB0SEpBU05jVldMU1oyVkFvR0JBTVF5XG43Y04yams3RDdLNDRYUGZFbStmc2IrQi9BaG4xZTlXeFlBa3ZFWnVJdWcvcFZPaHN2OFhDRU9laERPN29YajNoXG5OMjRJYVdtQWRzQlVYRjkzcC8ranJxdnc4ODlrcEd5USt6eWpoZXh6blp3WndtNXVoZEhxenNCTE5BLzFrcGlLXG5ScWhjWlZ1WURpd1didUl0U1VTRHZ3WEpqSVlHQWVPdGlFbkoyQlFCQW9HQWJ6Qklxby9SRC9ZcUIyVU1oTE1xXG5zdlRuTjc4djlwUnhYOERWOWdlZGJ3bm1LRXlUdUZ6RGNLNml5clBzZzdxaHVkdnRXVDBUVUs5ZVRtTlk5bzhMXG55QWs3Y3NBTGh5eU1FUnVzM1dRV1pVT1Yrc1ArbHdoaXVHTk9YdkVyenM2MDVQdDVZV2wxT3dNQ1RVUTl1OURwXG5wMC93Qzk1NDZCczlWL3lRMGVNTFVLZz1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJ2ZXJ0ZXgtYWktc2FAbWFzc2l2ZS1ncmFwaC00NjU5MjItaTguaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTAwMTg3MjQzNzQxNDgzMzg5NTY1IiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS92ZXJ0ZXgtYWktc2ElNDBtYXNzaXZlLWdyYXBoLTQ2NTkyMi1pOC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgInVuaXZlcnNlX2RvbWFpbiI6ICJnb29nbGVhcGlzLmNvbSIKfQo="

        print("✅ Using credentials for AI generation")

        # convert base64 to credentials
        try:
            credentials = service_account.Credentials.from_service_account_info(
                json.loads(base64.b64decode(credentials_base64))
            )
        except Exception as cred_error:
            raise Exception(f"Failed to decode credentials: {cred_error}")

        vertexai.init(project=project_id, location=location, credentials=credentials)

        # model = GenerativeModel("gemini-1.5-flash") # Not Working 
        model = GenerativeModel("gemini-2.5-flash")

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
