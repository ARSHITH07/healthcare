"""Unit tests for block creation and hashing."""

from app.models.block_factory import BlockFactory
from app.services.hashing import SHA256HashStrategy


def test_block_creation_sets_previous_hash_and_current_hash() -> None:
    strategy = SHA256HashStrategy()
    block = BlockFactory.create_block(
        index=1,
        patient_data={"patient_id": "P-2001", "diagnosis": "Migraine"},
        previous_hash="abc123",
        hashing_strategy=strategy,
        timestamp="2024-02-20T11:00:00",
    )

    assert block.index == 1
    assert block.previous_hash == "abc123"
    assert block.current_hash


def test_sha256_hash_is_deterministic() -> None:
    strategy = SHA256HashStrategy()
    block = BlockFactory.create_block(
        index=2,
        patient_data={"patient_id": "P-2002", "diagnosis": "Asthma"},
        previous_hash="prev-hash",
        hashing_strategy=strategy,
        timestamp="2024-02-20T11:05:00",
    )

    recalculated_hash = strategy.calculate_hash(block)
    assert recalculated_hash == block.current_hash
