interface HangerProps {
  width?: number;
}

/** A single metal hanger — purely decorative, sits above a HangingGarment. */
export function Hanger({ width = 108 }: HangerProps) {
  return (
    <svg
      width={width}
      height={(width * 56) / 108}
      viewBox="0 0 108 56"
      fill="none"
      aria-hidden="true"
      className="mx-auto"
    >
      <path
        d="M54 4 V12"
        stroke="var(--color-metal)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="54" cy="6" r="4" stroke="var(--color-metal)" strokeWidth="3" fill="none" />
      <path
        d="M54 12 L10 40 Q4 44 10 47 H98 Q104 44 98 40 L54 12 Z"
        stroke="var(--color-metal)"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}
