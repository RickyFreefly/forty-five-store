import { motion, useReducedMotion } from "motion/react";
import { Hanger } from "./Hanger";
import { ClipHanger } from "./ClipHanger";
import { GarmentVisual } from "./GarmentVisual";
import type { ClothingProduct } from "../types/product";
import { DURATION, EASE_OUT } from "../lib/motionTokens";

// Stable per-position tilt so neighbouring garments don't all lean the same way.
const TILT_ANGLES = [-5, 4, -3, 5, -4, 3, -5, 4];

interface HangingGarmentProps {
  product: ClothingProduct;
  colorHex: string;
  index: number;
  isActive: boolean;
  onSelect: (product: ClothingProduct) => void;
}

export function HangingGarment({ product, colorHex, index, isActive, onSelect }: HangingGarmentProps) {
  const reduceMotion = useReducedMotion();
  const tilt = reduceMotion ? 0 : TILT_ANGLES[index % TILT_ANGLES.length];

  return (
    <div className="relative flex w-[172px] flex-none flex-col items-center pt-2 select-none" style={{ zIndex: isActive ? 20 : 10 }}>
      {product.group === "inferior" ? <ClipHanger width={64} /> : <Hanger width={64} />}
      <motion.button
        type="button"
        layoutId={`garment-${product.id}`}
        onClick={() => onSelect(product)}
        aria-label={`Ver ${product.name}, ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(product.priceCOP)}`}
        className="relative -mt-1 block h-[200px] w-[150px] cursor-pointer drop-shadow-[8px_16px_14px_rgba(0,0,0,0.45)]"
        initial={false}
        animate={{
          rotate: isActive ? 0 : tilt,
          scale: isActive ? 1.08 : 0.9,
          y: isActive ? -6 : 0,
          filter: isActive ? "brightness(1.08)" : "brightness(0.74)",
        }}
        whileHover={reduceMotion ? undefined : { rotate: isActive ? 0 : tilt * 0.3, scale: isActive ? 1.1 : 0.96, filter: "brightness(1)" }}
        whileTap={{ scale: isActive ? 1.04 : 0.88 }}
        transition={{ duration: DURATION.rackSettle, ease: EASE_OUT }}
      >
        <GarmentVisual shape={product.visual.shape} colorHex={colorHex} trim={product.visual.trim} print={product.visual.print} />
      </motion.button>
    </div>
  );
}
