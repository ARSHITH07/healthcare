import { useMemo, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";

function Reports() {
  const { chain, refreshChain, pushToast } = useAppContext();
  const reports = useMemo(() => api.getReports(chain), [chain]);
  const maxCount = Math.max(...reports.blocksOverTime.map((item) => item.count), 1);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      await api.exportLedger();
      pushToast({ tone: "success", message: "Ledger exported for node sharing." });
    } catch {
      pushToast({ tone: "error", message: "Unable to export the ledger." });
    }
  };

  const handleImportChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const chainPayload = JSON.parse(text);
      await api.importLedger(chainPayload);
      await refreshChain();
      pushToast({ tone: "success", message: "Ledger imported and validated for this node." });
    } catch (error) {
      pushToast({
        tone: "error",
        message: error?.response?.data?.error || "Unable to import the selected ledger.",
      });
    } finally {
      event.target.value = "";
      setImporting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="page-card p-6">
        <h1 className="section-title">Reports</h1>
        <p className="section-copy">
          Track ledger growth, observe validation activity, and share ledger snapshots across simulated nodes.
        </p>

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Node Simulation Controls</h2>
          <p className="mt-2 text-sm text-slate-700">
            Export this ledger and import it into another backend instance to demonstrate simulated
            decentralized verification.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={handleExport} className="primary-button">
              Export Ledger JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {importing ? "Importing..." : "Import Ledger JSON"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportChange}
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-end gap-3">
            {reports.blocksOverTime.map((point) => (
              <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-48 w-full items-end rounded-2xl bg-white p-2 shadow-sm">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-brand to-blue-400"
                    style={{ height: `${(point.count / maxCount) * 100}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-slate-500">{point.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="page-card p-6">
          <h2 className="section-title">Validation History</h2>
          <div className="mt-4 space-y-3">
            {reports.validationHistory.length ? (
              reports.validationHistory.map((entry) => (
                <div key={`${entry.timestamp}-${entry.status}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{entry.status}</p>
                  <p className="mt-1 text-sm text-slate-500">{entry.timestamp}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No validation history captured yet.</p>
            )}
          </div>
        </div>

        <div className="page-card p-6">
          <h2 className="section-title">Tampering Attempts</h2>
          <p className="mt-4 text-4xl font-bold text-red-600">{reports.tamperingAttempts}</p>
          <p className="mt-2 text-sm text-slate-500">
            Count of simulated patient-data edits performed without recomputing block hashes.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Reports;
