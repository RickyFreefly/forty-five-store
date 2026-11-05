/**
 * Catálogo de "El Ropero" — el riel de prendas colgadas (ver src/components/rack).
 * Subconjunto del catálogo real (src/data/products.ts) que tiene foto recortada de la prenda.
 * Precios y nombres se reutilizan tal cual del catálogo oficial.
 */

/** Set de fotos en public/images/ropero/<set>-<color>.webp (y <set>-<color>-espalda.webp si hay espalda). */
export type RoperoPhotoSet = "hoodie" | "tee" | "polo" | "pant";

export interface RoperoProduct {
  id: string;
  name: string;
  price: number;
  badge: string;
  photo: RoperoPhotoSet;
  colors: string[];
  sizes: string[];
  desc: string;
}

/** Colores en que de verdad están fotografiadas las prendas. */
export const COLORS: Record<string, [string, string]> = {
  hueso: ["Blanco hueso", "#ECE6D9"],
  negro: ["Negro", "#1E1E20"],
  jaspe: ["Gris jaspe", "#A7A6A2"],
  carbon: ["Gris carbón", "#46474A"],
  marino: ["Azul marino", "#1F2A44"],
  celeste: ["Celeste", "#9DC3E2"],
  oliva: ["Verde oliva", "#68683A"],
  bosque: ["Verde bosque", "#24452F"],
  vinotinto: ["Vinotinto", "#5B1A25"],
  naranja: ["Naranja", "#DE6A2D"],
  arena: ["Arena", "#CDB892"],
  cafe: ["Café", "#603B30"],
  chicle: ["Rosa chicle", "#FC64A8"],
  verdeK: ["Verde kelly", "#24974A"],
  cobalto: ["Azul cobalto", "#405C95"],
  fucsia: ["Fucsia", "#DE1874"],
  crema: ["Crema", "#EFDABF"],
  camel: ["Camel", "#B98A55"],
};

export const SIZES = ["XS", "S", "M", "L", "XL"];

export const PRODUCTS: RoperoProduct[] = [
  {
    id: "drop-zone-hoodie",
    name: "Drop Zone Hoodie",
    price: 259900,
    badge: "Nuevo",
    photo: "hoodie",
    colors: ["negro", "naranja", "carbon", "oliva", "celeste", "cobalto", "marino", "cafe", "crema", "chicle", "fucsia", "verdeK"],
    sizes: SIZES,
    desc: "Hoodie de felpa pesada con bolsillo canguro y capucha reforzada, para esperar el próximo manifiesto.",
  },
  {
    id: "flow-line-tee",
    name: "Flow Line Tee",
    price: 109900,
    badge: "Más vendido",
    photo: "tee",
    colors: ["jaspe", "hueso", "negro", "bosque", "vinotinto", "marino"],
    sizes: SIZES,
    desc: "Camiseta técnica oversize de secado rápido con panel de malla en la espalda.",
  },
  {
    id: "exit-point-trouser",
    name: "Exit Point Trouser",
    price: 189900,
    badge: "Nuevo",
    photo: "pant",
    colors: ["carbon", "camel", "arena", "cafe", "marino", "negro"],
    sizes: SIZES,
    desc: "Pantalón técnico con pretina ajustable. Se mueve contigo antes y después del salto.",
  },
  {
    id: "aero-jersey-45",
    name: "Aero Jersey 45",
    price: 169900,
    badge: "Nuevo",
    photo: "polo",
    colors: ["marino", "negro", "bosque", "hueso", "vinotinto", "camel"],
    sizes: SIZES,
    desc: "Jersey técnico de malla ligera con cortes de competición y vivos de contraste.",
  },
  {
    id: "terminal-tee",
    name: "Terminal Tee",
    price: 99900,
    badge: "Básico",
    photo: "tee",
    colors: ["negro", "hueso", "jaspe", "bosque", "vinotinto", "marino"],
    sizes: SIZES,
    desc: "Algodón peinado de 220g. El básico de cada salida al hangar.",
  },
];

export const PROD: Record<string, RoperoProduct> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

/** Lo que cuelga en el riel, de izquierda a derecha: producto + color con el que se muestra. */
export const RACK: { productId: string; color: string }[] = [
  { productId: "drop-zone-hoodie", color: "negro" },
  { productId: "flow-line-tee", color: "jaspe" },
  { productId: "exit-point-trouser", color: "carbon" },
  { productId: "aero-jersey-45", color: "marino" },
  { productId: "drop-zone-hoodie", color: "naranja" },
  { productId: "terminal-tee", color: "negro" },
  { productId: "flow-line-tee", color: "hueso" },
  { productId: "exit-point-trouser", color: "camel" },
  { productId: "drop-zone-hoodie", color: "celeste" },
];

export type RoperoView = "front" | "back" | "side";

/** Sufijo del archivo de cada vista: <set>-<color><sufijo>.webp. */
const VIEW_SUFFIX: Record<RoperoView, string> = { front: "", back: "-espalda", side: "-lado" };

/**
 * Sets fotografiados en todas las vistas, para todos sus colores. Las del hoodie salen de las
 * fotos del negro, teñidas con scripts/recolor-hoodie.py (córrelo si cambias sus colores).
 */
const ALL_VIEWS: RoperoPhotoSet[] = ["hoodie"];

/**
 * Vistas extra disponibles por "<set>-<color>" (el frente siempre existe), para sets que no
 * están en ALL_VIEWS. Cuando agregues public/images/ropero/tee-negro-espalda.webp, añade
 * "tee-negro": ["back"] aquí y el botón "Espalda" se activa solo para esa prenda.
 */
export const EXTRA_VIEWS: Record<string, RoperoView[]> = {};

export function photoUrl(product: RoperoProduct, color: string, view: RoperoView = "front") {
  return `/images/ropero/${product.photo}-${color}${VIEW_SUFFIX[view]}.webp`;
}

export function hasView(product: RoperoProduct, color: string, view: RoperoView) {
  if (view === "front" || ALL_VIEWS.includes(product.photo)) return true;
  return (EXTRA_VIEWS[`${product.photo}-${color}`] ?? []).includes(view);
}
