"""Factory for creating blockchain blocks."""

from __future__ import annotations

from typing import Any

from app.models.block import Block
from app.services.hashing import HashingStrategy


class BlockFactory:
    """Factory pattern for building fully hashed blocks."""

    @staticmethod
    def create_block(
        index: int,
        patient_data: dict[str, Any],
        previous_hash: str,
        hashing_strategy: HashingStrategy,
        timestamp: str | None = None,
    ) -> Block:
        """Create a new block and compute its hash."""
        block = Block.create_placeholder(
            index=index,
            patient_data=patient_data,
            previous_hash=previous_hash,
            timestamp=timestamp,
        )
        block.current_hash = hashing_strategy.calculate_hash(block)
        return block
