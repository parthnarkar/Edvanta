# Quiz AI Help Utils using centralized AI system

from .ai_utils import generate_quiz_content

def create_quiz(topic: str, difficulty: str = "medium", num_questions: int = 10):
    """
    Simple function to create quizzes using centralized AI system with fallback.
    """

    # Try AI generation first using centralized system
    try:
        
        result = generate_quiz_content(topic, difficulty, num_questions)
        
        if result['success']:
            # Format to match expected structure
            quiz_data = {
                "topic": topic,
                "difficulty": difficulty,
                "questions": []
            }
            
            for i, question in enumerate(result.get('questions', []), 1):
                options = question.get("options", [])
                correct_ans = question.get("correct_answer", 0)
                try:
                    correct_idx = int(correct_ans)
                except (ValueError, TypeError):
                    correct_idx = 0

                if options and 0 <= correct_idx < len(options):
                    correct_val = options[correct_idx]
                elif options:
                    correct_val = options[0]
                else:
                    correct_val = ""

                quiz_data["questions"].append({
                    "id": i,
                    "question": question.get("question", ""),
                    "options": options,
                    "correctAnswer": correct_val
                })
            
            return quiz_data
        else:
            raise Exception("AI generation failed")

    except Exception as e:
        raise e
