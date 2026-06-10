export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card" aria-hidden>
      <div className="skeleton-shimmer h-5 w-2/3 rounded" />
      <div className="skeleton-shimmer mt-2.5 h-4 w-1/2 rounded" />
      <div className="skeleton-shimmer mt-3 h-14 rounded-xl" />
      <div className="skeleton-shimmer mt-3 h-4 w-5/6 rounded" />
      <div className="skeleton-shimmer mt-3 h-11 rounded-xl" />
    </div>
  );
}
