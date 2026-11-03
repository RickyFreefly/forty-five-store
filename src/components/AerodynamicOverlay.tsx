/** Low-opacity aero-grid texture laid over the hero photograph — frames it, never competes with it. */
export function AerodynamicOverlay({ className }: { className?: string }) {
  return (
    <img
      src="/images/graphics/aero-grid.svg"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-screen ${className ?? ""}`}
    />
  );
}
