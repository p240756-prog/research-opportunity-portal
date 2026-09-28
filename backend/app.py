from flask import Flask
from routes.opportunity_routes import opportunity_bp

app = Flask(__name__)

app.register_blueprint(opportunity_bp)


if __name__ == "__main__":
    app.run(debug=True)