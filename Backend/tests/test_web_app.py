"""Unit tests for the Flask frontend."""

from app.config.settings import AppConfig
from app.services.blockchain import Blockchain
from app.web import create_web_app


def build_test_client(tmp_path):
    """Create a Flask test client backed by an isolated ledger."""
    Blockchain.reset_instance()
    config = AppConfig(
        ledger_path=tmp_path / "ledger.json",
        hashing_algorithm="sha256",
        debug=False,
    )
    blockchain = Blockchain(config=config)
    web_app = create_web_app(config=config, blockchain=blockchain)
    web_app.config["TESTING"] = True
    return web_app.test_client(), blockchain


def test_dashboard_renders(tmp_path) -> None:
    client, _ = build_test_client(tmp_path)

    response = client.get("/")

    assert response.status_code == 200
    assert b"Healthcare Blockchain Ledger" in response.data
    assert b"Overview" in response.data


def test_records_page_renders(tmp_path) -> None:
    client, _ = build_test_client(tmp_path)

    response = client.get("/records")

    assert response.status_code == 200
    assert b"Add a patient record" in response.data


def test_chain_page_renders(tmp_path) -> None:
    client, _ = build_test_client(tmp_path)

    response = client.get("/chain")

    assert response.status_code == 200
    assert b"Ledger Explorer" in response.data


def test_add_record_from_frontend(tmp_path) -> None:
    client, blockchain = build_test_client(tmp_path)

    response = client.post(
        "/records",
        data={
            "patient_id": "P-7001",
            "name": "Isha Menon",
            "age": "39",
            "diagnosis": "Arrhythmia",
            "treatment": "Cardiology observation",
        },
        follow_redirects=True,
    )

    assert response.status_code == 200
    assert b"Patient record added to block #1." in response.data
    assert len(blockchain.get_chain()) == 2


def test_get_blockchain_json(tmp_path) -> None:
    client, _ = build_test_client(tmp_path)

    response = client.get("/blockchain")

    assert response.status_code == 200
    assert response.json[0]["index"] == 0
    assert response.json[0]["patient_data"]["patient_id"] == "GENESIS"


def test_add_block_json(tmp_path) -> None:
    client, blockchain = build_test_client(tmp_path)

    response = client.post(
        "/block",
        json={
            "patient_id": "P-9001",
            "name": "Maya Rao",
            "age": 44,
            "diagnosis": "Migraine",
            "treatment": "Neurology follow-up",
            "doctor_name": "Dr. Sen",
        },
    )

    assert response.status_code == 201
    assert response.json["index"] == 1
    assert response.json["patient_data"]["name"] == "Maya Rao"
    assert len(blockchain.get_chain()) == 2


def test_validate_chain_json(tmp_path) -> None:
    client, _ = build_test_client(tmp_path)

    response = client.get("/validate")

    assert response.status_code == 200
    assert response.json == {"corrupted_index": None, "is_valid": True, "issues_by_index": {}}


def test_tamper_block_json_marks_chain_invalid(tmp_path) -> None:
    client, blockchain = build_test_client(tmp_path)
    blockchain.add_block(
        {
            "patient_id": "P-9002",
            "name": "Dev Patel",
            "age": 51,
            "diagnosis": "Asthma",
            "treatment": "Inhaler",
        }
    )

    response = client.put(
        "/tamper/1",
        json={
            "diagnosis": "Tampered diagnosis",
            "treatment": "Changed treatment",
        },
    )
    validation_response = client.get("/validate")

    assert response.status_code == 200
    assert response.json["success"] is True
    assert response.json["block"]["patient_data"]["diagnosis"] == "Tampered diagnosis"
    assert validation_response.json["corrupted_index"] == 1
    assert validation_response.json["is_valid"] is False


def test_export_ledger_json(tmp_path) -> None:
    client, blockchain = build_test_client(tmp_path)
    blockchain.add_block(
        {
            "patient_id": "P-9200",
            "name": "Sara Thomas",
            "age": 33,
            "diagnosis": "Flu",
            "treatment": "Rest",
        }
    )

    response = client.get("/ledger/export")

    assert response.status_code == 200
    assert response.headers["Content-Disposition"] == 'attachment; filename="healthchain-ledger.json"'
    assert len(response.json) == 2
    assert response.json[1]["patient_data"]["name"] == "Sara Thomas"


def test_import_ledger_json_accepts_valid_chain(tmp_path) -> None:
    source_client, source_blockchain = build_test_client(tmp_path / "source")
    source_blockchain.add_block(
        {
            "patient_id": "P-9300",
            "name": "Kiran Das",
            "age": 45,
            "diagnosis": "Back pain",
            "treatment": "Physiotherapy",
        }
    )
    exported_chain = source_client.get("/ledger/export").json

    target_client, target_blockchain = build_test_client(tmp_path / "target")
    response = target_client.post("/ledger/import", json=exported_chain)

    assert response.status_code == 200
    assert response.json["success"] is True
    assert response.json["total_blocks"] == 2
    assert len(target_blockchain.get_chain()) == 2


def test_import_ledger_json_rejects_invalid_chain(tmp_path) -> None:
    client, blockchain = build_test_client(tmp_path)
    blockchain.add_block(
        {
            "patient_id": "P-9400",
            "name": "Leena Roy",
            "age": 39,
            "diagnosis": "Migraine",
            "treatment": "Medication",
        }
    )
    invalid_chain = blockchain.get_chain()
    invalid_chain[1]["patient_data"]["diagnosis"] = "Tampered diagnosis"

    response = client.post("/ledger/import", json=invalid_chain)

    assert response.status_code == 400
    assert "failed validation" in response.json["error"]


def test_import_ledger_json_rejects_malformed_payload(tmp_path) -> None:
    client, _ = build_test_client(tmp_path)

    response = client.post("/ledger/import", json={"chain": []})

    assert response.status_code == 400
    assert response.json["error"] == "Request body must be a JSON array of blocks"
