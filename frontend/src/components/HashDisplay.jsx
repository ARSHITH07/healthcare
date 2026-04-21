import { useState } from "react";

function HashDisplay({ label, value }) {
  const [copied, setCopied] = useState(false);
  const preview = `${value.slice(0, 12)}...${value.slice(-10)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs font-semibold text-brand hover:text-brandDark"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <code className="block break-all font-mono text-xs text-slate-700" title={value}>
        {preview}
      </code>
    </div>
  );
}

export default HashDisplay;
