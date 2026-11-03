import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "../types/product";
import { formatCOP } from "../data/products";
import { SizeSelector } from "./SizeSelector";
import { ColorSelector } from "./ColorSelector";
import { useCartStore } from "../store/cart";
import { DURATION } from "../lib/motionTokens";

interface ProductDetailsProps {
  product: Product;
  selectedColorId: string;
  onColorChange: (colorId: string) => void;
  onClose: () => void;
}

export function ProductDetails({ product, selectedColorId, onColorChange, onClose }: ProductDetailsProps) {
  const [size, setSize] = useState(product.sizes[Math.min(1, product.sizes.length - 1)]);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const color = product.colors.find((c) => c.id === selectedColorId) ?? product.colors[0];

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        name: product.name,
        priceCOP: product.priceCOP,
        size,
        colorId: color.id,
        colorName: color.name,
      },
      qty,
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: DURATION.panel }}
      className="flex w-full max-w-sm flex-col gap-5 rounded-lg border border-line bg-surface/90 p-6 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-display text-[10px] tracking-[0.18em] text-paper-dim uppercase">
            {product.subcategory} · {product.sku}
          </span>
          <h2 className="mt-1 text-xl text-paper">{product.name}</h2>
          <p className="font-display tnum mt-1 text-lg text-accent">{formatCOP(product.priceCOP)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar y volver al rack"
          className="rounded-full p-2 text-paper-dim transition hover:bg-white/5 hover:text-paper focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <X size={18} />
        </button>
      </div>

      <p className="text-sm leading-relaxed text-paper-dim">{product.description}</p>

      {product.technicalFeatures.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {product.technicalFeatures.map((feature) => (
            <li
              key={feature}
              className="rounded-full border border-line px-3 py-1 text-[11px] text-paper-dim normal-case"
            >
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <SizeSelector sizes={product.sizes} value={size} onChange={setSize} />
      <ColorSelector colors={product.colors} value={selectedColorId} onChange={onColorChange} />

      <div>
        <span className="font-display text-xs tracking-[0.15em] text-paper-dim uppercase">Cantidad</span>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Disminuir cantidad"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-paper transition hover:border-paper-dim focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Minus size={14} />
          </button>
          <span className="tnum w-6 text-center text-paper">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            aria-label="Aumentar cantidad"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-paper transition hover:border-paper-dim focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Plus size={14} />
          </button>
          <span className="text-xs text-paper-dim">{product.stock} disponibles</span>
        </div>
      </div>

      <div className="mt-1 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 rounded-sm bg-accent px-5 py-3 font-display text-sm font-semibold tracking-[0.08em] text-accent-ink uppercase transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          {justAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
          {justAdded ? "Agregado" : "Agregar al carrito"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="font-display text-xs tracking-[0.1em] text-paper-dim uppercase transition hover:text-paper"
        >
          Volver al rack
        </button>
      </div>
    </motion.div>
  );
}
