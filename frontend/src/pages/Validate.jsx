import { useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function Validate() {
  const { chain, integrity, refreshChain, pushToast } = useAppContext();
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await api.validateChain();
      await refreshChain();
      setValidationResult(result);
      pushToast({
        tone: result.isValid ? "success" : "warning",
        message: result.isValid
          ? "Blockchain is Secure and Untampered"
          : "Blockchain Integrity Compromised",
      });
    } catch {
      pushToast({ tone: "error", message: "Validation request failed." });
    } finally {
      setValidating(false);
    }
  };

  const result = validationResult || integrity;
  const nodeSummary = useMemo(
    () => ({
      totalBlocks: chain.length,
      patientBlocks: Math.max(chain.length - 1, 0),
    }),
    [chain]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="page-card p-6">
        <h1 className="section-title">Validate Chain</h1>
        <p className="section-copy">
          Ask this backend node to validate the full ledger using the authoritative hashing logic.
        </p>

        <div className="mt-6">
          <button type="button" onClick={handleValidate} className="primary-button" disabled={validating}>
            Validate Blockchain
          </button>
        </div>

        <div className="mt-6">
          {validating ? (
            <LoadingSpinner label="Validating block hashes..." />
          ) : (
            <div
              className={[
                "rounded-2xl border p-5",
                result.isValid
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700",
              ].join(" ")}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Validation Result</p>
              <p className="mt-3 text-xl font-bold">
                {result.isValid
                  ? "Blockchain is Secure and Untampered"
                  : "Blockchain Integrity Compromised"}
              </p>
              <p className="mt-2 text-sm">
                {result.isValid
                  ? "All block hashes and previous hash references are intact."
                  : `Corruption detected at block index ${result.corruptedIndex}.`}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Node Simulation</p>
          <p className="mt-2">
            This project simulates decentralization by treating each backend instance as a logical node.
            Any node can import the ledger, keep its own copy, and verify integrity independently.
          </p>
          <p className="mt-2">
            Current node snapshot: {nodeSummary.totalBlocks} blocks, {nodeSummary.patientBlocks} simulated
            patient records.
          </p>
        </div>
      </section>

      <section className="page-card p-6">
        <h2 className="section-title">Why This Matters</h2>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Immutability</p>
            <p className="mt-2 text-sm text-slate-600">
              If patient data changes inside an existing block, the recalculated hash no longer matches the
              stored `current_hash`.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Hash Linkage</p>
            <p className="mt-2 text-sm text-slate-600">
              Each block stores the previous block hash. If one link changes, every downstream verification
              becomes suspect.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Tampering Detection</p>
            <p className="mt-2 text-sm text-slate-600">
              This validator highlights the first corrupted block index so academic demos can clearly show
              where the chain fails.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Backend Consistency</p>
            <p className="mt-2 text-sm text-slate-600">
              Hashing and validation are centralized in the backend so every simulated node checks the same
              ledger with the same rules.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Validate;
