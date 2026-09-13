"""Unit tests for request validation middleware decorators."""
import pytest
from flask import Flask, jsonify, request
from app.middleware.validation import validate_json, validate_query_params


@pytest.fixture
def validation_app():
    app = Flask(__name__)
    app.config["TESTING"] = True

    @app.route("/test-json", methods=["POST"])
    @validate_json(required_fields=["name", "age"], type_rules={"name": str, "age": int, "score": float})
    def test_json():
        return jsonify({"success": True, "data": request.get_json()})

    @app.route("/test-query", methods=["GET"])
    @validate_query_params(required_params=["user_email", "category"])
    def test_query():
        return jsonify({"success": True, "email": request.args.get("user_email")})

    return app


@pytest.fixture
def client(validation_app):
    return validation_app.test_client()


def test_validate_json_missing_body(client):
    """Test validate_json rejects non-JSON requests."""
    response = client.post("/test-json", data="raw string", content_type="text/plain")
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "must be valid JSON" in data["error"]


def test_validate_json_missing_required_fields(client):
    """Test validate_json rejects requests missing required fields."""
    response = client.post("/test-json", json={"name": "Alice"})
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "Missing required fields: age" in data["error"]


def test_validate_json_type_mismatch(client):
    """Test validate_json rejects requests with incorrect types."""
    response = client.post("/test-json", json={"name": "Alice", "age": "not-a-number"})
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "must be of type int" in data["error"]


def test_validate_json_int_to_float_allowed(client):
    """Test validate_json allows int for float type rules."""
    response = client.post("/test-json", json={"name": "Alice", "age": 25, "score": 100})
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True


def test_validate_json_options_bypass(client):
    """Test validate_json allows OPTIONS requests."""
    response = client.open("/test-json", method="OPTIONS")
    # Should not be rejected by JSON validator
    assert response.status_code != 400


def test_validate_query_params_missing(client):
    """Test validate_query_params rejects missing required query params."""
    response = client.get("/test-query?user_email=test@example.com")
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "Missing required query parameters: category" in data["error"]


def test_validate_query_params_success(client):
    """Test validate_query_params passes with all required parameters."""
    response = client.get("/test-query?user_email=test@example.com&category=math")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["email"] == "test@example.com"
