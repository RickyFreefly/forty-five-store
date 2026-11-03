interface SizeSelectorProps {
  sizes: string[];
  value: string;
  onChange: (size: string) => void;
}

export function SizeSelector({ sizes, value, onChange }: SizeSelectorProps) {
  return (
    <div>
      <span className="font-display text-xs tracking-[0.15em] text-paper-dim uppercase">Talla</span>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Talla">
        {sizes.map((size) => {
          const selected = size === value;
          return (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(size)}
              className={`h-10 min-w-10 rounded-sm border px-3 font-display text-sm tracking-wide transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                selected
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line text-paper hover:border-paper-dim"
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
