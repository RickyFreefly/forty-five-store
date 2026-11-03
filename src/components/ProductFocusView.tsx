import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { ClothingProduct } from "../types/product";
import { GarmentVisual } from "./GarmentVisual";
import { GarmentTextureDetail } from "./GarmentTextureDetail";
import { ProductDetails } from "./ProductDetails";
import { DURATION } from "../lib/motionTokens";

const VIEWS = [
  { id: "front", label: "Vista frontal" },
  { id: "back", label: "Vista posterior" },
  { id: "texture", label: "Textura y costuras" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

interface ProductFocusViewProps {
  product: ClothingProduct;
  onClose: () => void;
}

export function ProductFocusView({ product, onClose }: ProductFocusViewProps) {
  const [view, setView] = useState<ViewId>("front");
  const [colorId, setColorId] = useState(product.colors[0].id);
  const panelRef = useRef<HTMLDivElement>(null);
  const colorHex = product.colors.find((c) => c.id === colorId)?.hex ?? product.colors[0].hex;

  useEffect(() => {
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.panel }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative flex w-full max-w-3xl flex-col items-center gap-8 outline-none md:flex-row md:items-center md:justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            layoutId={`garment-${product.id}`}
            role="img"
            aria-label={`${product.name}, ${VIEWS.find((v) => v.id === view)?.label.toLowerCase()}`}
            className="h-[300px] w-[230px] drop-shadow-[14px_26px_20px_rgba(0,0,0,0.55)] md:h-[360px] md:w-[270px]"
            animate={{ rotate: 0 }}
            transition={{ duration: DURATION.select }}
          >
            {view === "texture" ? (
              <GarmentTextureDetail colorHex={colorHex} feature={product.technicalFeatures[0] ?? "Detalle de costura"} />
            ) : (
              <GarmentVisual
                shape={product.visual.shape}
                colorHex={colorHex}
                trim={product.visual.trim}
                print={view === "front" ? product.visual.print : product.visual.backPrint}
              />
            )}
          </motion.div>

          <div className="flex flex-wrap justify-center gap-1 rounded-full border border-line p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={`rounded-full px-4 py-1.5 font-display text-xs tracking-[0.1em] uppercase transition ${
                  view === v.id ? "bg-paper text-ink" : "text-paper-dim hover:text-paper"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <ProductDetails product={product} selectedColorId={colorId} onColorChange={setColorId} onClose={onClose} />
      </div>
    </motion.div>
  );
}
