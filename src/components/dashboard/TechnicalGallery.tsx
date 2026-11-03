import { DashboardPanel } from "./DashboardPanel";
import { SealFortyFive } from "../brand/BrandMotifs";

function WireframeFigure() {
  // A schematic, generated diagram — not a photograph, and not presented as one.
  const dots: [number, number][] = [
    [50, 6], [46, 14], [54, 14], [50, 22],
    [34, 26], [42, 30], [58, 30], [66, 26],
    [50, 34], [38, 42], [50, 46], [62, 42],
    [32, 54], [44, 58], [56, 58], [68, 54],
    [28, 70], [40, 72], [60, 72], [72, 70],
    [24, 88], [38, 86], [62, 86], [76, 88],
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.4" fill="var(--color-paper)" opacity="0.65" />
      ))}
    </svg>
  );
}

export function TechnicalGallery() {
  return (
    <DashboardPanel title="Imagen" index="06" className="col-span-full">
      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
        <figure className="relative aspect-[4/5] overflow-hidden bg-ink">
          <img src="/images/hero/skydiver-demo.webp" alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover object-[60%_30%]" />
          <figcaption className="font-display absolute bottom-2 left-2 text-[9px] tracking-[0.1em] text-paper/80 uppercase">
            En vuelo
          </figcaption>
        </figure>
        <figure className="relative aspect-[4/5] overflow-hidden bg-ink">
          <img src="/images/products/jersey-demo-texture.png" alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
          <figcaption className="font-display absolute bottom-2 left-2 text-[9px] tracking-[0.1em] text-paper/80 uppercase">
            Detalle de confección
          </figcaption>
        </figure>
        <figure className="relative aspect-[4/5] overflow-hidden bg-ink p-6">
          <WireframeFigure />
          <figcaption className="font-display absolute bottom-2 left-2 text-[9px] tracking-[0.1em] text-paper/80 uppercase">
            Esquema técnico
          </figcaption>
        </figure>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <span className="font-display text-[11px] tracking-[0.1em] text-paper uppercase">45 Suits</span>
        <span aria-hidden="true" className="flex h-3 items-end gap-[1.5px] opacity-50">
          {[3, 6, 2, 8, 4, 7, 3, 5, 2, 6, 4, 8].map((h, i) => (
            <span key={i} style={{ height: `${h}px` }} className="w-[1.5px] bg-paper" />
          ))}
        </span>
        <span className="font-display hidden text-[10px] tracking-[0.1em] text-paper-dim uppercase sm:inline">
          Especificación N.º 45-AERO-TÉCNICO
        </span>
        <SealFortyFive className="h-6 w-6 text-paper-dim" />
      </div>
    </DashboardPanel>
  );
}
