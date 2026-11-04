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

export function matchesGender(product: ClothingProduct, gender: Gender): boolean {
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
