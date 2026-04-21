import { useState } from "react";
import HashDisplay from "./HashDisplay";

function BlockCard({ block, integrityIssue }) {
  const [expanded, setExpanded] = useState(false);
  const isBroken = Boolean(integrityIssue);

  return (
    <article
      className={[
        "rounded-2xl border bg-white p-5 shadow-soft transition",
        isBroken ? "border-red-300 ring-1 ring-red-100" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              Block {block.index}
            </span>
            {isBroken ? (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                Chain Break Detected
              </span>
            ) : (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Link Verified
              </span>
            )}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-900">
            {block.patient_data?.name || "System Record"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{block.timestamp}</p>
        </div>

        <button type="button" onClick={() => setExpanded((current) => !current)} className="secondary-button">
          {expanded ? "Collapse Details" : "Expand Details"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Patient ID</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{block.patient_data?.patient_id}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Diagnosis</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{block.patient_data?.diagnosis}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Doctor</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{block.patient_data?.doctor_name || "N/A"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <HashDisplay label="Previous Hash" value={block.previous_hash} />
        <HashDisplay label="Current Hash" value={block.current_hash} />
      </div>

      {expanded ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Full Patient Payload
          </p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm text-slate-700">
            {JSON.stringify(block.patient_data, null, 2)}
          </pre>
          {isBroken ? (
            <p className="mt-3 text-sm font-medium text-red-600">
              This block no longer matches its stored hash or linked predecessor, which demonstrates how
              tampering breaks blockchain integrity.
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default BlockCard;
