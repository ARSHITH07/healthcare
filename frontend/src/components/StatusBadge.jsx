function StatusBadge({ status }) {
  const valid = status === "valid";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        valid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", valid ? "bg-green-500" : "bg-red-500"].join(" ")} />
      {valid ? "Valid" : "Compromised"}
    </span>
  );
}

export default StatusBadge;
