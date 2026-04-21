function ChainVisualizer({ chain, issuesByIndex = {}, compact = false }) {
  return (
    <div className={["flex", compact ? "gap-3 overflow-x-auto pb-2" : "flex-col gap-5"].join(" ")}>
      {chain.map((block, index) => {
        const issue = issuesByIndex[block.index];

        return (
          <div key={`${block.index}-${block.current_hash}`} className={compact ? "flex items-center gap-3" : "flex flex-col items-center"}>
            <div
              className={[
                "rounded-2xl border bg-white shadow-soft",
                compact ? "min-w-[220px] p-4" : "w-full p-5",
                issue ? "border-red-300" : "border-slate-200",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                  Block {block.index}
                </span>
                <span className={["text-xs font-semibold", issue ? "text-red-600" : "text-green-600"].join(" ")}>
                  {issue ? "Broken" : "Linked"}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{block.patient_data?.patient_id || "GENESIS"}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {block.current_hash.slice(0, compact ? 14 : 20)}...
              </p>
            </div>

            {index < chain.length - 1 ? (
              <div
                className={[
                  "flex items-center justify-center text-sm font-bold",
                  compact ? "text-slate-400" : "my-2 h-8 w-8 rounded-full bg-slate-100 text-slate-500",
                  issuesByIndex[chain[index + 1].index] ? "text-red-500" : "text-brand",
                ].join(" ")}
              >
                {compact ? "->" : "v"}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default ChainVisualizer;
