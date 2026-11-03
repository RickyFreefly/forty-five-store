import { ChevronLeft, ChevronRight } from "lucide-react";

interface RackNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  index: number;
  count: number;
}

export function RackNavigation({ onPrev, onNext, index, count }: RackNavigationProps) {
  return (
    <div className="flex items-center justify-center gap-4 text-paper-dim">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Prenda anterior"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-paper transition hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="font-display tnum text-xs tracking-[0.2em]">
        {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
      </span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Siguiente prenda"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-paper transition hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
