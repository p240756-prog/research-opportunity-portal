"""Flask REST API for the university Research Opportunity Portal."""

import os
from datetime import date, datetime
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory, url_for
from werkzeug.exceptions import HTTPException

from database import close_db, get_db
from validation import FIELDS, validate_opportunity

load_dotenv(Path(__file__).with_name(".env"))
app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 128 * 1024
app.json.ensure_ascii = False
app.teardown_appcontext(close_db)
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
SELECT_COLUMNS = "id, " + ", ".join(FIELDS) + ", created_at, updated_at"


def serialize(row):
    return {
        key: value.isoformat() if isinstance(value, (date, datetime)) else value
        for key, value in row.items()
    }


def find_opportunity(opportunity_id):
    with get_db().cursor(dictionary=True) as cursor:
        cursor.execute(
            f"SELECT {SELECT_COLUMNS} FROM opportunities WHERE id = %s",
            (opportunity_id,),
        )
        row = cursor.fetchone()
    return serialize(row) if row else None


def validated_body():
    if not request.is_json:
        return {}, {"body": "Set Content-Type to application/json."}
    return validate_opportunity(request.get_json(silent=True))


@app.get("/api/health")
def health():
    with get_db().cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    return jsonify(status="ok", database="connected")


@app.get("/api/opportunities")
def list_opportunities():
    with get_db().cursor(dictionary=True) as cursor:
        cursor.execute(f"SELECT {SELECT_COLUMNS} FROM opportunities ORDER BY id DESC")
        rows = cursor.fetchall()
    return jsonify([serialize(row) for row in rows]), 200


@app.get("/api/opportunities/<int:opportunity_id>")
def get_opportunity(opportunity_id):
    opportunity = find_opportunity(opportunity_id)
    if opportunity is None:
        return jsonify(message="Research opportunity not found."), 404
    return jsonify(opportunity), 200


@app.post("/api/opportunities")
def create_opportunity():
    data, errors = validated_body()
    if errors:
        return jsonify(message="Please correct the invalid fields.", errors=errors), 400
    db = get_db()
    placeholders = ", ".join(["%s"] * len(FIELDS))
    with db.cursor() as cursor:
        cursor.execute(
            f"INSERT INTO opportunities ({', '.join(FIELDS)}) VALUES ({placeholders})",
            tuple(data[field] for field in FIELDS),
        )
        opportunity_id = cursor.lastrowid
    db.commit()
    response = jsonify(find_opportunity(opportunity_id))
    response.status_code = 201
    response.headers["Location"] = url_for("get_opportunity", opportunity_id=opportunity_id)
    return response


@app.put("/api/opportunities/<int:opportunity_id>")
def update_opportunity(opportunity_id):
    # A missing ID always produces 404, even if the submitted body is invalid.
    if find_opportunity(opportunity_id) is None:
        return jsonify(message="Research opportunity not found."), 404
    data, errors = validated_body()
    if errors:
        return jsonify(message="Please correct the invalid fields.", errors=errors), 400
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            f"UPDATE opportunities SET {', '.join(field + ' = %s' for field in FIELDS)} WHERE id = %s",
            tuple(data[field] for field in FIELDS) + (opportunity_id,),
        )
    db.commit()
    opportunity = find_opportunity(opportunity_id)
    if opportunity is None:
        return jsonify(message="Research opportunity not found."), 404
    return jsonify(opportunity), 200


@app.delete("/api/opportunities/<int:opportunity_id>")
def delete_opportunity(opportunity_id):
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("DELETE FROM opportunities WHERE id = %s", (opportunity_id,))
        deleted = cursor.rowcount
    db.commit()
    if deleted == 0:
        return jsonify(message="Research opportunity not found."), 404
    return jsonify(message="Research opportunity deleted.", id=opportunity_id), 200


@app.errorhandler(mysql.connector.Error)
def database_error(error):
    # Details stay in the local server log; never return connection settings to clients.
    app.logger.error("MySQL operation failed (%s).", error.__class__.__name__)
    return jsonify(message="Database operation failed. Check MySQL and the backend configuration."), 500


@app.errorhandler(HTTPException)
def http_error(error):
    response = error.get_response()
    response.data = app.json.dumps({"message": error.description})
    response.content_type = "application/json"
    return response


@app.errorhandler(Exception)
def unexpected_error(error):
    app.logger.error("Request failed (%s).", error.__class__.__name__)
    return jsonify(message="An unexpected server error occurred."), 500


@app.get("/")
def index():
    if (FRONTEND_DIST / "index.html").is_file():
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify(message="API is running. Start the React frontend at http://127.0.0.1:5173."), 200


@app.get("/assets/<path:filename>")
def frontend_asset(filename):
    return send_from_directory(FRONTEND_DIST / "assets", filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=False)
