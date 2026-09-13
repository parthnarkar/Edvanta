"""Roadmap generation endpoints.

Generates a learning roadmap with milestones, resources and estimated durations using centralized AI.
Stores and retrieves roadmaps from MongoDB.
"""
from flask import Blueprint, request, jsonify, send_file
import uuid
from datetime import datetime
import html
from app.utils.ai_utils import generate_roadmap_content
from app.utils.mongo_utils import connect_to_mongodb
from app.middleware.auth import require_auth, verify_user_ownership

roadmap_bp = Blueprint("roadmap", __name__)

# MongoDB setup - Centralized
client, db, collection_name = connect_to_mongodb('MONGODB_ROADMAP_COLLECTION')

# In-memory fallback store for roadmaps when MongoDB is not configured
_in_memory_roadmaps = {}


@roadmap_bp.route("/api/roadmap/generate", methods=["POST"])
@require_auth
def generate_roadmap():
    """Generate roadmap for a target skill or goal.

    Expected JSON: {"goal": "Become a ML Engineer", "background": "Python programmer", "duration_weeks": 12, "user_email": "user@example.com" }
    Steps:
      1. Validate request
      2. Call Gemini AI to outline milestones & sequencing
      3. Store the generated roadmap in MongoDB or fallback store
      4. Return the roadmap data
    """
    # Check if MongoDB is available (if not, use in-memory fallback)
    global client, db, collection_name
    if db is None:
        client, db, collection_name = connect_to_mongodb('MONGODB_ROADMAP_COLLECTION')

    data = request.get_json() or {}
    goal = data.get("goal")
    background = data.get("background")  # user's current knowledge/skills
    raw_duration = data.get("duration_weeks") or data.get("duration")
    try:
        duration_weeks = int(raw_duration) if raw_duration is not None else None
    except (TypeError, ValueError):
        duration_weeks = None

    user_email = data.get("user_email") or data.get("userEmail")

    if not goal or not background:
        return jsonify({"error": "Missing goal or background"}), 400

    if not user_email:
        return jsonify({"error": "Missing user email"}), 400

    if not verify_user_ownership(user_email):
        return jsonify({"error": "Forbidden: Access denied to requested user data", "code": "FORBIDDEN"}), 403

    # Use centralized AI to generate roadmap
    try:
        # Generate roadmap using centralized AI function - NO FALLBACKS
        result = generate_roadmap_content(goal, background, duration_weeks or 12)
        
        if not result['success']:
            raise Exception(f"AI roadmap generation failed: {result.get('error', 'Unknown error')}")
        
        roadmap_data = result['roadmap']

        # Prepare document used for DB or in-memory fallback
        roadmap_document = {
            "id": str(uuid.uuid4()),
            "user_email": user_email,
            "title": goal,
            "description": background,
            "duration_weeks": duration_weeks,
            "created_at": datetime.utcnow(),
            "data": roadmap_data
        }

        # Save to MongoDB or fallback to in-memory
        if db is not None and collection_name is not None:
            roadmap_collection = db[collection_name]
            roadmap_collection.insert_one(roadmap_document)
            if "_id" in roadmap_document:
                roadmap_document["_id"] = str(roadmap_document["_id"])
        else:
            # Fallback to in-memory store
            _in_memory_roadmaps[roadmap_document["id"]] = roadmap_document

        # Ensure created_at is serialized if it is a datetime object
        if isinstance(roadmap_document.get("created_at"), datetime):
            roadmap_document["created_at"] = roadmap_document["created_at"].isoformat()

        return jsonify({"success": True, "roadmap": roadmap_document})
    except Exception as e:
        return jsonify({"error": f"Roadmap generation failed: {str(e)}"}), 500


@roadmap_bp.route("/api/roadmap/user", methods=["GET"])
@require_auth
def get_user_roadmaps():
    """Get all roadmaps for a specific user.

    Query params:
    - user_email: The email of the user to get roadmaps for
    """
    # Check if MongoDB is available
    global client, db, collection_name
    if db is None:
        client, db, collection_name = connect_to_mongodb('MONGODB_ROADMAP_COLLECTION')
        # If still unavailable, proceed with in-memory fallback (do not 503)

    user_email = request.args.get("user_email") or request.args.get("userEmail")
    if not user_email:
        return jsonify({"error": "Missing user_email parameter"}), 400

    if not verify_user_ownership(user_email):
        return jsonify({"error": "Forbidden: Access denied to requested user data", "code": "FORBIDDEN"}), 403

    try:
        if db is not None and collection_name is not None:
            roadmap_collection = db[collection_name]
            roadmaps_cursor = roadmap_collection.find({"user_email": user_email}).sort("created_at", -1)
            roadmaps = []
            for roadmap in roadmaps_cursor:
                roadmap["_id"] = str(roadmap["_id"])
                if "created_at" in roadmap and isinstance(roadmap["created_at"], datetime):
                    roadmap["created_at"] = roadmap["created_at"].isoformat()
                if "updated_at" in roadmap and isinstance(roadmap["updated_at"], datetime):
                    roadmap["updated_at"] = roadmap["updated_at"].isoformat()
                roadmaps.append(roadmap)
            return jsonify(roadmaps)
        # Fallback to in-memory
        user_roadmaps = []
        for r in _in_memory_roadmaps.values():
            if r.get("user_email") == user_email:
                r_copy = r.copy()
                if "created_at" in r_copy and isinstance(r_copy["created_at"], datetime):
                    r_copy["created_at"] = r_copy["created_at"].isoformat()
                if "updated_at" in r_copy and isinstance(r_copy["updated_at"], datetime):
                    r_copy["updated_at"] = r_copy["updated_at"].isoformat()
                user_roadmaps.append(r_copy)
        return jsonify(user_roadmaps)
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve roadmaps: {str(e)}"}), 500


