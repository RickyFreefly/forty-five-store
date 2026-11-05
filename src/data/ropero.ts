/**
 * Catálogo de "El Ropero" — el riel de prendas colgadas (ver src/components/rack).
 * Los diseños salen de "Propuesta Camisetas FINAL.pdf" (scripts/extract-propuesta.py); el hoodie
 * liso y el pantalón vienen de las fotos anteriores.
 */

/** Tipo de prenda: define cuánto cuelga en el riel. */
export type RoperoKind = "hoodie" | "tee" | "longsleeve" | "pant";

export type RoperoView = "front" | "back" | "side";

export interface RoperoProduct {
  id: string;
  name: string;
  price: number;
  badge: string;
  kind: RoperoKind;
  /** Fotos en public/images/ropero/<photo>-<color><sufijo de vista>.webp. */
  photo: string;
  colors: string[];
  /** Vistas fotografiadas, iguales para todos sus colores. */
  views: RoperoView[];
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

const FRONT_BACK: RoperoView[] = ["front", "back"];

export const PRODUCTS: RoperoProduct[] = [
  {
    id: "hoodie-ff-estrellas",
    name: "Hoodie FF Estrellas",
    price: 279900,
    badge: "Drop 01",
    kind: "hoodie",
    photo: "hoodie-ff",
    colors: ["negro"],
    views: FRONT_BACK,
    sizes: SIZES,
    desc: "Felpa lavada con el escudo FF de estrellas en el bolsillo y un degradado térmico en la espalda.",
  },
  {
    id: "hoodie-aurora",
    name: "Hoodie Aurora",
    price: 289900,
    badge: "Nuevo",
    kind: "hoodie",
    photo: "hoodie-aurora",
    colors: ["negro"],
    views: FRONT_BACK,
    sizes: SIZES,
    desc: "Estela de luz en degradado al frente y el 45 vertical en la espalda, como la estela de un salto nocturno.",
  },
  {
    id: "hoodie-45-probado",
    name: "Hoodie 45 Probado",
    price: 289900,
    badge: "Nuevo",
    kind: "hoodie",
    photo: "hoodie-45",
    colors: ["negro"],
    views: FRONT_BACK,
    sizes: SIZES,
    desc: "Degradado de atardecer, FORTY FIVE en las mangas y el 45 «Probado bajo presión» en vinilo en relieve.",
  },
  {
    id: "oversize-45-aero",
    name: "Oversize 45 Aero",
    price: 129900,
    badge: "Más vendido",
    kind: "tee",
    photo: "tee-45",
    colors: ["negro"],
    views: FRONT_BACK,
    sizes: SIZES,
    desc: "El 45 «Probado bajo presión» al frente y el logo FORTY FIVE en rojo en la espalda. Especificación 45-Aero-Técnico.",
  },
  {
    id: "oversize-graffiti",
    name: "Oversize Graffiti",
    price: 139900,
    badge: "Edición",
    kind: "tee",
    photo: "tee-graffiti",
    colors: ["negro"],
    views: FRONT_BACK,
    sizes: SIZES,
    desc: "FORTY FIVE en graffiti con vinilo textil puff en la espalda; logo tono sobre tono al frente.",
  },
  {
    id: "oversize-resistencia-cero",
    name: "Oversize Resistencia Cero",
    price: 129900,
    badge: "Nuevo",
    kind: "tee",
    photo: "tee-cero",
    colors: ["hueso"],
    views: FRONT_BACK,
    sizes: SIZES,
    desc: "Logo FORTY FIVE al frente y «Resistencia Cero» vertical en verde en la espalda.",
  },
  {
    id: "oversize-logo",
    name: "Oversize Logo",
    price: 119900,
    badge: "Básico",
    kind: "tee",
    photo: "tee-logo",
    colors: ["negro", "hueso"],
    views: FRONT_BACK,
    sizes: SIZES,
    desc: "Isotipo pequeño al pecho y el isotipo en línea en la espalda, en reflectivo o tornasol.",
  },
  {
    id: "manga-larga-resistencia-cero",
    name: "Manga Larga Resistencia Cero",
    price: 149900,
    badge: "Deportiva",
    kind: "longsleeve",
    photo: "longsleeve-cero",
    colors: ["negro"],
    views: FRONT_BACK,
    sizes: SIZES,
    desc: "Camiseta técnica de manga larga con FORTY FIVE vertical y la caída libre impresa en la espalda.",
  },
  {
    id: "deportiva-45",
    name: "Deportiva 45",
    price: 129900,
    badge: "Deportiva",
    kind: "tee",
    photo: "deportiva-45",
    colors: ["negro"],
    views: FRONT_BACK,
    sizes: SIZES,
    desc: "Camiseta técnica de secado rápido: isotipo al pecho, 45 y «Resistencia Cero» en la espalda.",
  },
  {
    id: "drop-zone-hoodie",
    name: "Drop Zone Hoodie",
    price: 259900,
    badge: "Liso",
    kind: "hoodie",
    photo: "hoodie",
    colors: ["negro", "naranja", "carbon", "oliva", "celeste", "cobalto", "marino", "cafe", "crema", "chicle", "fucsia", "verdeK"],
    // Las del negro, teñidas a cada color con scripts/recolor-hoodie.py.
    views: ["front", "back", "side"],
    sizes: SIZES,
    desc: "Hoodie de felpa pesada con bolsillo canguro y capucha reforzada, para esperar el próximo manifiesto.",
  },
  {
    id: "exit-point-trouser",
    name: "Exit Point Trouser",
    price: 189900,
    badge: "Nuevo",
    kind: "pant",
    photo: "pant",
    colors: ["carbon", "camel", "arena", "cafe", "marino", "negro"],
    views: ["front"],
    sizes: SIZES,
    desc: "Pantalón técnico con pretina ajustable. Se mueve contigo antes y después del salto.",
  },
];

export const PROD: Record<string, RoperoProduct> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

/** Lo que cuelga en el riel, de izquierda a derecha: producto + color con el que se muestra. */
export const RACK: { productId: string; color: string }[] = [
  { productId: "hoodie-ff-estrellas", color: "negro" },
  { productId: "oversize-45-aero", color: "negro" },
  { productId: "hoodie-aurora", color: "negro" },
  { productId: "oversize-resistencia-cero", color: "hueso" },
  { productId: "manga-larga-resistencia-cero", color: "negro" },
  { productId: "oversize-graffiti", color: "negro" },
  { productId: "hoodie-45-probado", color: "negro" },
  { productId: "oversize-logo", color: "hueso" },
  { productId: "deportiva-45", color: "negro" },
  { productId: "drop-zone-hoodie", color: "naranja" },
  { productId: "exit-point-trouser", color: "camel" },
];

/** Sufijo del archivo de cada vista: <photo>-<color><sufijo>.webp. */
const VIEW_SUFFIX: Record<RoperoView, string> = { front: "", back: "-espalda", side: "-lado" };

export function photoUrl(product: RoperoProduct, color: string, view: RoperoView = "front") {
  return `/images/ropero/${product.photo}-${color}${VIEW_SUFFIX[view]}.webp`;
}

export function hasView(product: RoperoProduct, view: RoperoView) {
  return product.views.includes(view);
}
