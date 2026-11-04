import type { SubcategoryConfig } from "../../data/catalogTaxonomy";

interface SubcategorySelectorProps {
  options: SubcategoryConfig[];
  value: string;
  onChange: (id: string) => void;
}

export function SubcategorySelector({ options, value, onChange }: SubcategorySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={`px-4 py-1.5 font-display text-xs font-semibold tracking-[0.1em] transition ${
              active ? "border border-orange text-orange" : "border border-line text-paper-dim hover:text-paper"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