@roadmap_bp.route("/api/roadmap/<roadmap_id>", methods=["GET", "PUT", "DELETE"])
@require_auth
def get_roadmap_by_id(roadmap_id):
    """Get, update, or delete a specific roadmap by ID.

    Query params:
    - user_email: The email of the user requesting the roadmap
    """
    # Check if MongoDB is available (use in-memory fallback if not)
    global client, db, collection_name
    if db is None:
        client, db, collection_name = connect_to_mongodb('MONGODB_ROADMAP_COLLECTION')

    if not roadmap_id:
        return jsonify({"error": "Missing roadmap_id parameter"}), 400

    user_email = request.args.get("user_email") or request.args.get("userEmail")
    if not user_email:
        return jsonify({"error": "Missing user_email parameter"}), 400

    if not verify_user_ownership(user_email):
        return jsonify({"error": "Forbidden: Access denied to requested user data", "code": "FORBIDDEN"}), 403


    try:
        # If DB is available, operate against MongoDB
        if db is not None and collection_name is not None:
            roadmap_collection = db[collection_name]

            roadmap = roadmap_collection.find_one(
                {"id": roadmap_id, "user_email": user_email})

            if not roadmap:
                return jsonify({"error": "Roadmap not found or access denied"}), 404

            if request.method == "PUT":
                update_data = {}
                body = request.get_json() or {}
                for field in ["title", "description", "duration_weeks", "data"]:
                    if field in body:
                        update_data[field] = body[field]

                if not update_data:
                    return jsonify({"error": "No update payload provided"}), 400

                update_data["updated_at"] = datetime.utcnow()
                result = roadmap_collection.update_one(
                    {"id": roadmap_id, "user_email": user_email},
                    {"$set": update_data}
                )

                if result.modified_count > 0:
                    roadmap = roadmap_collection.find_one(
                        {"id": roadmap_id, "user_email": user_email})
                    roadmap["_id"] = str(roadmap["_id"])
                    if "created_at" in roadmap and isinstance(roadmap["created_at"], datetime):
                        roadmap["created_at"] = roadmap["created_at"].isoformat()
                    if "updated_at" in roadmap and isinstance(roadmap["updated_at"], datetime):
                        roadmap["updated_at"] = roadmap["updated_at"].isoformat()
                    return jsonify({"success": True, "roadmap": roadmap}), 200

                return jsonify({"success": True, "message": "No changes were made"}), 200

            if request.method == "DELETE":
                result = roadmap_collection.delete_one(
                    {"id": roadmap_id, "user_email": user_email})

                if result.deleted_count > 0:
                    return jsonify({"success": True, "message": "Roadmap deleted successfully"}), 200
                else:
                    return jsonify({"error": "Failed to delete roadmap"}), 500

            roadmap["_id"] = str(roadmap["_id"])
            if "created_at" in roadmap and isinstance(roadmap["created_at"], datetime):
                roadmap["created_at"] = roadmap["created_at"].isoformat()
            if "updated_at" in roadmap and isinstance(roadmap["updated_at"], datetime):
                roadmap["updated_at"] = roadmap["updated_at"].isoformat()
            return jsonify(roadmap)

        # Fall back to in-memory store
        r = None
        for rid, roadmap in _in_memory_roadmaps.items():
            if roadmap.get("id") == roadmap_id and roadmap.get("user_email") == user_email:
                r = roadmap
                break

        if not r:
            return jsonify({"error": "Roadmap not found or access denied"}), 404

        if request.method == "PUT":
            body = request.get_json() or {}
            for field in ["title", "description", "duration_weeks", "data"]:
                if field in body:
                    r[field] = body[field]
            r["updated_at"] = datetime.utcnow()
            _in_memory_roadmaps[r.get("id")] = r
            
            # Serialize for response
            r_copy = r.copy()
            if "created_at" in r_copy and isinstance(r_copy["created_at"], datetime):
                r_copy["created_at"] = r_copy["created_at"].isoformat()
            if "updated_at" in r_copy and isinstance(r_copy["updated_at"], datetime):
                r_copy["updated_at"] = r_copy["updated_at"].isoformat()
            return jsonify({"success": True, "roadmap": r_copy}), 200

        if request.method == "DELETE":
            _in_memory_roadmaps.pop(r.get("id"), None)
            return jsonify({"success": True, "message": "Roadmap deleted successfully"}), 200

        # Serialize for GET response
        r_copy = r.copy()
        if "created_at" in r_copy and isinstance(r_copy["created_at"], datetime):
            r_copy["created_at"] = r_copy["created_at"].isoformat()
        if "updated_at" in r_copy and isinstance(r_copy["updated_at"], datetime):
            r_copy["updated_at"] = r_copy["updated_at"].isoformat()
        return jsonify(r_copy)

    except Exception as e:
        return jsonify({"error": f"Operation failed: {str(e)}"}), 500


