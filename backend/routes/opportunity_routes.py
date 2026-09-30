from flask import Blueprint, jsonify, request

from database import get_db_connection


opportunity_bp = Blueprint(
    "opportunity",
    __name__,
    url_prefix="/api/opportunities"
)


def validate_opportunity_data(data):
    """
    Validate the required fields for an opportunity.
    Returns an error message if invalid, otherwise None.
    """
    required_fields = [
        "title",
        "description",
        "area",
        "faculty_id",
        "department",
        "available_positions",
        "deadline",
        "status"
    ]

    for field in required_fields:
        if field not in data:
            return f"Missing required field: {field}"

    if not isinstance(data["faculty_id"], int):
        return "faculty_id must be an integer"

    if not isinstance(data["available_positions"], int):
        return "available_positions must be an integer"

    if data["available_positions"] < 1:
        return "available_positions must be at least 1"

    if data["status"] not in ["Open", "Closed"]:
        return "status must be either 'Open' or 'Closed'"

    return None


# ---------------------------------------------------------
# GET ALL OPPORTUNITIES
# GET /api/opportunities/
# ---------------------------------------------------------
@opportunity_bp.route("/", methods=["GET"])
def get_opportunities():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                title,
                description,
                area,
                faculty_id,
                department,
                required_skills,
                available_positions,
                deadline,
                status
            FROM opportunities
            ORDER BY id DESC
        """)

        opportunities = cursor.fetchall()

        return jsonify(opportunities), 200

    except Exception as error:
        print(f"Database error: {error}")

        return jsonify({
            "error": "Internal Server Error"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()


# ---------------------------------------------------------
# GET SINGLE OPPORTUNITY
# GET /api/opportunities/<id>
# ---------------------------------------------------------
@opportunity_bp.route("/<int:opportunity_id>", methods=["GET"])
def get_opportunity(opportunity_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                title,
                description,
                area,
                faculty_id,
                department,
                required_skills,
                available_positions,
                deadline,
                status
            FROM opportunities
            WHERE id = %s
        """, (opportunity_id,))

        opportunity = cursor.fetchone()

        if opportunity is None:
            return jsonify({
                "error": "Opportunity not found"
            }), 404

        return jsonify(opportunity), 200

    except Exception as error:
        print(f"Database error: {error}")

        return jsonify({
            "error": "Internal Server Error"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()


# ---------------------------------------------------------
# CREATE OPPORTUNITY
# POST /api/opportunities/
# ---------------------------------------------------------
@opportunity_bp.route("/", methods=["POST"])
def create_opportunity():
    connection = None
    cursor = None

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "Request body must contain JSON data"
            }), 400

        validation_error = validate_opportunity_data(data)

        if validation_error:
            return jsonify({
                "error": validation_error
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO opportunities (
                title,
                description,
                area,
                faculty_id,
                department,
                required_skills,
                available_positions,
                deadline,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data["title"],
            data["description"],
            data["area"],
            data["faculty_id"],
            data["department"],
            data.get("required_skills"),
            data["available_positions"],
            data["deadline"],
            data["status"]
        ))

        connection.commit()

        created_id = cursor.lastrowid

        return jsonify({
            "message": "Opportunity created successfully",
            "id": created_id
        }), 201

    except Exception as error:
        if connection is not None:
            connection.rollback()

        print(f"Database error: {error}")

        return jsonify({
            "error": "Unable to create opportunity"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()


# ---------------------------------------------------------
# UPDATE OPPORTUNITY
# PUT /api/opportunities/<id>
# ---------------------------------------------------------
@opportunity_bp.route("/<int:opportunity_id>", methods=["PUT"])
def update_opportunity(opportunity_id):
    connection = None
    cursor = None

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "Request body must contain JSON data"
            }), 400

        validation_error = validate_opportunity_data(data)

        if validation_error:
            return jsonify({
                "error": validation_error
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # Check whether the opportunity exists
        cursor.execute(
            "SELECT id FROM opportunities WHERE id = %s",
            (opportunity_id,)
        )

        existing_opportunity = cursor.fetchone()

        if existing_opportunity is None:
            return jsonify({
                "error": "Opportunity not found"
            }), 404

        cursor.execute("""
            UPDATE opportunities
            SET
                title = %s,
                description = %s,
                area = %s,
                faculty_id = %s,
                department = %s,
                required_skills = %s,
                available_positions = %s,
                deadline = %s,
                status = %s
            WHERE id = %s
        """, (
            data["title"],
            data["description"],
            data["area"],
            data["faculty_id"],
            data["department"],
            data.get("required_skills"),
            data["available_positions"],
            data["deadline"],
            data["status"],
            opportunity_id
        ))

        connection.commit()

        return jsonify({
            "message": "Opportunity updated successfully"
        }), 200

    except Exception as error:
        if connection is not None:
            connection.rollback()

        print(f"Database error: {error}")

        return jsonify({
            "error": "Unable to update opportunity"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()


# ---------------------------------------------------------
# DELETE OPPORTUNITY
# DELETE /api/opportunities/<id>
# ---------------------------------------------------------
@opportunity_bp.route("/<int:opportunity_id>", methods=["DELETE"])
def delete_opportunity(opportunity_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check whether the opportunity exists
        cursor.execute(
            "SELECT id FROM opportunities WHERE id = %s",
            (opportunity_id,)
        )

        existing_opportunity = cursor.fetchone()

        if existing_opportunity is None:
            return jsonify({
                "error": "Opportunity not found"
            }), 404

        cursor.execute(
            "DELETE FROM opportunities WHERE id = %s",
            (opportunity_id,)
        )

        connection.commit()

        return jsonify({
            "message": "Opportunity deleted successfully"
        }), 200

    except Exception as error:
        if connection is not None:
            connection.rollback()

        print(f"Database error: {error}")

        return jsonify({
            "error": "Unable to delete opportunity"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()