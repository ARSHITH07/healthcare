"""CLI controller for blockchain interactions."""

from __future__ import annotations

import json
from typing import Any

from app.services.blockchain import Blockchain


class LedgerController:
    """Controller that manages user interaction through the CLI."""

    def __init__(self, blockchain: Blockchain) -> None:
        self.blockchain = blockchain

    def run(self) -> None:
        """Start the interactive menu loop."""
        while True:
            self._print_menu()
            choice = input("Select an option: ").strip()

            if choice == "1":
                self.add_patient_record()
            elif choice == "2":
                self.view_blockchain()
            elif choice == "3":
                self.validate_blockchain()
            elif choice == "4":
                self.tamper_data()
            elif choice == "5":
                print("Exiting Healthcare Blockchain Ledger.")
                break
            else:
                print("Invalid option. Please choose a number from 1 to 5.")

    def add_patient_record(self) -> None:
        """Collect patient data and add it to the blockchain."""
        patient_data = self._sanitize_payload(
            {
                "patient_id": input("Patient ID: ").strip(),
                "name": input("Patient Name: ").strip(),
                "age": self._parse_integer(input("Age: ").strip()),
                "diagnosis": input("Diagnosis: ").strip(),
                "treatment": input("Treatment: ").strip(),
            }
        )
        block = self.blockchain.add_block(patient_data)
        print(f"Block #{block.index} added successfully.")

    def view_blockchain(self) -> None:
        """Display the full blockchain."""
        chain = self.blockchain.get_chain()
        print(json.dumps(chain, indent=4))

    def validate_blockchain(self) -> None:
        """Validate and display blockchain status."""
        is_valid = self.blockchain.is_chain_valid()
        print("Blockchain is valid." if is_valid else "Blockchain validation failed.")

    def tamper_data(self) -> None:
        """Modify a block's payload to demonstrate tampering detection."""
        chain = self.blockchain.get_chain()
        if len(chain) <= 1:
            print("At least one patient record is required before tampering.")
            return

        try:
            index = int(input("Enter block index to tamper with: ").strip())
        except ValueError:
            print("Index must be a valid integer.")
            return

        if index <= 0 or index >= len(chain):
            print("Choose a non-genesis block index from the current chain.")
            return

        new_value = input("Enter replacement diagnosis text: ").strip()
        self.blockchain.tamper_block(index=index, field_name="diagnosis", new_value=new_value)
        print("Block data was tampered with for demonstration purposes.")

    @staticmethod
    def _parse_integer(raw_value: str) -> int:
        """Convert input to an integer, defaulting to zero when blank or invalid."""
        try:
            return int(raw_value)
        except ValueError:
            return 0

    @staticmethod
    def _sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
        """Return a sanitized copy of user input."""
        return {key: value for key, value in payload.items() if value not in (None, "")}

    @staticmethod
    def _print_menu() -> None:
        """Display the CLI menu."""
        print("\nHealthcare Blockchain Ledger")
        print("1. Add Patient Record")
        print("2. View Blockchain")
        print("3. Validate Blockchain")
        print("4. Tamper Data (for demo)")
        print("5. Exit")
