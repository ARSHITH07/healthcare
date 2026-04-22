import { useMemo, useState } from "react";
import EditRecordModal from "../components/EditRecordModal";
import RecordDetailModal from "../components/RecordDetailModal";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";

function patientBlocks(chain) {
  return chain.filter((b) => b.index > 0);
}

function formatDateAdded(timestamp) {
  if (!timestamp) return "-";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function sameLocalDay(iso, ymd) {
  if (!iso || !ymd) return true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const pad = (n) => String(n).padStart(2, "0");
  const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return key === ymd;
}

function shortHash(hash) {
  if (!hash || hash.length < 14) return hash || "-";
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function sanitizeUpdates(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value != null)
  );
}

function pythonJsonStringify(value) {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => pythonJsonStringify(item)).join(", ")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}: ${pythonJsonStringify(value[key])}`);
    return `{${entries.join(", ")}}`;
  }

  return "null";
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function rebuildChainAfterEdit(chain, patientId, updates) {
  const normalizedId = String(patientId || "").trim();
  const sanitizedUpdates = sanitizeUpdates(updates);
  const nextChain = chain.map((block) => ({
    ...block,
    patient_data: { ...(block.patient_data || {}) },
  }));

  const targetIndex = nextChain.findIndex(
    (block) => block.index > 0 && String(block.patient_data?.patient_id) === normalizedId
  );

  if (targetIndex === -1) {
    throw new Error(`No patient record found for patient ID ${normalizedId}.`);
  }

  nextChain[targetIndex].patient_data = {
    ...nextChain[targetIndex].patient_data,
    ...sanitizedUpdates,
  };

  for (let index = targetIndex; index < nextChain.length; index++) {
    const currentBlock = nextChain[index];
    if (index > 0) {
      currentBlock.previous_hash = nextChain[index - 1].current_hash;
    }
    const payload = {
      index: currentBlock.index,
      timestamp: currentBlock.timestamp,
      patient_data: currentBlock.patient_data,
      previous_hash: currentBlock.previous_hash,
    };
    currentBlock.current_hash = await sha256Hex(pythonJsonStringify(payload));
  }

  return nextChain;
}

function downloadRecordJson(block) {
  const blob = new Blob([JSON.stringify(block, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const id = block.patient_data?.patient_id || block.index;
  a.href = url;
  a.download = `patient-record-${id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function Ledger() {
  const { chain, integrity, pushToast, refreshChain } = useAppContext();
  const [search, setSearch] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailBlock, setDetailBlock] = useState(null);
  const [editBlock, setEditBlock] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const issues = useMemo(() => {
    const raw = integrity?.issuesByIndex;
    return raw && typeof raw === "object" ? raw : {};
  }, [integrity]);

  const rows = useMemo(() => {
    return patientBlocks(chain).map((block) => {
      const pd = block.patient_data || {};
      const hasIssue = Boolean(issues[block.index]);
      return {
        block,
        patientId: pd.patient_id || "-",
        name: pd.name || "-",
        age: pd.age != null && pd.age !== "" ? pd.age : "-",
        gender: pd.gender ? String(pd.gender).charAt(0).toUpperCase() + String(pd.gender).slice(1) : "-",
        diagnosis: pd.diagnosis || "-",
        dateAdded: formatDateAdded(block.timestamp),
        hashShort: shortHash(block.current_hash),
        verified: !hasIssue,
      };
    });
  }, [chain, issues]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (q) {
        const matchName = row.name.toLowerCase().includes(q);
        const matchId = row.patientId.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      if (diseaseFilter.trim()) {
        if (!row.diagnosis.toLowerCase().includes(diseaseFilter.trim().toLowerCase())) return false;
      }
      if (dateFilter && !sameLocalDay(row.block.timestamp, dateFilter)) return false;
      if (statusFilter === "verified" && !row.verified) return false;
      if (statusFilter === "not_verified" && row.verified) return false;
      return true;
    });
  }, [rows, search, diseaseFilter, dateFilter, statusFilter]);

  const handleSaveEdit = async (payload) => {
    if (!editBlock) return;
    setSavingEdit(true);
    try {
      const patientId = editBlock.patient_data?.patient_id;
      let updatedBlock = null;

      try {
        const response = await api.updatePatientRecord(patientId, payload);
        updatedBlock = response.block;
      } catch (error) {
        const shouldFallback = error?.response?.status === 404 || error?.response?.status === 405;
        if (!shouldFallback) {
          throw error;
        }

        const rebuiltChain = await rebuildChainAfterEdit(chain, patientId, payload);
        await api.importLedger(rebuiltChain);
        updatedBlock =
          rebuiltChain.find((block) => block.index === editBlock.index) || rebuiltChain[editBlock.index];
      }

      await refreshChain({ showLoading: false });
      setEditBlock(null);
      if (detailBlock && detailBlock.index === updatedBlock.index) {
        setDetailBlock(updatedBlock);
      }
      pushToast({ tone: "success", message: "Patient record updated successfully." });
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Unable to update the patient record.";
      pushToast({ tone: "error", message });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">View Records</h1>
        <p className="mt-1 text-sm text-slate-600">
          Simulated patient records stored in the blockchain ledger. Search, filter, and open details.
        </p>
      </div>

      <section className="page-card p-5">
        <h2 className="text-sm font-semibold text-slate-900">Search &amp; filter</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block text-xs font-medium text-slate-600">
            Search (name or patient ID)
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Asha or P-1001"
              className="input-mockup mt-1"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Filter by disease
            <input
              type="text"
              value={diseaseFilter}
              onChange={(e) => setDiseaseFilter(e.target.value)}
              placeholder="e.g. Diabetes"
              className="input-mockup mt-1"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Filter by date added
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-mockup mt-1"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Verification status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-mockup mt-1"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="not_verified">Not verified</option>
            </select>
          </label>
        </div>
      </section>

      <section className="page-card overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Records table</h2>
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {rows.length} record{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="bg-[#2563eb] text-white">
                <th className="px-3 py-3 font-semibold">Patient ID</th>
                <th className="px-3 py-3 font-semibold">Patient Name</th>
                <th className="px-3 py-3 font-semibold">Age</th>
                <th className="px-3 py-3 font-semibold">Gender</th>
                <th className="px-3 py-3 font-semibold">Disease / Diagnosis</th>
                <th className="px-3 py-3 font-semibold">Date Added</th>
                <th className="px-3 py-3 font-semibold">Blockchain Hash</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                    No records match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(({ block, patientId, name, age, gender, diagnosis, dateAdded, hashShort, verified }) => (
                  <tr key={block.index} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-800">{patientId}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{name}</td>
                    <td className="px-3 py-2.5 text-slate-700">{age}</td>
                    <td className="px-3 py-2.5 text-slate-700">{gender}</td>
                    <td className="max-w-[200px] truncate px-3 py-2.5 text-slate-700" title={diagnosis}>
                      {diagnosis}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{dateAdded}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{hashShort}</td>
                    <td className="px-3 py-2.5">
                      {verified ? (
                        <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Not verified
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailBlock(block)}
                          className="whitespace-nowrap rounded bg-[#2563eb] px-2 py-1 text-center text-xs font-medium text-white hover:bg-[#1d4ed8]"
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditBlock(block)}
                          className="whitespace-nowrap rounded border border-blue-200 bg-blue-50 px-2 py-1 text-center text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Edit record
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            downloadRecordJson(block);
                            pushToast({ tone: "info", message: "Record exported as JSON." });
                          }}
                          className="whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Download File
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailBlock && (
        <RecordDetailModal
          block={detailBlock}
          verified={!issues[detailBlock.index]}
          onClose={() => setDetailBlock(null)}
          onEdit={() => setEditBlock(detailBlock)}
        />
      )}
      {editBlock && (
        <EditRecordModal
          block={editBlock}
          saving={savingEdit}
          onClose={() => {
            if (!savingEdit) {
              setEditBlock(null);
            }
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

export default Ledger;
