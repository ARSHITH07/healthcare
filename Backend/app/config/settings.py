"""Application configuration objects."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]


@dataclass(slots=True)
class AppConfig:
    """Runtime configuration for the application."""

    ledger_path: Path = field(default_factory=lambda: BASE_DIR / "data" / "ledger.json")
    hashing_algorithm: str = "sha256"
    host: str = "127.0.0.1"
    port: int = 5000
    debug: bool = False
    secret_key: str = "healthcare-blockchain-ledger"
