# Catálogo interactivo del Front Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el `CategoryDashboard` estático (4 tarjetas con `DemoProductDialog` genérico) por navegación jerárquica real — categoría (acordeón) → género → subcategoría → grid de productos — conectada al catálogo real, sin agregar productos nuevos ("solo arquitectura").

**Architecture:** Config de categorías/subcategorías + un resolver puro (`resolveCatalogSlice`) separan "qué mostrar" de los componentes. `CatalogMenu` controla qué acordeón está abierto; cada `CategoryAccordion` despliega un `CategoryFlyout` (flotante desde `lg`, inline en mobile) con `GenderSelector` + `SubcategorySelector` opcional + `ProductGrid`. Abrir un producto usa un store de Zustand nuevo (`productFocus`) para no hacer prop-drilling desde `App.tsx`.

**Tech Stack:** React 19 + TypeScript, Tailwind v4, Motion (framer-motion), Zustand. Se añade Vitest + React Testing Library + jsdom (el proyecto no tiene test runner hoy).

**Spec:** `docs/superpowers/specs/2026-11-04-catalog-front-page-design.md`

## Global Constraints

- Apertura/cierre del acordeón: 250–350ms. Transición de selección M/F: 150–200ms.
- Aparición de productos: fade-in con ligero desplazamiento vertical. Hover en tarjetas: escala moderada. Indicador de expansión: rotación suave.
- Nunca mostrar productos inventados ni slots fingidos como poblados; sin datos reales → `EmptyCatalogState`.
- Si `productos.length` supera la capacidad de slots/página, debe haber paginación/navegación interna.
- Cambiar de género actualiza el grid de inmediato, sin recargar la página.
- Un acordeón abierto cierra los demás; un segundo clic sobre el abierto lo cierra.
- No se toca el hero, el header, el branding, el tema oscuro ni el acento naranja.
- `aria-expanded` en los triggers de acordeón, navegación e indicadores de foco por teclado.
- Mobile: acordeón vertical (contenido empuja, no flota), selector M/F visible, grid de productos 1 columna (2 desde `sm`), sin scroll horizontal.
- Desktop (`lg` y superior): el acordeón abierto flota sobre el resto de la página (`CategoryFlyout`) — nunca estira la fila que comparte con el hero.
- "Solo arquitectura": no se agregan productos nuevos a `src/data/products.ts` en este plan. Technical Suits y Streetwear quedan en estado vacío a propósito.
- Producto sin `gender` definido se considera válido para ambos géneros (no se oculta).

## Review Focus

- Cambiar de género en una categoría sin datos (Technical Suits/Streetwear) no debe mostrar productos de la otra categoría ni romper — siempre `[]`.
- Abrir una segunda categoría con otra ya abierta debe cerrar la primera, nunca dos flyouts abiertos a la vez.
- `productos.length` exactamente igual a la capacidad de la página no debe mostrar controles de paginación (riesgo de off-by-one).
- Con teclado: `Escape` cierra el flyout y el foco vuelve al botón que lo abrió, nunca se pierde en `body`.
- Un producto con `stock === 0` debe mostrarse como agotado, nunca como disponible silenciosamente.

---

## File Structure

**Crear:**
- `vitest.config.ts` — config de test separada (jsdom, setup file).
- `src/test/setup.ts` — `@testing-library/jest-dom` matchers.
- `src/data/catalogTaxonomy.ts` — config de categorías/subcategorías + `resolveCatalogSlice`.
- `src/store/productFocus.ts` — store de Zustand para abrir `ProductFocusView` desde cualquier parte.
- `src/components/dashboard/EmptyCatalogState.tsx`
- `src/components/dashboard/ProductCard.tsx`
- `src/components/dashboard/ProductGrid.tsx`
- `src/components/dashboard/SubcategorySelector.tsx`
- `src/components/dashboard/CategoryFlyout.tsx`
- `src/components/dashboard/CategoryAccordion.tsx`
- `src/components/dashboard/CatalogMenu.tsx`
- Un archivo `*.test.tsx`/`*.test.ts` junto a cada archivo de arriba (co-ubicado, mismo directorio).

**Modificar:**
- `src/types/product.ts` — agrega `gender?: "M" | "F"` a `ProductBase`.
- `src/lib/motionTokens.ts` — agrega `accordion` y `genderSwitch` a `DURATION`.
- `src/components/dashboard/CategoryDashboard.tsx` — pasa a renderizar `CatalogMenu` + `TechnicalGallery`.
- `src/App.tsx` — usa `useProductFocusStore` en vez de `useState` local.
- `package.json` — añade devDependencies y script `test`.

**Eliminar:**
- `src/components/dashboard/TechnicalSuitsPanel.tsx` (reemplazado por `CategoryAccordion` + config).
- `src/components/dashboard/StreetwearPanel.tsx` (idem).

