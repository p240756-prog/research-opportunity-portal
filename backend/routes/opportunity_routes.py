from flask import Blueprint, jsonify

from database import get_db_connection


opportunity_bp = Blueprint(
    "opportunity",
    __name__,
    url_prefix="/api/opportunities"
)


@opportunity_bp.route("/", methods=["GET"])
def get_opportunities():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM opportunities")
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