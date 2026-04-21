function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default LoadingSpinner;
