"""Roadmap generation endpoints.

Generates a learning roadmap with milestones, resources, and estimated durations.
Stores and retrieves roadmaps from MongoDB.
"""
from flask import Blueprint, request, jsonify
import os
import json
import base64
import uuid
from datetime import datetime
import vertexai
from vertexai.generative_models import GenerativeModel
from google.oauth2 import service_account
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from ..config import Config

roadmap_bp = Blueprint("roadmap", __name__)

# Function to establish MongoDB connection


def connect_to_mongodb():
    try:
        connection_string = Config.MONGODB_URI
        db_name = Config.MONGODB_DB_NAME
        dynamic_collection = Config.MONGODB_ROADMAP_COLLECTION

        if not connection_string or not db_name:
            print("⚠️ MongoDB connection string or database name not configured")
            return None, None, None

        # Attempt to connect with a timeout
        client = MongoClient(connection_string)
        # Test the connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful")

        db = client[db_name]
        collection_name = dynamic_collection

        return client, db, collection_name
    except Exception as e:
        print(f"⚠️ Failed to connect to MongoDB: {e}")
        return None, None, None


# MongoDB setup
client, db, collection_name = connect_to_mongodb()


@roadmap_bp.route("/api/roadmap/generate", methods=["POST"])
def generate_roadmap():
    """Generate roadmap for a target skill or goal.

    Expected JSON: {"goal": "Become a ML Engineer", "background": "Python programmer", "duration_weeks": 12, "user_email": "user@example.com" }
    Steps:
      1. Validate request
      2. Call Vertex AI to outline milestones & sequencing
      3. Store the generated roadmap in MongoDB
      4. Return the roadmap data
    """
    # Check if MongoDB is available
    global client, db, collection_name
    if db is None:
        client, db, collection_name = connect_to_mongodb()
        if db is None:
            return jsonify({"error": "Database connection is not available"}), 503

    data = request.get_json()
    goal = data.get("goal")
    background = data.get("background")  # user's current knowledge/skills
    duration_weeks = data.get("duration_weeks")
    user_email = data.get("user_email")

    if not goal or not background:
        return jsonify({"error": "Missing goal or background"}), 400

    if not user_email:
        return jsonify({"error": "Missing user email"}), 400

    # Vertex AI Gemini setup (same as chatbot.py)
    try:
        project_id = Config.GOOGLE_CLOUD_PROJECT
        location = Config.GOOGLE_CLOUD_LOCATION
        credentials_base64 = Config.VERTEX_DEFAULT_CREDENTIALS
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(base64.b64decode(credentials_base64))
        )
        vertexai.init(project=project_id, location=location,
                      credentials=credentials)
        model_name = Config.VERTEX_MODEL_NAME
        model = GenerativeModel(model_name=model_name)
        prompt = (
            "You are a career roadmap assistant. Given a user's goal and background, "
            "generate a learning roadmap as a directed graph in JSON. "
            "Each node should represent a milestone or skill, with edges showing dependencies. "
            "Each node must have: id, title, description, recommended_weeks, resources (list of links or names). "
            "The graph should have a start node and an end node (the goal). "
            "Respond ONLY with a JSON object with keys: nodes (list), edges (list of {from, to}).\n\n"
            f"Goal: {goal}\n"
            f"Background: {background}\n"
            f"Target Duration (weeks): {duration_weeks if duration_weeks else 'Not specified'}"
        )
        response = model.generate_content(prompt)
        roadmap_json = response.text

        # Clean up the response if it contains markdown formatting
        if "```json" in roadmap_json:
            roadmap_json = roadmap_json.replace(
                "```json", "").replace("```", "").strip()
        elif "```" in roadmap_json:
            roadmap_json = roadmap_json.replace("```", "").strip()

        # Remove any backticks that might be left
        roadmap_json = roadmap_json.replace("`", "")

        # Parse the JSON to ensure it's valid
        roadmap_data = json.loads(roadmap_json)

        # Save the roadmap to MongoDB
        try:
            roadmap_collection = db[collection_name]
            # Create the document to save
            roadmap_document = {
                "id": str(uuid.uuid4()),
                "user_email": user_email,
                "title": goal,
                "description": background,
                "duration_weeks": duration_weeks,
                "created_at": datetime.utcnow(),
                "data": roadmap_data
            }

            # Insert into MongoDB
            roadmap_collection.insert_one(roadmap_document)
            print(f"✅ Roadmap saved for user: {user_email}")
        except Exception as db_error:
            print(f"⚠️ Failed to save roadmap to database: {db_error}")
            # Continue anyway - we can still return the generated roadmap
            # even if storage failed

        return jsonify({"roadmap": roadmap_data})
    except Exception as e:
        return jsonify({"error": f"Roadmap generation failed: {str(e)}"}), 500


