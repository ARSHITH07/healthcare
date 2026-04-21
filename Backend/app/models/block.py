"""Blockchain block model."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any


@dataclass(slots=True)
class Block:
    """Represents a single block in the healthcare ledger."""

    index: int
    timestamp: str
    patient_data: dict[str, Any]
    previous_hash: str
    current_hash: str

    @classmethod
    def create_placeholder(
        cls,
        index: int,
        patient_data: dict[str, Any],
        previous_hash: str,
        timestamp: str | None = None,
    ) -> "Block":
        """Create a block shell before calculating the final hash."""
        return cls(
            index=index,
            timestamp=timestamp or datetime.utcnow().isoformat(),
            patient_data=patient_data,
            previous_hash=previous_hash,
            current_hash="",
        )

    def to_dict(self) -> dict[str, Any]:
        """Convert the block to a JSON-serializable dictionary."""
        return asdict(self)
