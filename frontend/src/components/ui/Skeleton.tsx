// T24 — loading placeholder. A pulsing slate block sized by the caller's className.
// Used while REST data is still in flight (e.g. the lobby quiz title) so the layout
// doesn't pop in from empty.
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 motion-reduce:animate-none ${className}`}
    />
  )
}
