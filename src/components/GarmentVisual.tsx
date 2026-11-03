import { useMemo } from "react";
import type { GarmentPrint, GarmentShape } from "../types/product";
import { GRAIN_SVG } from "../lib/texture";

const TEE_CLIP =
  "polygon(30% 4%,42% 0%,58% 0%,70% 4%,88% 16%,100% 30%,84% 42%,74% 34%,74% 92%,66% 100%,58% 93%,50% 100%,42% 94%,34% 100%,26% 93%,26% 34%,16% 42%,0% 30%,12% 16%)";

const HOODIE_CLIP =
  "polygon(32% 10%,40% 4%,50% 2%,60% 4%,68% 10%,88% 18%,100% 32%,84% 44%,74% 36%,74% 92%,66% 100%,56% 93%,46% 100%,36% 94%,26% 100%,26% 36%,16% 44%,0% 32%,12% 18%)";

const CLIP_BY_SHAPE: Partial<Record<GarmentShape, string>> = {
  tee: TEE_CLIP,
  jersey: TEE_CLIP,
  hoodie: HOODIE_CLIP,
};

function textColorFor(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#101317" : "#F8FAFC";
}

function Shading() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-35"
        style={{ backgroundImage: `url(${GRAIN_SVG})`, backgroundSize: "120px 120px" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 32%, rgba(0,0,0,0) 62%, rgba(0,0,0,.18) 100%)",
        }}
      />
    </>
  );
}

function PrintBlock({ print, ink }: { print: GarmentPrint; ink: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex -rotate-2 flex-col items-center justify-center gap-0.5 px-[14%] text-center">
      {print.big ? (
        <b className="font-display text-3xl leading-none font-bold" style={{ color: ink }}>
          {print.big}
        </b>
      ) : null}
      <span className="font-display text-[11px] leading-tight tracking-wide" style={{ color: ink, opacity: 0.92 }}>
        {print.small}
      </span>
    </div>
  );
}

export interface GarmentVisualProps {
  shape: GarmentShape;
  colorHex: string;
  trim?: boolean;
  print: GarmentPrint;
  className?: string;
}

export function GarmentVisual({ shape, colorHex, trim, print, className }: GarmentVisualProps) {
  const ink = useMemo(() => textColorFor(colorHex), [colorHex]);

  if (shape === "pants" || shape === "shorts") {
    const legHeight = shape === "pants" ? "82%" : "34%";
    return (
      <div className={`relative flex h-full w-full flex-col ${className ?? ""}`}>
        <div
          className="relative h-[12%] w-full rounded-[2px]"
          style={{ background: colorHex, filter: "brightness(0.82)" }}
        >
          <Shading />
        </div>
        <div className="flex h-full w-full gap-[6%] pt-[3%]">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="relative"
              style={{
                width: "47%",
                height: legHeight,
                background: colorHex,
                clipPath: "polygon(8% 0%,92% 0%,80% 100%,20% 100%)",
              }}
            >
              <Shading />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-[12%] flex justify-center">
          <span className="font-display text-[10px] tracking-wide" style={{ color: ink, opacity: 0.85 }}>
            {print.small}
          </span>
        </div>
      </div>
    );
  }

  const clip = CLIP_BY_SHAPE[shape] ?? TEE_CLIP;

  return (
    <div
      className={`relative h-full w-full ${className ?? ""}`}
      style={{ background: colorHex, clipPath: clip }}
    >
      <Shading />
      {trim ? (
        <>
          <div className="absolute inset-x-[26%] top-[3%] h-[4%]" style={{ background: "#F8FAFC", opacity: 0.85 }} />
          <div className="absolute top-[14%] left-0 h-[6%] w-[16%]" style={{ background: "#F8FAFC", opacity: 0.85 }} />
          <div className="absolute top-[14%] right-0 h-[6%] w-[16%]" style={{ background: "#F8FAFC", opacity: 0.85 }} />
        </>
      ) : null}
      <PrintBlock print={print} ink={ink} />
    </div>
  );
}