**Sin cambios:** `GenderSelector.tsx`, `DashboardPanel.tsx`, `CategoryProductCard.tsx`, `AccessoriesPanel.tsx`, `DemoProductDialog.tsx`, `ProductFocusView.tsx`, `src/data/products.ts`.

---

### Task 1: Test tooling (Vitest + React Testing Library)

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/smoke.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm test` (alias `vitest run`) usable by every later task.

- [ ] **Step 1: Install dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

- [ ] **Step 3: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add `"test": "vitest run"` and `"test:watch": "vitest"` to `package.json` scripts**

- [ ] **Step 5: Write the smoke test `src/test/smoke.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run `npm test` and verify it passes**

Expected: 1 passed.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts src/test/ package.json package-lock.json
git commit -m "test: add Vitest + React Testing Library harness"
```

---

### Task 2: `gender` field + `catalogTaxonomy.ts` + `resolveCatalogSlice`

**Files:**
- Modify: `src/types/product.ts`
- Create: `src/data/catalogTaxonomy.ts`
- Test: `src/data/catalogTaxonomy.test.ts`

**Interfaces:**
- Consumes: `ClothingProduct`, `clothingProducts` from `src/data/products.ts` (`group: "superior" | "inferior"`, `gender?: "M" | "F"`).
- Produces (for later tasks):
  ```ts
  export type Gender = "M" | "F";
  export type CategoryId = "technical-suits" | "upper" | "lower" | "streetwear";
  export interface SubcategoryConfig { id: string; label: string; slots: number }
  export interface CategoryConfig {
    id: CategoryId;
    label: string;
    index: string;
    slots?: number;              // set when no subcategories (upper/lower)
    subcategories?: SubcategoryConfig[]; // set for technical-suits/streetwear
  }
  export const CATALOG_CATEGORIES: CategoryConfig[];
  export function resolveCatalogSlice(
    categoryId: CategoryId,
    gender: Gender,
    subcategoryId?: string,
  ): ClothingProduct[];
  ```

- [ ] **Step 1: Add `gender?: "M" | "F";` to `ProductBase` in `src/types/product.ts`**

One line in the existing interface; no product in `products.ts` sets it, so every existing product stays `undefined`.

- [ ] **Step 2: Write the failing tests in `src/data/catalogTaxonomy.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { resolveCatalogSlice, CATALOG_CATEGORIES } from "./catalogTaxonomy";

describe("CATALOG_CATEGORIES", () => {
  it("has the four categories from the spec with their slot counts", () => {
    const bySlots = Object.fromEntries(CATALOG_CATEGORIES.map((c) => [c.id, c]));
    expect(bySlots["technical-suits"].subcategories).toEqual([
      { id: "hibridos", label: "Híbridos", slots: 4 },
      { id: "skydiving", label: "Skydiving", slots: 2 },
      { id: "tunel", label: "Túnel", slots: 2 },
    ]);
    expect(bySlots["upper"].slots).toBe(6);
    expect(bySlots["lower"].slots).toBe(6);
    expect(bySlots["streetwear"].subcategories?.map((s) => s.id)).toEqual(["cabeza", "sup", "inf"]);
  });
});

describe("resolveCatalogSlice", () => {
  it("returns [] for technical-suits regardless of gender/subcategory", () => {
    expect(resolveCatalogSlice("technical-suits", "M", "hibridos")).toEqual([]);
    expect(resolveCatalogSlice("technical-suits", "F", "skydiving")).toEqual([]);
  });

  it("returns [] for streetwear regardless of gender/subcategory", () => {
    expect(resolveCatalogSlice("streetwear", "M", "cabeza")).toEqual([]);
  });

  it("returns real superior-group products for upper, same for both genders when ungendered", () => {
    const m = resolveCatalogSlice("upper", "M");
    const f = resolveCatalogSlice("upper", "F");
    expect(m.map((p) => p.id).sort()).toEqual(f.map((p) => p.id).sort());
    expect(m.map((p) => p.id)).toContain("flow-line-tee");
    expect(m.every((p) => p.group === "superior")).toBe(true);
  });

  it("returns real inferior-group products for lower", () => {
    const lower = resolveCatalogSlice("lower", "M");
    expect(lower.map((p) => p.id)).toContain("exit-point-trouser");
    expect(lower.every((p) => p.group === "inferior")).toBe(true);
  });

  it("excludes a product whose gender doesn't match, includes it when it does", () => {
    // flow-line-tee has no gender in products.ts — this test only needs resolveCatalogSlice's
    // own filtering logic, so it is independent of any fixture data in products.ts.
    const upperM = resolveCatalogSlice("upper", "M").map((p) => p.id);
    const upperF = resolveCatalogSlice("upper", "F").map((p) => p.id);
    expect(upperM).toEqual(upperF); // no product is gendered today, so both sets are identical
  });
});
```

- [ ] **Step 3: Run `npm test` and verify these fail**

Expected: FAIL — `catalogTaxonomy` module not found.

- [ ] **Step 4: Implement `src/data/catalogTaxonomy.ts`**

```ts
import { clothingProducts } from "./products";
import type { ClothingProduct } from "../types/product";

