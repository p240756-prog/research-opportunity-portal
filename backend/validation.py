"""Validate complete POST and PUT bodies before writing anything to MySQL."""

import re
from datetime import date

TEXT_LIMITS = {
    "title": 180,
    "description": 10000,
    "research_area": 100,
    "faculty_name": 120,
    "department": 120,
    "required_skills": 1000,
}
FIELDS = tuple(TEXT_LIMITS) + ("available_positions", "application_deadline", "status")


def validate_opportunity(body):
    errors = {}
    cleaned = {}
    if not isinstance(body, dict):
        return {}, {"body": "Send a JSON object containing all opportunity fields."}

    unknown = set(body) - set(FIELDS)
    if unknown:
        errors["body"] = "Unknown fields: " + ", ".join(sorted(unknown))

    for field, limit in TEXT_LIMITS.items():
        value = body.get(field)
        if not isinstance(value, str) or not value.strip():
            errors[field] = "This field is required and must contain text."
        elif len(value.strip()) > limit:
            errors[field] = f"Use at most {limit} characters."
        else:
            cleaned[field] = value.strip()

    positions = body.get("available_positions")
    if type(positions) is not int or not 1 <= positions <= 1000:
        errors["available_positions"] = "Enter a whole number from 1 to 1000."
    else:
        cleaned["available_positions"] = positions

    deadline = body.get("application_deadline")
    if not isinstance(deadline, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", deadline):
        errors["application_deadline"] = "Use a valid date in YYYY-MM-DD format."
    else:
        try:
            cleaned["application_deadline"] = date.fromisoformat(deadline)
        except ValueError:
            errors["application_deadline"] = "Use a real calendar date."

    if body.get("status") not in ("Open", "Closed"):
        errors["status"] = "Status must be Open or Closed."
    else:
        cleaned["status"] = body["status"]

    return cleaned, errors
