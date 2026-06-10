export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl shadow-pop"
        aria-hidden
      >
        🍜
      </span>
      <span className="text-3xl font-black tracking-tight text-primary-deep">Dishcover</span>
    </span>
  );
}
