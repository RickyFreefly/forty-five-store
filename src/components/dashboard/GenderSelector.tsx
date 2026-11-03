interface GenderSelectorProps {
  value: "M" | "F";
  onChange: (value: "M" | "F") => void;
}

export function GenderSelector({ value, onChange }: GenderSelectorProps) {
  return (
    <div className="flex rounded-sm border border-line" role="radiogroup" aria-label="Filtrar por género">
      {(["M", "F"] as const).map((g) => (
        <button
          key={g}
          type="button"
          role="radio"
          aria-checked={value === g}
          onClick={() => onChange(g)}
          className={`flex-1 px-4 py-1.5 font-display text-xs font-semibold tracking-[0.1em] transition ${
            value === g ? "border border-orange text-orange" : "text-paper-dim hover:text-paper"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
