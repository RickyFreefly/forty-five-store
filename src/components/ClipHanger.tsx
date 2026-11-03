interface ClipHangerProps {
  width?: number;
}

/**
 * A pinch/clip hanger for trousers and shorts — physically distinct from the shoulder
 * `Hanger` used for tops, per the brand brief: lower garments must never be shown hanging
 * the same way a t-shirt does.
 */
export function ClipHanger({ width = 108 }: ClipHangerProps) {
  return (
    <svg
      width={width}
      height={(width * 50) / 108}
      viewBox="0 0 108 50"
      fill="none"
      aria-hidden="true"
      className="mx-auto"
    >
      <path d="M54 2 V10" stroke="var(--color-metal)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="54" cy="4" r="3.4" stroke="var(--color-metal)" strokeWidth="3" fill="none" />
      <line x1="20" y1="10" x2="88" y2="10" stroke="var(--color-metal)" strokeWidth="2.5" strokeLinecap="round" />

      {[26, 82].map((cx) => (
        <g key={cx}>
          <rect x={cx - 7} y="10" width="14" height="16" rx="2" fill="var(--color-metal-dark)" stroke="var(--color-metal)" strokeWidth="1.5" />
          <line x1={cx - 4} y1="26" x2={cx - 4} y2="34" stroke="var(--color-metal)" strokeWidth="1.5" />
          <line x1={cx + 4} y1="26" x2={cx + 4} y2="34" stroke="var(--color-metal)" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  );
}
