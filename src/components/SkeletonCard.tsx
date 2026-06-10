export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-card p-4 shadow-sm" aria-hidden>
      <div className="h-5 w-2/3 rounded bg-line" />
      <div className="mt-2 h-4 w-1/2 rounded bg-line" />
      <div className="mt-3 h-12 rounded-xl bg-line/60" />
      <div className="mt-3 h-4 w-5/6 rounded bg-line" />
      <div className="mt-3 h-11 rounded-xl bg-line/60" />
    </div>
  );
}
