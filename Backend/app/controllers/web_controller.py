"""Web controller for the Healthcare Blockchain Ledger frontend."""

from __future__ import annotations

from typing import Any

from flask import Blueprint, flash, jsonify, make_response, redirect, render_template, request, url_for

from app.config.settings import AppConfig
from app.services.blockchain import Blockchain


def create_web_blueprint(blockchain: Blockchain, config: AppConfig) -> Blueprint:
    """Create the blueprint that powers the browser-based frontend."""
    blueprint = Blueprint("web", __name__)

    @blueprint.get("/")
    def dashboard() -> str:
        context = _build_page_context(blockchain=blockchain, config=config)
        return render_template(
            "dashboard.html",
            **context,
            page_title="Overview",
            active_page="overview",
        )

    @blueprint.get("/records")
    def records_page() -> str:
        return render_template(
            "records.html",
            **_build_page_context(blockchain=blockchain, config=config),
            page_title="Add Record",
            active_page="records",
        )

    @blueprint.get("/chain")
    def chain_page() -> str:
        return render_template(
            "chain.html",
            **_build_page_context(blockchain=blockchain, config=config),
            page_title="Ledger Explorer",
            active_page="chain",
        )

    @blueprint.get("/security")
    def security_page() -> str:
        return render_template(
            "security.html",
            **_build_page_context(blockchain=blockchain, config=config),
            page_title="Security Demo",
            active_page="security",
        )

    @blueprint.post("/records")
    def add_record() -> Any:
        patient_data = _sanitize_form_payload(
            {
                "patient_id": request.form.get("patient_id", ""),
                "name": request.form.get("name", ""),
                "age": _parse_integer(request.form.get("age", "")),
                "diagnosis": request.form.get("diagnosis", ""),
                "treatment": request.form.get("treatment", ""),
            }
        )

        if not patient_data.get("patient_id") or not patient_data.get("name"):
            flash("Patient ID and Patient Name are required.", "error")
            return redirect(url_for("web.records_page"))

        block = blockchain.add_block(patient_data)
        flash(f"Patient record added to block #{block.index}.", "success")
        return redirect(url_for("web.chain_page"))

    @blueprint.get("/blockchain")
    @blueprint.get("/api/blockchain")
    def get_blockchain() -> Any:
        return jsonify(blockchain.get_chain())

    @blueprint.get("/ledger/export")
    @blueprint.get("/api/ledger/export")
    def export_ledger() -> Any:
        response = make_response(jsonify(blockchain.get_chain()))
        response.headers["Content-Disposition"] = 'attachment; filename="healthchain-ledger.json"'
        return response

    @blueprint.post("/ledger/import")
    @blueprint.post("/api/ledger/import")
    def import_ledger() -> Any:
        payload = request.get_json(silent=True)
        if not isinstance(payload, list):
            return jsonify({"error": "Request body must be a JSON array of blocks"}), 400

        try:
            blockchain.replace_chain(payload)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

        return jsonify(
            {
                "success": True,
                "total_blocks": len(blockchain.get_chain()),
                "message": "Ledger imported and validated successfully.",
            }
        )

    @blueprint.post("/block")
    @blueprint.post("/api/block")
    def add_block() -> Any:
        patient_data = _sanitize_form_payload(request.get_json(silent=True) or {})

        if not patient_data.get("patient_id") or not patient_data.get("name"):
            return jsonify({"error": "patient_id and name are required"}), 400

        block = blockchain.add_block(patient_data)
        return jsonify(block.to_dict()), 201

    @blueprint.put("/records/<patient_id>")
    @blueprint.put("/api/records/<patient_id>")
    def update_record_json(patient_id: str) -> Any:
        updates = _sanitize_form_payload(request.get_json(silent=True) or {})
        if not updates:
            return jsonify({"error": "At least one patient field is required"}), 400

        try:
            block = blockchain.update_patient_record(patient_id=patient_id, updates=updates)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        except LookupError as exc:
            return jsonify({"error": str(exc)}), 404

        return jsonify(
            {
                "success": True,
                "message": f"Patient record {patient_id} updated successfully.",
                "block": block.to_dict(),
            }
        )

    @blueprint.get("/validate")
    @blueprint.get("/api/validate")
    def validate_chain_json() -> Any:
        corrupted_index = blockchain.get_first_invalid_index()
        return jsonify(
            {
                "is_valid": corrupted_index is None,
                "corrupted_index": corrupted_index,
                "issues_by_index": {} if corrupted_index is None else {str(corrupted_index): {"hashMismatch": True}},
            }
        )

    @blueprint.post("/validate")
    @blueprint.post("/api/validate")
    def validate_chain() -> Any:
        if blockchain.is_chain_valid():
            flash("Blockchain integrity verified successfully.", "success")
        else:
            flash("Blockchain validation failed. The ledger may be tampered.", "error")
        return redirect(url_for("web.security_page"))

    @blueprint.put("/tamper/<int:index>")
    @blueprint.put("/api/tamper/<int:index>")
    def tamper_block_json(index: int) -> Any:
        chain = blockchain.get_chain()
        if index <= 0 or index >= len(chain):
            return jsonify({"error": "Choose a valid non-genesis block index"}), 400

        patient_data = _sanitize_form_payload(request.get_json(silent=True) or {})
        if not patient_data:
            return jsonify({"error": "At least one patient field is required"}), 400

        blockchain.tamper_block_data(index=index, patient_data=patient_data)
        return jsonify(
            {
                "success": True,
                "block": blockchain.get_chain()[index],
            }
        )

    @blueprint.post("/tamper")
    def tamper_chain() -> Any:
        chain = blockchain.get_chain()
        if len(chain) <= 1:
            flash("Add a patient record before running the tamper demo.", "error")
            return redirect(url_for("web.security_page"))

        raw_index = request.form.get("block_index", "")
        block_index = _parse_integer(raw_index)
        diagnosis = request.form.get("diagnosis", "Tampered diagnosis")

        if block_index <= 0 or block_index >= len(chain):
            flash("Choose a valid non-genesis block for the tamper demo.", "error")
            return redirect(url_for("web.security_page"))

        blockchain.tamper_block(index=block_index, field_name="diagnosis", new_value=diagnosis)
        flash(f"Block #{block_index} was tampered for demonstration.", "warning")
        return redirect(url_for("web.security_page"))

    return blueprint


def _build_page_context(blockchain: Blockchain, config: AppConfig) -> dict[str, Any]:
    """Build shared template data for all frontend pages."""
    chain = blockchain.get_chain()
    return {
        "chain": chain,
        "is_valid": blockchain.is_chain_valid(),
        "total_blocks": len(chain),
        "total_records": max(0, len(chain) - 1),
        "hashing_algorithm": config.hashing_algorithm.upper(),
        "recent_blocks": list(reversed(chain[-3:])),
    }


def _parse_integer(raw_value: str) -> int:
    """Convert a form value to an integer."""
    try:
        return int(raw_value)
    except ValueError:
        return 0


def _sanitize_form_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Remove blank values from submitted form data."""
    return {key: value for key, value in payload.items() if value not in (None, "")}
