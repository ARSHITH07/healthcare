"""Unit tests for blockchain validation."""

from pathlib import Path

from app.config.settings import AppConfig
from app.services.blockchain import Blockchain


def build_test_blockchain(tmp_path: Path) -> Blockchain:
    Blockchain.reset_instance()
    config = AppConfig(ledger_path=tmp_path / "ledger.json", hashing_algorithm="sha256")
    return Blockchain(config=config)


def test_blockchain_creates_genesis_block(tmp_path: Path) -> None:
    blockchain = build_test_blockchain(tmp_path)

    chain = blockchain.get_chain()
    assert len(chain) == 1
    assert chain[0]["index"] == 0
    assert chain[0]["previous_hash"] == "0"


def test_blockchain_validation_succeeds_for_valid_chain(tmp_path: Path) -> None:
    blockchain = build_test_blockchain(tmp_path)
    blockchain.add_block(
        {
            "patient_id": "P-3001",
            "name": "Ravi Kumar",
            "age": 48,
            "diagnosis": "Diabetes",
            "treatment": "Insulin therapy",
        }
    )

    assert blockchain.is_chain_valid() is True


def test_blockchain_validation_fails_after_tampering(tmp_path: Path) -> None:
    blockchain = build_test_blockchain(tmp_path)
    blockchain.add_block(
        {
            "patient_id": "P-3002",
            "name": "Meera Joshi",
            "age": 29,
            "diagnosis": "Allergy",
            "treatment": "Antihistamines",
        }
    )

    blockchain.tamper_block(index=1, field_name="diagnosis", new_value="Tampered diagnosis")

    assert blockchain.is_chain_valid() is False


def test_blockchain_validation_fails_when_genesis_is_tampered(tmp_path: Path) -> None:
    blockchain = build_test_blockchain(tmp_path)
    blockchain.tamper_block(index=0, field_name="diagnosis", new_value="Compromised genesis")

    assert blockchain.is_chain_valid() is False


def test_update_patient_record_recalculates_chain(tmp_path: Path) -> None:
    blockchain = build_test_blockchain(tmp_path)
    blockchain.add_block(
        {
            "patient_id": "P-3020",
            "name": "Rhea Nair",
            "age": 31,
            "diagnosis": "Migraines",
            "treatment": "Medication",
        }
    )
    blockchain.add_block(
        {
            "patient_id": "P-3021",
            "name": "Kabir Shah",
            "age": 40,
            "diagnosis": "Diabetes",
            "treatment": "Follow-up",
        }
    )

    updated_block = blockchain.update_patient_record(
        "P-3020",
        {
            "name": "Rhea Nair",
            "age": 32,
            "diagnosis": "Migraine",
            "treatment": "Adjusted medication",
        },
    )

    chain = blockchain.get_chain()
    assert updated_block.patient_data["age"] == 32
    assert chain[1]["current_hash"] == updated_block.current_hash
    assert chain[2]["previous_hash"] == updated_block.current_hash
    assert blockchain.is_chain_valid() is True


def test_replace_chain_accepts_valid_import(tmp_path: Path) -> None:
    blockchain = build_test_blockchain(tmp_path)
    blockchain.add_block(
        {
            "patient_id": "P-3010",
            "name": "Aarav Singh",
            "age": 37,
            "diagnosis": "Hypertension",
            "treatment": "Lifestyle management",
        }
    )

    exported_chain = blockchain.get_chain()
    replacement = build_test_blockchain(tmp_path / "other")
    replacement.replace_chain(exported_chain)

    assert len(replacement.get_chain()) == 2
    assert replacement.is_chain_valid() is True


def test_replace_chain_rejects_invalid_import(tmp_path: Path) -> None:
    blockchain = build_test_blockchain(tmp_path)
    blockchain.add_block(
        {
            "patient_id": "P-3011",
            "name": "Nisha Iyer",
            "age": 42,
            "diagnosis": "Arthritis",
            "treatment": "Physical therapy",
        }
    )

    invalid_chain = blockchain.get_chain()
    invalid_chain[1]["patient_data"]["diagnosis"] = "Tampered"

    try:
        blockchain.replace_chain(invalid_chain)
    except ValueError as exc:
        assert "failed validation" in str(exc)
    else:
        raise AssertionError("replace_chain should reject invalid imported ledgers")
