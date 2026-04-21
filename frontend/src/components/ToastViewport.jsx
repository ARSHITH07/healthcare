function ToastViewport({ toasts }) {
  return (
    <div className="fixed right-4 top-24 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            "animate-floatIn rounded-lg border px-4 py-3 text-sm font-medium shadow-soft",
            toast.tone === "success" && "border-green-200 bg-green-50 text-green-700",
            toast.tone === "error" && "border-red-200 bg-red-50 text-red-700",
            toast.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
            toast.tone === "info" && "border-slate-200 bg-white text-slate-700",
          ].join(" ")}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default ToastViewport;
