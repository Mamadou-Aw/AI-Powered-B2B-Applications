from flask import Flask, jsonify
from flask_cors import CORS
from psycopg.errors import UndefinedTable

from crm_api.routes.api import api_bp
from crm_api.utils import ApiError, load_local_env


def create_app() -> Flask:
    load_local_env()

    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(api_bp)

    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        payload = {"error": error.message}
        if error.details:
            payload["details"] = error.details
        return jsonify(payload), error.status_code

    @app.errorhandler(404)
    def handle_404(_error):
        return jsonify({"error": "Route not found."}), 404

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        if isinstance(error, UndefinedTable):
            return jsonify({
                "error": "Database tables are missing. Run backend/db/schema.sql and backend/db/seed.sql in PostgreSQL before starting the app."
            }), 503
        return jsonify({"error": f"Unexpected server error: {str(error)}"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
