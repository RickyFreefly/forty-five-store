import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "motion/react";
import type { ClothingProduct } from "../types/product";
import { HangingGarment } from "./HangingGarment";
import { RackNavigation } from "./RackNavigation";

const CARD_WIDTH = 172;

interface ProductRackProps {
  products: ClothingProduct[];
  onSelect: (product: ClothingProduct) => void;
}

export function ProductRack({ products, onSelect }: ProductRackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(activeIndex);
  const x = useMotionValue(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const targetXFor = useCallback(
    (index: number) => containerWidth / 2 - CARD_WIDTH / 2 - index * CARD_WIDTH,
    [containerWidth],
  );

  // Re-centre the active card whenever the viewport changes size. Reads the index via a
  // ref (not a dependency) so this never fires on its own when goTo() animates activeIndex.
  useEffect(() => {
    if (!containerWidth) return;
    x.set(targetXFor(activeIndexRef.current));
  }, [containerWidth, targetXFor, x]);

  const dragConstraints = useMemo(
    () => ({
      left: targetXFor(Math.max(products.length - 1, 0)),
      right: targetXFor(0),
    }),
    [products.length, targetXFor],
  );

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(products.length - 1, index));
    setActiveIndex(clamped);
    animate(x, targetXFor(clamped), { type: "spring", stiffness: 300, damping: 32 });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(activeIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(activeIndex - 1);
    }
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        role="listbox"
        aria-label="Prendas del rack"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative h-[280px] w-full overflow-hidden focus:outline-none"
      >
        {/* the rail stays visually fixed while garments travel along it */}
        <div className="pointer-events-none absolute inset-x-6 top-[46px] z-30 h-[3px] rounded-full bg-gradient-to-r from-metal-dark via-metal to-metal-dark shadow-[0_1px_0_rgba(255,255,255,0.15)]" />
        <div className="pointer-events-none absolute inset-x-6 top-[46px] z-30 h-[3px] rounded-full bg-metal/40 blur-[2px]" />

        <motion.div
          className="absolute top-0 left-0 flex h-full cursor-grab items-start active:cursor-grabbing"
          style={{ x }}
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          dragTransition={{
            power: 0.25,
            timeConstant: 220,
            modifyTarget: (target) => {
              const nearest = Math.round((containerWidth / 2 - CARD_WIDTH / 2 - target) / CARD_WIDTH);
              const clamped = Math.max(0, Math.min(products.length - 1, nearest));
              setActiveIndex(clamped);
              return targetXFor(clamped);
            },
          }}
        >
          {products.map((product, i) => (
            <HangingGarment
              key={product.id}
              product={product}
              colorHex={product.colors[0].hex}
              index={i}
              isActive={i === activeIndex}
              onSelect={onSelect}
            />
          ))}
        </motion.div>
      </div>

      <div className="mt-4">
        <RackNavigation onPrev={() => goTo(activeIndex - 1)} onNext={() => goTo(activeIndex + 1)} index={activeIndex} count={products.length} />
      </div>
    </div>
  );
}
