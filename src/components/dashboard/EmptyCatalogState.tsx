interface EmptyCatalogStateProps {
  message?: string;
}

/** Honest "nothing here yet" block for a catalog combination with no real products. */
export function EmptyCatalogState({
  message = "Próximamente — todavía no hay prendas en esta combinación.",
}: EmptyCatalogStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center border border-dashed border-line px-4 py-10 text-center">
      <p className="font-display text-[11px] leading-relaxed tracking-[0.1em] text-paper-dim uppercase">{message}</p>
    </div>
  );
}