@roadmap_bp.route("/api/roadmap/user", methods=["GET"])
def get_user_roadmaps():
    """Get all roadmaps for a specific user.

    Query params:
    - user_email: The email of the user to get roadmaps for
    """
    # Check if MongoDB is available
    global client, db, collection_name
    if db is None:
        client, db, collection_name = connect_to_mongodb()
        if db is None:
            return jsonify({"error": "Database connection is not available"}), 503

    user_email = request.args.get("user_email")
    if not user_email:
        return jsonify({"error": "Missing user_email parameter"}), 400

    try:
        # Get roadmaps from MongoDB
        roadmap_collection = db[collection_name]

        # Find all roadmaps for this user, sorted by creation date (newest first)
        roadmaps_cursor = roadmap_collection.find(
            {"user_email": user_email}).sort("created_at", -1)

        # Convert to list and serialize ObjectId
        roadmaps = []
        for roadmap in roadmaps_cursor:
            # Convert ObjectId to string for JSON serialization
            roadmap["_id"] = str(roadmap["_id"])
            roadmaps.append(roadmap)

        return jsonify(roadmaps)
    except Exception as e:
        print(f"⚠️ Error retrieving roadmaps: {e}")
        return jsonify({"error": f"Failed to retrieve roadmaps: {str(e)}"}), 500


@roadmap_bp.route("/api/roadmap/<roadmap_id>", methods=["GET", "DELETE"])
def get_roadmap_by_id(roadmap_id):
    """Get or delete a specific roadmap by ID.

    Query params:
    - user_email: The email of the user requesting the roadmap
    """
    # Check if MongoDB is available
    global client, db, collection_name
    if db is None:
        client, db, collection_name = connect_to_mongodb()
        if db is None:
            return jsonify({"error": "Database connection is not available"}), 503

    if not roadmap_id:
        return jsonify({"error": "Missing roadmap_id parameter"}), 400

    user_email = request.args.get("user_email")
    if not user_email:
        return jsonify({"error": "Missing user_email parameter"}), 400

    try:
        # Get roadmap from MongoDB
        roadmap_collection = db[collection_name]

        # Check if roadmap exists and verify ownership
        roadmap = roadmap_collection.find_one(
            {"id": roadmap_id, "user_email": user_email})

        if not roadmap:
            return jsonify({"error": "Roadmap not found or access denied"}), 404

        # For DELETE method, delete the roadmap
        if request.method == "DELETE":
            result = roadmap_collection.delete_one({"id": roadmap_id, "user_email": user_email})
            
            if result.deleted_count > 0:
                print(f"✅ Roadmap {roadmap_id} deleted for user: {user_email}")
                return jsonify({"success": True, "message": "Roadmap deleted successfully"}), 200
            else:
                return jsonify({"error": "Failed to delete roadmap"}), 500
        
        # For GET method, return the roadmap
        # Convert ObjectId to string for JSON serialization
        roadmap["_id"] = str(roadmap["_id"])
        return jsonify(roadmap)
        
    except Exception as e:
        print(f"⚠️ Error with roadmap {roadmap_id}: {e}")
        return jsonify({"error": f"Operation failed: {str(e)}"}), 500
