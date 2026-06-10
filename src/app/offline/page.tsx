export const metadata = {
  title: "Offline — Dishcover",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden>
        📡
      </p>
      <h1 className="mt-4 text-2xl font-black tracking-tight text-primary-deep">
        You&apos;re offline
      </h1>
      <p className="mt-2 text-sm text-muted">
        Dishcover needs a connection to find food nearby. Reconnect and try again — the
        restaurants will still be hungry for you.
      </p>
      {/* Intentional full-page navigation: when reconnecting we want a real
          network load, not client-side routing that could re-serve the cached
          offline shell. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="press mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-base font-bold text-white hover:bg-primary-deep"
      >
        Retry
      </a>
    </main>
  );
}
