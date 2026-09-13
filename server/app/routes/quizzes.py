# QUIZ Backend 
"""Quiz generation & scoring endpoints.

Responsible for generating quizzes from topic content and managing quiz data.
"""
from flask import Blueprint, request, jsonify
import uuid
from datetime import datetime
from ..utils.quizzes_utils import create_quiz
from ..config import Config
from app.utils.mongo_utils import connect_to_mongodb
from app.middleware.auth import require_auth, verify_user_ownership

quizzes_bp = Blueprint("quizzes", __name__)

# MongoDB connection - GRACEFUL ERROR HANDLING WITH RECONNECTION SUPPORT
client = None
db = None
quizzes_collection = None
quiz_history_collection = None

def get_collections():
    """Retrieve collections dynamically with reconnection support."""
    global client, db, quizzes_collection, quiz_history_collection
    if db is None or quizzes_collection is None or quiz_history_collection is None:
        try:
            client, db, collection_name = connect_to_mongodb('MONGODB_QUIZ_COLLECTION')
            if db is not None and collection_name:
                quizzes_collection = db[collection_name]
                quiz_history_collection = db[Config.MONGODB_QUIZ_HISTORY_COLLECTION]
        except Exception as e:
            print(f"Quiz MongoDB connection failed: {str(e)}")
    return db, quizzes_collection, quiz_history_collection

# Attempt initial connection
get_collections()



