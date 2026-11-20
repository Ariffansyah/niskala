// Half solid, half outline: sekala (the seen) and niskala (the unseen).
export function LogoMark({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2.5a9.5 9.5 0 0 0 0 19z" fill="currentColor" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-accent">
      <LogoMark />
      <span className="text-lg font-bold tracking-tight text-ink">Niskala</span>
    </span>
  );
}
