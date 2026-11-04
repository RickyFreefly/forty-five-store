import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ClothingProduct } from "../../types/product";
import { ProductCard } from "./ProductCard";
import { EmptyCatalogState } from "./EmptyCatalogState";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface ProductGridProps {
  products: ClothingProduct[];
  slots: number;
  pageSize?: number;
}

/** Paginated grid of real product cards for one catalog slice. */
export function ProductGrid({ products, slots, pageSize = slots }: ProductGridProps) {
  const [page, setPage] = useState(0);
  const reduceMotion = useReducedMotion();

  if (products.length === 0) {
    return <EmptyCatalogState />;
  }

  const lastPage = Math.ceil(products.length / pageSize) - 1;
  const pageItems = products.slice(page * pageSize, page * pageSize + pageSize);
  const showPagination = products.length > pageSize;

  return (
    <div className="flex flex-1 flex-col gap-px bg-line">
      <motion.div
        className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2"
        variants={reduceMotion ? undefined : gridVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="show"
      >
        {pageItems.map((product) => (
          <motion.div key={product.id} variants={reduceMotion ? undefined : itemVariants}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>

      {showPagination ? (
        <div className="flex items-center justify-between bg-ink px-4 py-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="font-display text-[10px] tracking-[0.1em] text-paper uppercase disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="font-display tnum text-[10px] tracking-[0.1em] text-paper-dim uppercase">
            {page + 1} / {lastPage + 1}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page === lastPage}
            className="font-display text-[10px] tracking-[0.1em] text-paper uppercase disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  );
}
