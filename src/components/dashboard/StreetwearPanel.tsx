import { useState } from "react";
import { DashboardPanel } from "./DashboardPanel";
import type { DemoDialogContent } from "./DemoProductDialog";

const TABS = [
  { id: "cabeza", label: "Cabeza", image: "/images/products/gorra-demo.webp", alt: "Gorra técnica Forty Five, vista de estudio." },
  { id: "sup", label: "Sup", image: "/images/products/jersey-demo-texture.png", alt: "Detalle de textura de prenda superior técnica, costuras y panel de malla." },
  { id: "inf", label: "Inf", image: "/images/products/pantalon-demo.webp", alt: "Pantalón técnico Forty Five, vista de estudio." },
] as const;

interface StreetwearPanelProps {
  onOpenDemo: (content: DemoDialogContent) => void;
}

export function StreetwearPanel({ onOpenDemo }: StreetwearPanelProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("cabeza");
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <DashboardPanel title="Streetwear" index="04">
      <div className="flex items-center gap-1 border-b border-line px-4 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`font-display rounded-sm px-2 py-1 text-[10px] tracking-[0.08em] uppercase transition ${
              tab === t.id ? "text-orange" : "text-paper-dim hover:text-paper"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onOpenDemo({
            eyebrow: "Streetwear",
            title: `${active.label} · colección cápsula`,
            description: "Piezas de calle con el mismo lenguaje técnico del taller: paneles reflectantes, costuras planas y el sello 45.",
            meta: "12 slots de exhibición en total",
          })
        }
        aria-label={`Ver ${active.label}`}
        className="group relative flex-1 overflow-hidden bg-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <img src={active.image} alt={active.alt} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      </button>
      <div className="px-4 py-3">
        <span className="font-display tnum text-[10px] tracking-[0.1em] text-paper-dim uppercase">12 slots</span>
      </div>
    </DashboardPanel>
  );
}
