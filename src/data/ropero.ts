import { GRAPHITE, OFFWHITE, VIOLET, ORANGE, LIME } from "./colors";

/**
 * Catálogo de "El Ropero" — la experiencia de riel 3D (ver src/components/ropero).
 * Es un subconjunto curado del catálogo real (src/data/products.ts): el motor 3D solo
 * sabe pintar siluetas de tee/hoodie/jogger/gorra, así que no todo el catálogo cabe aquí.
 * Precios, textos de impresión y nombres se reutilizan tal cual del catálogo oficial.
 */

export type RoperoCat = "arriba" | "abajo" | "accesorio";
export type RoperoPainterKey = "hoodie" | "teeOv" | "teeReg" | "jogger" | "cap";

export interface RoperoProduct {
  id: string;
  name: string;
  short: string;
  price: number;
  cat: RoperoCat;
  type: RoperoPainterKey;
  badge: string;
  colors: string[];
  def: string;
  sizes: string[];
  guide: "teeOv" | "teeReg" | "hoodie" | "jogger" | "cap";
  desc: string;
}

export const ROPERO_CFG = {
  brand: "FORTY FIVE",
  tagline: "DESAFÍA LA GRAVEDAD",
  sub: "INDUMENTARIA TÉCNICA · EL ROPERO",
};

const PALETTE = [GRAPHITE, OFFWHITE, VIOLET, ORANGE, LIME];
export const COLORS: Record<string, [string, string]> = Object.fromEntries(
  PALETTE.map((c) => [c.id, [c.name, c.hex] as [string, string]]),
);

export const SIZES = ["XS", "S", "M", "L", "XL"];
export const SIZE_SCALE: Record<string, number> = { XS: 0.92, S: 0.96, M: 1, L: 1.04, XL: 1.08, Única: 1 };

export const PRODUCTS: RoperoProduct[] = [
  {
    id: "flow-line-tee",
    name: "Flow Line Tee",
    short: "Flow Line Tee",
    price: 109900,
    cat: "arriba",
    type: "teeOv",
    badge: "Más vendido",
    colors: ["graphite", "offwhite", "lime"],
    def: "graphite",
    sizes: SIZES,
    guide: "teeOv",
    desc: "Camiseta técnica oversize de secado rápido con panel de malla en la espalda, trazada con las líneas de flujo aerodinámico de la marca.",
  },
  {
    id: "terminal-tee",
    name: "Terminal Tee",
    short: "Terminal Tee",
    price: 99900,
    cat: "arriba",
    type: "teeReg",
    badge: "Básico",
    colors: ["graphite", "offwhite", "violet"],
    def: "graphite",
    sizes: SIZES,
    guide: "teeReg",
    desc: "Algodón peinado de 220g con retícula técnica impresa. El básico de cada salida al hangar.",
  },
  {
    id: "aero-jersey-45",
    name: "Aero Jersey 45",
    short: "Aero Jersey 45",
    price: 169900,
    cat: "arriba",
    type: "teeReg",
    badge: "Nuevo",
    colors: ["graphite", "violet", "lime"],
    def: "violet",
    sizes: SIZES,
    guide: "teeReg",
    desc: "Jersey técnico de malla ligera con cortes de competición y vivos de contraste.",
  },
  {
    id: "drop-zone-hoodie",
    name: "Drop Zone Hoodie",
    short: "Drop Zone Hoodie",
    price: 259900,
    cat: "arriba",
    type: "hoodie",
    badge: "Nuevo",
    colors: ["graphite", "offwhite", "lime"],
    def: "graphite",
    sizes: SIZES,
    guide: "hoodie",
    desc: "Hoodie de felpa pesada con bolsillo canguro y capucha reforzada, para esperar el próximo manifiesto.",
  },
  {
    id: "exit-point-trouser",
    name: "Exit Point Trouser",
    short: "Exit Point Trouser",
    price: 189900,
    cat: "abajo",
    type: "jogger",
    badge: "Nuevo",
    colors: ["graphite", "violet"],
    def: "graphite",
    sizes: SIZES,
    guide: "jogger",
    desc: "Jogger técnico con bolsillos de carga y puño ajustable. Se mueve contigo antes y después del salto.",
  },
  {
    id: "vector-cap",
    name: "Vector Cap",
    short: "Vector Cap",
    price: 89900,
    cat: "accesorio",
    type: "cap",
    badge: "Accesorio",
    colors: ["graphite", "lime"],
    def: "graphite",
    sizes: ["Única"],
    guide: "cap",
    desc: "Gorra de six paneles con visera curva y bordado del sello 45. Ajuste trasero metálico.",
  },
  {
    id: "altitude-cap",
    name: "Altitude Cap",
    short: "Altitude Cap",
    price: 79900,
    cat: "accesorio",
    type: "cap",
    badge: "Accesorio",
    colors: ["offwhite", "orange"],
    def: "offwhite",
    sizes: ["Única"],
    guide: "cap",
    desc: "Gorra trucker de malla transpirable, ideal para el calor de la zona de aterrizaje.",
  },
];

