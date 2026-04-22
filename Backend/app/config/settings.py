"""Application configuration objects."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]


@dataclass(slots=True)
class AppConfig:
    """Runtime configuration for the application."""

    ledger_path: Path = field(default_factory=lambda: BASE_DIR / "data" / "ledger.json")
    hashing_algorithm: str = "sha256"
    host: str = "0.0.0.0"
    port: int = 5000
    debug: bool = field(default_factory=lambda: os.getenv("HEALTHCHAIN_DEBUG", "0") == "1")
    secret_key: str = "healthcare-blockchain-ledger"
