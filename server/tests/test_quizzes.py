import pytest
from unittest.mock import patch, MagicMock
from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@patch("app.routes.quizzes.create_quiz")
def test_generate_quiz_success(mock_create, client):
    """Test generating a quiz from a topic successfully."""
    mock_quiz_data = {
        "topic": "Python OOP",
        "difficulty": "medium",
        "questions": [
            {
                "id": "q1",
                "question": "What is self in Python?",
                "options": ["A class", "The instance itself", "A method"],
                "correctAnswer": "The instance itself"
            }
        ]
    }
    mock_create.return_value = mock_quiz_data

    payload = {
        "topic": "Python OOP",
        "difficulty": "medium",
        "numberOfQuestions": 5
    }
    response = client.post("/api/quizzes/generate", json=payload)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["topic"] == "Python OOP"
    assert len(data["questions"]) == 1
    mock_create.assert_called_once_with("Python OOP", "medium", 5)


def test_generate_quiz_invalid_payload(client):
    """Test generating a quiz fails with invalid/missing arguments."""
    # Topic empty
    payload = {"topic": "", "difficulty": "medium", "numberOfQuestions": 5}
    response = client.post("/api/quizzes/generate", json=payload)
    assert response.status_code == 400
    assert "Topic is required" in response.get_json()["error"]

    # Incorrect question range
    payload = {"topic": "OOP", "difficulty": "medium", "numberOfQuestions": 25}
    response = client.post("/api/quizzes/generate", json=payload)
    assert response.status_code == 400
    assert "Number of questions must be between" in response.get_json()["error"]


@patch("app.routes.quizzes.quizzes_collection")
def test_manage_quizzes_get(mock_col, client):
    """Test fetching saved quizzes list for a user."""
    mock_quiz = {
        "_id": "60c72b2f9b1d8e1f5c8b456a",
        "id": "quiz-uuid-1",
        "topic": "Databases",
        "difficulty": "hard",
        "questions": [{}, {}],
        "created_by": "test@example.com"
    }
    mock_col.find.return_value = [mock_quiz]

    response = client.get("/api/tools/quizzes?user_email=test@example.com")
    
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Databases"
    assert data[0]["questions"] == 2
    mock_col.find.assert_called_once_with({"created_by": "test@example.com"})


@patch("app.routes.quizzes.quizzes_collection")
def test_manage_quizzes_post(mock_col, client):
    """Test saving a generated quiz to list."""
    mock_result = MagicMock()
    mock_result.inserted_id = "mongo-insert-id"
    mock_col.insert_one.return_value = mock_result

    payload = {
        "topic": "Web Security",
        "difficulty": "medium",
        "questions": [{}],
        "user_email": "test@example.com"
    }
    response = client.post("/api/tools/quizzes", json=payload)
    
    assert response.status_code == 200
    data = response.get_json()
    assert "Quiz saved successfully" in data["message"]
    assert "quiz_id" in data
    mock_col.insert_one.assert_called_once()


@patch("app.routes.quizzes.quizzes_collection")
def test_submit_quiz_evaluation(mock_col, client):
    """Test evaluating user answers to return correct score."""
    # Mock saved quiz data
    mock_quiz = {
        "id": "quiz-123",
        "questions": [
            {
                "id": "q1",
                "question": "What is 2+2?",
                "options": ["3", "4", "5"],
                "correctAnswer": "4"
            }
        ]
    }
    mock_col.find_one.return_value = mock_quiz

    payload = {
        "quiz_id": "quiz-123",
        "answers": [{"id": "q1", "answer": "4"}]
    }
    response = client.post("/api/quizzes/submit", json=payload)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["score"] == 1
    assert data["total"] == 1
    assert data["percentage"] == 100
    assert data["feedback"][0]["is_correct"] is True


def test_create_quiz_utility_success():
    """Test quizzes_utils.create_quiz parses AI questions correctly."""
    from app.utils.quizzes_utils import create_quiz

    mock_ai_result = {
        "success": True,
        "questions": [
            {
                "question": "What is Python?",
                "options": ["Snake", "Language", "Car"],
                "correct_answer": 1
            },
            {
                "question": "What is 1+1?",
                "options": ["2", "3"],
                "correct_answer": "0"  # String index
            }
        ]
    }

    with patch("app.utils.quizzes_utils.generate_quiz_content", return_value=mock_ai_result):
        quiz = create_quiz("Python Basics", "easy", 2)
        assert quiz["topic"] == "Python Basics"
        assert len(quiz["questions"]) == 2
        assert quiz["questions"][0]["correctAnswer"] == "Language"
        assert quiz["questions"][1]["correctAnswer"] == "2"


@patch("app.routes.quizzes.get_collections")
def test_delete_quiz_with_ownership(mock_get_col, client):
    """Test deleting a quiz enforces ownership query."""
    mock_db = MagicMock()
    mock_q_col = MagicMock()
    mock_qh_col = MagicMock()
    mock_get_col.return_value = (mock_db, mock_q_col, mock_qh_col)

    mock_delete_result = MagicMock()
    mock_delete_result.deleted_count = 1
    mock_q_col.delete_one.return_value = mock_delete_result

    response = client.delete("/api/tools/quizzes/quiz-123?user_email=test@example.com")
    assert response.status_code == 200
    data = response.get_json()
    assert "deleted successfully" in data["message"]
    mock_q_col.delete_one.assert_called_once_with({"id": "quiz-123", "created_by": "test@example.com"})

