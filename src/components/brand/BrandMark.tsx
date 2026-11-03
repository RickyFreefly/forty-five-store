/**
 * PROVISIONAL brand mark.
 *
 * FORTY FIVE's official horizontal logotype, stacked seal and organic isotype were not
 * supplied as files for this build. Per the brand brief we must not invent a new isotype
 * or fake the logo with approximate type — so this stays deliberately plain: the wordmark
 * set in the display face, and a neutral circular "45" badge built from the brand's own
 * stated "sello 45" motif (never a drawn symbol of our own invention).
 *
 * Replace the SVG paths below with the real assets once they're available; every place
 * that needs a mark imports from here, so the swap only happens once.
 */

interface BrandMarkProps {
  variant?: "horizontal" | "stacked" | "iso";
  className?: string;
}

export function BrandMark({ variant = "horizontal", className }: BrandMarkProps) {
  if (variant === "iso") {
    return (
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-current font-display text-[10px] font-bold tracking-tight ${className ?? ""}`}
        aria-label="Forty Five"
        role="img"
      >
        45
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <span className={`inline-flex flex-col items-center leading-none ${className ?? ""}`} aria-label="Forty Five">
        <span className="font-display text-sm font-bold tracking-[0.2em]">FORTY</span>
        <span className="font-display text-sm font-bold tracking-[0.2em] text-accent">FIVE</span>
      </span>
    );
  }

  return (
    <span className={`font-display font-bold tracking-[0.08em] ${className ?? ""}`} aria-label="Forty Five">
      FORTY <span className="text-accent">FIVE</span>
    </span>
  );
}
