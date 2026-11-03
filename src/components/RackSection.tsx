import { motion, useReducedMotion } from "motion/react";
import type { ClothingProduct } from "../types/product";
import { ProductRack } from "./ProductRack";
import { DURATION, EASE_OUT } from "../lib/motionTokens";

interface RackSectionProps {
  id: string;
  title: string;
  description: string;
  products: ClothingProduct[];
  onSelect: (product: ClothingProduct) => void;
}

export function RackSection({ id, title, description, products, onSelect }: RackSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id={id} className="mx-auto max-w-6xl px-5 py-20">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: DURATION.sectionIn, ease: EASE_OUT }}
        className="mb-8 max-w-lg"
      >
        <h2 className="text-3xl text-paper">{title}</h2>
        <p className="mt-2 text-sm text-paper-dim normal-case">{description}</p>
      </motion.div>

      {/* key remounts the rack when the collection changes, resetting its internal position */}
      <ProductRack key={id} products={products} onSelect={onSelect} />
    </section>
  );
}
