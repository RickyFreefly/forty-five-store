import type { ColorOption } from "../types/product";

interface ColorSelectorProps {
  colors: ColorOption[];
  value: string;
  onChange: (colorId: string) => void;
}

export function ColorSelector({ colors, value, onChange }: ColorSelectorProps) {
  const active = colors.find((c) => c.id === value);
  return (
    <div>
      <span className="font-display text-xs tracking-[0.15em] text-paper-dim uppercase">
        Color {active ? `· ${active.name}` : ""}
      </span>
      <div className="mt-2 flex gap-3" role="radiogroup" aria-label="Color">
        {colors.map((color) => {
          const selected = color.id === value;
          return (
            <button
              key={color.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color.name}
              onClick={() => onChange(color.id)}
              className={`h-9 w-9 rounded-full border-2 transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                selected ? "border-accent" : "border-transparent hover:border-paper-dim"
              }`}
              style={{ background: color.hex, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)" }}
            />
          );
        })}
      </div>
    </div>
  );
}
