import { useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function shortHash(value, head = 8, tail = 6) {
  if (!value || typeof value !== "string") return "-";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function getStatusCopy(isValid, corruptedIndex) {
  if (isValid) {
    return {
      toneClasses: "border-emerald-200 bg-emerald-50 text-emerald-700",
      title: "Chain is VALID",
      body: "All blocks are linked correctly.",
    };
  }

  return {
    toneClasses: "border-rose-200 bg-rose-50 text-rose-700",
    title: "Chain is BROKEN",
    body:
      corruptedIndex != null
        ? `Block #${corruptedIndex} modified.`
        : "A tampered block was detected.",
  };
}

function Validate() {
  const { chain, integrity, refreshChain, pushToast } = useAppContext();
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [tampering, setTampering] = useState(false);

  const result = validationResult || integrity;
  const status = getStatusCopy(result.isValid, result.corruptedIndex);
  const blockExample = useMemo(
    () => chain.find((block) => block.index === 2) || chain.find((block) => block.index > 0) || chain[0] || null,
    [chain]
  );
  const flowBlocks = useMemo(() => {
    const desiredIndexes = [0, 1, 2, 3];
    return desiredIndexes.map((index) => {
      const block = chain.find((item) => item.index === index);
      return block || { index };
    });
  }, [chain]);

  const handleValidate = async () => {
    setValidating(true);
    try {
      const next = await api.validateChain();
      await refreshChain();
      setValidationResult(next);
      pushToast({
        tone: next.isValid ? "success" : "warning",
        message: next.isValid ? "Chain is VALID" : "Chain is BROKEN",
      });
    } catch {
      pushToast({ tone: "error", message: "Validation request failed." });
    } finally {
      setValidating(false);
    }
  };

  const handleTamperBlock2 = async () => {
    setTampering(true);
    try {
      await api.tamperBlock(2, {
        diagnosis: "Tampered diagnosis",
        treatment: "Tampered treatment",
      });
      const next = await api.validateChain();
      await refreshChain();
      setValidationResult(next);
      pushToast({ tone: "warning", message: "Block #2 tampered." });
    } catch {
      pushToast({ tone: "error", message: "Unable to tamper block #2." });
    } finally {
      setTampering(false);
    }
  };

  const tamperedIndex = result.isValid ? null : result.corruptedIndex;

  return (
    <div className="space-y-6">
      <section className="page-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
              Blockchain Validation
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Blockchain Validation</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleTamperBlock2} className="secondary-button" disabled={tampering}>
              {tampering ? "Tampering..." : "Tamper Block #2"}
            </button>
            <button type="button" onClick={handleValidate} className="primary-button min-w-44" disabled={validating}>
              {validating ? "Validating..." : "Run Validation"}
            </button>
          </div>
        </div>
      </section>

      <section className="page-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          {(flowBlocks.length ? flowBlocks : [{ index: 0 }, { index: 1 }, { index: 2 }, { index: 3 }]).map(
            (block, index) => {
              const isBroken = !result.isValid && block.index >= (tamperedIndex ?? Number.MAX_SAFE_INTEGER);
              const tone = block.index === 0
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : isBroken
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700";
              const label =
                block.index === 0
                  ? "Genesis"
                  : block.index === 1
                    ? "Block 1"
                    : block.index === 2
                      ? "Block 2"
                      : "Block 3";

              return (
                <div key={block.index} className="flex items-center gap-3">
                  <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
                  </div>
                  {index < flowBlocks.length - 1 && <span className="text-slate-300">-&gt;</span>}
                </div>
              );
            }
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
          <span className="text-emerald-600">Green = valid</span>
          <span className="text-rose-600">Red = broken</span>
        </div>
      </section>

      <section className="page-card p-6">
        {!blockExample ? (
          <p className="text-sm text-slate-500">No block available yet.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Block #2</p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>Name: {blockExample.patient_data?.name || "-"}</p>
              <p>Diagnosis: {blockExample.patient_data?.diagnosis || "-"}</p>
              <p>Previous Hash: {shortHash(blockExample.previous_hash, 6, 4)}</p>
              <p>Current Hash: {shortHash(blockExample.current_hash, 6, 4)}</p>
            </div>
          </div>
        )}
      </section>

      <section className="page-card p-6">
        {validating ? (
          <LoadingSpinner label="Checking the ledger..." />
        ) : (
          <div className={`rounded-2xl border p-5 ${status.toneClasses}`}>
            <p className="text-2xl font-semibold text-slate-900">{status.title}</p>
            <p className="mt-2 text-sm text-slate-700">{status.body}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Validate;