export const PROD: Record<string, RoperoProduct> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export const PKEY: Record<string, RoperoPainterKey> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.type]));

/** Posición y tamaño del estampado al pecho (plano aplicado sobre la silueta pintada). */
export const PRINT_AT: Record<string, { y: number; w: number; a: number; kind: "brand" | "cap"; label?: string }> = {
  "flow-line-tee": { y: 0.25, w: 0.22, a: 0.8, kind: "brand", label: "FORTY FIVE" },
  "terminal-tee": { y: 0.226, w: 0.2, a: 0.6, kind: "brand", label: "RESISTENCIA CERO" },
  "aero-jersey-45": { y: 0.22, w: 0.2, a: 0.5, kind: "brand", label: "FORTY FIVE TEAM" },
  "drop-zone-hoodie": { y: 0.26, w: 0.19, a: 0.55, kind: "brand", label: "DROP ZONE" },
  "vector-cap": { y: 0.085, w: 0.09, a: 0.5, kind: "cap" },
  "altitude-cap": { y: 0.085, w: 0.09, a: 0.5, kind: "cap" },
};

export interface RoperoSection {
  id: string;
  name: string;
  title: string;
  sub?: string;
  items?: [string, string[]][];
}

export const SECS: RoperoSection[] = [
  { id: "tienda", name: "El Ropero", title: "FORTY FIVE" },
  {
    id: "nuevo",
    name: "Lo nuevo",
    title: "Nuevo en el hangar",
    sub: "Lo nuevo · Drop Zone",
    items: [
      ["drop-zone-hoodie", ["graphite", "offwhite", "lime"]],
      ["exit-point-trouser", ["graphite", "violet"]],
    ],
  },
  {
    id: "top",
    name: "Más vendidos",
    title: "Más vendidos",
    sub: "Lo que más se lleva",
    items: [["flow-line-tee", ["graphite", "offwhite", "lime"]]],
  },
  { id: "look", name: "Completa el look", title: "Completa el look", sub: "Arriba + abajo" },
  {
    id: "basicos",
    name: "Básicos",
    title: "Básicos técnicos",
    sub: "Todos los días",
    items: [
      ["terminal-tee", ["graphite", "offwhite", "violet"]],
      ["aero-jersey-45", ["graphite", "violet", "lime"]],
    ],
  },
  {
    id: "accesorios",
    name: "Accesorios",
    title: "Accesorios",
    sub: "Gorras bordadas 45",
    items: [
      ["vector-cap", ["graphite", "lime"]],
      ["altitude-cap", ["offwhite", "orange"]],
    ],
  },
  { id: "pedido", name: "Tu pedido", title: "Tu pedido", sub: "Lo que elegiste" },
];

export const LOOK: [string, string][] = [
  ["drop-zone-hoodie", "lime"],
  ["exit-point-trouser", "graphite"],
];

export const GUIDES: Record<string, { cols: string[]; rows: (string | number)[][] }> = {
  teeOv: { cols: ["Talla", "Ancho de pecho", "Largo", "Manga"], rows: [["XS", 54, 68, 22], ["S", 57, 70, 23], ["M", 60, 72, 24], ["L", 63, 74, 25], ["XL", 66, 76, 26]] },
  teeReg: { cols: ["Talla", "Ancho de pecho", "Largo", "Manga"], rows: [["XS", 46, 64, 18], ["S", 49, 66, 19], ["M", 52, 69, 20], ["L", 55, 72, 21], ["XL", 58, 74, 22]] },
  hoodie: { cols: ["Talla", "Ancho de pecho", "Largo", "Manga"], rows: [["XS", 56, 66, 58], ["S", 59, 68, 60], ["M", 62, 70, 62], ["L", 65, 72, 63], ["XL", 68, 74, 64]] },
  jogger: { cols: ["Talla", "Cintura relajada", "Cadera", "Largo"], rows: [["XS", 64, 98, 96], ["S", 68, 102, 98], ["M", 72, 106, 100], ["L", 78, 112, 102], ["XL", 84, 118, 104]] },
  cap: { cols: ["Talla", "Contorno de cabeza"], rows: [["Única", "54 a 60 (correa ajustable)"]] },
};