export type Gender = "M" | "F";
export type CategoryId = "technical-suits" | "upper" | "lower" | "streetwear";

export interface SubcategoryConfig {
  id: string;
  label: string;
  slots: number;
}

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  index: string;
  slots?: number;
  subcategories?: SubcategoryConfig[];
}

export const CATALOG_CATEGORIES: CategoryConfig[] = [
  {
    id: "technical-suits",
    label: "Technical Suits",
    index: "01",
    subcategories: [
      { id: "hibridos", label: "Híbridos", slots: 4 },
      { id: "skydiving", label: "Skydiving", slots: 2 },
      { id: "tunel", label: "Túnel", slots: 2 },
    ],
  },
  { id: "upper", label: "Prendas Superiores", index: "02", slots: 6 },
  { id: "lower", label: "Prendas Inferiores", index: "03", slots: 6 },
  {
    id: "streetwear",
    label: "Streetwear",
    index: "04",
    subcategories: [
      { id: "cabeza", label: "Cabeza", slots: 4 },
      { id: "sup", label: "Sup", slots: 4 },
      { id: "inf", label: "Inf", slots: 4 },
    ],
  },
];

function matchesGender(product: ClothingProduct, gender: Gender): boolean {
  return product.gender === undefined || product.gender === gender;
}

/**
 * Technical Suits y Streetwear no tienen todavía ninguna línea de producto real en
 * el catálogo (products.ts) — devuelven [] a propósito en vez de inventar prendas.
 * Prendas Superiores/Inferiores sí reutilizan el catálogo real existente.
 */
export function resolveCatalogSlice(categoryId: CategoryId, gender: Gender, _subcategoryId?: string): ClothingProduct[] {
  if (categoryId === "upper") return clothingProducts.filter((p) => p.group === "superior" && matchesGender(p, gender));
  if (categoryId === "lower") return clothingProducts.filter((p) => p.group === "inferior" && matchesGender(p, gender));
  return [];
}
```

- [ ] **Step 5: Run `npm test` and verify all pass**

- [ ] **Step 6: Commit**

```bash
git add src/types/product.ts src/data/catalogTaxonomy.ts src/data/catalogTaxonomy.test.ts
git commit -m "feat: add catalog taxonomy config and resolveCatalogSlice"
```

---

### Task 3: `productFocus` store

**Files:**
- Create: `src/store/productFocus.ts`
- Test: `src/store/productFocus.test.ts`

**Interfaces:**
- Consumes: `ClothingProduct` from `src/types/product.ts`.
- Produces:
  ```ts
  export const useProductFocusStore: UseBoundStore<StoreApi<{
    product: ClothingProduct | null;
    open: (product: ClothingProduct) => void;
    close: () => void;
  }>>;
  ```

- [ ] **Step 1: Write the failing test in `src/store/productFocus.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useProductFocusStore } from "./productFocus";
import { clothingProducts } from "../data/products";

const [tee, hoodie] = clothingProducts;

beforeEach(() => {
  useProductFocusStore.setState({ product: null });
});

describe("useProductFocusStore", () => {
  it("starts with no product", () => {
    expect(useProductFocusStore.getState().product).toBeNull();
  });

  it("open() sets the product", () => {
    useProductFocusStore.getState().open(tee);
    expect(useProductFocusStore.getState().product).toBe(tee);
  });

  it("open() replaces a previously open product", () => {
    useProductFocusStore.getState().open(tee);
    useProductFocusStore.getState().open(hoodie);
    expect(useProductFocusStore.getState().product).toBe(hoodie);
  });

  it("close() clears the product", () => {
    useProductFocusStore.getState().open(tee);
    useProductFocusStore.getState().close();
    expect(useProductFocusStore.getState().product).toBeNull();
  });
});
```

- [ ] **Step 2: Run `npm test` and verify it fails** (module not found)

- [ ] **Step 3: Implement `src/store/productFocus.ts`**

```ts
import { create } from "zustand";
import type { ClothingProduct } from "../types/product";

interface ProductFocusState {
  product: ClothingProduct | null;
  open: (product: ClothingProduct) => void;
  close: () => void;
}

