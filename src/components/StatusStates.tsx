"use client";

export function DemoBanner() {
  return (
    <p className="rounded-xl border border-line bg-primary-soft/50 px-3 py-2 text-center text-xs text-primary-deep">
      Demo data — add API keys to search real restaurants near you.
    </p>
  );
}

export function WidenedNotice() {
  return (
    <p className="text-center text-xs text-muted" role="status">
      Widened search to a 25-min walk to find enough matches.
    </p>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-2xl border border-line bg-card p-6 text-center">
      <p className="text-3xl" aria-hidden>
        🍽️
      </p>
      <h3 className="mt-2 font-semibold">Nothing open matches right now</h3>
      <p className="mt-1 text-sm text-muted">
        Try widening the walk, changing the mood, or nudging the budget.
      </p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6 text-center" role="alert">
      <p className="text-3xl" aria-hidden>
        😵‍💫
      </p>
      <h3 className="mt-2 font-semibold">That didn&apos;t work</h3>
      <p className="mt-1 text-sm text-muted">
        {message ?? "Something went wrong while searching."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-11 rounded-xl border border-line bg-card px-4 text-sm font-semibold transition-colors hover:border-primary"
      >
        Try again
      </button>
    </div>
  );
}
