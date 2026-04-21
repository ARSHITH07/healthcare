"""Persistence service for blockchain data."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class StorageService:
    """Read and write blockchain ledger data as JSON."""

    def __init__(self, ledger_path: Path) -> None:
        self.ledger_path = ledger_path

    def load(self) -> list[dict[str, Any]]:
        """Load the chain from disk if the ledger file exists."""
        if not self.ledger_path.exists():
            return []

        with self.ledger_path.open("r", encoding="utf-8") as ledger_file:
            data = json.load(ledger_file)
            return data if isinstance(data, list) else []

    def save(self, chain: list[dict[str, Any]]) -> None:
        """Persist the blockchain to disk."""
        self.ledger_path.parent.mkdir(parents=True, exist_ok=True)
        with self.ledger_path.open("w", encoding="utf-8") as ledger_file:
            json.dump(chain, ledger_file, indent=4)
