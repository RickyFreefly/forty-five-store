/**
 * Discreet graphic language from the brand manual: aerodynamic flow lines, concentric
 * circles, technical grids, coordinate markers and spec labels. Always background-layer,
 * low-opacity, non-interactive (`pointer-events-none`) — these frame products, they never
 * compete with them.
 */

export function AerodynamicLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 200"
      className={`pointer-events-none ${className ?? ""}`}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {[20, 60, 100, 140, 180].map((y, i) => (
        <path
          key={y}
          d={`M0 ${y} C 150 ${y - 14}, 300 ${y + 14}, 600 ${y}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.12 + i * 0.02}
        />
      ))}
    </svg>
  );
}

export function ConcentricRings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={`pointer-events-none ${className ?? ""}`} aria-hidden="true">
      {[60, 110, 160, 210].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.14" />
      ))}
    </svg>
  );
}

export function TechnicalGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={`pointer-events-none ${className ?? ""}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (i + 1) * 40).map((v) => (
        <g key={v}>
          <line x1={v} y1="0" x2={v} y2="400" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
          <line x1="0" y1={v} x2="400" y2={v} stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
        </g>
      ))}
    </svg>
  );
}

export function SealFortyFive({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`pointer-events-none ${className ?? ""}`} aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fontSize="22"
        fontFamily="var(--font-display)"
        fontWeight="700"
        fill="currentColor"
        opacity="0.7"
      >
        45
      </text>
      <text
        x="60"
        y="30"
        textAnchor="middle"
        fontSize="6"
        letterSpacing="2"
        fontFamily="var(--font-sans)"
        fill="currentColor"
        opacity="0.5"
      >
        FORTY FIVE
      </text>
    </svg>
  );
}

interface CoordinateTagProps {
  label: string;
  className?: string;
}

/** A small "spec label" tag, e.g. lat/long-style coordinates or a measurement callout. */
export function CoordinateTag({ label, className }: CoordinateTagProps) {
  return (
    <span
      className={`font-display inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] text-paper-dim uppercase ${className ?? ""}`}
    >
      <span className="h-px w-4 bg-current opacity-60" />
      {label}
    </span>
  );
}