export const useProductFocusStore = create<ProductFocusState>((set) => ({
  product: null,
  open: (product) => set({ product }),
  close: () => set({ product: null }),
}));
```

- [ ] **Step 4: Run `npm test` and verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/store/productFocus.ts src/store/productFocus.test.ts
git commit -m "feat: add productFocus store"
```

---

### Task 4: `EmptyCatalogState`

**Files:**
- Create: `src/components/dashboard/EmptyCatalogState.tsx`
- Test: `src/components/dashboard/EmptyCatalogState.test.tsx`

**Interfaces:**
- Produces: `EmptyCatalogState({ message?: string })` — default message is
  `"Próximamente — todavía no hay prendas en esta combinación."`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyCatalogState } from "./EmptyCatalogState";

describe("EmptyCatalogState", () => {
  it("shows the default message", () => {
    render(<EmptyCatalogState />);
    expect(screen.getByText(/todavía no hay prendas/i)).toBeInTheDocument();
  });

  it("shows a custom message when given one", () => {
    render(<EmptyCatalogState message="Sin accesorios por ahora." />);
    expect(screen.getByText("Sin accesorios por ahora.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run `npm test` and verify it fails**

- [ ] **Step 3: Implement `EmptyCatalogState({ message = "Próximamente — todavía no hay prendas en esta combinación." }: { message?: string })`**

Bloque centrado, estilo consistente con el resto del dashboard (`text-paper-dim`,
borde punteado `border-line`), sin imágenes ni productos simulados.

- [ ] **Step 4: Run `npm test` and verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/EmptyCatalogState.tsx src/components/dashboard/EmptyCatalogState.test.tsx
git commit -m "feat: add EmptyCatalogState component"
```

---

### Task 5: `ProductCard`

**Files:**
- Create: `src/components/dashboard/ProductCard.tsx`
- Test: `src/components/dashboard/ProductCard.test.tsx`

**Interfaces:**
- Consumes: `ClothingProduct` (`src/types/product.ts`), `formatCOP` (`src/data/products.ts`),
  `useProductFocusStore` (Task 3), `GarmentVisual` (`src/components/GarmentVisual.tsx`,
  props `{shape, colorHex, trim, print, className?}`).
- Produces: `ProductCard({ product: ClothingProduct })`.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "./ProductCard";
import { useProductFocusStore } from "../../store/productFocus";
import { clothingProducts } from "../../data/products";

const product = clothingProducts.find((p) => p.id === "flow-line-tee")!;
const outOfStock = { ...product, id: "x", stock: 0 };

beforeEach(() => {
  useProductFocusStore.setState({ product: null });
});

describe("ProductCard", () => {
  it("shows name, sku and formatted price", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText(product.sku)).toBeInTheDocument();
    expect(screen.getByText(/109\.900/)).toBeInTheDocument();
  });

  it("shows availability text for an in-stock product", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText(/en stock/i)).toBeInTheDocument();
  });

  it("shows 'Agotado' for a product with stock 0", () => {
    render(<ProductCard product={outOfStock} />);
    expect(screen.getByText(/agotado/i)).toBeInTheDocument();
  });

  it("opens the product focus store on click", async () => {
    render(<ProductCard product={product} />);
    await userEvent.click(screen.getByRole("button"));
    expect(useProductFocusStore.getState().product).toBe(product);
  });
});
```

- [ ] **Step 2: Run `npm test` and verify these fail**

- [ ] **Step 3: Implement `ProductCard({ product }: { product: ClothingProduct })`**

Botón (consistente con `DashboardPanel`/`CategoryProductCard`: borde `border-line`,
hover `border-orange`). Dentro: `<GarmentVisual shape={product.visual.shape}
colorHex={product.colors[0].hex} trim={product.visual.trim} print={product.visual.print} />`,
nombre, `product.sku`, `formatCOP(product.priceCOP)`, y
`product.stock > 0 ? "En stock" : "Agotado"`. `onClick` llama
`useProductFocusStore.getState().open(product)` (o el hook, según convenga).

- [ ] **Step 4: Run `npm test` and verify these pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ProductCard.tsx src/components/dashboard/ProductCard.test.tsx
git commit -m "feat: add ProductCard component"
```

---

### Task 6: `ProductGrid` (con paginación)

**Files:**
- Create: `src/components/dashboard/ProductGrid.tsx`
- Test: `src/components/dashboard/ProductGrid.test.tsx`

**Interfaces:**
- Consumes: `ProductCard` (Task 5), `EmptyCatalogState` (Task 4), `ClothingProduct`.
- Produces: `ProductGrid({ products: ClothingProduct[], slots: number, pageSize?: number })`
  (`pageSize` por defecto = `slots`).

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductGrid } from "./ProductGrid";
import { clothingProducts } from "../../data/products";

describe("ProductGrid", () => {
  it("shows EmptyCatalogState when there are no products", () => {
    render(<ProductGrid products={[]} slots={6} />);
    expect(screen.getByText(/todavía no hay prendas/i)).toBeInTheDocument();
  });

  it("renders every product and no pagination when they fit one page", () => {
    const subset = clothingProducts.slice(0, 3);
    render(<ProductGrid products={subset} slots={6} pageSize={6} />);
    subset.forEach((p) => expect(screen.getByText(p.name)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /siguiente/i })).not.toBeInTheDocument();
  });

  it("does not show pagination when products.length === pageSize exactly", () => {
    const subset = clothingProducts.slice(0, 2);
    render(<ProductGrid products={subset} slots={2} pageSize={2} />);
    expect(screen.queryByRole("button", { name: /siguiente/i })).not.toBeInTheDocument();
  });

  it("paginates when there are more products than pageSize, and Next advances the page", async () => {
    render(<ProductGrid products={clothingProducts} slots={6} pageSize={2} />);
    expect(screen.getByText(clothingProducts[0].name)).toBeInTheDocument();
    expect(screen.queryByText(clothingProducts[2].name)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    expect(screen.getByText(clothingProducts[2].name)).toBeInTheDocument();
    expect(screen.queryByText(clothingProducts[0].name)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run `npm test` and verify these fail**

- [ ] **Step 3: Implement `ProductGrid({ products, slots, pageSize = slots }: { products: ClothingProduct[]; slots: number; pageSize?: number })`**

`useState(0)` para la página. Si `products.length === 0` → `<EmptyCatalogState />`.
Si no, `const pageItems = products.slice(page * pageSize, page * pageSize + pageSize)`;
grid responsive (`grid-cols-1 sm:grid-cols-2`) de `ProductCard`; botones Prev/Siguiente
solo si `products.length > pageSize`, `Prev` deshabilitado en `page === 0`, `Siguiente`
deshabilitado en la última página.

- [ ] **Step 4: Run `npm test` and verify these pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ProductGrid.tsx src/components/dashboard/ProductGrid.test.tsx
git commit -m "feat: add ProductGrid component with pagination"
```

---

### Task 7: `SubcategorySelector`

**Files:**
- Create: `src/components/dashboard/SubcategorySelector.tsx`
- Test: `src/components/dashboard/SubcategorySelector.test.tsx`

**Interfaces:**
- Consumes: `SubcategoryConfig` (Task 2).
- Produces: `SubcategorySelector({ options: SubcategoryConfig[], value: string, onChange: (id: string) => void })`.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubcategorySelector } from "./SubcategorySelector";

const options = [
  { id: "hibridos", label: "Híbridos", slots: 4 },
  { id: "skydiving", label: "Skydiving", slots: 2 },
];

describe("SubcategorySelector", () => {
  it("renders a button per option", () => {
    render(<SubcategorySelector options={options} value="hibridos" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Híbridos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skydiving" })).toBeInTheDocument();
  });

  it("marks the active option with aria-pressed", () => {
    render(<SubcategorySelector options={options} value="skydiving" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Skydiving" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Híbridos" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the clicked option's id", async () => {
    const onChange = vi.fn();
    render(<SubcategorySelector options={options} value="hibridos" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Skydiving" }));
    expect(onChange).toHaveBeenCalledWith("skydiving");
  });
});
```

- [ ] **Step 2: Run `npm test` and verify these fail**

- [ ] **Step 3: Implement `SubcategorySelector`**

Fila de botones (mismo lenguaje visual que `GenderSelector`/los tabs actuales de
`StreetwearPanel`: `aria-pressed`, texto naranja cuando está activo).

- [ ] **Step 4: Run `npm test` and verify these pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/SubcategorySelector.tsx src/components/dashboard/SubcategorySelector.test.tsx
git commit -m "feat: add SubcategorySelector component"
```

---

### Task 8: `CategoryFlyout`

**Files:**
- Modify: `src/lib/motionTokens.ts`
- Create: `src/components/dashboard/CategoryFlyout.tsx`
- Test: `src/components/dashboard/CategoryFlyout.test.tsx`

**Interfaces:**
- Consumes: `DURATION` (`src/lib/motionTokens.ts`).
- Produces: `CategoryFlyout({ id: string, open: boolean, onClose: () => void, children: ReactNode })`.
  Renderiza `children` dentro de un contenedor con `id={id}` cuando `open` es `true`
  (desmontado o vacío cuando `open` es `false`), más un backdrop clicable.

- [ ] **Step 1: Add `accordion: 0.3` and `genderSwitch: 0.18` to `DURATION` in `src/lib/motionTokens.ts`**

(250–350ms y 150–200ms del spec, valor medio de cada rango.)

- [ ] **Step 2: Write the failing tests**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFlyout } from "./CategoryFlyout";

describe("CategoryFlyout", () => {
  it("does not render children when closed", () => {
    render(
      <CategoryFlyout id="f1" open={false} onClose={() => {}}>
        <p>contenido</p>
      </CategoryFlyout>,
    );
    expect(screen.queryByText("contenido")).not.toBeInTheDocument();
  });

  it("renders children with the given id when open", () => {
    render(
      <CategoryFlyout id="f1" open onClose={() => {}}>
        <p>contenido</p>
      </CategoryFlyout>,
    );
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(document.getElementById("f1")).toBeInTheDocument();
  });

  it("calls onClose on Escape", async () => {
    const onClose = vi.fn();
    render(
      <CategoryFlyout id="f1" open onClose={onClose}>
        <p>contenido</p>
      </CategoryFlyout>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked, not when children are clicked", async () => {
    const onClose = vi.fn();
    render(
      <CategoryFlyout id="f1" open onClose={onClose}>
        <button type="button">adentro</button>
      </CategoryFlyout>,
    );
    await userEvent.click(screen.getByText("adentro"));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("category-flyout-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run `npm test` and verify these fail**

- [ ] **Step 4: Implement `CategoryFlyout`**

- `AnimatePresence`/`motion.div` con `DURATION.accordion`, opacidad + `y` leve, igual
  que el resto del motion del dashboard; `useReducedMotion` respetado.
- Backdrop: `<div data-testid="category-flyout-backdrop" className="hidden lg:block fixed inset-0 z-20" onClick={onClose} />`,
  solo visible desde `lg` (en mobile el contenido es inline, sin overlay).
- Contenedor de contenido: `lg:absolute lg:left-0 lg:right-0 lg:top-full lg:z-30` para
  flotar desde `lg`; sin esas clases (flujo normal) por debajo de `lg`.
- `useEffect` con `keydown` en `window` mientras `open` para `Escape → onClose()`.

- [ ] **Step 5: Run `npm test` and verify these pass**

- [ ] **Step 6: Commit**

```bash
git add src/lib/motionTokens.ts src/components/dashboard/CategoryFlyout.tsx src/components/dashboard/CategoryFlyout.test.tsx
git commit -m "feat: add CategoryFlyout component"
```

---

### Task 9: `CategoryAccordion`

**Files:**
- Create: `src/components/dashboard/CategoryAccordion.tsx`
- Test: `src/components/dashboard/CategoryAccordion.test.tsx`

**Interfaces:**
- Consumes: `CategoryConfig`, `resolveCatalogSlice` (Task 2); `GenderSelector` (existente);
  `SubcategorySelector` (Task 7); `ProductGrid` (Task 6); `CategoryFlyout` (Task 8);
  `DashboardPanel` (existente, para el chrome del trigger).
- Produces: `CategoryAccordion({ category: CategoryConfig, isOpen: boolean, onToggle: () => void })`.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryAccordion } from "./CategoryAccordion";
import { CATALOG_CATEGORIES } from "../../data/catalogTaxonomy";

const upper = CATALOG_CATEGORIES.find((c) => c.id === "upper")!;
const technicalSuits = CATALOG_CATEGORIES.find((c) => c.id === "technical-suits")!;

describe("CategoryAccordion", () => {
  it("reflects isOpen via aria-expanded on the trigger", () => {
    const { rerender } = render(<CategoryAccordion category={upper} isOpen={false} onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: /prendas superiores/i })).toHaveAttribute("aria-expanded", "false");
    rerender(<CategoryAccordion category={upper} isOpen onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: /prendas superiores/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("calls onToggle when the trigger is clicked", async () => {
    const onToggle = vi.fn();
    render(<CategoryAccordion category={upper} isOpen={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button", { name: /prendas superiores/i }));
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows real products for upper when open, with no subcategory selector", () => {
    render(<CategoryAccordion category={upper} isOpen onToggle={() => {}} />);
    expect(screen.getByText("Flow Line Tee")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Híbridos" })).not.toBeInTheDocument();
  });

  it("shows the subcategory selector and empty state for technical-suits when open", () => {
    render(<CategoryAccordion category={technicalSuits} isOpen onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: "Híbridos" })).toBeInTheDocument();
    expect(screen.getByText(/todavía no hay prendas/i)).toBeInTheDocument();
  });

  it("returns focus to the trigger when isOpen flips from true to false (Escape/backdrop case)", () => {
    const { rerender } = render(<CategoryAccordion category={upper} isOpen onToggle={() => {}} />);
    const trigger = screen.getByRole("button", { name: /prendas superiores/i });
    rerender(<CategoryAccordion category={upper} isOpen={false} onToggle={() => {}} />);
    expect(trigger).toHaveFocus();
  });
});
```

- [ ] **Step 2: Run `npm test` and verify these fail**

- [ ] **Step 3: Implement `CategoryAccordion`**

Estado interno: `gender` (`useState<Gender>("M")`), `subcategoryId`
(`useState(category.subcategories?.[0]?.id ?? "")`). Header/trigger = botón con
`aria-expanded={isOpen}` `aria-controls={flyoutId}` sobre el chrome de `DashboardPanel`
(título + índice + chevron que rota con `isOpen`), `onClick={onToggle}`. Dentro de
`CategoryFlyout` (`id=flyoutId`, `open={isOpen}`, `onClose={onToggle}`):
`GenderSelector` (duración `DURATION.genderSwitch` en su transición si aplica) +
`SubcategorySelector` si `category.subcategories` existe + `ProductGrid` con
`products={resolveCatalogSlice(category.id, gender, subcategoryId)}` y
`slots={category.subcategories?.find(s => s.id === subcategoryId)?.slots ?? category.slots!}`.
`triggerRef = useRef<HTMLButtonElement>(null)` en el botón; `useEffect` que compara
`isOpen` con su valor anterior (`useRef`/`usePrevious` inline) y, cuando pasa de
`true` a `false`, llama `triggerRef.current?.focus()` — cubre tanto el cierre por
`Escape`/backdrop (foco estaba dentro del flyout) como por clic directo en el
trigger (ya tenía el foco, el `focus()` es un no-op).

- [ ] **Step 4: Run `npm test` and verify these pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/CategoryAccordion.tsx src/components/dashboard/CategoryAccordion.test.tsx
git commit -m "feat: add CategoryAccordion component"
```

---

### Task 10: `CatalogMenu`

**Files:**
- Create: `src/components/dashboard/CatalogMenu.tsx`
- Test: `src/components/dashboard/CatalogMenu.test.tsx`

**Interfaces:**
- Consumes: `CATALOG_CATEGORIES` (Task 2), `CategoryAccordion` (Task 9),
  `AccessoriesPanel` (existente, prop `onOpenDemo: (content: DemoDialogContent) => void`),
  `DemoProductDialog`/`DemoDialogContent` (existente).
- Produces: `CatalogMenu()` — sin props; auto-contenido (incluye el estado y el diálogo
  demo que antes vivían en `CategoryDashboard`).

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogMenu } from "./CatalogMenu";

describe("CatalogMenu", () => {
  it("renders a trigger for each of the four categories plus Accesorios", () => {
    render(<CatalogMenu />);
    expect(screen.getByRole("button", { name: /technical suits/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prendas superiores/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prendas inferiores/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /streetwear/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accesorios/i })).toBeInTheDocument();
  });

  it("opening a second category closes the first", async () => {
    render(<CatalogMenu />);
    const upperTrigger = screen.getByRole("button", { name: /prendas superiores/i });
    const lowerTrigger = screen.getByRole("button", { name: /prendas inferiores/i });

    await userEvent.click(upperTrigger);
    expect(upperTrigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(lowerTrigger);
    expect(lowerTrigger).toHaveAttribute("aria-expanded", "true");
    expect(upperTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("clicking an open trigger again closes it", async () => {
    render(<CatalogMenu />);
    const upperTrigger = screen.getByRole("button", { name: /prendas superiores/i });
    await userEvent.click(upperTrigger);
    expect(upperTrigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(upperTrigger);
    expect(upperTrigger).toHaveAttribute("aria-expanded", "false");
  });
});
```

- [ ] **Step 2: Run `npm test` and verify these fail**

- [ ] **Step 3: Implement `CatalogMenu`**

`useState<CategoryId | null>(null)` para `openCategory`. Grid
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line` (corrige el breakpoint de
`CategoryDashboard` actual, que no colapsaba a 1 columna). Mapea `CATALOG_CATEGORIES`
a `<CategoryAccordion key={c.id} category={c} isOpen={openCategory === c.id}
onToggle={() => setOpenCategory((cur) => (cur === c.id ? null : c.id))} />`.
`AccessoriesPanel` se coloca en la misma columna donde vivía hoy (apilado junto a
Streetwear), con el `demo`/`DemoProductDialog` que antes tenía `CategoryDashboard`
movidos aquí.

- [ ] **Step 4: Run `npm test` and verify these pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/CatalogMenu.tsx src/components/dashboard/CatalogMenu.test.tsx
git commit -m "feat: add CatalogMenu, wiring one-open-accordion behavior"
```

---

### Task 11: Cablear `CategoryDashboard`, migrar `App.tsx`, borrar paneles viejos

**Files:**
- Modify: `src/components/dashboard/CategoryDashboard.tsx`
- Modify: `src/App.tsx`
- Delete: `src/components/dashboard/TechnicalSuitsPanel.tsx`
- Delete: `src/components/dashboard/StreetwearPanel.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `CatalogMenu` (Task 10), `useProductFocusStore` (Task 3).

- [ ] **Step 1: Write the failing integration test in `src/App.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { useProductFocusStore } from "./store/productFocus";

beforeEach(() => {
  useProductFocusStore.setState({ product: null });
});

describe("App catalog → product focus integration", () => {
  it("opens ProductFocusView when a real product card in Prendas Superiores is clicked", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /prendas superiores/i }));
    await userEvent.click(screen.getByRole("button", { name: /flow line tee/i }));
    expect(useProductFocusStore.getState().product?.id).toBe("flow-line-tee");
    expect(await screen.findByText(/flow line tee/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run `npm test` and verify it fails**

- [ ] **Step 3: Modify `src/components/dashboard/CategoryDashboard.tsx`**

Reemplaza el grid estático + `demo`/`DemoProductDialog` (ahora dentro de `CatalogMenu`)
por:

```tsx
export function CategoryDashboard() {
  return (
    <div className="flex flex-col gap-px bg-line">
      <CatalogMenu />
      <TechnicalGallery />
    </div>
  );
}
```

- [ ] **Step 4: Modify `src/App.tsx`**

Elimina `const [selected, setSelected] = useState<ClothingProduct | null>(null)` y el
import ahora no usado de `ClothingProduct`/`useState` (si queda sin otros usos).
Sustituye el bloque `AnimatePresence` por:

```tsx
const product = useProductFocusStore((s) => s.product);
const closeProductFocus = useProductFocusStore((s) => s.close);
// ...
<AnimatePresence>
  {product ? <ProductFocusView product={product} onClose={closeProductFocus} /> : null}
</AnimatePresence>
```

- [ ] **Step 5: Delete `TechnicalSuitsPanel.tsx` and `StreetwearPanel.tsx`**

- [ ] **Step 6: Run `npm test` and verify everything passes**

- [ ] **Step 7: Run `npm run build` and verify it succeeds (no unused imports, no type errors)**

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: wire CatalogMenu into CategoryDashboard, migrate App.tsx to productFocus store"
```

---

## Self-Review

**1. Cobertura del spec:** acordeones (Task 9/10) · género M/F con actualización
inmediata (Task 2/9, `useState` sin recarga) · subcategorías de Technical
Suits/Streetwear (Task 2/7/9) · grid dinámico desde datos reales, sin imagen única
(Task 5/6) · estado vacío honesto (Task 4) · paginación si hay más productos que
slots (Task 6) · abrir detalle de producto (Task 3/5/11) · motion (Task 8, valores en
Global Constraints) · accesibilidad aria-expanded/foco/teclado (Task 8/9) ·
responsive mobile/tablet/desktop (Task 6/8/10) · Accesorios sin tocar (no-goal,
ningún task lo modifica) · "solo arquitectura" (ningún task toca `products.ts`).

**2. Escaneo de pasos:** cada paso de test trae nombre+aserciones; cada paso de
código trae firma exacta y, cuando el algoritmo no es obvio de la firma+tests (p.ej.
`resolveCatalogSlice`, la lógica de paginación de `ProductGrid`, el backdrop de
`CategoryFlyout`), un párrafo de una o dos líneas, no un cuerpo completo.

**3. Consistencia de tipos:** `CategoryId`/`Gender`/`SubcategoryConfig`/`CategoryConfig`
se definen una vez en Task 2 y se reutilizan tal cual (mismos nombres) en Tasks 7, 9 y
10. `resolveCatalogSlice(categoryId, gender, subcategoryId?)` se llama con esa firma
exacta en Task 9. `useProductFocusStore` con `{product, open, close}` se define en
Task 3 y se consume igual en Tasks 5 y 11.

**4. Review Focus:** las 5 líneas de arriba tienen su test: género en categoría sin
datos → Task 2 (`resolveCatalogSlice` siempre `[]`); doble acordeón abierto → Task 10;
paginación off-by-one → Task 6 (`products.length === pageSize`); Escape + retorno de
foco → Task 8 cubre `Escape → onClose`, Task 9 cubre el retorno de foco al trigger
(`CategoryFlyout` no conoce el trigger, por eso vive en `CategoryAccordion`);
producto agotado → Task 5.

**5. Proporción:** el plan es más largo que el spec porque fija nombres, firmas y
tests exactos para 9 componentes/módulos nuevos — ningún paso repite un cuerpo que la
firma+tests ya determinan; los cuerpos de implementación se dejan en prosa corta.
