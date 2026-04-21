"""Application entry point for the Healthcare Blockchain Ledger."""

from __future__ import annotations

import argparse

from app.config.settings import AppConfig
from app.controllers.ledger_controller import LedgerController
from app.services.blockchain import Blockchain
from app.utils.logger import configure_logging
from app.web import create_web_app


def main() -> None:
    """Run the Healthcare Blockchain Ledger."""
    parser = argparse.ArgumentParser(description="Healthcare Blockchain Ledger")
    parser.add_argument(
        "--cli",
        action="store_true",
        help="Run the command-line interface instead of the web frontend.",
    )
    args = parser.parse_args()

    configure_logging()
    config = AppConfig()
    blockchain = Blockchain(config=config)

    if args.cli:
        controller = LedgerController(blockchain=blockchain)
        controller.run()
        return

    web_app = create_web_app(config=config, blockchain=blockchain)
    web_app.run(host=config.host, port=config.port, debug=config.debug)


if __name__ == "__main__":
    main()
