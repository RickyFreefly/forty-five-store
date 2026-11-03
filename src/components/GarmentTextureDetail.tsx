import { GRAIN_SVG } from "../lib/texture";

interface GarmentTextureDetailProps {
  colorHex: string;
  feature: string;
  className?: string;
}

/**
 * The "texture & seams" tab — a genuinely different piece of art from the front/back
 * views (a close-up swatch with a stitch line), not a zoomed crop of the same print.
 */
export function GarmentTextureDetail({ colorHex, feature, className }: GarmentTextureDetailProps) {
  return (
    <div className={`relative h-full w-full overflow-hidden rounded-sm ${className ?? ""}`} style={{ background: colorHex }}>
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-45"
        style={{ backgroundImage: `url(${GRAIN_SVG})`, backgroundSize: "70px 70px" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,.2) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,.2) 100%)",
        }}
      />
      <svg className="absolute inset-x-[10%] top-1/2 h-10 w-[80%] -translate-y-1/2" viewBox="0 0 200 40" aria-hidden="true">
        <line
          x1="0"
          y1="20"
          x2="200"
          y2="20"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2"
          strokeDasharray="6 5"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.14em] text-paper/80 uppercase">
        {feature}
      </span>
    </div>
  );
}
