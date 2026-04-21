"""Hashing strategies for blockchain blocks."""

from __future__ import annotations

import hashlib
import json
from abc import ABC, abstractmethod

from app.models.block import Block


class HashingStrategy(ABC):
    """Strategy interface for block hashing."""

    @abstractmethod
    def calculate_hash(self, block: Block) -> str:
        """Return a deterministic hash for a block."""


class SHA256HashStrategy(HashingStrategy):
    """SHA-256 hashing implementation."""

    def calculate_hash(self, block: Block) -> str:
        """Calculate the SHA-256 hash for the provided block."""
        block_payload = {
            "index": block.index,
            "timestamp": block.timestamp,
            "patient_data": block.patient_data,
            "previous_hash": block.previous_hash,
        }
        encoded = json.dumps(block_payload, sort_keys=True).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()


class SHA512HashStrategy(HashingStrategy):
    """Optional SHA-512 hashing implementation for algorithm switching."""

    def calculate_hash(self, block: Block) -> str:
        """Calculate the SHA-512 hash for the provided block."""
        block_payload = {
            "index": block.index,
            "timestamp": block.timestamp,
            "patient_data": block.patient_data,
            "previous_hash": block.previous_hash,
        }
        encoded = json.dumps(block_payload, sort_keys=True).encode("utf-8")
        return hashlib.sha512(encoded).hexdigest()


class HashingStrategyFactory:
    """Factory for selecting a hashing strategy at runtime."""

    _strategies: dict[str, type[HashingStrategy]] = {
        "sha256": SHA256HashStrategy,
        "sha512": SHA512HashStrategy,
    }

    @classmethod
    def create(cls, algorithm: str) -> HashingStrategy:
        """Create a hashing strategy based on the configured algorithm."""
        normalized = algorithm.lower()
        strategy_class = cls._strategies.get(normalized)
        if strategy_class is None:
            raise ValueError(f"Unsupported hashing algorithm: {algorithm}")
        return strategy_class()
