import type { ClothingProduct } from "../../types/product";
import { formatCOP } from "../../data/products";
import { useProductFocusStore } from "../../store/productFocus";
import { GarmentVisual } from "../GarmentVisual";
import { DashboardPanel } from "./DashboardPanel";

interface ProductCardProps {
  product: ClothingProduct;
}

/** Catalog tile for one real product. Clicking opens the existing product focus view. */
export function ProductCard({ product }: ProductCardProps) {
  const inStock = product.stock > 0;

  return (
    <DashboardPanel
      as="button"
      title={product.name}
      index={product.sku}
      onClick={() => useProductFocusStore.getState().open(product)}
      ariaLabel={`${product.name} — ${formatCOP(product.priceCOP)}`}
    >
      <div className="relative flex-1 overflow-hidden bg-ink">
        <div className="h-48 w-full">
          <GarmentVisual
            shape={product.visual.shape}
            colorHex={product.colors[0].hex}
            trim={product.visual.trim}
            print={product.visual.print}
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-display tnum text-[12px] text-paper">{formatCOP(product.priceCOP)}</span>
        <span
          className={`font-display text-[10px] tracking-[0.1em] uppercase ${inStock ? "text-paper-dim" : "text-orange"}`}
        >
          {inStock ? "En stock" : "Agotado"}
        </span>
      </div>
    </DashboardPanel>
  );
}
