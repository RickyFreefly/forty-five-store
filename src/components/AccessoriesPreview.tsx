import { accessoryProducts, formatCOP } from "../data/products";

/**
 * Placeholder for the accessories shelf (Fase 4 del plan). Mantiene el ancla de navegación
 * y muestra el catálogo real para no dejar una sección vacía, sin fingir la experiencia final.
 */
export function AccessoriesPreview() {
  return (
    <section id="accesorios" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-8 max-w-lg">
        <h2 className="text-3xl text-paper">Accesorios</h2>
        <p className="mt-2 text-sm text-paper-dim normal-case">
          El mueble de estantes interactivo es la Fase 4 del plan. Por ahora, el catálogo de gorras y gafas ya
          está listo.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {accessoryProducts.map((item) => (
          <div key={item.id} className="rounded-lg border border-line bg-surface p-4">
            <p className="font-display text-xs tracking-[0.1em] text-paper-dim uppercase">{item.category}</p>
            <p className="mt-1 text-sm text-paper">{item.name}</p>
            <p className="tnum mt-2 text-sm text-accent">{formatCOP(item.priceCOP)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