@quizzes_bp.route("/api/quizzes/generate", methods=["POST"])
@require_auth
def generate_quiz():
    """Generate a quiz from provided topic text or summary.

    Expected JSON: {"topic": "...", "difficulty": "easy|medium|hard", "numberOfQuestions": 5-20}
    Returns: Generated quiz structure with questions
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        topic = data.get("topic", "").strip()
        difficulty = data.get("difficulty", "medium").lower()
        num_questions = data.get("numberOfQuestions", 10)
        
        # Validation
        if not topic:
            return jsonify({"error": "Topic is required"}), 400
        
        if difficulty not in ["easy", "medium", "hard"]:
            return jsonify({"error": "Difficulty must be easy, medium, or hard"}), 400
        
        if not isinstance(num_questions, int) or num_questions < 5 or num_questions > 20:
            return jsonify({"error": "Number of questions must be between 5 and 20"}), 400
        
        # Generate quiz using the unified create_quiz function
        quiz_data = create_quiz(topic, difficulty, num_questions)
        
        if not quiz_data:
            return jsonify({"error": "Failed to generate quiz"}), 500
        
        return jsonify(quiz_data)
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@quizzes_bp.route("/api/tools/quizzes", methods=["GET", "POST"])
@require_auth
def manage_quizzes():
    """Handle quiz management.
    
    GET: Fetch all saved quizzes for browsing
    POST: Save a generated quiz to the browsing list
    """
    
    if request.method == "GET":
        try:
            # Get user email from query parameters (required for user-specific data)
            user_email = request.args.get('user_email')
            
            if not user_email:
                return jsonify({"error": "user_email parameter is required"}), 400

            if not verify_user_ownership(user_email):
                return jsonify({"error": "Forbidden: Access denied to requested user data", "code": "FORBIDDEN"}), 403
            
            # Fetch quizzes for the specific user from MongoDB
            _, q_col, _ = get_collections()
            if q_col is None:
                return jsonify([])

            quizzes_cursor = q_col.find({"created_by": user_email})
            formatted_quizzes = []
            
            for quiz in quizzes_cursor:
                # Convert ObjectId to string for JSON serialization
                quiz['_id'] = str(quiz['_id'])
                formatted_quizzes.append({
                    "id": quiz["id"],
                    "title": quiz["topic"],
                    "category": "AI Generated",
                    "questions": len(quiz["questions"]),
                    "difficulty": quiz["difficulty"].title(),
                    "duration": f"{len(quiz['questions']) * 1.5:.0f} min",
                    "description": f"Quiz about {quiz['topic']} - {quiz['difficulty']} level",
                    "completed": False,
                    "score": None,
                    "quiz_data": quiz,  # Include full quiz data for taking the quiz
                    "created_by": quiz.get("created_by", "anonymous@example.com")
                })
            
            return jsonify(formatted_quizzes)
            
        except Exception:
            return jsonify([])
    
    elif request.method == "POST":
        # Save a quiz to the browsing list
        try:
            quiz_data = request.get_json()
            
            if not quiz_data or not isinstance(quiz_data, dict):
                return jsonify({"error": "Invalid quiz data"}), 400
            
            user_email = quiz_data.get('user_email', 'anonymous@example.com')
            if user_email and not verify_user_ownership(user_email):
                return jsonify({"error": "Forbidden: Access denied to requested user data", "code": "FORBIDDEN"}), 403
            
            # Generate UUID-based ID
            quiz_uuid = str(uuid.uuid4())
            
            # Add metadata
            quiz_entry = {
                "id": quiz_uuid,
                "topic": quiz_data.get("topic", "Untitled Quiz"),
                "difficulty": quiz_data.get("difficulty", "medium"),
                "questions": quiz_data.get("questions", []),
                "created_at": datetime.now().isoformat(),
                "created_by": user_email,
                "num_questions": len(quiz_data.get("questions", []))
            }
            
            # Insert into MongoDB
            _, q_col, _ = get_collections()
            if q_col is None:
                return jsonify({"error": "Database not available"}), 503

            result = q_col.insert_one(quiz_entry)
            
            return jsonify({
                "message": "Quiz saved successfully",
                "quiz_id": quiz_entry["id"],
                "mongo_id": str(result.inserted_id)
            })
            
        except Exception as e:
            return jsonify({"error": f"Failed to save quiz: {str(e)}"}), 500


@quizzes_bp.route("/api/tools/quizzes/<quiz_id>", methods=["DELETE"])
@require_auth
def delete_quiz(quiz_id):
    """Delete a quiz by UUID.
    
    DELETE: Remove a quiz from the saved quizzes list
    """
    try:
        user_email = request.args.get('user_email')
        if user_email and not verify_user_ownership(user_email):
            return jsonify({"error": "Forbidden: Access denied to requested user data", "code": "FORBIDDEN"}), 403

        _, q_col, _ = get_collections()
        if q_col is None:
            return jsonify({"error": "Database not available"}), 503

        # Delete from MongoDB using the custom UUID field and ensure ownership
        delete_query = {"id": quiz_id}
        if user_email:
            delete_query["created_by"] = user_email

        result = q_col.delete_one(delete_query)
        
        if result.deleted_count == 0:
            return jsonify({"error": "Quiz not found"}), 404
        
        return jsonify({
            "message": "Quiz deleted successfully",
            "deleted_quiz_id": quiz_id
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to delete quiz: {str(e)}"}), 500


@quizzes_bp.route("/api/quizzes/submit", methods=["POST"])
@require_auth
def submit_quiz():
    """Evaluate submitted answers and return score & feedback.

    Expected JSON: {"quiz_id": "...", "answers": [{"id": qid, "answer": value}]}
    Returns: { score, total, feedback: [...] }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        quiz_id = data.get("quiz_id")
        answers = data.get("answers", [])
        
        # Find the quiz in MongoDB
        _, q_col, _ = get_collections()
        if q_col is None:
            return jsonify({"error": "Database not available"}), 503

        quiz = q_col.find_one({"id": quiz_id})
        
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404
        
        # Calculate score and feedback
        questions = quiz["questions"]
        total_questions = len(questions)
        correct_count = 0
        feedback = []
        
        # Create answer lookup
        answer_lookup = {ans["id"]: ans["answer"] for ans in answers}
        
        for question in questions:
            question_id = question["id"]
            user_answer = answer_lookup.get(question_id)
            correct_answer = question["correctAnswer"]
            is_correct = user_answer == correct_answer
            
            if is_correct:
                correct_count += 1
            
            feedback.append({
                "question_id": question_id,
                "question": question["question"],
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "options": question["options"]
            })
        
        score_percentage = round((correct_count / total_questions) * 100)
        
        return jsonify({
            "score": correct_count,
            "total": total_questions,
            "percentage": score_percentage,
            "feedback": feedback
        })
        
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@quizzes_bp.route("/api/quiz-history", methods=["GET", "POST", "DELETE"])
@require_auth
def quiz_history_endpoint():
    """Handle quiz history operations."""
    
    if request.method == "GET":
        try:
            user_email = request.args.get('user_email') or request.args.get('userEmail') or request.args.get('userId') or request.args.get('user_id')
            
            if not user_email:
                return jsonify({"error": "user_email parameter is required"}), 400

            if not verify_user_ownership(user_email):
                return jsonify({"error": "Forbidden: Access denied to requested user data", "code": "FORBIDDEN"}), 403
            
            _, _, qh_col = get_collections()
            if qh_col is None:
                return jsonify([])

            history_cursor = qh_col.find({"user_email": user_email}).sort("completedAt", -1)
            history_list = []
            
            for entry in history_cursor:
                entry['_id'] = str(entry['_id'])
                history_list.append(entry)
            
            return jsonify(history_list)
            
        except Exception:
            return jsonify([])
    
    elif request.method == "POST":
        # Log quiz completion data to history
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No JSON data provided"}), 400

            user_email = data.get("user_email") or data.get("userEmail") or data.get("userId") or data.get("user_id") or "anonymous@example.com"
            if user_email and not verify_user_ownership(user_email):
                return jsonify({"error": "Forbidden: Access denied to requested user data", "code": "FORBIDDEN"}), 403
            
            history_uuid = str(uuid.uuid4())
            
            history_entry = {
                "id": history_uuid,
                "quizId": data.get("quizId", ""),
                "quizTitle": data.get("quizTitle", "Unknown Quiz"),
                "topic": data.get("topic", "Unknown Topic"),
                "difficulty": data.get("difficulty", "medium"),
                "totalQuestions": data.get("totalQuestions", 0),
                "correctAnswers": data.get("correctAnswers", 0),
                "percentage": data.get("percentage", 0),
                "completedAt": data.get("completedAt", datetime.now().isoformat()),
                "timeTaken": data.get("timeTaken", "Not tracked"),
                "user_email": user_email,
                "user_uid": data.get("userUid") or data.get("user_uid")
            }

            # Insert into MongoDB
            _, _, qh_col = get_collections()
            if qh_col is None:
                return jsonify({"error": "Database not available"}), 503

            result = qh_col.insert_one(history_entry)

            return jsonify({
                "message": "Quiz history logged successfully", 
                "id": history_entry["id"],
                "mongo_id": str(result.inserted_id)
            }), 201

        except Exception as e:
            return jsonify({"error": f"Failed to log quiz history: {str(e)}"}), 500
    
    elif request.method == "DELETE":
        # Clear quiz history for a specific user
        try:
            user_email = request.args.get('user_email') or request.args.get('userEmail') or request.args.get('userId') or request.args.get('user_id')
            
            if not user_email:
                return jsonify({"error": "user_email parameter is required"}), 400

            if not verify_user_ownership(user_email):
                return jsonify({"error": "Forbidden: Access denied to requested user data", "code": "FORBIDDEN"}), 403
            
            _, _, qh_col = get_collections()
            if qh_col is None:
                return jsonify({"error": "Database not available"}), 503

            result = qh_col.delete_many({"user_email": user_email})
            
            return jsonify({
                "message": f"Quiz history cleared successfully for user {user_email}",
                "deleted_count": result.deleted_count
            }), 200
            
        except Exception as e:
            return jsonify({"error": f"Failed to clear quiz history: {str(e)}"}), 500