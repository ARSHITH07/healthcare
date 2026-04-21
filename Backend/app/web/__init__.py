"""Flask application factory for the Healthcare Blockchain Ledger."""

from __future__ import annotations

from flask import Flask, Response

from app.config.settings import AppConfig
from app.controllers.web_controller import create_web_blueprint
from app.services.blockchain import Blockchain


def create_web_app(config: AppConfig, blockchain: Blockchain) -> Flask:
    """Create and configure the Flask web application."""
    web_app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
    )
    web_app.config["SECRET_KEY"] = config.secret_key
    web_app.register_blueprint(create_web_blueprint(blockchain=blockchain, config=config))

    @web_app.after_request
    def add_cors_headers(response: Response) -> Response:
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, OPTIONS"
        return response

    return web_app
