"""One MySQL connection per request; credentials come from the local environment."""

import os

import mysql.connector
from flask import g


def get_db():
    if "db" not in g:
        g.db = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "research_portal"),
            charset="utf8mb4",
            connection_timeout=5,
            autocommit=False,
            use_pure=True,
        )
    return g.db


def close_db(_error=None):
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()
