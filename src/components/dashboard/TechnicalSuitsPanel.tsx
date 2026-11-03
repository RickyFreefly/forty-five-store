import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DashboardPanel } from "./DashboardPanel";
import { GenderSelector } from "./GenderSelector";
import type { DemoDialogContent } from "./DemoProductDialog";

const ROWS: { label: string; slots: number; description: string }[] = [
  { label: "Híbridos", slots: 4, description: "Trajes técnicos pensados para moverse entre el hangar y la calle, sin perder rendimiento." },
  { label: "Skydiving", slots: 2, description: "Monos de caída libre con paneles de flujo de aire y costuras planas de alto rendimiento." },
  { label: "Túnel", slots: 2, description: "Equipación ajustada para sesiones de túnel de viento, pensada para repetición y control." },
];

interface TechnicalSuitsPanelProps {
  onOpenDemo: (content: DemoDialogContent) => void;
}

export function TechnicalSuitsPanel({ onOpenDemo }: TechnicalSuitsPanelProps) {
  const [gender, setGender] = useState<"M" | "F">("M");

  return (
    <DashboardPanel title="Technical Suits" index="01">
      <div className="flex flex-1 flex-col gap-4 p-4">
        <GenderSelector value={gender} onChange={setGender} />
        <ol className="flex flex-1 flex-col divide-y divide-line">
          {ROWS.map((row, i) => (
            <li key={row.label}>
              <button
                type="button"
                onClick={() =>
                  onOpenDemo({
                    eyebrow: `Trajes técnicos · ${gender === "M" ? "Hombre" : "Mujer"}`,
                    title: row.label,
                    description: row.description,
                    meta: `${row.slots} slots de exhibición`,
                  })
                }
                className="group flex w-full items-center justify-between gap-3 py-3 text-left transition hover:text-orange focus-visible:text-orange focus-visible:outline-none"
              >
                <span className="flex items-baseline gap-3">
                  <span className="font-display tnum text-xs text-orange">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-sm tracking-[0.04em] text-paper uppercase group-hover:text-orange">
                    {row.label}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-display tnum text-[10px] text-paper-dim">{row.slots} SLOTS</span>
                  <ArrowRight size={14} className="text-paper-dim transition group-hover:translate-x-0.5 group-hover:text-orange" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </DashboardPanel>
  );
}
