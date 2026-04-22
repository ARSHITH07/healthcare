function truncateHash(value, head = 12, tail = 10) {
  if (!value || typeof value !== "string") return "-";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function formatTimestamp(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
}

function RecordDetailModal({ block, verified, onClose, onEdit }) {
  if (!block) return null;

  const pd = block.patient_data || {};
  const fileName = pd.medical_file_name?.trim();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="record-detail-title" className="text-lg font-semibold text-slate-900">
            Detailed view
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">Full patient record and blockchain linkage for this block.</p>

        <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Patient information</h3>
        <dl className="mt-2 space-y-3 text-sm">
          <DetailRow label="Patient ID" value={pd.patient_id || "-"} />
          <DetailRow label="Name" value={pd.name || "-"} />
          <DetailRow label="Age" value={pd.age != null && pd.age !== "" ? String(pd.age) : "-"} />
          <DetailRow label="Gender" value={pd.gender || "-"} />
          <DetailRow label="Disease / Diagnosis" value={pd.diagnosis || "-"} />
          <DetailRow label="Treatment" value={pd.treatment || "-"} />
          <DetailRow label="Doctor" value={pd.doctor_name || "-"} />
        </dl>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded medical file</h3>
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
          {fileName ? (
            <p className="font-medium text-slate-900">{fileName}</p>
          ) : (
            <p className="text-slate-600">No file name stored for this record (demo: files are not uploaded to a server).</p>
          )}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blockchain</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <DetailRow label="Block number" value={String(block.index)} mono />
            <DetailRow label="Timestamp" value={formatTimestamp(block.timestamp)} />
            <DetailRow label="Previous hash" value={truncateHash(block.previous_hash)} mono />
            <DetailRow label="Current hash" value={truncateHash(block.current_hash)} mono />
          </dl>
        </div>

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification (this block)</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                Valid - backend verification passed for this record
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                Tampered or invalid - backend detected a ledger issue
              </span>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            To validate the <span className="font-medium">entire</span> ledger, use{" "}
            <span className="font-medium text-slate-700">Verify Data</span> in the sidebar.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Edit record
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-slate-900 ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</dd>
    </div>
  );
}

export default RecordDetailModal;
