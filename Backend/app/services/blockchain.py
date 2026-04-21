"""Blockchain service with singleton behavior."""

from __future__ import annotations

import logging
from typing import Any, ClassVar

from app.config.settings import AppConfig
from app.models.block import Block
from app.models.block_factory import BlockFactory
from app.services.hashing import HashingStrategy, HashingStrategyFactory
from app.services.storage_service import StorageService


class Blockchain:
    """Singleton blockchain service for managing healthcare records."""

    _instance: ClassVar["Blockchain | None"] = None

    def __new__(cls, config: AppConfig) -> "Blockchain":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, config: AppConfig) -> None:
        if self._initialized:
            return

        self.logger = logging.getLogger(self.__class__.__name__)
        self.config = config
        self.storage_service = StorageService(config.ledger_path)
        self.hashing_strategy: HashingStrategy = HashingStrategyFactory.create(
            config.hashing_algorithm
        )
        self.chain: list[Block] = []
        self._load_or_initialize_chain()
        self._initialized = True

    @classmethod
    def reset_instance(cls) -> None:
        """Reset the singleton for isolated tests."""
        cls._instance = None

    def _load_or_initialize_chain(self) -> None:
        """Load an existing chain or create the genesis block."""
        stored_chain = self.storage_service.load()
        if stored_chain:
            self.chain = [Block(**block_data) for block_data in stored_chain]
        else:
            self.chain = [self.create_genesis_block()]
            self._persist_chain()

    def create_genesis_block(self) -> Block:
        """Create the first block in the chain."""
        genesis_data = {
            "patient_id": "GENESIS",
            "name": "System",
            "age": 0,
            "diagnosis": "Genesis Block",
            "treatment": "N/A",
        }
        genesis_block = BlockFactory.create_block(
            index=0,
            patient_data=genesis_data,
            previous_hash="0",
            hashing_strategy=self.hashing_strategy,
            timestamp="2024-01-01T00:00:00",
        )
        self.logger.info("Genesis block created")
        return genesis_block

    def add_block(self, data: dict[str, Any]) -> Block:
        """Create and append a new block with patient data."""
        previous_block = self.chain[-1]
        block = BlockFactory.create_block(
            index=len(self.chain),
            patient_data=data,
            previous_hash=previous_block.current_hash,
            hashing_strategy=self.hashing_strategy,
        )
        self.chain.append(block)
        self._persist_chain()
        self.logger.info("Block created: index=%s hash=%s", block.index, block.current_hash)
        return block

    def is_chain_valid(self) -> bool:
        """Validate the integrity of the blockchain."""
        return self.get_first_invalid_index() is None

    def get_first_invalid_index(self) -> int | None:
        """Return the first invalid block index, or None when the chain is valid."""
        return self.get_first_invalid_index_for_blocks(self.chain)

    def get_first_invalid_index_for_blocks(self, blocks: list[Block]) -> int | None:
        """Return the first invalid block index for the provided block list."""
        if not blocks:
            return 0

        genesis_block = blocks[0]
        if genesis_block.previous_hash != "0":
            self.logger.warning("Genesis block previous hash is invalid")
            return genesis_block.index

        genesis_hash = self.hashing_strategy.calculate_hash(genesis_block)
        if genesis_block.current_hash != genesis_hash:
            self.logger.warning("Genesis block hash mismatch detected")
            return genesis_block.index

        for index in range(1, len(blocks)):
            current_block = blocks[index]
            previous_block = blocks[index - 1]

            recalculated_hash = self.hashing_strategy.calculate_hash(current_block)
            if current_block.current_hash != recalculated_hash:
                self.logger.warning(
                    "Hash mismatch detected at block index=%s", current_block.index
                )
                return current_block.index

            if current_block.previous_hash != previous_block.current_hash:
                self.logger.warning(
                    "Broken chain detected at block index=%s", current_block.index
                )
                return current_block.index

        self.logger.info("Blockchain validation successful")
        return None

    def get_chain(self) -> list[dict[str, Any]]:
        """Return the blockchain as serializable dictionaries."""
        return [block.to_dict() for block in self.chain]

    def replace_chain(self, chain_data: list[dict[str, Any]]) -> None:
        """Replace the chain with imported data after schema and integrity validation."""
        if not chain_data:
            raise ValueError("Imported ledger cannot be empty.")

        try:
            imported_blocks = [Block(**block_data) for block_data in chain_data]
        except TypeError as exc:
            raise ValueError("Imported ledger does not match the expected block schema.") from exc

        invalid_index = self.get_first_invalid_index_for_blocks(imported_blocks)
        if invalid_index is not None:
            raise ValueError(f"Imported ledger failed validation at block index {invalid_index}.")

        self.chain = imported_blocks
        self._persist_chain()
        self.logger.info("Ledger imported successfully with %s blocks", len(self.chain))

    def tamper_block(self, index: int, field_name: str, new_value: Any) -> None:
        """Alter a block without recalculating hashes for demonstration purposes."""
        self.chain[index].patient_data[field_name] = new_value
        self._persist_chain()
        self.logger.warning("Tampering performed on block index=%s", index)

    def tamper_block_data(self, index: int, patient_data: dict[str, Any]) -> None:
        """Alter multiple patient fields without recalculating hashes."""
        self.chain[index].patient_data.update(patient_data)
        self._persist_chain()
        self.logger.warning("Tampering performed on block index=%s", index)

    def _persist_chain(self) -> None:
        """Save the current chain state to disk."""
        self.storage_service.save(self.get_chain())