@roadmap_bp.route("/api/roadmap/download/<roadmap_id>", methods=["GET"])
@require_auth
def download_roadmap(roadmap_id):
    """Download a roadmap as PDF.

    Query params:
    - user_email: The email of the user requesting the roadmap
    """
    # Check if MongoDB is available
    global client, db, collection_name
    if db is None:
        client, db, collection_name = connect_to_mongodb('MONGODB_ROADMAP_COLLECTION')

    user_email = request.args.get("user_email") or request.args.get("userEmail")
    if not user_email:
        return jsonify({"error": "Missing user_email parameter"}), 400

    if not verify_user_ownership(user_email):
        return jsonify({"error": "Forbidden: Access denied to requested user data", "code": "FORBIDDEN"}), 403


    try:
        # Fetch roadmap
        if db is not None and collection_name is not None:
            roadmap_collection = db[collection_name]
            roadmap = roadmap_collection.find_one(
                {"id": roadmap_id, "user_email": user_email})
            if not roadmap:
                return jsonify({"error": "Roadmap not found or access denied"}), 404
        else:
            # Fallback to in-memory
            roadmap = _in_memory_roadmaps.get(roadmap_id)
            if not roadmap or roadmap.get("user_email") != user_email:
                return jsonify({"error": "Roadmap not found or access denied"}), 404

        # Generate PDF using reportlab
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        import io

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
            title=f"Roadmap: {roadmap['title']}",
        )

        styles = getSampleStyleSheet()
        h1 = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=18, leading=22, spaceAfter=6)
        h2 = ParagraphStyle("Section", parent=styles["Heading2"], fontSize=13, spaceBefore=12, spaceAfter=6)
        normal = styles["BodyText"]

        story = []
        # Header
        story.append(Paragraph(f"Roadmap: {html.escape(roadmap['title'])}", h1))
        story.append(Spacer(1, 6))

        # Description
        story.append(Paragraph(html.escape(roadmap['description']), normal))
        story.append(Spacer(1, 12))

        # Duration
        if roadmap.get('duration_weeks'):
            story.append(Paragraph(f"Target Duration: {roadmap['duration_weeks']} weeks", normal))
            story.append(Spacer(1, 6))

        # Created date
        if roadmap.get('created_at'):
            created_date = roadmap['created_at']
            if isinstance(created_date, datetime):
                created_str = created_date.strftime("%Y-%m-%d")
            elif isinstance(created_date, str):
                try:
                    dt = datetime.fromisoformat(created_date.replace("Z", "+00:00"))
                    created_str = dt.strftime("%Y-%m-%d")
                except ValueError:
                    created_str = created_date[:10]
            else:
                created_str = str(created_date)
            story.append(Paragraph(f"Created: {html.escape(created_str)}", normal))
            story.append(Spacer(1, 12))

        # Nodes
        story.append(Paragraph("Learning Path:", h2))
        story.append(Spacer(1, 6))

        nodes = roadmap['data'].get('nodes', [])
        for i, node in enumerate(nodes, 1):
            story.append(Paragraph(f"{i}. {html.escape(node['title'])}", h2))
            story.append(Paragraph(html.escape(node['description']), normal))
            if node.get('recommended_weeks'):
                story.append(Paragraph(f"Recommended weeks: {node['recommended_weeks']}", normal))
            if node.get('resources') and node['resources']:
                story.append(Paragraph("Resources:", normal))
                bullets = [ListItem(Paragraph(html.escape(str(r)), normal)) for r in node['resources']]
                story.append(ListFlowable(bullets, bulletType="bullet", leftIndent=12))
            story.append(Spacer(1, 12))

        # Edges (dependencies)
        edges = roadmap['data'].get('edges', [])
        if edges:
            story.append(Paragraph("Skill Dependencies:", h2))
            story.append(Spacer(1, 6))
            for edge in edges:
                from_node = next((n for n in nodes if n['id'] == edge['from']), None)
                to_node = next((n for n in nodes if n['id'] == edge['to']), None)
                if from_node and to_node:
                    story.append(Paragraph(f"{html.escape(from_node['title'])} → {html.escape(to_node['title'])}", normal))
            story.append(Spacer(1, 12))

        doc.build(story)
        buf.seek(0)

        return send_file(
            buf,
            as_attachment=True,
            download_name=f"roadmap_{roadmap_id}.pdf",
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({"error": f"Download failed: {str(e)}"}), 500
