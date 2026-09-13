"""Unit tests for user statistics routes."""
import pytest
from unittest.mock import patch, MagicMock
from app import create_app


@pytest.fixture
def app():
    test_app = create_app()
    test_app.config["TESTING"] = True
    return test_app


@pytest.fixture
def client(app):
    return app.test_client()


def test_user_stats_missing_email(client):
    """Test that /api/user-stats requires user_email parameter."""
    response = client.get("/api/user-stats")
    assert response.status_code == 400
    data = response.get_json()
    assert "user_email parameter is required" in data.get("error", "")


def test_user_stats_forbidden_idor(client):
    """Test IDOR protection when token email does not match requested email."""
    headers = {"Authorization": "Bearer dev-token-authorized@example.com"}
    response = client.get("/api/user-stats?user_email=other@example.com", headers=headers)
    assert response.status_code == 403
    data = response.get_json()
    assert data.get("code") == "FORBIDDEN"


def test_user_stats_success(client):
    """Test successful retrieval of user statistics with active collections."""
    mock_db = MagicMock()
    mock_quiz_col = MagicMock()
    mock_roadmap_col = MagicMock()

    # Configure mocks
    mock_roadmap_col.count_documents.return_value = 3
    mock_roadmap_col.aggregate.return_value = [{"unique_skills_count": 5}]
    mock_quiz_col.count_documents.return_value = 4

    with patch("app.routes.user_stats.get_collections", return_value=(mock_db, mock_quiz_col, mock_roadmap_col)):
        headers = {"Authorization": "Bearer dev-token-test@example.com"}
        response = client.get("/api/user-stats?user_email=test@example.com", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["active_roadmaps"] == 3
        assert data["quizzes_taken"] == 4
        assert data["skills_learning"] == 5
        # 4 quizzes * 12 + 5 skills * 15 = 48 + 75 = 123
        assert data["total_learning_minutes"] == 123
        assert data["user_email"] == "test@example.com"
        assert data["data_source"] == "real_mongodb_data"


def test_user_stats_db_unavailable(client):
    """Test /api/user-stats returns 503 fallback when database is unavailable."""
    with patch("app.routes.user_stats.get_collections", return_value=(None, None, None)):
        headers = {"Authorization": "Bearer dev-token-test@example.com"}
        response = client.get("/api/user-stats?user_email=test@example.com", headers=headers)
        assert response.status_code == 503
        data = response.get_json()
        assert data["data_source"] == "fallback_no_db"
        assert data["active_roadmaps"] == 0


def test_user_stats_test_endpoint(client):
    """Test /api/user-stats/test returns health status."""
    with patch("app.routes.user_stats.get_collections", return_value=(MagicMock(), MagicMock(), MagicMock())):
        response = client.get("/api/user-stats/test")
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "ok"
        assert data["mongodb_available"] is True


def test_user_stats_session_deprecated(client):
    """Test /api/user-stats/session returns deprecated status."""
    response = client.post("/api/user-stats/session")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["deprecated"] is True


def test_user_stats_debug_missing_email(client):
    """Test /api/user-stats/debug requires user_email."""
    response = client.get("/api/user-stats/debug")
    assert response.status_code == 400


def test_user_stats_debug_success(client):
    """Test /api/user-stats/debug with valid email."""
    mock_db = MagicMock()
    mock_quiz_col = MagicMock()
    mock_roadmap_col = MagicMock()

    mock_roadmap_col.find_one.return_value = {
        "user_email": "test@example.com",
        "data": {"nodes": [{"title": "Skill 1"}]}
    }
    mock_roadmap_col.count_documents.return_value = 1
    mock_quiz_col.find_one.return_value = {"_id": "1", "score": 90}
    mock_quiz_col.count_documents.return_value = 1

    with patch("app.routes.user_stats.get_collections", return_value=(mock_db, mock_quiz_col, mock_roadmap_col)):
        response = client.get("/api/user-stats/debug?user_email=test@example.com")
        assert response.status_code == 200
        data = response.get_json()
        assert data["user_email"] == "test@example.com"
        assert data["roadmaps"]["count"] == 1
        assert data["quizzes"]["count"] == 1
