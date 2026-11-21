// Kawung, one of the oldest batik motifs: four petals that also read as eyes.
// The one lit in kunyit is the thing Niskala makes visible.
export function LogoMark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M16.84 16.84A7.23 7.23 0 0 1 25.82 25.82A7.23 7.23 0 0 1 16.84 16.84ZM15.16 16.84A7.23 7.23 0 0 1 6.18 25.82A7.23 7.23 0 0 1 15.16 16.84ZM15.16 15.16A7.23 7.23 0 0 1 6.18 6.18A7.23 7.23 0 0 1 15.16 15.16Z"
      />
      <path fill="var(--kunyit)" d="M16.84 15.16A7.23 7.23 0 0 1 25.82 6.18A7.23 7.23 0 0 1 16.84 15.16Z" />
      {/* Deep nila in both themes: the light-theme accent would vanish against kunyit in the dark. */}
      <circle cx="21.33" cy="10.67" r="1.9" fill="var(--band)" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-accent">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-[-0.03em] text-ink">niskala</span>
    </span>
  );
}
